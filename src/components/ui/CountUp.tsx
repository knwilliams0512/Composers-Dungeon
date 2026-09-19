"use client";

/**
 * A number that arrives rather than appears.
 *
 * XP is the game's applause, and applause that is simply there when you look
 * does not feel like anything. Counting it up takes the same half second the
 * player is already spending reading the banner, and makes the number an
 * event.
 *
 * Reduced motion gets the final value immediately — the information is the
 * point, the count is the flourish.
 */

import { useEffect, useRef, useState } from "react";

export function CountUp({
  to,
  durationMs = 650,
  prefix = "",
  suffix = "",
}: {
  to: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [value, setValue] = useState(to);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const quiet =
      document.documentElement.getAttribute("data-motion") === "reduce" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (quiet || to <= 0) {
      setValue(to);
      return;
    }

    const started = performance.now();
    setValue(0);
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / durationMs);
      // Fast at first, settling at the end — the shape of a tally landing.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [to, durationMs]);

  // The final value is always in the DOM for a screen reader, whatever the
  // animation is doing.
  return (
    <span aria-label={`${prefix}${to}${suffix}`}>
      <span aria-hidden="true">
        {prefix}
        {value.toLocaleString()}
        {suffix}
      </span>
    </span>
  );
}
