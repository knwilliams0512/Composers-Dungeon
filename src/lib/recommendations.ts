// Encouraging recommendation engine: surfaces the next best activity based on
// skills, current lessons, and dungeon state — never framed as punishment.

import { db } from "@/lib/db";
import { SKILL_LABELS, type SkillKey, tierOrdinal } from "@/lib/enums";

export interface Recommendation {
  kind: "LESSON" | "DUNGEON" | "DAILY" | "BOSS";
  title: string;
  message: string;
  href: string;
}

const SKILL_AREA: Partial<Record<SkillKey, string>> = {
  MELODY: "hall-of-melody",
  HARMONY: "crypt-of-harmony",
  RHYTHM: "tower-of-rhythm",
  TECHNIQUE: "hall-of-the-virtuoso",
  COUNTERPOINT: "ancient-conservatory",
  EXPRESSION: "impressionist-gardens",
  FORM: "cathedral-of-composition",
};

export async function getRecommendations(userId: string): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];
  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile) return recs;

  // 1. Next uncompleted lesson at or below the user's tier.
  const completed = await db.lessonProgress.findMany({
    where: { userId, status: "COMPLETED" },
    select: { lessonId: true },
  });
  const completedIds = new Set(completed.map((c) => c.lessonId));
  const lessons = await db.lesson.findMany({ orderBy: { order: "asc" } });
  const userOrdinal = tierOrdinal(profile.experienceTier);
  const nextLesson = lessons.find(
    (l) =>
      !completedIds.has(l.id) &&
      tierOrdinal(l.tierRequirement) <= userOrdinal &&
      (!l.prerequisiteId || completedIds.has(l.prerequisiteId))
  );
  if (nextLesson) {
    recs.push({
      kind: "LESSON",
      title: nextLesson.title,
      message: `Continue your studies in the Academy: “${nextLesson.title}” awaits.`,
      href: `/academy/${nextLesson.slug}`,
    });
  }

  // 2. Weakest skill → matching dungeon area (phrased as an opportunity).
  const skills = await db.userSkill.findMany({
    where: { userId },
    include: { skill: true },
  });
  if (skills.length > 0) {
    const sorted = [...skills].sort((a, b) => a.level - b.level || a.xp - b.xp);
    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];
    if (strongest.level - weakest.level >= 2) {
      const key = weakest.skill.key as SkillKey;
      const areaKey = SKILL_AREA[key];
      if (areaKey) {
        const area = await db.dungeonArea.findUnique({ where: { key: areaKey } });
        if (area && profile.level >= area.levelRequirement) {
          recs.push({
            kind: "DUNGEON",
            title: area.name,
            message: `Your ${SKILL_LABELS[key]} skill has room to grow — the ${area.name} would sharpen it quickly.`,
            href: `/dungeon/${area.key}`,
          });
        }
      }
    }
  }

  // 3. Daily challenge if not done today.
  recs.push({
    kind: "DAILY",
    title: "Daily Dungeon Challenge",
    message: "Keep your Creative Flame burning with today's challenge.",
    href: "/dungeon/daily",
  });

  return recs.slice(0, 3);
}
