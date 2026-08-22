// XP and leveling math. All progression is computed here, server-side only —
// clients never submit XP amounts, only completed actions.

/** Total XP required to go from level n to level n+1. */
export function xpToNextLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.4));
}

/** Cumulative XP required to reach a given level from level 1. */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNextLevel(l);
  return total;
}

/** Derive level + progress from a total XP amount. */
export function levelFromXp(totalXp: number): {
  level: number;
  intoLevel: number;
  needed: number;
  percent: number;
} {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (remaining >= xpToNextLevel(level) && level < 200) {
    remaining -= xpToNextLevel(level);
    level++;
  }
  const needed = xpToNextLevel(level);
  return {
    level,
    intoLevel: remaining,
    needed,
    percent: Math.min(100, Math.round((remaining / needed) * 100)),
  };
}

/** Skill levels use a gentler curve than the overall composer level. */
export function skillXpToNextLevel(level: number): number {
  return Math.round(60 * Math.pow(level, 1.3));
}

export function skillLevelFromXp(xp: number): {
  level: number;
  intoLevel: number;
  needed: number;
  percent: number;
} {
  let level = 1;
  let remaining = Math.max(0, xp);
  while (remaining >= skillXpToNextLevel(level) && level < 200) {
    remaining -= skillXpToNextLevel(level);
    level++;
  }
  const needed = skillXpToNextLevel(level);
  return {
    level,
    intoLevel: remaining,
    needed,
    percent: Math.min(100, Math.round((remaining / needed) * 100)),
  };
}

/** Streak XP multiplier: +10% while the Creative Flame burns (day 1+). */
export function streakMultiplier(streakCount: number): number {
  return streakCount >= 1 ? 1.1 : 1.0;
}

export function applyStreakBonus(baseXp: number, streakCount: number): number {
  return Math.round(baseXp * streakMultiplier(streakCount));
}

/** XP reward scale for generated challenges, by difficulty 1..10. */
export function challengeXpForDifficulty(difficulty: number): number {
  return 100 + Math.max(0, difficulty - 1) * 75;
}
