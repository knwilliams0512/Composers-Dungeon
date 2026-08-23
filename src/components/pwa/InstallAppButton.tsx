"use client";

import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __cdInstallPrompt?: InstallPromptEvent | null;
  }
}

/**
 * Surfaces the browser's own "install this app" prompt as an in-app button.
 * Renders nothing when the app is already installed, or in browsers that
 * don't support installation (Firefox, Safari desktop).
 *
 * The event often fires before React hydrates, so layout.tsx stashes it on
 * window.__cdInstallPrompt and re-dispatches it as "cd:installable".
 */
export function InstallAppButton({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    if (window.__cdInstallPrompt) setPrompt(window.__cdInstallPrompt);

    const onAvailable = () => setPrompt(window.__cdInstallPrompt ?? null);
    const onInstalled = () => {
      window.__cdInstallPrompt = null;
      setPrompt(null);
      setInstalled(true);
    };
    window.addEventListener("cd:installable", onAvailable);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("cd:installable", onAvailable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !prompt) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
          window.__cdInstallPrompt = null;
          setPrompt(null);
        }
      }}
      title="Install Composer's Dungeon as a desktop app"
      className={`w-full rounded-md border border-gold-700/60 bg-abyss-800/70 px-3 py-1.5 text-xs font-semibold tracking-wide text-gold-300 transition-colors hover:border-gold-500 hover:bg-abyss-700/70 ${className}`}
    >
      ⬇ Install as App
    </button>
  );
}
