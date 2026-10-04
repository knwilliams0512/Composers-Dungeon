/**
 * The numbers a guild runs on.
 *
 * Here rather than beside the actions because a "use server" module may only
 * export async functions — a plain exported constant becomes a client
 * reference stub and the build refuses it outright. The roster needs these to
 * explain itself, the actions need them to enforce, and a second copy of "3"
 * in a sentence is how a cap and its own description drift apart.
 */

/** How many boosts one composer may give in a day. */
export const BOOSTS_PER_DAY = 3;

/** What a boost is worth to the composer who receives it. */
export const BOOST_XP = 40;

/**
 * The share of a raid boss's health below which the last blow becomes
 * possible. Read by the server when it enforces this and by the raid panel
 * when it explains it; scripts/check-raids.mjs reads the server's copy and
 * proves no raid can be finished alone at this threshold.
 */
export const FINAL_BLOW_THRESHOLD = 0.15;
