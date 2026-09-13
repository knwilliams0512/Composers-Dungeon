/**
 * How far along a composer actually is.
 *
 * `experienceTier` on the profile is what someone told us about themselves
 * during onboarding, once. It gates the Academy, the dungeon and the
 * recommendations — but nothing ever raised it, so an honest "I don't know
 * music theory yet" was a permanent ceiling: 18 of 40 lessons and 5 of 15
 * areas, no matter how much of the game you finished.
 *
 * So the declared tier is a starting point, not a cap. It says where to begin;
 * completed lessons say where you have got to. Gates read whichever is higher,
 * which means the answer you gave on day one can never be the reason you are
 * shut out of something you have already earned.
 */
import { EXPERIENCE_TIERS, tierOrdinal, type ExperienceTier } from "@/lib/enums";

/**
 * Completed lessons needed for each tier, indexed alongside EXPERIENCE_TIERS.
 * The steps sit just under each level of the roadmap, so finishing a level is
 * what opens the next one — scripts/check-content.mjs walks the whole
 * curriculum from a standing start and fails if any lesson is unreachable.
 */
const LESSONS_FOR_TIER = [0, 8, 14, 20, 26, 32, 38] as const;

/** The tier a composer has earned through completed lessons alone. */
export function earnedTier(lessonsCompleted: number): ExperienceTier {
  let earned: ExperienceTier = EXPERIENCE_TIERS[0];
  for (let i = 0; i < EXPERIENCE_TIERS.length; i++) {
    if (lessonsCompleted >= LESSONS_FOR_TIER[i]) earned = EXPERIENCE_TIERS[i];
  }
  return earned;
}

/** The tier every gate should use: what you said, or what you've shown. */
export function effectiveTier(
  declared: string,
  lessonsCompleted: number
): ExperienceTier {
  const earned = earnedTier(lessonsCompleted);
  return tierOrdinal(earned) > tierOrdinal(declared)
    ? earned
    : (declared as ExperienceTier);
}

/** Lessons still to finish before the next tier — null once at the top. */
export function lessonsToNextTier(lessonsCompleted: number): number | null {
  const next = LESSONS_FOR_TIER.find((n) => n > lessonsCompleted);
  return next === undefined ? null : next - lessonsCompleted;
}
