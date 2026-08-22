"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { compositionSchema } from "@/lib/validation";
import {
  awardProgress,
  checkSpecializations,
  type AwardResult,
} from "@/lib/progression";

export async function startBossFight(
  bossKey: string
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const boss = await db.boss.findUnique({ where: { key: bossKey } });
  if (!boss) return { ok: false, error: "Boss not found" };
  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile || profile.level < boss.levelRequirement) {
    return {
      ok: false,
      error: `You must reach Composer Level ${boss.levelRequirement} to challenge ${boss.name}`,
    };
  }
  await db.userBossProgress.upsert({
    where: { userId_bossId: { userId, bossId: boss.id } },
    create: { userId, bossId: boss.id, currentHp: boss.totalHp },
    update: {},
  });
  revalidatePath(`/bosses/${bossKey}`);
  return { ok: true };
}

export interface BossObjectiveResult {
  ok: boolean;
  error?: string;
  damage?: number;
  currentHp?: number;
  defeated?: boolean;
  award?: AwardResult;
  rewardArtifact?: string;
  newSpecializations?: string[];
}

/**
 * Completing a boss objective deals its damage. The final-blow objective is
 * only available once every other required objective is complete, and it
 * requires a composition submission — the actual musical deliverable.
 */
export async function completeBossObjective(input: {
  bossKey: string;
  objectiveId: string;
  composition?: {
    title: string;
    description?: string;
    reflection?: string;
    scoreLink?: string;
    visibility?: string;
  };
}): Promise<BossObjectiveResult> {
  const userId = await requireUserId();
  const boss = await db.boss.findUnique({
    where: { key: input.bossKey },
    include: { objectives: true, rewardArtifact: true },
  });
  if (!boss) return { ok: false, error: "Boss not found" };

  const progress = await db.userBossProgress.findUnique({
    where: { userId_bossId: { userId, bossId: boss.id } },
    include: { objectives: true },
  });
  if (!progress) return { ok: false, error: "Start the encounter first" };
  if (progress.defeated) return { ok: false, error: "This boss is already defeated" };

  const objective = boss.objectives.find((o) => o.id === input.objectiveId);
  if (!objective) return { ok: false, error: "Objective not found" };

  const doneIds = new Set(progress.objectives.map((o) => o.objectiveId));
  if (doneIds.has(objective.id)) {
    return { ok: false, error: "Objective already completed" };
  }

  if (objective.finalBlow) {
    const requiredRemaining = boss.objectives.filter(
      (o) => !o.bonus && !o.finalBlow && !doneIds.has(o.id)
    );
    if (requiredRemaining.length > 0) {
      return {
        ok: false,
        error: "The final blow is sealed until every required objective is complete",
      };
    }
    if (!input.composition?.title) {
      return { ok: false, error: "The final blow requires your finished composition" };
    }
  }

  let compositionId: string | null = null;
  if (input.composition?.title) {
    const parsed = compositionSchema.safeParse({
      title: input.composition.title,
      description: input.composition.description ?? "",
      reflection: input.composition.reflection ?? "",
      scoreLink: input.composition.scoreLink ?? "",
      visibility: input.composition.visibility ?? "PRIVATE",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid composition" };
    }
    const comp = await db.composition.create({
      data: { userId, ...parsed.data, source: "BOSS" },
    });
    compositionId = comp.id;
  }
  void compositionId;

  await db.userBossObjective.create({
    data: { progressId: progress.id, objectiveId: objective.id },
  });

  const newHp = Math.max(0, progress.currentHp - objective.damage);
  const defeated = objective.finalBlow || newHp === 0;
  await db.userBossProgress.update({
    where: { id: progress.id },
    data: {
      currentHp: defeated ? 0 : newHp,
      defeated,
      defeatedAt: defeated ? new Date() : null,
    },
  });

  // Objective XP scales with damage dealt; defeat pays the full bounty.
  const objectiveXp = Math.round(objective.damage / 20);
  let award: AwardResult | undefined;
  let rewardArtifact: string | undefined;
  let newSpecializations: string[] | undefined;

  if (defeated) {
    award = await awardProgress({
      userId,
      xp: boss.xpReward + objectiveXp,
      skillXp: { TECHNIQUE: 50, FORM: 50 },
    });
    if (boss.rewardArtifact) {
      const existing = await db.userArtifact.findFirst({
        where: { userId, artifactId: boss.rewardArtifact.id },
      });
      if (!existing) {
        await db.userArtifact.create({
          data: { userId, artifactId: boss.rewardArtifact.id },
        });
        rewardArtifact = boss.rewardArtifact.name;
      }
    }
    newSpecializations = await checkSpecializations(userId);
  } else {
    award = await awardProgress({ userId, xp: objectiveXp });
  }

  revalidatePath(`/bosses/${input.bossKey}`);
  revalidatePath("/bosses");
  revalidatePath("/hall");
  return {
    ok: true,
    damage: objective.damage,
    currentHp: defeated ? 0 : newHp,
    defeated,
    award,
    rewardArtifact,
    newSpecializations,
  };
}
