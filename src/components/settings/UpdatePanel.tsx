"use client";

import { useEffect, useState } from "react";
import {
  applyUpdate,
  checkForUpdate,
  updateProgress,
  type UpdateStatus,
} from "@/server/actions/updates";
import type { UpdateProgress } from "@/lib/update-status";
import { Icon } from "@/components/ui/Icon";

export function UpdatePanel({ initial }: { initial: UpdateStatus }) {
  const [status, setStatus] = useState<UpdateStatus>(initial);
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [restarting, setRestarting] = useState(false);
  const [lost, setLost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Follow the updater while it works.
   *
   * Two things make this less ordinary than a poll. The updater stops this
   * very server partway through, so the request that fails is not an error —
   * it is the expected shape of the step called "stopping", and the right
   * response is to keep asking until the relaunched app answers and then
   * reload onto it. And the updater can finish by failing, which the panel has
   * to show rather than spin through.
   */
  useEffect(() => {
    if (!applying) return;
    let cancelled = false;
    let downSince = 0;

    const tick = async () => {
      try {
        const next = await updateProgress();
        if (cancelled) return;
        // The server answered, so it is still up.
        if (downSince) {
          // It went away and came back: the new version is serving us.
          window.location.reload();
          return;
        }
        setRestarting(false);
        if (next) setProgress(next);
      } catch {
        if (cancelled) return;
        // The server is gone. That is a step, not a failure.
        if (!downSince) downSince = Date.now();
        setRestarting(true);
        // The relaunched app picks its own port, and on the rare occasion it
        // picks a different one this page is left asking an address nobody is
        // answering. Say so rather than spinning: by this point the update
        // itself has already happened.
        if (Date.now() - downSince > 60_000) setLost(true);
      }
    };

    void tick();
    const timer = setInterval(tick, 1200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [applying]);

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
    const failed = progress?.phase === "failed";
    const done = progress?.phase === "done";
    const steps: { phase: UpdateProgress["phase"]; label: string }[] = [
      { phase: "checking", label: "Checking" },
      { phase: "downloading", label: "Downloading" },
      { phase: "verifying", label: "Verifying" },
      { phase: "unpacking", label: "Unpacking" },
      { phase: "stopping", label: "Closing the app" },
      { phase: "swapping", label: "Installing" },
      { phase: "database", label: "Your save" },
    ];
    const reached = steps.findIndex((s) => s.phase === progress?.phase);
    // After the swap the server is dead, so the last thing it told us is the
    // furthest it got — treat a restart as being at least at that step.
    const at = done ? steps.length : reached;

    if (lost) {
      return (
        <div className="rounded-lg border border-gold-700/50 bg-abyss-900/60 p-5">
          <p className="flex items-center gap-2 font-display text-gold-300">
            <Icon name="check" size={16} /> The update has finished
          </p>
          <p className="mt-2 text-sm leading-relaxed text-parchment-300">
            A new window should already be open. If it is not, open Composer&rsquo;s Dungeon
            from its shortcut — this window is pointed at the old server and has nothing left
            to show.
          </p>
        </div>
      );
    }

    if (failed) {
      return (
        <div className="rounded-lg border border-crimson-500/50 bg-abyss-900/60 p-5">
          <p className="flex items-center gap-2 font-display text-crimson-300">
            <Icon name="warning" size={16} /> The update could not be installed
          </p>
          <p className="mt-2 text-sm leading-relaxed text-parchment-300">
            {progress?.detail || progress?.message}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-parchment-500">
            Your existing copy is untouched and still works. The full account is in{" "}
            <code className="break-all text-gold-400">data\update.log</code>, inside the
            Composer&rsquo;s Dungeon folder.
          </p>
          <button
            onClick={() => {
              setApplying(false);
              setProgress(null);
            }}
            className="btn-secondary mt-4"
          >
            Back
          </button>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-gold-700/50 bg-abyss-900/60 p-5">
        <div className="flex items-center gap-3">
          <Icon name="refresh" size={22} className="shrink-0 animate-spin text-gold-400" />
          <div className="min-w-0">
            <p className="heading-display">
              {restarting
                ? "Reopening…"
                : progress?.message || "Starting the updater…"}
            </p>
            <p className="mt-0.5 text-sm text-parchment-400">
              {restarting
                ? "The app has closed to replace its own files. This page comes back on its own."
                : progress?.detail ||
                  "This window closes and a fresh one opens when it is done. Your progress is untouched."}
            </p>
          </div>
        </div>

        <ol className="mt-4 space-y-1.5">
          {steps.map((step, i) => {
            const state = at > i ? "done" : at === i ? "now" : "todo";
            return (
              <li
                key={step.phase}
                className={`flex items-center gap-2 text-xs ${
                  state === "todo" ? "text-parchment-600" : "text-parchment-300"
                }`}
              >
                {state === "done" ? (
                  <Icon name="check" size={12} className="shrink-0 text-emerald-400" />
                ) : state === "now" ? (
                  <Icon name="refresh" size={12} className="shrink-0 animate-spin text-gold-400" />
                ) : (
                  <span className="h-[12px] w-[12px] shrink-0 rounded-full border border-abyss-600" />
                )}
                {step.label}
              </li>
            );
          })}
        </ol>

        <p className="mt-4 text-xs leading-relaxed text-parchment-500">
          Downloading is about 15 MB, and rebuilding your save takes a few seconds more. On a
          slow connection the whole thing can take several minutes — it has not stalled.
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
                A minute or two on a good connection, longer on a slow one. Compositions,
                levels and streaks are kept, and a failed update leaves your current copy
                working.
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
