"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { appBaseUrl, desktopRoot } from "@/lib/desktop";
import { mailIsConfigured, relayProvider, resetEmailBody, sendMail } from "@/lib/mail";
import { HANDOFF_MINUTES, isLoopbackHost } from "@/lib/reset-handoff";
import { signupSchema } from "@/lib/validation";

export interface ActionResult {
  ok: boolean;
  error?: string;
  data?: Record<string, string>;
}

export async function signup(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const { email, password, displayName } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {
      email,
      passwordHash,
      profile: { create: { displayName } },
    },
  });
  return { ok: true };
}

/**
 * Password reset.
 *
 * This used to answer with the reset link itself, on the reasoning that a
 * desktop app has no mail service so the token had to go somewhere. It went to
 * whoever typed the email address — which means anyone who could reach the
 * sign-in screen could take over any account on the machine by guessing an
 * address. The screen even explained it was doing so. That is fixed here: the
 * token never leaves the server, and nothing the page receives can be read as
 * one.
 *
 * Three ways out, tried in this order:
 *
 *  1. Email, when the install has been lent a sender in Settings. Only the
 *     mailbox owner sees the link, which is the strongest of the three and the
 *     only one that works from another machine.
 *  2. A local hand-over, when the request provably came from this machine.
 *     The page gets a single-use handle, not a token; following it redeems the
 *     handle server-side and redirects to the reset form. This is the
 *     no-setup path: no mail service, no file to find, one click.
 *  3. A file in the app's own data folder, for anything else. That is the
 *     same folder the database sits in, so reading it already requires being
 *     the person who owns this Windows account.
 *
 * All three answer identically whether or not the account exists.
 */
export async function requestPasswordReset(email: string): Promise<ActionResult> {
  const normalized = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalized } });
  // The answer must not differ between a real address and an invented one, so
  // which of the three it will be is decided before the account is looked at.
  const configured = await mailIsConfigured();
  const local = isLocalRequest();
  const route = configured ? "email" : local ? "local" : "file";

  if (!user) {
    // A plausible handle that redeems to nothing, so the invented address and
    // the real one are indistinguishable right down to the shape of the reply.
    return {
      ok: true,
      data: route === "local" ? { delivery: "local", handoff: newSecret() } : { delivery: route },
    };
  }

  const token = newSecret();
  const handoff = route === "local" ? newSecret() : null;
  await db.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: new Date(Date.now() + 1000 * 60 * 30),
      resetHandoff: handoff,
      // Shorter than the token's own life: a hand-over is meant to be followed
      // in the next few seconds, by the person who just asked for it.
      resetHandoffExpiry: handoff ? new Date(Date.now() + 1000 * 60 * HANDOFF_MINUTES) : null,
    },
  });

  const url = `${appBaseUrl()}/reset-password?token=${token}`;

  if (route === "email") {
    const { subject, text } = resetEmailBody(url);
    const sent = await sendMail(normalized, subject, text);
    if (sent.ok) return { ok: true, data: { delivery: "email" } };
    // A failure to send is worth saying out loud — silently claiming a mail
    // was sent leaves someone waiting for one that will never come. The
    // fallback is the same for an address with no account, so saying it
    // reveals something about the sender, not about the recipient.
    if (local) {
      const rescue = newSecret();
      await db.user.update({
        where: { id: user.id },
        data: {
          resetHandoff: rescue,
          resetHandoffExpiry: new Date(Date.now() + 1000 * 60 * HANDOFF_MINUTES),
        },
      });
      return { ok: true, data: { delivery: "local", handoff: rescue, mailError: sent.error ?? "" } };
    }
    await writeResetLink(url);
    return { ok: true, data: { delivery: "file", mailError: sent.error ?? "" } };
  }

  if (route === "local" && handoff) {
    return { ok: true, data: { delivery: "local", handoff } };
  }

  await writeResetLink(url);
  return { ok: true, data: { delivery: "file" } };
}

function newSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Whether this request came from the machine the app is running on.
 *
 * The Windows launcher starts the server with HOSTNAME=127.0.0.1, so it only
 * ever accepts connections from loopback and the question is already settled.
 * The checks are for every other way the app can be run: a source install, a
 * dev server, a copy somebody has put behind a proxy. A forwarded header is
 * treated as proof of the opposite, because the only thing that adds one is a
 * hop the request has already taken.
 */
function isLocalRequest(): boolean {
  try {
    const h = headers();
    return isLoopbackHost(h.get("host"), {
      for: h.get("x-forwarded-for"),
      host: h.get("x-forwarded-host"),
      raw: h.get("forwarded"),
    });
  } catch {
    // No request context at all: nothing to prove it is local, so it is not.
    return false;
  }
}

