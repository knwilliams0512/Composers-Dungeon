"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signup } from "@/server/actions/auth-actions";

export function SignupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signup({ email, password, displayName });
    if (!result.ok) {
      setError(result.error ?? "Something went wrong");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="displayName">Composer Name</label>
        <input
          id="displayName"
          required
          minLength={2}
          maxLength={40}
          className="input"
          placeholder="Aria of the Ninth Gate"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-crimson-400">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Carving your name…" : "Create Account"}
      </button>
    </form>
  );
}
