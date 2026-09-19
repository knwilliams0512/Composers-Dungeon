/**
 * The brief a boss's final blow is judged against.
 *
 * Every other place the game asks for a composition — a lesson exercise, a
 * dungeon trial — hands the player the composer and grades what comes back.
 * The boss fight, which is the climax of all of it, used to accept a title
 * typed into a box. This closes that gap: the final blow is a piece, and the
 * standards it is held to are the ones the boss's own phases describe.
 *
 * The checks are deliberately readable against the fight. The Serpent asks for
 * a theme and its transformation, so it checks that an idea returns. The Iron
 * Metronome fights in 7/8 and asks for rhythmic layers, so it checks for
 * varied lengths and silence. The Forgotten Composer wants melody, harmony,
 * rhythm, counterpoint and form at once, and is checked on all five.
 */

import { emptyScore, minNotesFor, type Check, type Score } from "@/lib/score";
import type { Brief } from "@/lib/challenge-brief";
import { minimumTierFor } from "@/lib/composer-freedom";

interface BossSetup {
  key: string;
  mode: "major" | "minor";
  meter?: { beats: number; unit: number };
  bars: number;
  tempo?: number;
  checks: Check[];
}

const BOSS_BRIEFS: Record<string, BossSetup> = {
  // "Compose in A minor… combine your original theme with a transformed version."
  "chromatic-serpent": {
    key: "A",
    mode: "minor",
    bars: 8,
    checks: [{ id: "motif-repetition" }, { id: "rhythmic-variety", value: 3 }, { id: "single-climax" }],
  },
  // "Strict time before you break it… shift into 7/8… two rhythmic layers."
  "iron-metronome": {
    key: "C",
    mode: "major",
    meter: { beats: 7, unit: 8 },
    bars: 8,
    tempo: 96,
    checks: [{ id: "rhythmic-variety", value: 3 }, { id: "uses-rests" }],
  },
  // "A falling phrase… answer with a melody in a minor key… develop by variation."
  "pale-soprano": {
    key: "D",
    mode: "minor",
    meter: { beats: 3, unit: 4 },
    bars: 8,
    checks: [
      { id: "mostly-stepwise", value: 0.6 },
      { id: "single-climax" },
      { id: "motif-repetition" },
      { id: "range-limit", value: 14 },
    ],
  },
  // Five movements: melody, harmony, rhythm, counterpoint, form.
  "forgotten-composer": {
    key: "D",
    mode: "minor",
    bars: 16,
    checks: [
      { id: "motif-repetition" },
      { id: "single-climax" },
      { id: "chords-every-bar" },
      { id: "authentic-cadence" },
      { id: "melody-fits-chords", value: 0.6 },
      { id: "leap-recovery" },
      { id: "rhythmic-variety", value: 3 },
    ],
  },
  // "Write a melody that survives the texture… your idea has to work naked."
  "hundred-handed-organist": {
    key: "C",
    mode: "major",
    bars: 8,
    checks: [
      { id: "mostly-stepwise", value: 0.6 },
      { id: "single-climax" },
      { id: "range-limit", value: 16 },
      { id: "uses-rests" },
    ],
  },
  // Ninety-nine players reading exactly what is on the page: the longest span
  // in the game, harmonised throughout, with an idea that has to come back.
  "silent-orchestra": {
    key: "Eb",
    mode: "major",
    bars: 16,
    tempo: 88,
    checks: [
      { id: "motif-repetition" },
      { id: "single-climax" },
      { id: "chords-every-bar" },
      { id: "authentic-cadence" },
      { id: "melody-fits-chords", value: 0.6 },
      { id: "leap-recovery" },
      { id: "rhythmic-variety", value: 3 },
      { id: "uses-rests" },
    ],
  },
  // "A line that works against its own shadow… every rise becomes a fall."
  "canon-that-eats-itself": {
    key: "A",
    mode: "minor",
    bars: 8,
    checks: [
      { id: "motif-repetition" },
      { id: "leap-recovery" },
      { id: "mostly-stepwise", value: 0.6 },
    ],
  },
};

/** Falls back to a plain eight-bar piece for any boss added without a brief. */
const DEFAULT: BossSetup = {
  key: "C",
  mode: "major",
  bars: 8,
  checks: [{ id: "single-climax" }, { id: "rhythmic-variety", value: 2 }],
};

export function briefForBoss(boss: { key: string; difficulty: number }): Brief {
  const setup = BOSS_BRIEFS[boss.key] ?? DEFAULT;
  const meter = setup.meter ?? { beats: 4, unit: 4 };

  const checks: Check[] = [
    { id: "fills-all-bars" },
    { id: "in-key" },
    { id: "ends-on-tonic" },
    { id: "min-notes", value: Math.max(12, minNotesFor(setup.bars, meter)) },
    ...setup.checks,
  ];
  const seen = new Set<string>();

  return {
    setup: emptyScore({
      key: setup.key,
      mode: setup.mode,
      meter,
      bars: setup.bars,
      tempo: setup.tempo ?? (meter.unit === 8 ? 84 : 92),
      instrument: "PIANO",
    }),
    checks: checks.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true))),
    // A boss is the hardest thing in the game; the composer is fully unlocked,
    // and never below what the fight's own standards need.
    freedomCap: Math.max(4, minimumTierFor(checks)),
  };
}

export const BOSS_BRIEF_KEYS = Object.keys(BOSS_BRIEFS);
export type { Score };