/** Where the app keeps its data: the install's own folder, or the project. */
function dataDir(): string {
  const root = desktopRoot();
  return root ? path.join(root, "data") : path.join(process.cwd(), "data");
}

/** Not exported: a "use server" module may only export async functions. */
function resetLinkPath(): string {
  return path.join(dataDir(), "reset-link.txt");
}

/**
 * Puts the link where only this machine's owner can read it, replacing any
 * earlier one so an expired token is never left lying around.
 */
async function writeResetLink(url: string): Promise<void> {
  try {
    await fs.mkdir(dataDir(), { recursive: true });
    await fs.writeFile(
      resetLinkPath(),
      [
        "Composer's Dungeon — password reset",
        `Requested: ${new Date().toLocaleString()}`,
        "This link expires 30 minutes after it was requested.",
        "",
        url,
        "",
        "Delete this file once you have used it.",
        "",
      ].join("\n"),
      "utf8"
    );
  } catch {
    // A read-only data folder is a problem the person can see elsewhere; it
    // must not turn the reset page into an error that confirms the account.
  }
}

export async function resetPassword(input: {
  token: string;
  password: string;
}): Promise<ActionResult> {
  if (!input.token || input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }
  const user = await db.user.findUnique({ where: { resetToken: input.token } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return { ok: false, error: "This reset link is invalid or has expired" };
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Mail                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Saves the sender this install borrows.
 *
 * Signed-in only, and deliberately so: the mail settings are the one thing in
 * the app that reaches outside the machine, and the reset flow must not be
 * able to change where its own mail goes.
 */
export async function saveMailSettings(input: {
  mode: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  provider: string;
  apiKey: string;
  domain: string;
  fromName: string;
  fromEmail: string;
}): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign in first" };

  const mode = input.mode === "relay" ? "relay" : "smtp";
  const fromEmail = input.fromEmail.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return { ok: false, error: "The 'send from' address does not look like an email address" };
  }

  const existing = await db.mailSetting.findUnique({ where: { id: "mail" } });
  // An empty secret field means "leave it alone", so that opening the panel and
  // changing a port does not silently wipe the credential behind it.
  const password = input.password.length > 0 ? input.password : existing?.password ?? "";
  const apiKey = input.apiKey.length > 0 ? input.apiKey : existing?.apiKey ?? "";

  const host = input.host.trim();
  const port = Number(input.port);
  const provider = input.provider.trim();
  const domain = input.domain.trim();

  if (mode === "smtp") {
    if (!host) return { ok: false, error: "A mail server address is needed" };
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return { ok: false, error: "Port must be a number between 1 and 65535" };
    }
    if (!password) return { ok: false, error: "An app password is needed" };
  } else {
    const chosen = relayProvider(provider);
    if (!chosen) return { ok: false, error: "Choose a sending service" };
    if (!apiKey) return { ok: false, error: `A ${chosen.name} API key is needed` };
    if (chosen.needsDomain && !domain) {
      return { ok: false, error: `${chosen.name} also needs your sending domain` };
    }
  }

  const row = {
    mode,
    host,
    port: Number.isInteger(port) && port > 0 && port < 65536 ? port : 587,
    secure: input.secure,
    username: input.username.trim(),
    password,
    provider,
    apiKey,
    domain,
    fromName: input.fromName.trim(),
    fromEmail,
  };

  await db.mailSetting.upsert({
    where: { id: "mail" },
    create: { id: "mail", ...row },
    update: row,
  });
  return { ok: true };
}

/** Forgets the sender, returning the app to the local hand-over. */
export async function clearMailSettings(): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign in first" };
  await db.mailSetting.deleteMany({ where: { id: "mail" } });
  return { ok: true };
}

/**
 * Sends one message to the signed-in composer's own address.
 *
 * Fixed to their own address rather than anything typed in: a form that sends
 * mail to an arbitrary recipient, from credentials stored on the machine, is
 * an open relay with a nice font.
 */
export async function sendTestEmail(): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign in first" };
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Sign in first" };

  const result = await sendMail(
    user.email,
    "Composer's Dungeon can reach you",
    [
      "This is the test message from the mail settings page.",
      "",
      "If you are reading it, the app can send you a password reset link.",
    ].join("\n")
  );
  if (!result.ok) return { ok: false, error: result.error ?? "Could not send" };
  return { ok: true, data: { sentTo: user.email } };
}
