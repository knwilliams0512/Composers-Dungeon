"use client";

import { useEffect } from "react";

/**
 * Shown when a server component throws. This is a local, single-user app, so
 * the priority is telling the person at the keyboard where the real error is
 * written — Next.js redacts the message itself in production, leaving only a
 * digest.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="card-crimson w-full max-w-lg p-8 text-center">
        <p className="text-4xl" aria-hidden>
          🕯️
        </p>
        <h1 className="heading-display mt-3 text-2xl">Something Broke Down Here</h1>
        <p className="mt-3 text-sm leading-relaxed text-parchment-400">
          The dungeon hit an error it could not recover from.
          {error.digest && (
            <>
              {" "}
              Reference: <code className="rounded bg-abyss-900 px-1.5 py-0.5 text-crimson-400">{error.digest}</code>
            </>
          )}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-parchment-400">
          The full detail is written to the server log. In the installed Windows app that is:
        </p>
        <code className="mt-2 block rounded bg-abyss-900 px-3 py-2 text-xs text-gold-400">
          %LOCALAPPDATA%\ComposersDungeon\data\server.log.err
        </code>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            Try Again
          </button>
          <a href="/hall" className="btn-secondary">
            Back to the Hall
          </a>
        </div>
      </div>
    </div>
  );
}
