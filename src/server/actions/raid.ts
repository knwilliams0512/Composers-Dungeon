"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { compositionSchema, scoreSchema } from "@/lib/validation";
import { briefForBoss } from "@/lib/boss-brief";
import { runChecks, type CheckResult, type Score } from "@/lib/score";
import { FINAL_BLOW_THRESHOLD } from "@/lib/guild-rules";
import {
  awardProgress,
  checkSpecializations,
  syncAchievements,
  type AwardResult,
} from "@/lib/progression";

/**
 * Raids: the bosses a guild fights together.
 *
 * The shape deliberately mirrors boss.ts — start the encounter, land
 * objectives, strike a final blow that is a real piece of music judged by the
 * same engine — because a raid that graded more softly than a solo boss would
 * make the hardest content in the game the cheapest way through it.
 *
 * What differs is where the damage lands. A solo boss has one UserBossProgress
 * per player; a raid has one GuildRaid per guild, and every member's work comes
 * off the same pool. Each member may land each objective once, so the pool is
 * only emptied by people turning up. The numbers in world-collab.ts are set so
 * that one composer landing everything they are allowed to land cannot reach
 * the final blow's unlock threshold on any of the three — checked by
 * scripts/check-raids.mjs rather than trusted.
 */

export interface RaidResult {
  ok: boolean;
  error?: string;
  damage?: number;
  currentHp?: number;
  defeated?: boolean;
  award?: AwardResult;
  rewardArtifact?: string;
  /** Which standards the final piece missed, when it fell short. */
  results?: CheckResult[];
}

/**
 * Finds the raid boss and confirms the caller may fight it.
 *
 * Three gates, and they are different questions: is this a raid boss at all,
 * is the caller in a guild, and is that guild big enough. The last one is the
 * reason these bosses exist, so it is checked before a single objective can be
 * landed rather than at the final blow — being told at 95% damage that your
 * house was always too small would be a cruel way to learn it.
 */
async function requireRaider(bossKey: string) {
  const userId = await requireUserId();
  const boss = await db.boss.findUnique({
    where: { key: bossKey },
    include: { objectives: { orderBy: { order: "asc" } }, rewardArtifact: true },
  });
  if (!boss) return { error: "No such encounter" };
  if (!boss.collab) return { error: "That boss is fought alone" };

  const membership = await db.guildMember.findUnique({ where: { userId } });
  if (!membership) {
    return { error: "You must belong to a guild to take this on" };
  }
  const memberCount = await db.guildMember.count({
    where: { guildId: membership.guildId },
  });
  if (memberCount < boss.minMembers) {
    const error =
      `${boss.name} will not open for fewer than ${boss.minMembers} composers. ` +
      `Your guild has ${memberCount}.`;
    return { error };
  }

  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile || profile.level < boss.levelRequirement) {
    return {
      error: `You must reach Composer Level ${boss.levelRequirement} to join this fight`,
    };
  }

  return { userId, boss, guildId: membership.guildId, memberCount };
}

/** Opens the encounter for the whole guild. Idempotent: anyone may be first. */
export async function openRaid(bossKey: string): Promise<{ ok: boolean; error?: string }> {
  const raider = await requireRaider(bossKey);
  if ("error" in raider) return { ok: false, error: raider.error };

  await db.guildRaid.upsert({
    where: { guildId_bossId: { guildId: raider.guildId, bossId: raider.boss.id } },
    create: {
      guildId: raider.guildId,
      bossId: raider.boss.id,
      currentHp: raider.boss.totalHp,
    },
    update: {},
  });
  revalidatePath(`/guild/raid/${bossKey}`);
  return { ok: true };
}

/**
 * Lands one objective against the guild's shared pool.
 *
 * The final blow additionally requires a finished composition, matched to the
 * boss's brief and run through the same checks a solo boss uses. It ends the
 * raid for everyone — which is why it is also the one objective that cannot be
 * landed twice by different members.
 */
