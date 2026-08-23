"use client";

import { useEffect, useState } from "react";

/**
 * A torch-lit rail that fills as you read down a long page. Fixed to the top
 * so it works on every screen size, and it hides itself entirely on pages
 * short enough not to scroll.
 */
export function ScrollProgress() {
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 40) {
        setVisible(false);
        return;
      }
      setVisible(true);
      setPercent(Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)));
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Content can arrive after mount (images, async panels).
    const observer = new ResizeObserver(onScroll);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]"
      aria-hidden
    >
      <div
        className="h-full origin-left transition-[width] duration-150 ease-out"
        style={{
          width: `${percent}%`,
          background: "linear-gradient(90deg,#7d6229,#c9a84c 40%,#f0d894 70%,#e685a3)",
          boxShadow: "0 0 12px rgba(227,194,109,0.8), 0 0 4px rgba(240,216,148,0.9)",
        }}
      />
    </div>
  );
}
