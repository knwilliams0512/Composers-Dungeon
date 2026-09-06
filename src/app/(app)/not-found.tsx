import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * The 404 for pages inside the app shell, so a wrong turn keeps the nav and
 * the app's own colours instead of dropping to a bare white page.
 */
export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
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
          <Link href="/dungeon" className="btn-primary">
            <Icon name="candle" size={16} /> The Dungeon Map
          </Link>
          <Link href="/hall" className="btn-secondary">
            Back to the Hall
          </Link>
        </div>
      </div>
    </div>
  );
}
