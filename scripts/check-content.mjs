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

const CRITERIA = ["LESSONS_COMPLETED","COMPOSITIONS","CHALLENGES_COMPLETED","CURSES_COMPLETED","PUZZLES_COMPLETED","DAILIES_COMPLETED","BOSSES_DEFEATED","STREAK","LEVEL","SKILL_LEVEL","SPECIALIZATIONS","SECRETS_FOUND","ARTIFACTS_OWNED","PUBLIC_COMPOSITIONS","GUILD_MEMBER","ROOMS_CLEARED","ALL_SKILLS_LEVEL","GUILD_POSTS","TOTAL_XP"];
const CAP = { LESSONS_COMPLETED: totalLessons, ARTIFACTS_OWNED: artifacts.length, BOSSES_DEFEATED: bosses.length, SECRETS_FOUND: totalSecrets, ROOMS_CLEARED: totalRooms, PUZZLES_COMPLETED: totalPuzzles };
for (const a of achievements) {
  if (!CRITERIA.includes(a.criteria)) fail(`achievement "${a.key}": unknown criteria "${a.criteria}" - unwinnable`);
  if (a.threshold < 1) fail(`achievement "${a.key}": threshold ${a.threshold}`);
  const cap = CAP[a.criteria];
  if (cap !== undefined && a.threshold > cap) fail(`achievement "${a.key}": needs ${a.threshold}, game has ${cap} - unwinnable`);
}

console.log(`areas ${areas.length} · rooms ${totalRooms} (${totalSecrets} secret) · bosses ${bosses.length} · artifacts ${artifacts.length} · achievements ${achievements.length} · lessons ${totalLessons} · puzzles ${totalPuzzles}`);
if (problems.length === 0) console.log("OK - no content problems");
else { console.log(`FAIL - ${problems.length} problems:`); problems.forEach((p) => console.log("  -", p)); }
await db.$disconnect();
process.exit(problems.length ? 1 : 0);
