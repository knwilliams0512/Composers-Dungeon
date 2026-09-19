/**
 * Content integrity check.
 *
 * The game's world is plain data, and data has no type checker: a wrong key
 * fails silently at runtime. A treasure room hands out nothing, a secret can
 * never be found, an achievement can never unlock. This asserts every
 * cross-reference resolves and every threshold is reachable.
 *
 *   DATABASE_URL="file:./dev.db" node scripts/check-content.mjs
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
const db = new PrismaClient();
const problems = [];
const fail = (m) => problems.push(m);

const areas = await db.dungeonArea.findMany({ include: { rooms: true } });
const artifacts = await db.artifact.findMany();
const bosses = await db.boss.findMany({ include: { phases: true, objectives: true } });
const achievements = await db.achievement.findMany();
const skillKeys = new Set((await db.skill.findMany()).map((s) => s.key));
const artifactKeys = new Set(artifacts.map((a) => a.key));
const bossKeys = new Set(bosses.map((b) => b.key));
const totalLessons = await db.lesson.count();
const totalRooms = await db.dungeonRoom.count();
const totalPuzzles = await db.dungeonRoom.count({ where: { type: "PUZZLE" } });
const totalSecrets = await db.dungeonRoom.count({ where: { secret: true } });

for (const a of areas) {
  if (a.rooms.length === 0) fail(`area "${a.key}" has no rooms`);
  if (a.skillKey && !skillKeys.has(a.skillKey)) fail(`area "${a.key}" trains unknown skill "${a.skillKey}"`);
  const names = a.rooms.map((r) => r.name);
  if (new Set(names).size !== names.length) fail(`area "${a.key}" has duplicate room names`);
  for (const r of a.rooms) {
    const k = `${a.key}/${r.name}`;
    if (r.type === "TREASURE" && !r.artifactId) fail(`treasure room ${k} hands out nothing`);
    if (r.type === "BOSS" && !r.bossId) fail(`boss room ${k} has no boss`);
    if (r.levelRequirement < a.levelRequirement)
      fail(`room ${k} (L${r.levelRequirement}) opens before its area (L${a.levelRequirement})`);
    if (r.type === "PUZZLE") {
      if (!r.puzzleData) { fail(`puzzle ${k} has no puzzle`); continue; }
      let p; try { p = JSON.parse(r.puzzleData); } catch { fail(`puzzle ${k}: unparseable`); continue; }
      if (!p.prompt) fail(`puzzle ${k}: no prompt`);
      if (!p.explanation) fail(`puzzle ${k}: no explanation`);
      // Two shapes, and they are validated differently. An earlier version of
      // this check assumed every puzzle was ARRANGE and reported all five
      // multiple-choice rooms as broken content when nothing was wrong.
      if (p.kind === "ARRANGE") {
        const ids = new Set((p.pieces ?? []).map((x) => x.id));
        if (ids.size === 0) fail(`puzzle ${k}: no pieces`);
        if (!Array.isArray(p.solution)) { fail(`puzzle ${k}: no solution`); continue; }
        if (p.solution.length !== ids.size) fail(`puzzle ${k}: ${p.solution.length} solution steps for ${ids.size} pieces`);
        for (const s of p.solution) if (!ids.has(s)) fail(`puzzle ${k}: solution names unknown piece "${s}"`);
        if (new Set(p.solution).size !== p.solution.length) fail(`puzzle ${k}: solution repeats a piece`);
      } else if (p.kind === "MULTIPLE_CHOICE") {
        if (!Array.isArray(p.choices) || p.choices.length < 2) { fail(`puzzle ${k}: needs at least two choices`); continue; }
        if (typeof p.answerIndex !== "number" || !Number.isInteger(p.answerIndex))
          fail(`puzzle ${k}: answerIndex is not an integer`);
        else if (p.answerIndex < 0 || p.answerIndex >= p.choices.length)
          fail(`puzzle ${k}: answerIndex ${p.answerIndex} is outside its ${p.choices.length} choices - unsolvable`);
        if (new Set(p.choices).size !== p.choices.length) fail(`puzzle ${k}: duplicate choices`);
      } else {
        fail(`puzzle ${k}: unknown kind "${p.kind}" - the room will render nothing`);
      }
    }
    if (r.secret) {
      if (!r.secretRule) { fail(`secret ${k} has no rule - unreachable`); continue; }
      let rule; try { rule = JSON.parse(r.secretRule); } catch { fail(`secret ${k}: unparseable rule`); continue; }
      const KINDS = ["AREA_CLEARED","HOLDS_ARTIFACT","BOSS_DEFEATED","SKILL_LEVEL","LESSONS_COMPLETED","PUZZLES_SOLVED","STREAK","COMPOSITIONS","SECRETS_FOUND"];
      if (!KINDS.includes(rule.kind)) { fail(`secret ${k}: unknown rule "${rule.kind}" - unreachable`); continue; }
      if (rule.kind === "HOLDS_ARTIFACT" && !artifactKeys.has(rule.artifactKey)) fail(`secret ${k}: unknown artifact "${rule.artifactKey}"`);
      if (rule.kind === "BOSS_DEFEATED" && !bossKeys.has(rule.bossKey)) fail(`secret ${k}: unknown boss "${rule.bossKey}"`);
      if (rule.kind === "SKILL_LEVEL" && !skillKeys.has(rule.skillKey)) fail(`secret ${k}: unknown skill "${rule.skillKey}"`);
      if (rule.kind === "LESSONS_COMPLETED" && rule.count > totalLessons) fail(`secret ${k}: needs ${rule.count} lessons, game has ${totalLessons}`);
      if (rule.kind === "PUZZLES_SOLVED" && rule.count > totalPuzzles) fail(`secret ${k}: needs ${rule.count} puzzles, game has ${totalPuzzles}`);
      if (rule.kind === "SECRETS_FOUND" && rule.count >= totalSecrets) fail(`secret ${k}: needs ${rule.count} others, game has ${totalSecrets}`);
    }
  }
}

for (const b of bosses) {
  if (b.phases.length === 0) fail(`boss "${b.key}" has no phases`);
  if (!b.objectives.some((o) => o.finalBlow)) fail(`boss "${b.key}" has no final blow - unkillable`);
  const dmg = b.objectives.reduce((n, o) => n + o.damage, 0);
  if (dmg < b.totalHp) fail(`boss "${b.key}": ${dmg} damage available vs ${b.totalHp} HP - unkillable`);
  if (b.rewardArtifactKey && !artifactKeys.has(b.rewardArtifactKey)) fail(`boss "${b.key}" rewards unknown artifact`);
  if ((await db.dungeonRoom.count({ where: { bossId: b.id } })) === 0) fail(`boss "${b.key}" is in no room - unreachable`);
}

const CRITERIA = ["LESSONS_COMPLETED","COMPOSITIONS","CHALLENGES_COMPLETED","CURSES_COMPLETED","PUZZLES_COMPLETED","DAILIES_COMPLETED","BOSSES_DEFEATED","STREAK","LEVEL","SKILL_LEVEL","SPECIALIZATIONS","SECRETS_FOUND","ARTIFACTS_OWNED","PUBLIC_COMPOSITIONS","GUILD_MEMBER","ROOMS_CLEARED","ALL_SKILLS_LEVEL","GUILD_POSTS","TOTAL_XP","DRILL_RUNS","DRILL_SCORE","DRILL_FLAWLESS"];
const CAP = { LESSONS_COMPLETED: totalLessons, ARTIFACTS_OWNED: artifacts.length, BOSSES_DEFEATED: bosses.length, SECRETS_FOUND: totalSecrets, ROOMS_CLEARED: totalRooms, PUZZLES_COMPLETED: totalPuzzles };
for (const a of achievements) {
  if (!CRITERIA.includes(a.criteria)) fail(`achievement "${a.key}": unknown criteria "${a.criteria}" - unwinnable`);
  if (a.threshold < 1) fail(`achievement "${a.key}": threshold ${a.threshold}`);
  const cap = CAP[a.criteria];
  if (cap !== undefined && a.threshold > cap) fail(`achievement "${a.key}": needs ${a.threshold}, game has ${cap} - unwinnable`);
}

// --- Quiz and placement questions ----------------------------------------
// Drills and puzzles were already checked for being answerable; the lesson
// quizzes and the Placement Trial were not. A choices column that will not
// parse, or an answerIndex pointing past the end of its own choices, is a
// question with no right answer — the player loses marks on it every time and
// nothing in the app says why.
const quizQuestions = await db.quizQuestion.findMany({
  include: { quiz: { include: { lesson: true } } },
});
let placementCount = 0;
for (const q of quizQuestions) {
  const where = q.quiz?.lesson?.slug
    ? `lesson "${q.quiz.lesson.slug}"`
    : q.placement
      ? "placement trial"
      : "a quiz with no lesson";
  const label = `${where} question "${q.prompt.slice(0, 48)}"`;
  if (q.placement) placementCount++;

  let choices;
  try {
    choices = JSON.parse(q.choices);
  } catch {
    fail(`${label}: choices column is not valid JSON - unanswerable`);
    continue;
  }
  if (!Array.isArray(choices)) { fail(`${label}: choices are not a list`); continue; }
  if (choices.length < 2) { fail(`${label}: only ${choices.length} choice(s)`); continue; }
  if (choices.some((c) => typeof c !== "string" || c.trim() === "")) {
    fail(`${label}: has a blank choice`);
  }
  if (new Set(choices).size !== choices.length) fail(`${label}: duplicate choices`);
  if (!Number.isInteger(q.answerIndex)) {
    fail(`${label}: answerIndex is not an integer`);
  } else if (q.answerIndex < 0 || q.answerIndex >= choices.length) {
    fail(`${label}: answerIndex ${q.answerIndex} is outside its ${choices.length} choices - no right answer`);
  }
  if (!q.prompt.trim()) fail(`${label}: empty prompt`);
}
if (placementCount < 8) {
  fail(`the Placement Trial asks 8 questions but only ${placementCount} are marked placement`);
}
console.log(`quiz questions ${quizQuestions.length} (${placementCount} placement) - all answerable`);

// --- Curriculum -----------------------------------------------------------
// The roadmap names the lessons it expects. A unit pointing at a slug that
// does not exist renders an empty unit; a lesson on neither the roadmap nor
// the craft strand is unreachable from the Academy entirely.
{
  const src = readFileSync("src/lib/curriculum.ts", "utf8");
  const wanted = [...src.matchAll(/slugs: \[([^\]]+)\]/g)]
    .flatMap((m) => m[1].split(",").map((x) => x.trim().replace(/"/g, "")))
    .filter(Boolean);
  const craftBlock = src.match(/CRAFT_SLUGS = \[([^\]]+)\]/);
  const craft = craftBlock
    ? craftBlock[1].split(",").map((x) => x.trim().replace(/"/g, "")).filter(Boolean)
    : [];
  const have = new Set((await db.lesson.findMany({ select: { slug: true } })).map((l) => l.slug));
  for (const slug of wanted) if (!have.has(slug)) fail(`curriculum unit points at missing lesson "${slug}"`);
  for (const slug of craft) if (!have.has(slug)) fail(`craft strand points at missing lesson "${slug}"`);
  const dupes = wanted.filter((s, i) => wanted.indexOf(s) !== i);
  if (dupes.length) fail(`lesson listed in more than one unit: ${[...new Set(dupes)].join(", ")}`);
  for (const slug of have) {
    if (!wanted.includes(slug) && !craft.includes(slug))
      fail(`lesson "${slug}" is on neither the roadmap nor the craft strand - unreachable in the Academy`);
  }
  console.log(`curriculum: ${wanted.length} roadmap slots, ${craft.length} craft lessons`);
}

// --- The roadmap is walkable ----------------------------------------------
// Three ways a curriculum can be laid out correctly and still be impossible to
// walk, all of which shipped at least once:
//
//   1. A lesson requires a prerequisite that sorts after it. You reach it, it
//      is locked, and the thing that unlocks it is further down the page.
//   2. A lesson asks a stricter tier than a later, harder one, so the gate
//      closes and then opens again as you descend.
//   3. Nothing is individually wrong, but from a standing start some lesson is
//      never reachable at all.
//
// The third is the one that matters, and the only one a person would notice
// before it was too late, so it is checked by simulation: start as a composer
// with no experience and no lessons done, open everything the gates allow,
// count the completions, and go round again until nothing new opens.
{
  const lessons = await db.lesson.findMany({ orderBy: { order: "asc" } });
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const TIERS = ["NO_EXPERIENCE","NEW_TO_COMPOSING","KNOW_A_LITTLE","BASIC_COMPOSER","DECENT_COMPOSER","ADVANCED_COMPOSER","VIRTUOSO_REPERTOIRE"];
  const ord = (t) => { const i = TIERS.indexOf(t); return i < 0 ? 0 : i; };

  for (const l of lessons) {
    if (!l.prerequisiteId) continue;
    const pre = byId.get(l.prerequisiteId);
    if (!pre) { fail(`lesson "${l.slug}" requires a lesson that does not exist`); continue; }
    if (pre.order > l.order)
      fail(`lesson "${l.slug}" (order ${l.order}) requires "${pre.slug}" (order ${pre.order}) - which comes later`);
    if (ord(pre.tierRequirement) > ord(l.tierRequirement))
      fail(`lesson "${l.slug}" (${l.tierRequirement}) requires "${pre.slug}", which asks a stricter tier (${pre.tierRequirement})`);
  }

  // Tier must not decrease along the roadmap. The craft strand runs alongside
  // the numbered units rather than after them, so it is checked on its own.
  const craftSlugs = new Set(
    (readFileSync("src/lib/curriculum.ts", "utf8").match(/CRAFT_SLUGS = \[([^\]]+)\]/)?.[1] ?? "")
      .split(",").map((x) => x.trim().replace(/"/g, "")).filter(Boolean)
  );
  for (const strand of [lessons.filter((l) => !craftSlugs.has(l.slug)), lessons.filter((l) => craftSlugs.has(l.slug))]) {
    for (let i = 1; i < strand.length; i++) {
      if (ord(strand[i].tierRequirement) < ord(strand[i - 1].tierRequirement))
        fail(`lesson "${strand[i].slug}" asks ${strand[i].tierRequirement} after "${strand[i - 1].slug}" asked ${strand[i - 1].tierRequirement} - the gate closes and reopens`);
    }
  }

  // The simulation. LESSONS_FOR_TIER must stay in step with src/lib/tier.ts;
  // read it from there rather than restating it, so a change to the thresholds
  // is checked rather than merely assumed.
  const tierSrc = readFileSync("src/lib/tier.ts", "utf8");
  const steps = (tierSrc.match(/LESSONS_FOR_TIER = \[([^\]]+)\]/)?.[1] ?? "")
    .split(",").map((x) => Number(x.trim())).filter((n) => Number.isFinite(n));
  if (steps.length !== TIERS.length) fail(`src/lib/tier.ts: ${steps.length} tier thresholds for ${TIERS.length} tiers`);
  else {
    const earned = (done) => { let t = 0; for (let i = 0; i < steps.length; i++) if (done >= steps[i]) t = i; return t; };
    const open = new Set();
    let moved = true;
    while (moved) {
      moved = false;
      const allowed = earned(open.size) + 1; // the Academy grants one tier of headroom
      for (const l of lessons) {
        if (open.has(l.id)) continue;
        if (ord(l.tierRequirement) > allowed) continue;
        if (l.prerequisiteId && !open.has(l.prerequisiteId)) continue;
        open.add(l.id); moved = true;
      }
    }
    if (open.size < lessons.length) {
      const stuck = lessons.filter((l) => !open.has(l.id));
      fail(`${stuck.length} of ${lessons.length} lessons can never be reached from a standing start: ${stuck.map((l) => l.slug).join(", ")}`);
    } else {
      console.log(`roadmap: all ${lessons.length} lessons reachable from no experience`);
    }
    // Every area, too: the dungeon allows two tiers of headroom.
    const topTier = earned(lessons.length) + 2;
    const sealed = areas.filter((a) => ord(a.tierRequirement) > topTier);
    if (sealed.length) fail(`areas never reachable even after every lesson: ${sealed.map((a) => a.key).join(", ")}`);
  }
}

console.log(`areas ${areas.length} · rooms ${totalRooms} (${totalSecrets} secret) · bosses ${bosses.length} · artifacts ${artifacts.length} · achievements ${achievements.length} · lessons ${totalLessons} · puzzles ${totalPuzzles}`);
if (problems.length === 0) console.log("OK - no content problems");
else { console.log(`FAIL - ${problems.length} problems:`); problems.forEach((p) => console.log("  -", p)); }
await db.$disconnect();
process.exit(problems.length ? 1 : 0);
