// The progression engine. Every XP-bearing action in the app funnels through
// awardProgress(); nothing trusts client-computed numbers.

import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { applyStreakBonus, levelFromXp, skillLevelFromXp } from "@/lib/xp";
import { advanceStreak } from "@/lib/streak";
import type { SkillKey } from "@/lib/enums";
import { checkAchievements, type UnlockedAchievement } from "@/lib/achievements";

type Tx = Prisma.TransactionClient | PrismaClient;

export interface AwardInput {
  userId: string;
  xp: number;
  /** XP applied to individual skills, keyed by SkillKey. */
  skillXp?: Partial<Record<SkillKey, number>>;
  /** Whether this action counts as a "meaningful activity" for the Creative Flame. */
  countsAsActivity?: boolean;
}

export interface AwardResult {
  xpAwarded: number;
  streakBonusApplied: boolean;
  newLevel: number;
  leveledUp: boolean;
  skillLevelUps: { skill: SkillKey; level: number }[];
  streak: {
    count: number;
    milestone: number | null;
    usedRestDay: boolean;
  };
  achievements: UnlockedAchievement[];
}

export async function awardProgress(input: AwardInput): Promise<AwardResult> {
  const { userId, skillXp = {}, countsAsActivity = true } = input;

  const result = await db.$transaction(async (tx) => {
    const profile = await tx.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error("Profile not found");

    // 1. Streak first, so today's activity earns today's bonus.
    let streakMilestone: number | null = null;
    let usedRestDay = false;
    let streakCount = profile.streakCount;
    if (countsAsActivity) {
      const update = advanceStreak({
        streakCount: profile.streakCount,
        longestStreak: profile.longestStreak,
        lastActivityDate: profile.lastActivityDate,
        restDays: profile.restDays,
      });
      streakCount = update.streakCount;
      streakMilestone = update.milestone;
      usedRestDay = update.usedRestDay;
      if (update.changed) {
        await tx.userProfile.update({
          where: { userId },
          data: {
            streakCount: update.streakCount,
            longestStreak: update.longestStreak,
            lastActivityDate: update.lastActivityDate,
            restDays: update.restDays,
          },
        });
      }
    }

    // 2. Overall XP with streak bonus.
    const xpAwarded = applyStreakBonus(Math.max(0, Math.round(input.xp)), streakCount);
    const oldLevel = levelFromXp(profile.totalXp).level;
    const newTotal = profile.totalXp + xpAwarded;
    const newLevel = levelFromXp(newTotal).level;
    await tx.userProfile.update({
      where: { userId },
      data: { totalXp: newTotal, level: newLevel },
    });

    // 3. Skill XP.
    const skillLevelUps: { skill: SkillKey; level: number }[] = [];
    const entries = Object.entries(skillXp) as [SkillKey, number][];
    for (const [key, amount] of entries) {
      if (!amount || amount <= 0) continue;
      const skill = await tx.skill.findUnique({ where: { key } });
      if (!skill) continue;
      const existing = await tx.userSkill.upsert({
        where: { userId_skillId: { userId, skillId: skill.id } },
        create: { userId, skillId: skill.id, xp: 0, level: 1 },
        update: {},
      });
      const bonus = applyStreakBonus(Math.round(amount), streakCount);
      const newXp = existing.xp + bonus;
      const oldSkillLevel = skillLevelFromXp(existing.xp).level;
      const newSkillLevel = skillLevelFromXp(newXp).level;
      await tx.userSkill.update({
        where: { id: existing.id },
        data: { xp: newXp, level: newSkillLevel },
      });
      if (newSkillLevel > oldSkillLevel) {
        skillLevelUps.push({ skill: key, level: newSkillLevel });
      }
    }

    // 4. Streak milestone rewards.
    if (streakMilestone === 7) {
      await grantArtifactByKey(tx, userId, "quill-of-inspiration");
    } else if (streakMilestone === 30) {
      await grantArtifactByKey(tx, userId, "candle-of-the-forgotten-composer");
    }

    // 5. Achievements (may award their own XP without re-entering this fn).
    const achievements = await checkAchievements(tx, userId);

    return {
      xpAwarded,
      streakBonusApplied: streakCount >= 1,
      newLevel,
      leveledUp: newLevel > oldLevel,
      skillLevelUps,
      streak: { count: streakCount, milestone: streakMilestone, usedRestDay },
      achievements,
    };
  });

  return result;
}

/** Grants an artifact if the user doesn't own it yet. Returns true if newly granted. */
export async function grantArtifactByKey(
  tx: Tx,
  userId: string,
  artifactKey: string
): Promise<boolean> {
  const artifact = await tx.artifact.findUnique({ where: { key: artifactKey } });
  if (!artifact) return false;
  const existing = await tx.userArtifact.findUnique({
    where: { userId_artifactId: { userId, artifactId: artifact.id } },
  });
  if (existing) return false;
  await tx.userArtifact.create({ data: { userId, artifactId: artifact.id } });
  return true;
}

/** Checks which specializations the user newly qualifies for and unlocks them. */
export async function checkSpecializations(userId: string): Promise<string[]> {
  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile) return [];
  const specs = await db.specialization.findMany();
  const owned = await db.userSpecialization.findMany({ where: { userId } });
  const ownedIds = new Set(owned.map((s) => s.specializationId));
  const skills = await db.userSkill.findMany({
    where: { userId },
    include: { skill: true },
  });
  const skillLevels = new Map(skills.map((s) => [s.skill.key, s.level]));

  const unlocked: string[] = [];
  for (const spec of specs) {
    if (ownedIds.has(spec.id)) continue;
    if (profile.level < spec.levelRequirement) continue;
    if (spec.skillKey && (skillLevels.get(spec.skillKey) ?? 1) < spec.requiredSkillLevel)
      continue;
    await db.userSpecialization.create({
      data: { userId, specializationId: spec.id },
    });
    unlocked.push(spec.name);
  }
  return unlocked;
}