export async function landRaidObjective(input: {
  bossKey: string;
  objectiveId: string;
  composition?: {
    title: string;
    description?: string;
    reflection?: string;
    visibility?: string;
  };
  score?: unknown;
}): Promise<RaidResult> {
  const raider = await requireRaider(input.bossKey);
  if ("error" in raider) return { ok: false, error: raider.error };
  const { userId, boss, guildId } = raider;

  const raid = await db.guildRaid.findUnique({
    where: { guildId_bossId: { guildId, bossId: boss.id } },
    include: { contributions: true },
  });
  if (!raid) return { ok: false, error: "Open the encounter first" };
  if (raid.defeated) return { ok: false, error: "This boss has already fallen" };

  const objective = boss.objectives.find((o) => o.id === input.objectiveId);
  if (!objective) return { ok: false, error: "No such objective" };

  const mine = raid.contributions.filter((c) => c.userId === userId);
  if (mine.some((c) => c.objectiveId === objective.id)) {
    return { ok: false, error: "You have already landed that one" };
  }

  if (objective.finalBlow) {
    // Everyone's required objectives, not just yours: the guild has to have
    // done the work, and the pool has to show it.
    const myRequiredLeft = boss.objectives.filter(
      (o) =>
        !o.bonus &&
        !o.finalBlow &&
        !mine.some((c) => c.objectiveId === o.id)
    );
    if (myRequiredLeft.length > 0) {
      return {
        ok: false,
        error:
          "You have not finished your own part of this fight — " +
          `${myRequiredLeft.length} objective${myRequiredLeft.length === 1 ? "" : "s"} left.`,
      };
    }
    if (raid.currentHp > Math.ceil(boss.totalHp * FINAL_BLOW_THRESHOLD)) {
      return {
        ok: false,
        error:
          "It is still standing too tall to finish. The guild must bring it below " +
          `${Math.round(FINAL_BLOW_THRESHOLD * 100)}% first.`,
      };
    }
    if (!input.composition?.title) {
      return { ok: false, error: "The last blow is a finished piece. It needs a title." };
    }
  }

  // The final blow is music, judged exactly as a solo boss judges its own.
  let finalScore: Score | null = null;
  if (objective.finalBlow) {
    const brief = briefForBoss(boss);
    const parsedScore = scoreSchema.safeParse(input.score);
    if (!parsedScore.success) {
      return { ok: false, error: "Write the final piece in the composer before striking." };
    }
    finalScore = parsedScore.data as Score;
    if (
      finalScore.key !== brief.setup.key ||
      finalScore.mode !== brief.setup.mode ||
      finalScore.bars !== brief.setup.bars ||
      finalScore.meter.beats !== brief.setup.meter.beats ||
      finalScore.meter.unit !== brief.setup.meter.unit
    ) {
      return { ok: false, error: "This piece does not match what the fight demands." };
    }
    const verdict = runChecks(finalScore, brief.checks);
    if (!verdict.passed) {
      return {
        ok: false,
        error: `The blow glances off — ${verdict.passedCount} of ${verdict.results.length} standards met.`,
        results: verdict.results,
      };
    }
  }

  let compositionId: string | null = null;
  if (input.composition?.title) {
    const parsed = compositionSchema.safeParse({
      title: input.composition.title,
      description: input.composition.description ?? "",
      reflection: input.composition.reflection ?? "",
      scoreLink: "",
      visibility: input.composition.visibility ?? "PRIVATE",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid composition" };
    }
    const comp = await db.composition.create({
      data: {
        userId,
        ...parsed.data,
        source: "BOSS",
        ...(finalScore ? { score: JSON.stringify(finalScore) } : {}),
      },
    });
    compositionId = comp.id;
  }

  // One transaction: the contribution and the HP it takes off must not be able
  // to disagree. Two members striking at the same moment is the ordinary case
  // in a raid, not an edge one.
  const after = await db.$transaction(async (tx) => {
    const current = await tx.guildRaid.findUnique({ where: { id: raid.id } });
    if (!current || current.defeated) return null;

    await tx.guildRaidContribution.create({
      data: {
        raidId: raid.id,
        userId,
        objectiveId: objective.id,
        damage: objective.damage,
        compositionId,
      },
    });

    // An ordinary objective can wound it to within a hair of death and no
    // further. Without this floor a big enough guild kills the boss by
    // grinding objectives and never writes the piece — which would make the
    // final blow, the one part of the encounter that is actually music,
    // optional for exactly the guilds most able to produce it.
    const newHp = objective.finalBlow
      ? Math.max(0, current.currentHp - objective.damage)
      : Math.max(1, current.currentHp - objective.damage);
    const defeated = objective.finalBlow && newHp === 0;
    return tx.guildRaid.update({
      where: { id: raid.id },
      data: {
        currentHp: defeated ? 0 : newHp,
        defeated,
        defeatedAt: defeated ? new Date() : null,
      },
    });
  });

  if (!after) return { ok: false, error: "This boss has already fallen" };

  const objectiveXp = Math.round(objective.damage / 20);
  let award: AwardResult;
  let rewardArtifact: string | undefined;

  if (after.defeated) {
    // Everyone who landed anything shares the bounty. The composer who struck
    // last gets no more than the one who did the unglamorous second objective
    // three days earlier — in a raid, turning up is the contribution.
    const contributors = await db.guildRaidContribution.findMany({
      where: { raidId: raid.id },
      select: { userId: true },
    });
    const ids = Array.from(new Set(contributors.map((c) => c.userId)));
    for (const id of ids) {
      const result = await awardProgress({
        userId: id,
        xp: boss.xpReward + (id === userId ? objectiveXp : 0),
        skillXp: { FORM: 60, TECHNIQUE: 40, COUNTERPOINT: 40 },
        // Only the composer actually here right now is doing something today.
        countsAsActivity: id === userId,
      });
      if (id === userId) award = result;
      if (boss.rewardArtifactId) {
        const held = await db.userArtifact.findFirst({
          where: { userId: id, artifactId: boss.rewardArtifactId },
        });
        if (!held) {
          await db.userArtifact.create({
            data: { userId: id, artifactId: boss.rewardArtifactId },
          });
          if (id === userId) rewardArtifact = boss.rewardArtifact?.name;
        }
      }
      await syncAchievements(id);
    }
    await checkSpecializations(userId);
    award ??= await awardProgress({ userId, xp: 0, countsAsActivity: false });
  } else {
    award = await awardProgress({ userId, xp: objectiveXp });
  }

  revalidatePath(`/guild/raid/${input.bossKey}`);
  revalidatePath("/guild");
  revalidatePath("/hall");
  return {
    ok: true,
    damage: objective.damage,
    currentHp: after.currentHp,
    defeated: after.defeated,
    award,
    rewardArtifact,
  };
}
