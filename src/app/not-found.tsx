import Link from "next/link";

/**
 * Without this, a missing lesson, room, area or boss fell through to Next's
 * own 404 — black text on a white page, inside an app that is dark
 * everywhere else, which reads as a crash rather than a wrong turn.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="card w-full max-w-lg p-8 text-center">
        <p className="text-4xl" aria-hidden>
          🗝️
        </p>
        <h1 className="heading-display mt-3 text-2xl">No Such Door</h1>
        <p className="mt-3 text-sm leading-relaxed text-parchment-400">
          Nothing is written at this address. The room may have been renamed, or
          the link may have been guessed at.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/hall" className="btn-primary">
            Back to the Hall
          </Link>
          <Link href="/dungeon" className="btn-secondary">
            The Dungeon Map
          </Link>
        </div>
      </div>
    </div>
  );
}
