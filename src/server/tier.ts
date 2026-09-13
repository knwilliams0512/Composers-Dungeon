/**
 * The tier a gate should use, read from the database.
 *
 * Pure tier arithmetic lives in @/lib/tier; this is the one place that knows
 * how to count what a composer has actually finished. Pages that already hold
 * the lesson progress should call effectiveTier() directly rather than pay for
 * a second query.
 */
import { db } from "@/lib/db";
import { effectiveTier } from "@/lib/tier";
import { tierOrdinal, type ExperienceTier } from "@/lib/enums";

export async function currentTier(
  userId: string,
  declared: string
): Promise<ExperienceTier> {
  const lessonsCompleted = await db.lessonProgress.count({
    where: { userId, status: "COMPLETED" },
  });
  return effectiveTier(declared, lessonsCompleted);
}

export async function currentTierOrdinal(
  userId: string,
  declared: string
): Promise<number> {
  return tierOrdinal(await currentTier(userId, declared));
}
