"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { onboardingSchema, placementSubmissionSchema } from "@/lib/validation";
import { tierFromOrdinal, tierOrdinal, SKILL_LABELS, type SkillKey } from "@/lib/enums";

export async function completeOnboarding(input: {
  experienceTier: string;
  goals: string[];
  interests: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  await db.userProfile.update({
    where: { userId },
    data: {
      experienceTier: parsed.data.experienceTier,
      goals: JSON.stringify(parsed.data.goals),
      interests: JSON.stringify(parsed.data.interests),
      onboardingComplete: true,
    },
  });
  revalidatePath("/hall");
  return { ok: true };
}

export interface PlacementQuestionDto {
  id: string;
  subject: string;
  difficulty: number;
  prompt: string;
  choices: string[];
}

/** Serves the next adaptive placement question (answer withheld). */
export async function getPlacementQuestion(input: {
  difficulty: number;
  excludeIds: string[];
}): Promise<PlacementQuestionDto | null> {
  await requireUserId();
  const difficulty = Math.min(9, Math.max(1, Math.round(input.difficulty)));
  const excludeIds = input.excludeIds.slice(0, 50);

  // Prefer exact difficulty, widen the window if exhausted.
  for (const window of [0, 1, 2, 9]) {
    const candidates = await db.quizQuestion.findMany({
      where: {
        placement: true,
        id: { notIn: excludeIds },
        difficulty: { gte: difficulty - window, lte: difficulty + window },
      },
      take: 20,
    });
    if (candidates.length > 0) {
      const q = candidates[Math.floor(Math.random() * candidates.length)];
      return {
        id: q.id,
        subject: q.subject,
        difficulty: q.difficulty,
        prompt: q.prompt,
        choices: JSON.parse(q.choices) as string[],
      };
    }
  }
  return null;
}

/** Grades one answer server-side so the client can adapt difficulty. */
export async function gradePlacementAnswer(input: {
  questionId: string;
  choiceIndex: number;
}): Promise<{ correct: boolean; explanation: string }> {
  await requireUserId();
  const q = await db.quizQuestion.findUnique({ where: { id: input.questionId } });
  if (!q) return { correct: false, explanation: "" };
  return { correct: q.answerIndex === input.choiceIndex, explanation: q.explanation };
}

export interface PlacementResult {
  recommendedTier: string;
  recommendedTierLabel: string;
  strongestSkill: string;
  weakestSkill: string;
  recommendedDungeonKey: string;
  recommendedDungeonName: string;
  correct: number;
  total: number;
}

const SUBJECT_TO_SKILL: Record<string, SkillKey> = {
  NOTES: "MELODY",
  ACCIDENTALS: "MELODY",
  RHYTHM: "RHYTHM",
  METER: "RHYTHM",
  SCALES: "MELODY",
  INTERVALS: "HARMONY",
  CHORDS: "HARMONY",
  FUNCTIONS: "HARMONY",
  INVERSIONS: "HARMONY",
  CADENCES: "HARMONY",
  CIRCLE_OF_FIFTHS: "HARMONY",
  MODULATION: "HARMONY",
  SECONDARY_DOMINANTS: "HARMONY",
  COUNTERPOINT: "COUNTERPOINT",
  AUGMENTATION: "COUNTERPOINT",
  FORM: "FORM",
};

const SKILL_TO_DUNGEON: Partial<Record<SkillKey, { key: string; name: string }>> = {
  MELODY: { key: "hall-of-melody", name: "Hall of Melody" },
  HARMONY: { key: "crypt-of-harmony", name: "Crypt of Harmony" },
  RHYTHM: { key: "tower-of-rhythm", name: "Tower of Rhythm" },
  COUNTERPOINT: { key: "ancient-conservatory", name: "Ancient Conservatory" },
  FORM: { key: "cathedral-of-composition", name: "Cathedral of Composition" },
};

/** Grades the whole trial server-side and stores the recommendation. */
export async function submitPlacementTrial(input: {
  answers: { questionId: string; choiceIndex: number }[];
}): Promise<{ ok: boolean; result?: PlacementResult; error?: string }> {
  const userId = await requireUserId();
  const parsed = placementSubmissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid submission" };

  const ids = parsed.data.answers.map((a) => a.questionId);
  const questions = await db.quizQuestion.findMany({ where: { id: { in: ids } } });
  const byId = new Map(questions.map((q) => [q.id, q]));

  let correct = 0;
  let weightedTier = 0;
  let tierWeight = 0;
  const bySkill: Record<string, { right: number; total: number }> = {};

  for (const a of parsed.data.answers) {
    const q = byId.get(a.questionId);
    if (!q) continue;
    const isRight = q.answerIndex === a.choiceIndex;
    if (isRight) correct++;
    // A correct hard answer pulls the tier up; a missed easy one pulls it down.
    weightedTier += isRight ? q.difficulty + 0.5 : Math.max(1, q.difficulty - 1.5);
    tierWeight++;
    const skill = SUBJECT_TO_SKILL[q.subject] ?? "MELODY";
    bySkill[skill] ??= { right: 0, total: 0 };
    bySkill[skill].total++;
    if (isRight) bySkill[skill].right++;
  }

  const total = tierWeight;
  if (total === 0) return { ok: false, error: "No valid answers" };

  const recommendedOrdinal = weightedTier / total;
  const recommendedTier = tierFromOrdinal(recommendedOrdinal);

  const ranked = Object.entries(bySkill)
    .filter(([, v]) => v.total > 0)
    .map(([skill, v]) => ({ skill: skill as SkillKey, rate: v.right / v.total, n: v.total }))
    .sort((a, b) => b.rate - a.rate || b.n - a.n);

  const strongest = ranked[0]?.skill ?? "MELODY";
  const weakest = ranked[ranked.length - 1]?.skill ?? "HARMONY";
  const dungeon = SKILL_TO_DUNGEON[weakest] ?? SKILL_TO_DUNGEON.MELODY!;

  const result: PlacementResult = {
    recommendedTier,
    recommendedTierLabel: recommendedTier.replace(/_/g, " "),
    strongestSkill: SKILL_LABELS[strongest],
    weakestSkill: SKILL_LABELS[weakest],
    recommendedDungeonKey: dungeon.key,
    recommendedDungeonName: dungeon.name,
    correct,
    total,
  };

  await db.userProfile.update({
    where: { userId },
    data: { placementResult: JSON.stringify(result) },
  });

  return { ok: true, result };
}

/** Applies the recommended tier from the stored placement result. */
export async function acceptPlacementTier(): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile?.placementResult) return { ok: false };
  try {
    const result = JSON.parse(profile.placementResult) as PlacementResult;
    if (tierOrdinal(result.recommendedTier) >= 1) {
      await db.userProfile.update({
        where: { userId },
        data: { experienceTier: result.recommendedTier },
      });
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
