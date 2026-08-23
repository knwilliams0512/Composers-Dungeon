/**
 * Desktop-mode awareness.
 *
 * When the Windows launcher starts the bundled server it sets these variables.
 * A plain `next start` (development, or a source install) leaves them unset, so
 * everything that could touch the installed app is inert outside the installer.
 */

export const DEFAULT_UPDATE_FEED =
  "https://github.com/knwilliams0512/Composer-s-Dungeon/releases/latest/download/latest.json";

/** True only when running inside the installed Windows app. */
export function isDesktop(): boolean {
  return process.env.CD_DESKTOP === "1";
}

/** The installed version, e.g. "1.1.0". "dev" when not running installed. */
export function appVersion(): string {
  return process.env.CD_VERSION?.trim() || "dev";
}

/** Absolute path to the install root, or null outside desktop mode. */
export function desktopRoot(): string | null {
  return isDesktop() ? process.env.CD_ROOT?.trim() || null : null;
}

export function updateFeedUrl(): string {
  return process.env.CD_UPDATE_FEED?.trim() || DEFAULT_UPDATE_FEED;
}

/**
 * Compares dotted numeric versions. Returns > 0 when `a` is newer than `b`.
 * Non-numeric versions (like "dev") sort oldest, so a dev build never claims
 * to be ahead of a release.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) =>
    v
      .replace(/^v/, "")
      .split(".")
      .map((n) => Number.parseInt(n, 10));
  const pa = parse(a);
  const pb = parse(b);
  if (pa.some(Number.isNaN)) return pb.some(Number.isNaN) ? 0 : -1;
  if (pb.some(Number.isNaN)) return 1;
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** The shape of the JSON served at the update feed URL. */
export interface UpdateManifest {
  version: string;
  notes?: string;
  url: string;
  sha256: string;
  publishedAt?: string;
  /** Installs older than this must reinstall rather than patch. */
  minVersion?: string;
}

export function isValidManifest(value: unknown): value is UpdateManifest {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.version === "string" &&
    typeof m.url === "string" &&
    /^https:\/\//.test(m.url) &&
    typeof m.sha256 === "string" &&
    /^[a-fA-F0-9]{64}$/.test(m.sha256)
  );
}
