import "server-only";

import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { relayProvider, type MailConfig, type MailConfigView, type MailMode } from "@/lib/mail-providers";

/**
 * Sending mail from an app that runs on one person's machine.
 *
 * Composer's Dungeon has no server behind it and no account anywhere, which is
 * the point of it. That leaves nothing to send mail *from* unless the person
 * provides it, and it rules out the obvious shortcut: a mailbox shipped inside
 * the installer is a password shipped inside the installer, readable by anyone
 * who downloads it, and the first person to read it would be sending mail as
 * the app to everybody else. So there is no built-in sender here, and there
 * cannot honestly be one.
 *
 * What there is instead:
 *
 *   - Two ways to lend the install a sender, both optional. "smtp" borrows a
 *     mailbox you already own. "relay" posts to a sending service's HTTP API,
 *     which is one key and no port guessing.
 *   - A no-reply identity for everything sent either way: the display name
 *     says it is the app, the headers say it is automatic, and a reply goes
 *     nowhere a human is waiting.
 *   - A reset flow that does not need any of it. See requestPasswordReset:
 *     on the machine the app is installed on, the link is handed over
 *     locally and no mail is involved at all.
 */

export {
  RELAY_PROVIDERS,
  relayProvider,
  type MailConfig,
  type MailConfigView,
  type MailMode,
  type RelayProvider,
} from "@/lib/mail-providers";

/**
 * The stored sender, or null when this install has none.
 *
 * Null is the ordinary case, not an error: the app ships without a sender and
 * the reset flow works without one.
 */
export async function readMailConfig(): Promise<MailConfig | null> {
  const row = await db.mailSetting.findUnique({ where: { id: "mail" } }).catch(() => null);
  if (!row) return null;
  const mode: MailMode = row.mode === "relay" ? "relay" : "smtp";
  const from = row.fromEmail.trim();
  if (!from) return null;
  if (mode === "smtp" && !row.host.trim()) return null;
  if (mode === "relay") {
    const provider = relayProvider(row.provider);
    if (!provider || !row.apiKey.trim()) return null;
    if (provider.needsDomain && !row.domain.trim()) return null;
  }
  return {
    mode,
    host: row.host.trim(),
    port: row.port,
    secure: row.secure,
    username: row.username,
    password: row.password,
    provider: row.provider,
    apiKey: row.apiKey.trim(),
    domain: row.domain.trim(),
    fromName: row.fromName,
    fromEmail: from,
  };
}

export async function mailIsConfigured(): Promise<boolean> {
  return (await readMailConfig()) !== null;
}

export async function readMailConfigView(): Promise<MailConfigView | null> {
  const config = await readMailConfig();
  if (!config) return null;
  const { password, apiKey, ...rest } = config;
  return { ...rest, hasPassword: password.length > 0, hasApiKey: apiKey.length > 0 };
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

/**
 * The headers that make a message a no-reply.
 *
 * Not decoration. `Auto-Submitted` is what stops a mailing list or an
 * out-of-office responder from answering a password reset, which is how an
 * automatic message turns into an automatic argument between two robots.
 * `X-Auto-Response-Suppress` is Outlook's older spelling of the same idea.
 */
const NOREPLY_HEADERS: Record<string, string> = {
  "Auto-Submitted": "auto-generated",
  "X-Auto-Response-Suppress": "All",
  Precedence: "bulk",
};

/**
 * The address a reply would go to, written so a reply cannot arrive.
 *
 * `.invalid` is reserved by RFC 2606 precisely for this: it can never be
 * registered, so a mail client that tries to answer fails at once and tells
 * the person, rather than sending a question into a mailbox nobody reads.
 */
const NOREPLY_REPLY_TO = "no-reply@composers-dungeon.invalid";

function senderName(config: MailConfig): string {
  const base = config.fromName.trim() || "Composer's Dungeon";
  return /no.?reply/i.test(base) ? base : `${base} (no-reply)`;
}

function senderHeader(config: MailConfig): string {
  return `"${senderName(config).replace(/"/g, "")}" <${config.fromEmail}>`;
}

/**
 * Sends one message, or explains why it could not.
 *
 * Every failure here is something the person can act on — a wrong port, a key
 * the provider rejected, a sender address it has not verified — so the
 * provider's own words are passed through rather than flattened into "could
 * not send". The one thing never passed through is the body of the mail,
 * because the body of the only mail this app sends is a reset link.
 */
export async function sendMail(to: string, subject: string, text: string): Promise<SendResult> {
  const config = await readMailConfig();
  if (!config) return { ok: false, error: "No sender is configured on this install." };
  return config.mode === "relay"
    ? sendViaRelay(config, to, subject, text)
    : sendViaSmtp(config, to, subject, text);
}

async function sendViaSmtp(
  config: MailConfig,
  to: string,
  subject: string,
  text: string
): Promise<SendResult> {
  try {
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.username ? { user: config.username, pass: config.password } : undefined,
      // A local app should fail quickly rather than hang the page for a minute
      // on a host that is not listening.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    await transport.sendMail({
      from: senderHeader(config),
      replyTo: NOREPLY_REPLY_TO,
      to,
      subject,
      text,
      headers: NOREPLY_HEADERS,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: describe(error) };
  }
}

