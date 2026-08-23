"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { compositionSchema, scoreSchema } from "@/lib/validation";
import { briefForChallenge, parseChecks } from "@/lib/challenge-brief";
import { runChecks, type CheckResult, type Score } from "@/lib/score";
import {
  awardProgress,
  checkSpecializations,
  grantArtifactByKey,
  type AwardResult,
} from "@/lib/progression";
import { createUserChallenge, difficultyForUser } from "@/lib/challenge-generator";
import { parseJsonArray, tierOrdinal, type SkillKey } from "@/lib/enums";

async function getProfileOrThrow(userId: string) {
  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");
  return profile;
}

/** Server-side gate: is this area unlocked for the user? */
export async function isAreaUnlocked(userId: string, areaId: string): Promise<boolean> {
  const [profile, area] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    db.dungeonArea.findUnique({ where: { id: areaId } }),
  ]);
  if (!profile || !area) return false;
  return (
    profile.level >= area.levelRequirement &&
    tierOrdinal(profile.experienceTier) >= tierOrdinal(area.tierRequirement) - 2
  );
}

/**
 * Entering a Challenge/Curse room: returns the active UserChallenge for that
 * room, creating one from the curated challenge or the generator if needed.
 */
export async function getOrStartRoomChallenge(
  roomId: string
): Promise<{ ok: boolean; error?: string; userChallengeId?: string }> {
  const userId = await requireUserId();
  const room = await db.dungeonRoom.findUnique({
    where: { id: roomId },
    include: { area: true, challenges: { where: { curated: true } } },
  });
  if (!room) return { ok: false, error: "Room not found" };
  const profile = await getProfileOrThrow(userId);
  if (profile.level < room.levelRequirement || !(await isAreaUnlocked(userId, room.areaId))) {
    return { ok: false, error: "This room is still locked to you" };
  }

  // Existing active challenge in this room?
  const active = await db.userChallenge.findFirst({
    where: { userId, status: "ACTIVE", challenge: { roomId: room.id } },
  });
  if (active) return { ok: true, userChallengeId: active.id };

  // Curated challenge not yet completed?
  const completedChallengeIds = new Set(
    (
      await db.userChallenge.findMany({
        where: { userId, status: "COMPLETED", challenge: { roomId: room.id } },
        select: { challengeId: true },
      })
    ).map((c) => c.challengeId)
  );
  const curated = room.challenges.find((c) => !completedChallengeIds.has(c.id));
  if (curated) {
    const uc = await db.userChallenge.create({
      data: { userId, challengeId: curated.id },
    });
    return { ok: true, userChallengeId: uc.id };
  }

  // Otherwise generate a fresh one themed to the area.
  const skillKey = (room.area.skillKey as SkillKey | null) ?? null;
  const skill = skillKey
    ? await db.userSkill.findFirst({
        where: { userId, skill: { key: skillKey } },
      })
    : null;
  const difficulty = difficultyForUser(
    tierOrdinal(profile.experienceTier),
    skill?.level ?? 1
  );
  const { userChallengeId } = await createUserChallenge(userId, {
    difficulty,
    type: room.type === "CURSE" ? "CURSE" : "CHALLENGE",
    skillKey,
    roomId: room.id,
    interests: parseJsonArray(profile.interests),
  });
  return { ok: true, userChallengeId };
}

/** Reroll an active generated challenge using the Ancient Motif artifact. */
export async function rerollChallenge(
  userChallengeId: string
): Promise<{ ok: boolean; error?: string; userChallengeId?: string }> {
  const userId = await requireUserId();
  const uc = await db.userChallenge.findUnique({
    where: { id: userChallengeId },
    include: { challenge: { include: { room: { include: { area: true } } } } },
  });
  if (!uc || uc.userId !== userId) return { ok: false, error: "Challenge not found" };
  if (uc.status !== "ACTIVE") return { ok: false, error: "Challenge is not active" };

  const artifact = await db.userArtifact.findFirst({
    where: { userId, artifact: { effect: "REROLL" } },
    include: { artifact: true },
  });
  if (!artifact) {
    return { ok: false, error: "You need an artifact of rerolling (find the Ancient Motif)" };
  }

  const profile = await getProfileOrThrow(userId);
  await db.userChallenge.update({
    where: { id: uc.id },
    data: { status: "ABANDONED" },
  });
  await db.userArtifact.update({
    where: { id: artifact.id },
    data: { usedCount: { increment: 1 } },
  });
  const { userChallengeId: newId } = await createUserChallenge(userId, {
    difficulty: uc.challenge.difficulty,
    type: (uc.challenge.type as "CHALLENGE" | "CURSE") ?? "CHALLENGE",
    skillKey: (uc.challenge.room?.area.skillKey as SkillKey | null) ?? null,
    roomId: uc.challenge.roomId,
    interests: parseJsonArray(profile.interests),
  });
  revalidatePath("/dungeon");
  return { ok: true, userChallengeId: newId };
}

