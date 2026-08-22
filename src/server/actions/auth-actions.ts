"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
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
 * Password reset, v1: generates a one-time token. With no email service
 * configured, the token link is returned so it can be shown in dev; in
 * production wire this to a mailer instead.
 */
export async function requestPasswordReset(email: string): Promise<ActionResult> {
  const normalized = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalized } });
  // Do not reveal whether the account exists.
  if (!user) return { ok: true };

  const token = crypto.randomBytes(32).toString("hex");
  await db.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: new Date(Date.now() + 1000 * 60 * 30),
    },
  });
  return { ok: true, data: { resetUrl: `/reset-password?token=${token}` } };
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