/**
 * Posts the message to a sending service's HTTP API.
 *
 * Worth the four shapes below rather than one generic webhook field: a person
 * setting this up has an account with one of these and a key in their hand,
 * and "paste the key" is a setup they will finish. "Describe your provider's
 * JSON" is one they will not.
 */
async function sendViaRelay(
  config: MailConfig,
  to: string,
  subject: string,
  text: string
): Promise<SendResult> {
  const from = senderHeader(config);
  let url: string;
  let headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: unknown;

  switch (config.provider) {
    case "resend":
      url = "https://api.resend.com/emails";
      headers.Authorization = `Bearer ${config.apiKey}`;
      body = { from, to: [to], subject, text, reply_to: NOREPLY_REPLY_TO, headers: NOREPLY_HEADERS };
      break;
    case "brevo":
      url = "https://api.brevo.com/v3/smtp/email";
      headers["api-key"] = config.apiKey;
      body = {
        sender: { name: senderName(config), email: config.fromEmail },
        to: [{ email: to }],
        replyTo: { email: NOREPLY_REPLY_TO },
        subject,
        textContent: text,
        headers: NOREPLY_HEADERS,
      };
      break;
    case "sendgrid":
      url = "https://api.sendgrid.com/v3/mail/send";
      headers.Authorization = `Bearer ${config.apiKey}`;
      body = {
        personalizations: [{ to: [{ email: to }] }],
        from: { name: senderName(config), email: config.fromEmail },
        reply_to: { email: NOREPLY_REPLY_TO },
        subject,
        content: [{ type: "text/plain", value: text }],
        headers: NOREPLY_HEADERS,
      };
      break;
    case "mailgun": {
      url = `https://api.mailgun.net/v3/${encodeURIComponent(config.domain)}/messages`;
      // Mailgun takes a form body and basic auth with the literal user "api".
      const form = new URLSearchParams({
        from,
        to,
        subject,
        text,
        "h:Reply-To": NOREPLY_REPLY_TO,
        "h:Auto-Submitted": NOREPLY_HEADERS["Auto-Submitted"],
      });
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form,
          signal: AbortSignal.timeout(20_000),
        });
        return res.ok ? { ok: true } : { ok: false, error: await failureText(res) };
      } catch (error) {
        return { ok: false, error: describe(error) };
      }
    }
    default:
      return { ok: false, error: `Unknown sending service "${config.provider}".` };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    return res.ok ? { ok: true } : { ok: false, error: await failureText(res) };
  } catch (error) {
    return { ok: false, error: describe(error) };
  }
}

/** The provider's own complaint, which is almost always the useful one. */
async function failureText(res: Response): Promise<string> {
  const raw = await res.text().catch(() => "");
  let detail = raw;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const first =
      (parsed.message as string) ||
      (parsed.error as string) ||
      (Array.isArray(parsed.errors) && (parsed.errors[0] as Record<string, unknown>)?.message) ||
      "";
    if (typeof first === "string" && first) detail = first;
  } catch {
    // Not JSON; the raw body is the best there is.
  }
  return `${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`.slice(0, 400);
}

function describe(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 400);
}

/** The body of the one message this app sends. */
export function resetEmailBody(url: string): { subject: string; text: string } {
  return {
    subject: "Your Composer's Dungeon reset link",
    text: [
      "Someone asked to reset the password on your Composer's Dungeon account.",
      "",
      "Open this link to choose a new one. It expires in 30 minutes:",
      url,
      "",
      "If that was not you, nothing has changed and you can ignore this.",
      "",
      "This address is not monitored — replies to it will not arrive anywhere.",
    ].join("\n"),
  };
}