export interface ChallengeCompletionResult {
  ok: boolean;
  error?: string;
  award?: AwardResult;
  newSpecializations?: string[];
  /** Per-requirement verdicts when a submission falls short. */
  results?: CheckResult[];
}

/**
 * Completing a challenge: the user checks off objectives (the app cannot
 * verify external scores) and submits a composition record.
 */
export async function completeChallenge(input: {
  userChallengeId: string;
  score: Score;
  composition: {
    title: string;
    description?: string;
    reflection?: string;
    visibility?: string;
  };
}): Promise<ChallengeCompletionResult> {
  const userId = await requireUserId();
  const uc = await db.userChallenge.findUnique({
    where: { id: input.userChallengeId },
    include: { challenge: true },
  });
  if (!uc || uc.userId !== userId) return { ok: false, error: "Challenge not found" };
  if (uc.status !== "ACTIVE") return { ok: false, error: "Challenge is not active" };

  const parsedComp = compositionSchema.safeParse({
    title: input.composition.title,
    description: input.composition.description ?? "",
    reflection: input.composition.reflection ?? "",
    scoreLink: "",
    visibility: input.composition.visibility ?? "PRIVATE",
  });
  if (!parsedComp.success) {
    return { ok: false, error: parsedComp.error.errors[0]?.message ?? "Invalid composition" };
  }

  const parsedScore = scoreSchema.safeParse(input.score);
  if (!parsedScore.success) {
    return { ok: false, error: "That piece could not be read. Try again from the composer." };
  }
  const score = parsedScore.data as Score;

  // The brief the challenge was created with is the standard. Regenerating it
  // for older rows keeps trials made before the composer existed playable.
  const brief = briefForChallenge(uc.challenge);
  const checks = parseChecks(uc.challenge.checks) ?? brief.checks;

  // The setup is not the player's to change: a trial in 3/4 must be in 3/4.
  if (
    score.key !== brief.setup.key ||
    score.mode !== brief.setup.mode ||
    score.meter.beats !== brief.setup.meter.beats ||
    score.meter.unit !== brief.setup.meter.unit ||
    score.bars !== brief.setup.bars
  ) {
    return { ok: false, error: "This piece does not match the trial's brief." };
  }

  // The authority. The editor shows the same verdicts while you write, but a
  // client could say anything — only this run decides.
  const verdict = runChecks(score, checks);
  if (!verdict.passed) {
    return {
      ok: false,
      error: `The trial is not yet satisfied — ${verdict.passedCount} of ${verdict.results.length} standards met.`,
      results: verdict.results,
    };
  }

  const composition = await db.composition.create({
    data: {
      userId,
      title: parsedComp.data.title,
      description: parsedComp.data.description,
      reflection: parsedComp.data.reflection,
      scoreLink: "",
      visibility: parsedComp.data.visibility,
      challengeId: uc.id,
      source: uc.challenge.type === "DAILY" ? "DAILY" : "CHALLENGE",
      score: JSON.stringify(score),
    },
  });

  await db.userChallenge.update({
    where: { id: uc.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      objectivesDone: JSON.stringify(checks.map((c) => c.id)),
      compositionId: composition.id,
    },
  });

  const skillKey = (uc.challenge.skillKey as SkillKey | null) ?? "MELODY";
  const award = await awardProgress({
    userId,
    xp: uc.challenge.xpReward,
    skillXp: { [skillKey]: Math.round(uc.challenge.xpReward * 0.6) },
  });
  const newSpecializations = await checkSpecializations(userId);

  // Deliberately no revalidatePath here. Every one of these routes is
  // dynamically rendered, so there is no cache to bust — and revalidating from
  // inside a server action re-renders the current route, which would unmount
  // the victory screen the player just earned before they can read it.
  return { ok: true, award, newSpecializations, results: verdict.results };
}

