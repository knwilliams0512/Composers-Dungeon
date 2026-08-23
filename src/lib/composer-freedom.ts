/**
 * How much rope the composer gives you.
 *
 * Beginners get a deliberately small box: one octave of in-key notes, two note
 * lengths, four bars. That is not a limitation for its own sake — a blank page
 * with infinite options is the single most common reason a beginner writes
 * nothing. Every tier below hands back one more decision, earned by levelling
 * or by finishing lessons.
 */

export interface Freedom {
  tier: number;
  name: string;
  blurb: string;
  /** Ticks per grid column — 4 is a quarter note, 2 an eighth, 1 a sixteenth. */
  gridStep: number;
  /** Selectable note lengths, in ticks. */
  durations: number[];
  /** How many pitch rows to show, counted in scale degrees. */
  rows: number;
  chromatic: boolean;
  chords: boolean;
  /** Chord degrees offered in the harmony lane. */
  chordDegrees: number[];
  /** Key, meter, tempo and length are editable in the Workshop at this tier. */
  canEditSetup: boolean;
  maxBars: number;
  /** What unlocking the next tier needs, for display. */
  next?: string;
}

const TIERS: Freedom[] = [
  {
    tier: 1,
    name: "Apprentice",
    blurb:
      "One octave, in key, quarter and half notes. Everything else is decided for you so you can think about the tune.",
    gridStep: 4,
    durations: [4, 8],
    rows: 8,
    chromatic: false,
    chords: false,
    chordDegrees: [],
    canEditSetup: false,
    maxBars: 8,
    next: "Reach level 3 or finish 5 lessons for eighth notes and harmony.",
  },
  {
    tier: 2,
    name: "Journeyman",
    blurb: "Eighth notes, a wider octave, and a harmony lane with the four workhorse chords.",
    gridStep: 2,
    durations: [2, 4, 8],
    rows: 10,
    chromatic: false,
    chords: true,
    chordDegrees: [1, 4, 5, 6],
    canEditSetup: false,
    maxBars: 8,
    next: "Reach level 6 or finish 10 lessons for two octaves and every diatonic chord.",
  },
  {
    tier: 3,
    name: "Adept",
    blurb: "Two octaves, dotted and long values, and all seven diatonic chords.",
    gridStep: 2,
    durations: [1, 2, 3, 4, 6, 8, 12, 16],
    rows: 15,
    chromatic: false,
    chords: true,
    chordDegrees: [1, 2, 3, 4, 5, 6, 7],
    canEditSetup: false,
    maxBars: 12,
    next: "Reach level 10 or finish 18 lessons for chromatic notes and full control of the setup.",
  },
  {
    tier: 4,
    name: "Master",
    blurb: "Chromatic notes, sixteenths, and the key, meter, tempo and length in your hands.",
    gridStep: 1,
    durations: [1, 2, 3, 4, 6, 8, 12, 16],
    rows: 18,
    chromatic: true,
    chords: true,
    chordDegrees: [1, 2, 3, 4, 5, 6, 7],
    canEditSetup: true,
    maxBars: 16,
    next: "Reach level 15 or finish every lesson for the full range.",
  },
  {
    tier: 5,
    name: "Virtuoso",
    blurb: "Three octaves and thirty-two bars. Nothing is held back.",
    gridStep: 1,
    durations: [1, 2, 3, 4, 6, 8, 12, 16, 24, 32],
    rows: 22,
    chromatic: true,
    chords: true,
    chordDegrees: [1, 2, 3, 4, 5, 6, 7],
    canEditSetup: true,
    maxBars: 32,
  },
];

export function freedomTier(tier: number): Freedom {
  return TIERS[Math.max(0, Math.min(TIERS.length - 1, tier - 1))];
}

/** The tier a player has earned. Levelling and studying both count. */
export function freedomForPlayer(level: number, lessonsCompleted: number): Freedom {
  if (level >= 15 || lessonsCompleted >= 25) return freedomTier(5);
  if (level >= 10 || lessonsCompleted >= 18) return freedomTier(4);
  if (level >= 6 || lessonsCompleted >= 10) return freedomTier(3);
  if (level >= 3 || lessonsCompleted >= 5) return freedomTier(2);
  return freedomTier(1);
}

/**
 * A trial can cap the freedom below what the player has earned — a lesson on
 * stepwise melody has no business offering sixteenth notes — but never above.
 */
export function cappedFreedom(player: Freedom, cap?: number): Freedom {
  if (!cap) return player;
  return freedomTier(Math.min(player.tier, cap));
}

export const ALL_TIERS = TIERS;
