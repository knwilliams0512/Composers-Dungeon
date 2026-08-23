"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that makes Composer's Dungeon installable as a
 * desktop app (Windows Start menu / taskbar, macOS dock, Android home screen).
 * The worker itself caches nothing dynamic — see public/sw.js.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Secure contexts only: https, or localhost during local play.
    if (!window.isSecureContext) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* installability is a nicety; never break the app over it */
      });
    };

    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