/** Solving a puzzle room. Solutions live server-side in room.puzzleData. */
export async function solvePuzzle(input: {
  roomId: string;
  answerIndex?: number;
  arrangement?: string[];
}): Promise<{ ok: boolean; correct?: boolean; explanation?: string; error?: string; award?: AwardResult }> {
  const userId = await requireUserId();
  const room = await db.dungeonRoom.findUnique({
    where: { id: input.roomId },
    include: { area: true },
  });
  if (!room?.puzzleData) return { ok: false, error: "Puzzle not found" };
  if (!(await isAreaUnlocked(userId, room.areaId))) {
    return { ok: false, error: "This room is still locked to you" };
  }

  const puzzle = JSON.parse(room.puzzleData) as {
    kind: string;
    answerIndex?: number;
    solution?: string[];
    explanation?: string;
  };

  let correct = false;
  if (puzzle.kind === "MULTIPLE_CHOICE") {
    correct = puzzle.answerIndex === input.answerIndex;
  } else if (puzzle.kind === "ARRANGE") {
    correct =
      Array.isArray(input.arrangement) &&
      JSON.stringify(input.arrangement) === JSON.stringify(puzzle.solution);
  }

  if (!correct) {
    return { ok: true, correct: false, explanation: "Not quite — the dungeon holds firm. Try again." };
  }

  // Already solved? A puzzle pays out once.
  const existingSolve = await db.userChallenge.findFirst({
    where: { userId, status: "COMPLETED", challenge: { roomId: room.id, type: "PUZZLE" } },
  });
  if (existingSolve) {
    return { ok: true, correct: true, explanation: puzzle.explanation ?? "Solved (already claimed)." };
  }

  const xp = 80 + room.levelRequirement * 20;
  const challenge = await db.challenge.create({
    data: {
      roomId: room.id,
      type: "PUZZLE",
      title: `Puzzle: ${room.name}`,
      description: room.description,
      difficulty: Math.max(1, Math.min(10, room.levelRequirement)),
      xpReward: xp,
      skillKey: room.area.skillKey,
    },
  });
  await db.userChallenge.create({
    data: {
      userId,
      challengeId: challenge.id,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
  const skillKey = (room.area.skillKey as SkillKey | null) ?? "MELODY";
  const award = await awardProgress({ userId, xp, skillXp: { [skillKey]: Math.round(xp * 0.5) } });

  revalidatePath("/dungeon");
  return { ok: true, correct: true, explanation: puzzle.explanation, award };
}

/** Opening a treasure room grants its artifact once. */
export async function claimTreasure(
  roomId: string
): Promise<{ ok: boolean; error?: string; artifactName?: string; alreadyClaimed?: boolean }> {
  const userId = await requireUserId();
  const room = await db.dungeonRoom.findUnique({
    where: { id: roomId },
    include: { artifact: true },
  });
  if (!room?.artifact) return { ok: false, error: "There is no treasure here" };
  if (!(await isAreaUnlocked(userId, room.areaId))) {
    return { ok: false, error: "This room is still locked to you" };
  }
  const profile = await getProfileOrThrow(userId);
  if (profile.level < room.levelRequirement) {
    return { ok: false, error: "This vault will not open yet" };
  }

  const granted = await grantArtifactByKey(db, userId, room.artifact.key);
  if (granted && room.artifact.effect === "REST_DAY") {
    await db.userProfile.update({
      where: { userId },
      data: { restDays: { increment: 1 } },
    });
  }
  revalidatePath("/dungeon");
  revalidatePath("/library");
  return { ok: true, artifactName: room.artifact.name, alreadyClaimed: !granted };
}

/** Gets (or generates) today's Daily Dungeon Challenge and the user's state. */
export async function getOrCreateDailyChallenge(): Promise<{
  ok: boolean;
  error?: string;
  userChallengeId?: string;
}> {
  const userId = await requireUserId();
  const { ensureDailyChallenge } = await import("@/lib/daily");
  const uc = await ensureDailyChallenge(userId);
  return { ok: true, userChallengeId: uc.id };
}
