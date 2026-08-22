// Daily Dungeon Challenge: one global challenge generated per UTC day, with a
// per-user UserChallenge instance tracking completion.

import { db } from "@/lib/db";
import { dateKeyUTC } from "@/lib/streak";
import { generateChallenge } from "@/lib/challenge-generator";
import { challengeXpForDifficulty } from "@/lib/xp";

export async function ensureDailyChallenge(userId: string) {
  const today = dateKeyUTC();

  let daily = await db.dailyChallenge.findUnique({
    where: { date: today },
    include: { challenge: true },
  });

  if (!daily) {
    const recentDailies = await db.dailyChallenge.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: { challenge: { select: { title: true } } },
    });
    const generated = await generateChallenge(db, {
      difficulty: 4,
      type: "DAILY",
      avoidTitles: recentDailies.map((d) => d.challenge.title),
    });
    const challenge = await db.challenge.create({
      data: {
        type: "DAILY",
        title: generated.title,
        description: generated.description,
        difficulty: generated.difficulty,
        keySig: generated.keySig,
        meter: generated.meter,
        lengthBars: generated.lengthBars,
        instrument: generated.instrument,
        style: generated.style,
        requirement: generated.requirement,
        restriction: generated.restriction,
        xpReward: challengeXpForDifficulty(generated.difficulty) + 150,
        skillKey: generated.skillKey,
      },
    });
    try {
      daily = await db.dailyChallenge.create({
        data: { date: today, challengeId: challenge.id },
        include: { challenge: true },
      });
    } catch {
      // A concurrent request created today's row first — use theirs.
      daily = await db.dailyChallenge.findUnique({
        where: { date: today },
        include: { challenge: true },
      });
      if (!daily) throw new Error("Failed to create daily challenge");
    }
  }

  let uc = await db.userChallenge.findFirst({
    where: { userId, challengeId: daily.challengeId },
    include: { challenge: true },
  });
  if (!uc) {
    uc = await db.userChallenge.create({
      data: { userId, challengeId: daily.challengeId },
      include: { challenge: true },
    });
  }
  return uc;
}
