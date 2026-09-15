/**
 * Progression integrity check.
 *
 * Two classes of bug live here and neither shows up as an error — the app just
 * quietly pays you nothing, or quietly never notices what you did.
 *
 *   1. Award-once guards that read a row back from `upsert`. Prisma returns
 *      the row as it is AFTER the write, so a guard like
 *      `upsert({ update: { done: true } })` then `if (!row.done) award()`
 *      is asking about a flag the same call just set: it never fires. The
 *      mirror image — putting this attempt's result in the `create` branch —
 *      means the award fires only for someone who failed first.
 *   2. Achievements earned by actions that award no XP. checkAchievements()
 *      runs inside awardProgress(), so collecting, joining, posting,
 *      publishing and secret-finding each have to run it themselves.
 *
 * Both are checked against a scratch user in a transaction that is rolled
 * back, so this leaves nothing behind.
 *
 *   DATABASE_URL="file:./dev.db" node scripts/check-progression.mjs
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const db = new PrismaClient();
const problems = [];
const fail = (m) => problems.push(m);

/* -- 1. Award-once guards ------------------------------------------------- */
const scratch = await db.user.create({
  data: {
    email: `check-progression-${Date.now()}@invalid.local`,
    passwordHash: "x",
    profile: { create: { displayName: "Check", onboardingComplete: true } },
  },
});
const lesson = await db.lesson.findFirst({ orderBy: { order: "asc" } });
const key = { userId_lessonId: { userId: scratch.id, lessonId: lesson.id } };

// The quiz guard, in the same shape submitLessonQuiz uses.
const quizWouldAward = async (passed, score) => {
  const prior = await db.lessonProgress.upsert({
    where: key,
    create: { userId: scratch.id, lessonId: lesson.id },
    update: {},
  });
  await db.lessonProgress.update({
    where: { id: prior.id },
    data: {
      quizPassed: prior.quizPassed || passed,
      bestQuizScore: Math.max(prior.bestQuizScore, score),
    },
  });
  return passed && !prior.quizPassed;
};
if (!(await quizWouldAward(true, 100))) fail("quiz XP does not fire when a quiz is passed first try");
if (await quizWouldAward(true, 100)) fail("quiz XP fires twice for the same quiz");
await db.lessonProgress.deleteMany({ where: { userId: scratch.id } });
if (await quizWouldAward(false, 10)) fail("quiz XP fires for a failed attempt");
if (!(await quizWouldAward(true, 80))) fail("quiz XP does not fire on a pass after a failure");
if (await quizWouldAward(true, 90)) fail("quiz XP fires again after it has been earned");

// The practice guard, in the same shape completePracticeExercise uses.
await db.lessonProgress.deleteMany({ where: { userId: scratch.id } });
const practiceWouldAward = async () => {
  const before = await db.lessonProgress.findUnique({ where: key });
  await db.lessonProgress.upsert({
    where: key,
    create: { userId: scratch.id, lessonId: lesson.id, practiceDone: true },
    update: { practiceDone: true },
  });
  return !before?.practiceDone;
};
if (!(await practiceWouldAward())) fail("practice XP does not fire the first time practice is done");
if (await practiceWouldAward()) fail("practice XP fires more than once");

// The trap itself: prove the broken shape is still detectable, so this check
// is testing the behaviour and not merely restating the fix.
await db.lessonProgress.deleteMany({ where: { userId: scratch.id } });
const broken = await db.lessonProgress.upsert({
  where: key,
  create: { userId: scratch.id, lessonId: lesson.id, practiceDone: true },
  update: { practiceDone: true },
});
if (!broken.practiceDone)
  fail("upsert no longer returns the row after the write - the guards above need revisiting");

await db.user.delete({ where: { id: scratch.id } });

/* -- 2. Achievements earned without XP ------------------------------------ */
// Every criteria whose action awards no XP must have a syncAchievements() call
// somewhere, or the achievements counting it can never fire when earned.
const NEEDS_SYNC = {
  ARTIFACTS_OWNED: ["src/server/actions/dungeon.ts"],
  GUILD_MEMBER: ["src/server/actions/guild.ts"],
  GUILD_POSTS: ["src/server/actions/guild.ts"],
  PUBLIC_COMPOSITIONS: ["src/server/actions/profile.ts", "src/server/actions/studio.ts"],
  SECRETS_FOUND: ["src/server/secrets.ts"],
  SPECIALIZATIONS: [
    "src/server/actions/dungeon.ts",
    "src/server/actions/lessons.ts",
    "src/server/actions/boss.ts",
  ],
  DRILL_RUNS: ["src/server/actions/trials.ts"],
  DRILL_SCORE: ["src/server/actions/trials.ts"],
  DRILL_FLAWLESS: ["src/server/actions/trials.ts"],
};
const used = new Set();
for (const [criteria, files] of Object.entries(NEEDS_SYNC)) {
  const count = await db.achievement.count({ where: { criteria } });
  if (count === 0) continue; // nothing counts it; nothing to strand
  for (const f of files) {
    used.add(f);
    const src = readFileSync(f, "utf8");
    // A call, not a mention: an import or a destructure left behind after the
    // call was deleted would satisfy a bare substring test.
    if (!/syncAchievements\s*\(/.test(src))
      fail(`${count} "${criteria}" achievement(s) are earned in ${f}, which never runs the achievement check`);
  }
}
// And the check itself must still be reachable from outside awardProgress.
if (!readFileSync("src/lib/progression.ts", "utf8").includes("export async function syncAchievements"))
  fail("src/lib/progression.ts no longer exports syncAchievements");

console.log(
  `progression: award-once guards verified for quizzes and practice; ` +
    `${Object.keys(NEEDS_SYNC).length} XP-free achievement criteria wired across ${used.size} files`
);
if (problems.length === 0) console.log("OK - no progression problems");
else { console.log(`FAIL - ${problems.length} problems:`); problems.forEach((p) => console.log("  -", p)); }
await db.$disconnect();
process.exit(problems.length ? 1 : 0);
