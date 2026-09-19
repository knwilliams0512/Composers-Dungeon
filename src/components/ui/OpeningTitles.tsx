"use client";

/**
 * The opening titles.
 *
 * Launching the app used to mean a blank dark page and then, abruptly, the
 * Entrance Hall. This is the two seconds in between: five staff lines draw
 * themselves across the dark, a clef settles onto them and catches light, the
 * title strikes, and the whole thing dissolves into the game.
 *
 * Three rules it has to obey, because an opening that gets in the way is worse
 * than none:
 *
 *   - It never takes a click. The overlay is pointer-events: none throughout,
 *     so anything underneath stays usable even while it plays.
 *   - It plays once per launch, not once per page. A session flag survives
 *     navigation inside the app and is gone the next time the app starts.
 *   - Anyone who has asked for less motion never sees it at all.
 */

import { useCallback, useEffect, useState } from "react";

const SEEN_KEY = "cd-opening-played";
/** Long enough to read the title, short enough not to be in the way. */
const RUN_MS = 2600;

export function OpeningTitles() {
  const [state, setState] = useState<"idle" | "playing" | "leaving" | "done">("idle");

  const finish = useCallback(() => {
    setState((s) => (s === "playing" ? "leaving" : s));
  }, []);

  useEffect(() => {
    // Reduced motion, or already played this launch: nothing happens.
    let played = true;
    try {
      played = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      played = false; // private mode — show it, it is only two seconds
    }
    const quiet =
      document.documentElement.getAttribute("data-motion") === "reduce" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (played || quiet) {
      setState("done");
      return;
    }
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* nothing to remember it with; it will simply play again */
    }
    setState("playing");

    const end = window.setTimeout(finish, RUN_MS);
    // Any sign of impatience ends it early.
    const skip = () => finish();
    window.addEventListener("pointerdown", skip, { passive: true });
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, { passive: true });
    return () => {
      window.clearTimeout(end);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
    };
  }, [finish]);

  useEffect(() => {
    if (state !== "leaving") return;
    const t = window.setTimeout(() => setState("done"), 620);
    return () => window.clearTimeout(t);
  }, [state]);

  if (state === "idle" || state === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={`opening ${state === "leaving" ? "opening-out" : ""}`}
    >
      <div className="opening-vignette" />
      <svg className="opening-art" viewBox="0 0 520 240" fill="none">
        {/* Five staff lines, drawn left to right. */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="40"
            x2="480"
            y1={92 + i * 14}
            y2={92 + i * 14}
            stroke="rgba(227,194,109,0.55)"
            strokeWidth="1.2"
            className="opening-rule"
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}

        {/* A treble clef, drawn as one stroke that writes itself on. */}
        <path
          className="opening-clef"
          d="M104 176c-14 0-22-10-22-21 0-12 9-20 20-20 10 0 18 7 18 17 0 9-6 15-14 15-6 0-10-4-10-9 0-4 3-8 8-8 2 0 4 1 5 2-1-5-5-8-10-8-8 0-13 6-13 14 0 9 7 16 17 16 13 0 22-11 22-25 0-16-11-28-24-38-10-8-17-16-17-27 0-12 8-25 20-33 8 10 13 21 13 32 0 14-8 25-19 34 12 10 22 22 22 38 0 10-3 19-9 25 7 4 12 11 12 20 0 12-9 21-21 21-3 0-6 0-8-1"
          stroke="rgba(240,213,152,0.95)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* The light that catches it. */}
        <circle className="opening-spark" cx="112" cy="120" r="46" fill="url(#openingGlow)" />
        <defs>
          <radialGradient id="openingGlow">
            <stop offset="0%" stopColor="rgba(240,213,152,0.55)" />
            <stop offset="100%" stopColor="rgba(240,213,152,0)" />
          </radialGradient>
        </defs>
      </svg>

      <div className="opening-words">
        <p className="opening-title">Composer&rsquo;s Dungeon</p>
        <p className="opening-tagline">Learn · Create · Ascend</p>
      </div>
    </div>
  );
}
