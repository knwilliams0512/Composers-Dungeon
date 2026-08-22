// Creative Flame streak logic. Runs inside progression transactions.

export function dateKeyUTC(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function daysBetweenUTC(a: Date, b: Date): number {
  const dayMs = 24 * 60 * 60 * 1000;
  const aDay = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bDay = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((bDay - aDay) / dayMs);
}

export interface StreakState {
  streakCount: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  restDays: number;
}

export interface StreakUpdate extends StreakState {
  changed: boolean;
  usedRestDay: boolean;
  milestone: number | null; // 1, 7, 30, 100 when newly reached
}

export const STREAK_MILESTONES = [1, 7, 30, 100];

/**
 * Called whenever a meaningful activity completes. Gap of 1 day continues the
 * streak; gap of 2 days consumes a Rest Day if available (forgiving, not
 * punishing); larger gaps reset. Awards a bonus Rest Day every 10 streak days.
 */
export function advanceStreak(state: StreakState, now = new Date()): StreakUpdate {
  const { lastActivityDate } = state;
  let { streakCount, longestStreak, restDays } = state;
  let usedRestDay = false;

  const gap = lastActivityDate ? daysBetweenUTC(lastActivityDate, now) : Infinity;

  if (gap === 0) {
    return { ...state, changed: false, usedRestDay: false, milestone: null };
  }

  if (gap === 1) {
    streakCount += 1;
  } else if (gap === 2 && restDays > 0) {
    restDays -= 1;
    usedRestDay = true;
    streakCount += 1;
  } else {
    streakCount = 1;
  }

  if (streakCount > 0 && streakCount % 10 === 0) restDays = Math.min(restDays + 1, 5);
  longestStreak = Math.max(longestStreak, streakCount);

  const milestone = STREAK_MILESTONES.includes(streakCount) ? streakCount : null;

  return {
    streakCount,
    longestStreak,
    restDays,
    lastActivityDate: now,
    changed: true,
    usedRestDay,
    milestone,
  };
}

/** True if the flame is still burning today (activity today or yesterday). */
export function flameAlive(state: StreakState, now = new Date()): boolean {
  if (!state.lastActivityDate || state.streakCount === 0) return false;
  const gap = daysBetweenUTC(state.lastActivityDate, now);
  return gap <= 1 || (gap === 2 && state.restDays > 0);
}
