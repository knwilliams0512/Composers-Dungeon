"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Announces secret rooms the server revealed on this page load.
 *
 * The discovery already happened — it is a row in the database by the time
 * this renders — so this is purely the telling of it. It disappears on its
 * own, but only after long enough to read two room names, and it can be
 * dismissed. Nothing here is load-bearing: a player who never sees the toast
 * still has the room on their map.
 */
export function SecretFoundToast({
  found,
}: {
  found: { id: string; name: string }[];
}) {
  const [dismissed, setDismissed] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  }, []);

  useEffect(() => {
    if (found.length === 0) return;
    const ms = 6000 + found.length * 1500;
    const t = setTimeout(() => setDismissed(true), ms);
    return () => clearTimeout(t);
  }, [found.length]);

  if (found.length === 0 || dismissed) return null;

  return (
    <div
      // Polite, not assertive: finding a secret is good news, not an alert,
      // and it should wait its turn behind whatever the reader is on.
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 right-4 z-50 max-w-xs rounded-xl border border-amethyst-400/60 bg-abyss-900/95 p-4 shadow-[0_0_40px_-8px_rgba(194,142,245,0.55)] backdrop-blur md:bottom-6 ${
        reduced ? "" : "animate-[fadeIn_.4s_ease-out]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amethyst-400/60 bg-amethyst-500/20 text-amethyst-300">
          <Icon name="sparkle" size={18} solid />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm text-amethyst-200">
            {found.length === 1 ? "You found a secret room" : `You found ${found.length} secret rooms`}
          </p>
          <ul className="mt-1 space-y-0.5">
            {found.map((f) => (
              <li key={f.id} className="truncate text-xs text-parchment-300">
                {f.name}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded p-1 text-parchment-500 transition-colors hover:text-parchment-200"
        >
          <Icon name="close" size={14} />
        </button>
      </div>
    </div>
  );
}
