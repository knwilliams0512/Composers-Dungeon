import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { desktopRoot } from "@/lib/desktop";

/**
 * What the updater is doing right now.
 *
 * The updater runs detached — stopping this very server is one of its steps —
 * so there is no way to hold a handle on it and ask. It writes its progress to
 * a file in the data folder instead, and this reads it.
 *
 * The alternative, which is what the app did before, is to show a spinner the
 * moment the updater is launched and never change it again. That is right only
 * if every update succeeds. When one failed — an unreachable feed, a checksum
 * mismatch, a download that took three tries at ten minutes each — the app
 * went on claiming to be updating, forever, while the real answer sat in a
 * dialog behind the window.
 */

export type UpdatePhase =
  | "starting"
  | "checking"
  | "downloading"
  | "verifying"
  | "unpacking"
  | "stopping"
  | "swapping"
  | "database"
  | "done"
  | "failed";

export interface UpdateProgress {
  phase: UpdatePhase;
  message: string;
  detail?: string;
  /** -1 when the step has no meaningful fraction, which is most of them. */
  percent?: number;
  version?: string;
  /** When the updater last wrote, ISO 8601. */
  at?: string;
}

const PHASES: UpdatePhase[] = [
  "starting",
  "checking",
  "downloading",
  "verifying",
  "unpacking",
  "stopping",
  "swapping",
  "database",
  "done",
  "failed",
];

function statusPath(): string | null {
  const root = desktopRoot();
  if (!root) return null;
  return path.join(root, "data", "update-status.json");
}

export async function readUpdateProgress(): Promise<UpdateProgress | null> {
  const file = statusPath();
  if (!file) return null;
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const phase = String(parsed.phase ?? "");
    if (!PHASES.includes(phase as UpdatePhase)) return null;
    return {
      phase: phase as UpdatePhase,
      message: String(parsed.message ?? ""),
      detail: parsed.detail ? String(parsed.detail) : undefined,
      percent: typeof parsed.percent === "number" ? parsed.percent : undefined,
      version: parsed.version ? String(parsed.version) : undefined,
      at: parsed.at ? String(parsed.at) : undefined,
    };
  } catch {
    // No file yet, or a half-written one caught mid-save. Either way there is
    // nothing to report, which the caller treats as "not started".
    return null;
  }
}

/**
 * Records that the app has asked for an update, before the updater exists.
 *
 * Without this there is a gap — PowerShell starting, reading the feed — in
 * which no status file exists, and a PowerShell that fails to start at all
 * leaves that gap open forever. Writing first means the panel can tell "it has
 * not said anything yet" from "it never started".
 */
export async function markUpdateStarting(): Promise<void> {
  const file = statusPath();
  if (!file) return;
  const payload: UpdateProgress = {
    phase: "starting",
    message: "Starting the updater",
    at: new Date().toISOString(),
  };
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(payload), "utf8");
  } catch {
    // The panel copes with no status at all; this is an improvement on it,
    // not a requirement.
  }
}
