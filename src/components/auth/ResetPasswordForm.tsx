"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/server/actions/auth-actions";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await resetPassword({ token, password });
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Reset failed");
      return;
    }
    router.push("/login?reset=1");
  }

  if (!token) {
    return <p className="text-sm text-crimson-400">This reset link is missing its token.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="password">New Password</label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-crimson-400">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Reforging…" : "Set New Password"}
      </button>
    </form>
  );
}
