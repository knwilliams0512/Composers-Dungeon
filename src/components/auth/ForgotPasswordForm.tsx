"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/server/actions/auth-actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await requestPasswordReset(email);
    setLoading(false);
    setSent(true);
    if (result.data?.resetUrl) setResetUrl(result.data.resetUrl);
  }

  if (sent) {
    return (
      <div className="space-y-4 text-sm text-parchment-300">
        <p>
          If an account exists for <strong>{email}</strong>, a reset link has been
          forged. It expires in 30 minutes.
        </p>
        {resetUrl && (
          <p className="rounded border border-abyss-600 bg-abyss-900 p-3 text-xs">
            No mail service is configured in this environment, so here is your
            link directly:{" "}
            <Link href={resetUrl} className="break-all text-gold-400">
              {resetUrl}
            </Link>
          </p>
        )}
        <Link href="/login" className="btn-secondary w-full">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Forging…" : "Send Reset Link"}
      </button>
    </form>
  );
}
