"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { awardProgress, syncAchievements, type AwardResult } from "@/lib/progression";
import { DRILL_KEYS, DRILLS, pointsFor, xpForRound, type DrillKey } from "@/lib/drills";
import type { SkillKey } from "@/lib/enums";

export interface DrillRoundInput {
  drill: string;
  /** One entry per question answered, in order. */
  answers: { correct: boolean }[];
}

export interface DrillRoundResult {
  ok: boolean;
  error?: string;
  score?: number;
  best?: number;
  isBest?: boolean;
  award?: AwardResult;
}

/**
 * Files a finished round.
 *
 * The score is recomputed here from the sequence of right and wrong answers
 * rather than read off the request: the client knows the combo rules, so a
 * client that lies about its total is trivial. What it sends is the shape of
 * the round; what counts is what that shape is worth.
 */
export async function submitDrillRound(input: DrillRoundInput): Promise<DrillRoundResult> {
  const userId = await requireUserId();

  if (!DRILL_KEYS.includes(input.drill as DrillKey)) {
    return { ok: false, error: "Unknown drill" };
  }
  const drill = input.drill as DrillKey;

  // A round is bounded by its own clock. Each answer holds the question on
  // screen for at least ~0.6s before the next one, so there is a hard ceiling
  // on how many can honestly fit — and without one, a posted round of four
  // hundred right answers would be scored as though it happened.
  const ceiling = Math.ceil(DRILLS[drill].seconds / 0.5);
  const answers = Array.isArray(input.answers) ? input.answers.slice(0, ceiling) : [];
  if (answers.length === 0) return { ok: false, error: "Nothing to file" };

  // Replay the round under the server's own scoring rules.
  let score = 0;
  let combo = 0;
  let bestCombo = 0;
  let correct = 0;
  for (const a of answers) {
    if (a?.correct === true) {
      score += pointsFor(combo);
      combo += 1;
      correct += 1;
      bestCombo = Math.max(bestCombo, combo);
    } else {
      combo = 0;
    }
  }
  const summary = { score, correct, total: answers.length, bestCombo };

  const previous = await db.drillResult.findFirst({
    where: { userId, drill },
    orderBy: { score: "desc" },
    select: { score: true },
  });
  const previousBest = previous?.score ?? 0;

  await db.drillResult.create({
    data: { userId, drill, score, correct, total: answers.length, bestCombo },
  });

  const skill = DRILLS[drill].skill as SkillKey;
  const xp = xpForRound(summary);
  const award = await awardProgress({
    userId,
    xp,
    skillXp: { [skill]: Math.round(xp * 0.6) },
    countsAsActivity: true,
  });
  // Drill achievements are counted off DrillResult rows, which awardProgress
  // has no reason to know about — but it has just written XP, so the check has
  // already run against the row above. This catches the rest.
  await syncAchievements(userId);

  revalidatePath("/trials");
  revalidatePath("/hall");
  return {
    ok: true,
    score,
    best: Math.max(previousBest, score),
    isBest: score > previousBest,
    award,
  };
}
