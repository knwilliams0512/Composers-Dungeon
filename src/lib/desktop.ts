/**
 * Desktop-mode awareness.
 *
 * When the Windows launcher starts the bundled server it sets these variables.
 * A plain `next start` (development, or a source install) leaves them unset, so
 * everything that could touch the installed app is inert outside the installer.
 */

export const DEFAULT_UPDATE_FEED =
  "https://github.com/knwilliams0512/Composers-Dungeon/releases/latest/download/latest.json";

/** True only when running inside the installed Windows app. */
export function isDesktop(): boolean {
  return process.env.CD_DESKTOP === "1";
}

/**
 * True only on a server this app is hosted on for other people to reach.
 *
 * Deliberately its own variable rather than the inverse of isDesktop(): a
 * developer running `npm run dev` is neither, and should keep the conveniences
 * that only make sense when the person at the keyboard owns the machine — the
 * password-reset hand-over through a local file above all. Those conveniences
 * become either useless or dangerous once strangers can reach the server, so
 * the hosted deployment opts in explicitly and nothing else is affected.
 */
export function isHosted(): boolean {
  return process.env.CD_HOSTED === "1";
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

/**
 * The address this install answers on, for a link that has to survive leaving
 * the app — an emailed reset link is opened from a mail client, where a path
 * beginning with a slash means nothing.
 *
 * The launcher sets NEXTAUTH_URL to the port it actually chose, which matters:
 * when 3000 is busy the app moves up, and a link hard-coded to 3000 would open
 * somebody else's server.
 */
export function appBaseUrl(): string {
  const configured = process.env.NEXTAUTH_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  // A host that assigns the URL only once the first deploy has happened leaves
  // a chicken-and-egg: the address to put in a password-reset link is not
  // knowable at the moment the app is configured. Vercel publishes the stable
  // production domain as VERCEL_PROJECT_PRODUCTION_URL, so a link built from
  // it keeps working. VERCEL_URL is deliberately not used: it is the
  // individual deployment's hostname and changes with every push, so links
  // mailed out would rot as soon as anything else shipped.
  //
  // Without this a hosted instance falls through to localhost and mails every
  // player a reset link that only works on the server's own machine.
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/\/+$/, "")}`;

  const port = process.env.PORT?.trim() || "3000";
  return `http://localhost:${port}`;
}
