// Achievement evaluation. Criteria are keys stored on Achievement rows and
// evaluated here against real database counts — never client input.

import type { Prisma, PrismaClient } from "@prisma/client";
import { levelFromXp } from "@/lib/xp";

type Tx = Prisma.TransactionClient | PrismaClient;

export interface UnlockedAchievement {
  key: string;
  name: string;
  icon: string;
  xpReward: number;
}

/**
 * Evaluates all not-yet-earned achievements for the user and unlocks any whose
 * criteria are now met. Achievement XP is added directly to totalXp (it does
 * not re-trigger streak or achievement checks, avoiding recursion).
 */
export async function checkAchievements(
  tx: Tx,
  userId: string
): Promise<UnlockedAchievement[]> {
  const all = await tx.achievement.findMany();
  const earned = await tx.userAchievement.findMany({ where: { userId } });
  const earnedIds = new Set(earned.map((e) => e.achievementId));
  const pending = all.filter((a) => !earnedIds.has(a.id));
  if (pending.length === 0) return [];

  const profile = await tx.userProfile.findUnique({ where: { userId } });
  if (!profile) return [];

  // Gather stats once.
  const [
    lessonsCompleted,
    compositions,
    challengesCompleted,
    cursesCompleted,
    puzzlesCompleted,
    dailiesCompleted,
    bossesDefeated,
    specializations,
    maxSkill,
  ] = await Promise.all([
    tx.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
    tx.composition.count({ where: { userId } }),
    tx.userChallenge.count({ where: { userId, status: "COMPLETED" } }),
    tx.userChallenge.count({
      where: { userId, status: "COMPLETED", challenge: { type: "CURSE" } },
    }),
    tx.userChallenge.count({
      where: { userId, status: "COMPLETED", challenge: { type: "PUZZLE" } },
    }),
    tx.userChallenge.count({
      where: { userId, status: "COMPLETED", challenge: { type: "DAILY" } },
    }),
    tx.userBossProgress.count({ where: { userId, defeated: true } }),
    tx.userSpecialization.count({ where: { userId } }),
    tx.userSkill.findFirst({ where: { userId }, orderBy: { level: "desc" } }),
  ]);

  const stats: Record<string, number> = {
    LESSONS_COMPLETED: lessonsCompleted,
    COMPOSITIONS: compositions,
    CHALLENGES_COMPLETED: challengesCompleted,
    CURSES_COMPLETED: cursesCompleted,
    PUZZLES_COMPLETED: puzzlesCompleted,
    DAILIES_COMPLETED: dailiesCompleted,
    BOSSES_DEFEATED: bossesDefeated,
    STREAK: profile.longestStreak,
    LEVEL: profile.level,
    SKILL_LEVEL: maxSkill?.level ?? 1,
    SPECIALIZATIONS: specializations,
  };

  const unlocked: UnlockedAchievement[] = [];
  let bonusXp = 0;

  for (const achievement of pending) {
    const value = stats[achievement.criteria];
    if (value === undefined || value < achievement.threshold) continue;
    await tx.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });
    bonusXp += achievement.xpReward;
    unlocked.push({
      key: achievement.key,
      name: achievement.name,
      icon: achievement.icon,
      xpReward: achievement.xpReward,
    });
  }

  if (bonusXp > 0) {
    const newTotal = profile.totalXp + bonusXp;
    await tx.userProfile.update({
      where: { userId },
      data: { totalXp: { increment: bonusXp }, level: levelFromXp(newTotal).level },
    });
  }

  return unlocked;
}
