"use client";

import { useEffect, useState } from "react";

interface Diagnostics {
  version: string;
  node: string;
  database: string;
  logPath: string | null;
  logModified: string | null;
  log: string;
}

/**
 * Shown when a server component throws.
 *
 * Next.js redacts the message in production and leaves a digest, which on a
 * local single-user app is the worst of both worlds: the person looking at the
 * error is also the person who could fix it, and all they get is a number. In
 * the installed app this pulls the real message out of the server's own log and
 * puts it on the page, with a button to copy the lot.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [details, setDetails] = useState<Diagnostics | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
    // 404s on the web build, where there is no log to show.
    fetch("/api/diagnostics")
      .then((r) => (r.ok ? r.json() : null))
      .then(setDetails)
      .catch(() => setDetails(null));
  }, [error]);

  const report = details
    ? [
        `Composer's Dungeon ${details.version} · Node ${details.node}`,
        `Reference: ${error.digest ?? "none"}`,
        `Database: ${details.database}`,
        `Log: ${details.logPath ?? "unknown"}${details.logModified ? ` (last written ${details.logModified})` : ""}`,
        "",
        details.log,
      ].join("\n")
    : "";

  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-10">
      <div className="card-crimson w-full max-w-2xl p-8 text-center">
        <p className="text-4xl" aria-hidden>
          🕯️
        </p>
        <h1 className="heading-display mt-3 text-2xl">Something Broke Down Here</h1>
        <p className="mt-3 text-sm leading-relaxed text-parchment-400">
          The dungeon hit an error it could not recover from.
          {error.digest && (
            <>
              {" "}
              Reference:{" "}
              <code className="rounded bg-abyss-900 px-1.5 py-0.5 text-crimson-400">
                {error.digest}
              </code>
            </>
          )}
        </p>

        {details ? (
          <>
            <p className="mt-5 text-left text-xs uppercase tracking-wider text-parchment-500">
              What actually went wrong
            </p>
            <pre className="mt-2 max-h-72 overflow-auto rounded bg-abyss-900 p-3 text-left text-xs leading-relaxed text-parchment-300">
              {report}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(report).then(
                  () => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  },
                  () => setCopied(false)
                );
              }}
              className="btn-secondary mt-3 text-xs"
            >
              {copied ? "Copied" : "Copy this report"}
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-parchment-400">
              The full detail is written to the server log. In the installed Windows app that is:
            </p>
            <code className="mt-2 block rounded bg-abyss-900 px-3 py-2 text-xs text-gold-400">
              %LOCALAPPDATA%\ComposersDungeon\data\server.log.err
            </code>
          </>
        )}

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
