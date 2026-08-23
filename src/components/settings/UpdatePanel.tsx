"use client";

import { useEffect, useState } from "react";
import { checkForUpdate, applyUpdate, type UpdateStatus } from "@/server/actions/updates";
import { Icon } from "@/components/ui/Icon";

export function UpdatePanel({ initial }: { initial: UpdateStatus }) {
  const [status, setStatus] = useState<UpdateStatus>(initial);
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check once on mount so the page is current without the user asking.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await checkForUpdate();
      if (!cancelled) setStatus(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function recheck() {
    setChecking(true);
    setError(null);
    setStatus(await checkForUpdate());
    setChecking(false);
  }

  async function install() {
    setApplying(true);
    setError(null);
    const res = await applyUpdate();
    if (!res.ok) {
      setError(res.error ?? "The update couldn't be started.");
      setApplying(false);
    }
    // On success the server is about to be stopped by the updater; leaving the
    // button in its working state is the correct final frame.
  }

  if (applying) {
    return (
      <div className="rounded-lg border border-gold-700/50 bg-abyss-900/60 p-5 text-center">
        <Icon name="refresh" size={26} className="mx-auto animate-spin text-gold-400" />
        <p className="heading-display mt-3">Updating…</p>
        <p className="mt-1 text-sm text-parchment-400">
          Composer&apos;s Dungeon will close and reopen on its own. Your progress is untouched.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-parchment-300">
            Installed version{" "}
            <span className="font-display text-gold-300">{status.current}</span>
          </p>
          {status.latest && (
            <p className="text-xs text-parchment-500">
              Newest available: {status.latest}
              {status.publishedAt &&
                ` · released ${new Date(status.publishedAt).toLocaleDateString()}`}
            </p>
          )}
        </div>
        <button onClick={recheck} disabled={checking} className="btn-secondary">
          <Icon name="refresh" size={14} className={checking ? "animate-spin" : ""} />
          {checking ? "Checking…" : "Check now"}
        </button>
      </div>

      {status.available ? (
        <div className="rounded-lg border border-gold-700/50 bg-abyss-900/60 p-4">
          <p className="flex items-center gap-2 font-display text-gold-300">
            <Icon name="download" size={16} /> Version {status.latest} is ready
          </p>
          {status.notes && (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-parchment-400">
              {status.notes}
            </p>
          )}
          {status.desktop ? (
            <>
              <button onClick={install} className="btn-primary mt-4">
                <Icon name="download" size={15} /> Install and restart
              </button>
              <p className="mt-2 text-xs text-parchment-500">
                Takes about a minute. Compositions, levels and streaks are kept.
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs text-parchment-500">
              You&apos;re running from source — pull the latest code and rebuild to update.
            </p>
          )}
        </div>
      ) : status.error ? (
        <p className="flex items-start gap-2 text-sm text-parchment-500">
          <Icon name="info" size={15} className="mt-0.5 shrink-0" />
          {status.error}
        </p>
      ) : (
        <p className="flex items-center gap-2 text-sm text-emerald-300">
          <Icon name="check" size={15} /> You&apos;re on the latest version.
        </p>
      )}

      {error && (
        <p className="flex items-start gap-2 text-sm text-crimson-400">
          <Icon name="warning" size={15} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {status.desktop && (
        <p className="border-t border-abyss-600/60 pt-3 text-xs leading-relaxed text-parchment-500">
          Updates also install automatically when you launch the app, so you normally
          never need this page. Downloads are checked against a SHA-256 published with
          the release before anything is replaced.
        </p>
      )}
    </div>
  );
}
