"use server";

import path from "node:path";
import { spawn } from "node:child_process";
import { requireUserId } from "@/lib/auth";
import {
  appVersion,
  compareVersions,
  desktopRoot,
  isDesktop,
  isValidManifest,
  updateFeedUrl,
  type UpdateManifest,
} from "@/lib/desktop";

export interface UpdateStatus {
  current: string;
  desktop: boolean;
  available: boolean;
  latest?: string;
  notes?: string;
  publishedAt?: string;
  /** Set when the check itself failed — offline, feed missing, malformed. */
  error?: string;
}

/**
 * Asks the update feed what the newest release is.
 *
 * Deliberately forgiving: this app is designed to work with no network at all,
 * so an unreachable feed is a normal state, not an error worth shouting about.
 */
export async function checkForUpdate(): Promise<UpdateStatus> {
  await requireUserId();
  const current = appVersion();
  const desktop = isDesktop();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(updateFeedUrl(), {
      cache: "no-store",
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { current, desktop, available: false, error: `Update server said ${res.status}.` };
    }
    const manifest: unknown = await res.json();
    if (!isValidManifest(manifest)) {
      return { current, desktop, available: false, error: "The update feed was malformed." };
    }
    const m = manifest as UpdateManifest;
    return {
      current,
      desktop,
      available: compareVersions(m.version, current) > 0,
      latest: m.version,
      notes: m.notes,
      publishedAt: m.publishedAt,
    };
  } catch {
    return {
      current,
      desktop,
      available: false,
      error: "Couldn't reach the update server. You can keep playing offline.",
    };
  }
}

/**
 * Hands the update off to the Windows updater script and returns immediately.
 *
 * The updater runs detached: it outlives this server process, because stopping
 * that server is the first thing it does. It re-verifies the download's
 * SHA-256 against the feed before touching anything — this action never
 * downloads or unpacks code itself.
 */
export async function applyUpdate(): Promise<{ ok: boolean; error?: string }> {
  await requireUserId();

  const root = desktopRoot();
  if (!isDesktop() || !root) {
    return {
      ok: false,
      error: "Automatic updates are only available in the installed Windows app.",
    };
  }
  if (process.platform !== "win32") {
    return { ok: false, error: "The updater only runs on Windows." };
  }

  const script = path.join(root, "launch", "apply-update.ps1");
  try {
    const child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-WindowStyle",
        "Hidden",
        "-File",
        script,
        "-Root",
        root,
        "-Relaunch",
      ],
      { detached: true, stdio: "ignore", windowsHide: true }
    );
    child.unref();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn't start the updater.",
    };
  }
}
