/**
 * Proves that re-seeding the live database does not cost anybody their progress.
 *
 *   DATABASE_URL="file:/tmp/scratch.db" npx tsx scripts/verify-reseed.ts
 *
 * This is the question anybody has to answer before running the seeder against
 * a database with real accounts in it, and reading the seeder is not a good
 * enough answer. The seeder deletes and recreates three kinds of row — quiz
 * questions, exercises and unit-exam questions — and two of those sit at the
 * other end of a cascade from something a player earned. If a learner's quiz
 * attempt or a guild's boss progress referenced a row that gets replaced, a
 * content update would quietly wipe it.
 *
 * So: seed, create a player with progress of every kind, seed again, and count.
 *
 * It needs a database it is allowed to destroy, which is why it is not part of
 * `npm run check:all` — that suite runs without one. Point DATABASE_URL at a
 * scratch file, never at anything real.
 */
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";

const db = new PrismaClient();
const problems: string[] = [];
const fail = (m: string) => problems.push(m);

const seed = () =>
  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    stdio: "pipe",
    env: process.env,
  });

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/^file:/.test(url)) {
    console.log("FAIL - point DATABASE_URL at a scratch file: database, never a real one");
    process.exit(1);
  }

  console.log("seeding once…");
  seed();

  /* ---- A player, with one of everything they could lose --------------- */
  const user = await db.user.create({
    data: {
      email: `reseed-${Date.now()}@example.invalid`,
      passwordHash: "x",
      profile: { create: { displayName: "Reseed Test", totalXp: 4321, level: 9 } },
    },
    include: { profile: true },
  });

  const lesson = await db.lesson.findFirst({ include: { quiz: true } });
  const boss = await db.boss.findFirst();
  const objective = await db.bossObjective.findFirst({ where: { bossId: boss!.id } });
  if (!lesson?.quiz || !boss || !objective) {
    fail("the seeded database has no lesson quiz or no boss objective to test against");
  } else {
    await db.lessonProgress.create({
      data: { userId: user.id, lessonId: lesson.id, quizPassed: true, status: "COMPLETED", completedAt: new Date() },
    });
    await db.quizAttempt.create({
      data: { userId: user.id, quizId: lesson.quiz.id, score: 100, correct: 3, total: 3 },
    });
    await db.unitExamAttempt.create({
      data: { userId: user.id, unit: "1.1", score: 92, correct: 11, total: 12, passed: true },
    });
    const progress = await db.userBossProgress.create({
      data: { userId: user.id, bossId: boss.id, currentHp: 500 },
    });
    await db.userBossObjective.create({
      data: { progressId: progress.id, objectiveId: objective.id },
    });
  }

  console.log("seeding again, the way a content update would…");
  seed();

  /* ---- Count what survived -------------------------------------------- */
  const after = {
    profile: await db.userProfile.findUnique({ where: { userId: user.id } }),
    lessonProgress: await db.lessonProgress.count({ where: { userId: user.id } }),
    quizAttempts: await db.quizAttempt.count({ where: { userId: user.id } }),
    examAttempts: await db.unitExamAttempt.count({ where: { userId: user.id } }),
    bossProgress: await db.userBossProgress.count({ where: { userId: user.id } }),
    bossObjectives: await db.userBossObjective.count({
      where: { progress: { userId: user.id } },
    }),
  };

  if (after.profile?.totalXp !== 4321) fail(`XP came back as ${after.profile?.totalXp}, not 4321`);
  if (after.profile?.level !== 9) fail(`level came back as ${after.profile?.level}, not 9`);
  if (after.lessonProgress !== 1) fail(`lesson progress rows: ${after.lessonProgress}, expected 1`);
  if (after.quizAttempts !== 1)
    fail(
      `quiz attempts: ${after.quizAttempts}, expected 1 — the seeder replaces quiz questions, ` +
        `and an attempt that referenced one would have cascaded away`
    );
  if (after.examAttempts !== 1)
    fail(
      `unit exam attempts: ${after.examAttempts}, expected 1 — the seeder replaces exam questions ` +
        `wholesale, so an attempt keyed to a question rather than a unit would be gone`
    );
  if (after.bossProgress !== 1) fail(`boss progress rows: ${after.bossProgress}, expected 1`);
  if (after.bossObjectives !== 1)
    fail(
      `completed boss objectives: ${after.bossObjectives}, expected 1 — objectives cascade, so ` +
        `a seeder that recreated them would erase every guild's raid progress`
    );

  // And the content really did update, or the test above proves nothing.
  const lessons = await db.lesson.count();
  const areas = await db.dungeonArea.count();
  const bare = await db.dungeonArea.count({ where: { lore: null } });
  if (lessons === 0 || areas === 0) fail("the second seed left no content behind");
  if (bare > 0) fail(`${bare} areas have no lore after seeding`);

  await db.user.delete({ where: { id: user.id } });

  console.log(
    `reseed: ${lessons} lessons and ${areas} areas seeded twice; a player's XP, level, ` +
      `lesson progress, quiz attempt, exam attempt, boss progress and completed objective all survived`
  );
  if (problems.length === 0) console.log("OK - a content update costs nobody their progress");
  else {
    console.log(`FAIL - ${problems.length} problems:`);
    problems.forEach((p) => console.log("  -", p));
  }
  await db.$disconnect();
  process.exit(problems.length ? 1 : 0);
}

main();
