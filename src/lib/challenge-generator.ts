// Reusable challenge generation. Pulls weighted ChallengeComponent rows from
// the database and assembles a coherent challenge, avoiding impossible or
// repetitive combinations.

import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { challengeXpForDifficulty } from "@/lib/xp";
import type { ChallengeType, SkillKey } from "@/lib/enums";

type Tx = Prisma.TransactionClient | PrismaClient;

export interface GeneratorOptions {
  difficulty: number; // 1..10
  type?: ChallengeType; // CHALLENGE | CURSE | DAILY
  skillKey?: SkillKey | null; // bias toward the room/area's skill
  interests?: string[]; // user's style interests, used as weighting only
  roomId?: string | null;
  /** Titles to avoid repeating (e.g. the user's recent challenges). */
  avoidTitles?: string[];
}

interface Component {
  type: string;
  value: string;
  skillKey: string | null;
  weight: number;
}

function pickWeighted(pool: Component[], boostSkill?: string | null): Component | null {
  if (pool.length === 0) return null;
  const weighted = pool.map((c) => ({
    c,
    w: c.weight * (boostSkill && c.skillKey === boostSkill ? 3 : 1),
  }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let roll = Math.random() * total;
  for (const { c, w } of weighted) {
    roll -= w;
    if (roll <= 0) return c;
  }
  return weighted[weighted.length - 1].c;
}

// Combinations that read as nonsense or are unreasonable to ask for.
function isBadCombination(parts: {
  meter?: string;
  restriction?: string;
  requirement?: string;
  lengthBars?: number;
}): boolean {
  const { meter, restriction, requirement, lengthBars } = parts;
  // Irregular meters + very long forms is a grind, not a challenge.
  if (meter && ["5/8", "7/8", "11/8"].includes(meter) && (lengthBars ?? 0) > 32)
    return true;
  // Restriction and requirement must not contradict each other.
  if (restriction && requirement) {
    const r = restriction.toLowerCase();
    const q = requirement.toLowerCase();
    if (r.includes("no repeated") && q.includes("repeat")) return true;
    if (r.includes("only three notes") && q.includes("chromatic")) return true;
    if (r.includes("cadence") && q.includes("cadence")) return true;
  }
  return false;
}

export interface GeneratedChallenge {
  title: string;
  description: string;
  difficulty: number;
  keySig: string | null;
  meter: string | null;
  lengthBars: number | null;
  instrument: string | null;
  style: string | null;
  requirement: string | null;
  restriction: string | null;
  xpReward: number;
  skillKey: string | null;
  type: ChallengeType;
}

export async function generateChallenge(
  tx: Tx,
  options: GeneratorOptions
): Promise<GeneratedChallenge> {
  const difficulty = Math.min(10, Math.max(1, options.difficulty));
  const type: ChallengeType = options.type ?? "CHALLENGE";

  const components = await tx.challengeComponent.findMany({
    where: { minDifficulty: { lte: difficulty }, maxDifficulty: { gte: difficulty } },
  });
  const byType = (t: string) => components.filter((c) => c.type === t);

  const boost = options.skillKey ?? null;

  for (let attempt = 0; attempt < 12; attempt++) {
    const key = pickWeighted(byType("KEY"), boost);
    const meter = pickWeighted(byType("METER"), boost);
    const length = pickWeighted(byType("LENGTH"), boost);
    const instrument = pickWeighted(byType("INSTRUMENT"), boost);
    const style = pickWeighted(byType("STYLE"), boost);
    const requirement = pickWeighted(byType("REQUIREMENT"), boost);
    const restriction =
      type === "CURSE" || difficulty >= 5 ? pickWeighted(byType("RESTRICTION"), boost) : null;
    const fragment = pickWeighted(byType("TITLE_FRAGMENT"), boost);

    const lengthBars = length ? parseInt(length.value, 10) || 8 : 8;
    if (
      isBadCombination({
        meter: meter?.value,
        restriction: restriction?.value,
        requirement: requirement?.value,
        lengthBars,
      })
    ) {
      continue;
    }

    const title =
      type === "CURSE"
        ? `Curse of ${fragment?.value ?? "the Unknown"}`
        : type === "DAILY"
          ? `Daily Trial: ${fragment?.value ?? "the Dawn"}`
          : `Trial of ${fragment?.value ?? "the Deep"}`;

    if (options.avoidTitles?.includes(title) && attempt < 10) continue;

    const skillKey =
      boost ?? requirement?.skillKey ?? restriction?.skillKey ?? "MELODY";

    const parts: string[] = [];
    parts.push(
      `Compose ${lengthBars} measures for ${instrument?.value ?? "any instrument"} in ${
        key?.value ?? "any key"
      }, in ${meter?.value ?? "4/4"} time.`
    );
    if (style) parts.push(`Style: ${style.value}.`);
    if (requirement) parts.push(`Requirement: ${requirement.value}.`);
    if (restriction) parts.push(`Restriction: ${restriction.value}.`);

    return {
      title,
      description: parts.join(" "),
      difficulty,
      keySig: key?.value ?? null,
      meter: meter?.value ?? null,
      lengthBars,
      instrument: instrument?.value ?? null,
      style: style?.value ?? null,
      requirement: requirement?.value ?? null,
      restriction: restriction?.value ?? null,
      xpReward: challengeXpForDifficulty(difficulty) + (type === "CURSE" ? 100 : 0),
      skillKey,
      type,
    };
  }

  // Fallback — always valid.
  return {
    title: "Trial of the Silent Hall",
    description: `Compose 8 measures in C major, in 4/4 time. Requirement: write one clear melodic phrase and repeat it with a varied ending.`,
    difficulty,
    keySig: "C major",
    meter: "4/4",
    lengthBars: 8,
    instrument: "Piano",
    style: null,
    requirement: "Write one clear melodic phrase and vary its ending",
    restriction: null,
    xpReward: challengeXpForDifficulty(difficulty),
    skillKey: boost ?? "MELODY",
    type,
  };
}

/** Persists a generated challenge and assigns it to the user as ACTIVE. */
export async function createUserChallenge(
  userId: string,
  options: GeneratorOptions
): Promise<{ challengeId: string; userChallengeId: string }> {
  return db.$transaction(async (tx) => {
    const recent = await tx.userChallenge.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 8,
      include: { challenge: true },
    });
    const generated = await generateChallenge(tx, {
      ...options,
      avoidTitles: recent.map((r) => r.challenge.title),
    });
    const challenge = await tx.challenge.create({
      data: {
        roomId: options.roomId ?? null,
        type: generated.type,
        title: generated.title,
        description: generated.description,
        difficulty: generated.difficulty,
        keySig: generated.keySig,
        meter: generated.meter,
        lengthBars: generated.lengthBars,
        instrument: generated.instrument,
        style: generated.style,
        requirement: generated.requirement,
        restriction: generated.restriction,
        xpReward: generated.xpReward,
        skillKey: generated.skillKey,
      },
    });
    const userChallenge = await tx.userChallenge.create({
      data: { userId, challengeId: challenge.id },
    });
    return { challengeId: challenge.id, userChallengeId: userChallenge.id };
  });
}

/** Difficulty appropriate for a user given tier + skill level, clamped 1..10. */
export function difficultyForUser(tierOrdinal: number, skillLevel: number): number {
  return Math.min(10, Math.max(1, Math.round(tierOrdinal + skillLevel / 8)));
}
