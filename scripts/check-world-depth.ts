/**
 * Every area and every boss gets the same depth around it.
 *
 *   npx tsx scripts/check-world-depth.ts
 *
 * The Academy had this exact split and so did the dungeon. The nine areas of
 * the original descent each carried lore, a danger rating and survival tips,
 * and the four original bosses each carried lore and tactics. The six
 * expansion areas and the six bosses added since — every expansion,
 * orchestral and guild boss, which are the hardest fights in the game — had
 * none of it.
 *
 * The area and boss pages render each of those sections only when present, so
 * a player going deeper than the Cathedral found the writing simply stopping,
 * and the fights that most needed telling how to win them said least.
 *
 * Nothing else here could see it: the structural data was complete, the raid
 * arithmetic was sound, every route resolved. It was only visible by counting.
 */
import { dungeonAreas, bosses } from "../prisma/seed-data/world";
import { expansionAreas, expansionBosses } from "../prisma/seed-data/world-expansion";
import { orchestralArea, orchestralBosses, orchestralAreaDetail } from "../prisma/seed-data/world-orchestral";
import { collabBosses } from "../prisma/seed-data/world-collab";
import { areaDetail, bossDetail, type AreaDetail } from "../prisma/seed-data/world-detail";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);

interface AreaLike { key: string; name: string; order?: number }
interface BossLike { key: string; name: string }

const areas = [...dungeonAreas, ...expansionAreas, orchestralArea] as unknown as AreaLike[];
const allBosses = [
  ...bosses,
  ...expansionBosses,
  ...orchestralBosses,
  ...collabBosses,
] as unknown as BossLike[];

/**
 * The orchestral area keeps its detail beside itself rather than in the shared
 * table — and keyed by area, like the table, not as the detail itself. Reading
 * it as the detail is how the first version of this script reported the
 * deepest area in the dungeon as having no lore at all.
 */
const detailFor = (key: string): AreaDetail | undefined =>
  areaDetail[key] ?? (orchestralAreaDetail as Record<string, AreaDetail>)[key];

/* -------------------------------------------------------------------------- */
/* Areas                                                                      */
/* -------------------------------------------------------------------------- */

const MIN_LORE = 150;
const MIN_TIPS = 3;
const MIN_TIP = 40;

for (const a of areas) {
  const d = detailFor(a.key);
  if (!d) {
    fail(
      `area "${a.key}" has no detail, so its page shows no lore, no danger rating and no ` +
        `survival tips — while the area before it does`
    );
    continue;
  }
  if (!d.lore || d.lore.trim().length < MIN_LORE)
    fail(`${a.key}: ${d.lore?.trim().length ?? 0} characters of lore, where ${MIN_LORE} is the floor`);
  if (!Number.isInteger(d.dangerRating) || d.dangerRating < 1 || d.dangerRating > 5)
    fail(`${a.key}: a danger rating of ${d.dangerRating}, which is not on the one-to-five scale`);
  const tips = d.survivalTips ?? [];
  if (tips.length < MIN_TIPS) fail(`${a.key}: ${tips.length} survival tips, where ${MIN_TIPS} is the floor`);
  for (const t of tips) {
    if (!t || t.trim().length < MIN_TIP)
      fail(`${a.key}: a survival tip too short to help: "${t}"`);
    // A tip is advice. Restating what the area is does not survive a fight.
    if (/^(the|this) (area|room|place)\b/i.test(t.trim()))
      fail(`${a.key}: the tip "${t.slice(0, 40)}…" describes the area rather than advising`);
  }
}

for (const key of Object.keys(areaDetail)) {
  if (!areas.some((a) => a.key === key)) fail(`areaDetail has an entry for "${key}", which is not an area`);
}

/* -------------------------------------------------------------------------- */
/* Bosses                                                                     */
/* -------------------------------------------------------------------------- */

const MIN_TACTICS = 3;

for (const b of allBosses) {
  const d = bossDetail[b.key];
  if (!d) {
    fail(
      `boss "${b.key}" has no detail, so the fight arrives with no story and no tactics — ` +
        `and these are the hardest fights in the game`
    );
    continue;
  }
  if (!d.lore || d.lore.trim().length < MIN_LORE)
    fail(`${b.key}: ${d.lore?.trim().length ?? 0} characters of lore, where ${MIN_LORE} is the floor`);
  const tactics = d.tactics ?? [];
  if (tactics.length < MIN_TACTICS)
    fail(`${b.key}: ${tactics.length} tactics, where ${MIN_TACTICS} is the floor`);
  for (const t of tactics) {
    if (!t || t.trim().length < MIN_TIP) fail(`${b.key}: a tactic too short to act on: "${t}"`);
  }
}

for (const key of Object.keys(bossDetail)) {
  if (!allBosses.some((b) => b.key === key)) fail(`bossDetail has an entry for "${key}", which is not a boss`);
}

/* -------------------------------------------------------------------------- */
/* Nothing is written twice                                                   */
/* -------------------------------------------------------------------------- */
// Meeting the floor by copying the area above it would pass every rule so far
// and change nothing for a player.
{
  const seen = new Map<string, string>();
  const claim = (text: string, where: string, kind: string) => {
    const key = text.trim().toLowerCase();
    const already = seen.get(key);
    if (already) fail(`${where} and ${already} share a ${kind}: "${text.slice(0, 50)}…"`);
    else seen.set(key, where);
  };
  for (const a of areas) {
    const d = detailFor(a.key);
    if (d?.lore) claim(d.lore, a.key, "piece of lore");
    for (const t of d?.survivalTips ?? []) claim(t, a.key, "survival tip");
  }
  for (const b of allBosses) {
    const d = bossDetail[b.key];
    if (d?.lore) claim(d.lore, b.key, "piece of lore");
    for (const t of d?.tactics ?? []) claim(t, b.key, "tactic");
  }
}

/* -------------------------------------------------------------------------- */
/* The descent gets more dangerous                                            */
/* -------------------------------------------------------------------------- */
// Not monotonically — the Hall of the Virtuoso is rated above the Conservatory
// that follows it, deliberately, because difficulty and danger are not the
// same thing. But the first area has to be the gentlest and the last the worst,
// or the rating is decoration.
{
  const rated = areas
    .map((a) => ({ key: a.key, order: a.order ?? 0, danger: detailFor(a.key)?.dangerRating ?? 0 }))
    .filter((a) => a.danger > 0)
    .sort((a, b) => a.order - b.order);
  if (rated.length >= 2) {
    const first = rated[0];
    const last = rated[rated.length - 1];
    if (rated.some((a) => a.danger < first.danger))
      fail(`"${first.key}" is the first area but not the gentlest one`);
    if (rated.some((a) => a.danger > last.danger))
      fail(`"${last.key}" is the last area but not the most dangerous one`);
  }
  const spread = new Set(rated.map((a) => a.danger));
  if (spread.size < 3)
    fail(`the danger ratings take only ${spread.size} distinct values, so they say nothing`);
}

const tipCount = areas.reduce((n, a) => n + (detailFor(a.key)?.survivalTips?.length ?? 0), 0);
const tacticCount = allBosses.reduce((n, b) => n + (bossDetail[b.key]?.tactics?.length ?? 0), 0);

console.log(
  `world depth: ${areas.length} areas and ${allBosses.length} bosses, every one carrying lore — ` +
    `${tipCount} survival tips and ${tacticCount} tactics, none of them written twice`
);
if (problems.length === 0) console.log("OK - the dungeon does not stop explaining itself halfway down");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
