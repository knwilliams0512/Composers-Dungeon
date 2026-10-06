import "server-only";

/**
 * Which database this instance is talking to.
 *
 * The desktop app ships a SQLite file; a hosted instance runs Postgres. Almost
 * nothing in the app has to care — the schema and every Prisma query are the
 * same either way — but the two engines disagree about one thing that matters
 * to a player, and this is how the few places that must know find out.
 *
 * Set DATABASE_PROVIDER=postgresql alongside DATABASE_URL when deploying.
 * Unset means the desktop default, so an installed copy is never affected by
 * anything added here.
 */
export const dbProvider: "sqlite" | "postgresql" =
  process.env.DATABASE_PROVIDER === "postgresql" ? "postgresql" : "sqlite";

/**
 * A `contains` filter that ignores case on both engines.
 *
 * SQLite's LIKE is already case-insensitive for ASCII, so searching the library
 * for "fugue" finds "Fugue in D". Postgres's LIKE is case-sensitive and finds
 * nothing. Prisma's `mode: "insensitive"` fixes Postgres but is rejected
 * outright by the SQLite client, so neither spelling works for both and the
 * filter has to be chosen at runtime.
 *
 * Without this the search box quietly stops working for anyone on the hosted
 * version — no error, just no results.
 */
export function containsAnyCase(value: string) {
  return dbProvider === "postgresql"
    ? { contains: value, mode: "insensitive" as const }
    : { contains: value };
}
