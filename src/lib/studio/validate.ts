/**
 * What a Studio score has to look like before it is trusted.
 *
 * Server actions receive their arguments from the browser, so the TypeScript
 * type on a score parameter guarantees nothing at runtime. Both places that
 * accept a written score — saving in the Studio, and submitting one to a
 * dungeon trial — check the same shape here, so they cannot drift apart.
 */

import type { StudioScore } from "@/lib/studio/model";

/** Two megabytes is far beyond any real score and far below trouble. */
export const MAX_STUDIO_BYTES = 2_000_000;

/** The composition `source` used for anything written in the score maker. */
export const STUDIO_SOURCE = "STUDIO";

export function readableStudioScore(score: unknown): StudioScore | null {
  if (!score || typeof score !== "object") return null;
  const s = score as Partial<StudioScore>;
  if (!s.info || typeof s.info !== "object") return null;
  if (typeof s.info.title !== "string" || typeof s.info.subtitle !== "string") return null;
  if (!Array.isArray(s.parts) || !Array.isArray(s.measures)) return null;
  return s as StudioScore;
}
