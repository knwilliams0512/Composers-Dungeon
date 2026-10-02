"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset } from "@/server/actions/auth-actions";

/**
 * Asking for a reset link.
 *
 * This screen used to print the reset link on itself when no mail service was
 * configured, with a note explaining that it was doing so. That handed an
 * account to anybody who could reach the sign-in page and guess an email
 * address. Nothing here is a token any more: the local hand-over is a
 * single-use handle that only works from this machine, is spent the moment it
 * is followed, and expires in ten minutes either way.
 *
 * The wording is identical whether or not the account exists, which is the
 * other half of the same idea: a page that says "no such account" is a page
 * that confirms which addresses are real.
 */
export function ForgotPasswordForm() {
  const params = useSearchParams();
  const spent = params.get("handoff");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [delivery, setDelivery] = useState<"email" | "local" | "file" | null>(null);
  const [handoff, setHandoff] = useState<string | null>(null);
  const [mailError, setMailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await requestPasswordReset(email);
    setLoading(false);
    setSent(true);
    const how = result.data?.delivery;
    setDelivery(how === "email" || how === "local" ? how : "file");
    setHandoff(result.data?.handoff ?? null);
    setMailError(result.data?.mailError || null);
  }

  if (sent) {
    return (
      <div className="space-y-4 text-sm text-parchment-300">
        <p>
          If an account exists for <strong className="text-parchment-100">{email}</strong>, a
          reset link has been forged. It expires in 30 minutes.
        </p>

        {delivery === "email" && (
          <p className="rounded border border-abyss-600 bg-abyss-900 p-3 text-xs">
            It has been emailed to that address. Check the spam folder if it has not arrived
            in a minute.
          </p>
        )}

        {delivery === "local" && handoff && (
          <div className="space-y-3">
            {mailError && (
              <p className="rounded border border-rose-500/40 bg-rose-500/5 p-3 text-xs leading-relaxed text-parchment-300">
                The email could not be sent ({mailError}), so here is the link the short way
                instead. You can fix the sender in Settings once you are back in.
              </p>
            )}
            <p className="text-xs leading-relaxed text-parchment-400">
              You are at the machine this install lives on, so there is nothing to send: the
              button below takes you straight to a new password. It works only from this
              computer, only once, and only for the next ten minutes.
            </p>
            <a href={`/reset-password/open/${handoff}`} className="btn-primary w-full">
              Choose a new password
            </a>
          </div>
        )}

        {delivery === "file" && (
          <p className="rounded border border-abyss-600 bg-abyss-900 p-3 text-xs leading-relaxed">
            {mailError
              ? `The email could not be sent (${mailError}), so the link has been written to a file instead:`
              : "This install has no sender configured, so the link has been written to a file only you can read:"}{" "}
            <code className="text-gold-300">data\reset-link.txt</code>, inside the
            Composer&rsquo;s Dungeon folder. Open it, follow the link, then delete the file.
            <br />
            <span className="text-parchment-500">
              You can set up email in Settings once you are back in.
            </span>
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
      {spent && (
        <p className="rounded border border-abyss-600 bg-abyss-900 p-3 text-xs leading-relaxed text-parchment-400">
          {spent === "remote"
            ? "That link only works on the computer the app is installed on. Ask again from there, or set up email in Settings."
            : "That link has already been used, or it has expired. Ask for another one below."}
        </p>
      )}
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
