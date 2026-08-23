/**
 * The composer brief attached to a lesson's composition exercise.
 *
 * Lesson briefs are gentler than dungeon trials on purpose: a lesson is where
 * you first try the idea, so the standard checks that you applied the concept,
 * not that you wrote something impressive. The setup is chosen to suit the
 * lesson — the minor-scales lesson opens in A minor, the time-signature lesson
 * in 3/4 — so the exercise is about the thing you just read.
 */

import { freedomTier } from "@/lib/composer-freedom";
import { emptyScore, type Check, type Score } from "@/lib/score";
import type { Brief } from "@/lib/challenge-brief";

interface Setup {
  key?: string;
  mode?: "major" | "minor";
  meter?: { beats: number; unit: number };
  bars?: number;
  instrument?: string;
  tempo?: number;
}

/** Per-lesson setups, so the exercise practises what the lesson taught. */
const SETUPS: Record<string, Setup> = {
  "major-scales": { key: "C", mode: "major", bars: 4 },
  "minor-scales": { key: "A", mode: "minor", bars: 4 },
  "time-signatures": { key: "C", mode: "major", meter: { beats: 3, unit: 4 }, bars: 4 },
  "note-values-and-rests": { key: "C", mode: "major", bars: 4 },
  "basic-intervals": { key: "G", mode: "major", bars: 4 },
  "triads-major-minor": { key: "C", mode: "major", bars: 4 },
  "basic-progressions": { key: "C", mode: "major", bars: 4 },
  "melody-writing": { key: "F", mode: "major", bars: 8 },
  "phrases-question-answer": { key: "G", mode: "major", bars: 8 },
  "motifs-repetition-variation": { key: "D", mode: "minor", bars: 8 },
  "cadences-and-accompaniment": { key: "C", mode: "major", bars: 8 },
  "circle-of-fifths": { key: "D", mode: "major", bars: 8 },
  "chord-functions-inversions": { key: "Bb", mode: "major", bars: 8 },
  "binary-ternary-form": { key: "G", mode: "major", bars: 8 },
  "counterpoint-species": { key: "C", mode: "major", bars: 8 },
  "advanced-rhythm-texture": { key: "E", mode: "minor", meter: { beats: 6, unit: 8 }, bars: 8 },
  "fugue-large-form": { key: "D", mode: "minor", bars: 8 },
  "virtuoso-writing": { key: "A", mode: "minor", bars: 8, instrument: "PIANO" },
};

/** Extra standards for lessons whose whole point is one specific skill. */
const EXTRA_CHECKS: Record<string, Check[]> = {
  "note-values-and-rests": [{ id: "rhythmic-variety", value: 3 }, { id: "uses-rests" }],
  "basic-intervals": [{ id: "range-limit", value: 12 }],
  "basic-progressions": [{ id: "chords-every-bar" }, { id: "authentic-cadence" }],
  "melody-writing": [
    { id: "mostly-stepwise", value: 0.6 },
    { id: "single-climax" },
    { id: "range-limit", value: 14 },
  ],
  "phrases-question-answer": [{ id: "min-notes", value: 12 }, { id: "single-climax" }],
  "motifs-repetition-variation": [{ id: "motif-repetition" }],
  "cadences-and-accompaniment": [
    { id: "chords-every-bar" },
    { id: "authentic-cadence" },
    { id: "melody-fits-chords", value: 0.6 },
  ],
  "chord-functions-inversions": [{ id: "chords-every-bar" }, { id: "melody-fits-chords", value: 0.6 }],
  "counterpoint-species": [{ id: "leap-recovery" }, { id: "mostly-stepwise", value: 0.7 }],
  "advanced-rhythm-texture": [{ id: "rhythmic-variety", value: 3 }, { id: "uses-rests" }],
  "binary-ternary-form": [{ id: "motif-repetition" }],
  "fugue-large-form": [{ id: "motif-repetition" }, { id: "leap-recovery" }],
  "virtuoso-writing": [{ id: "rhythmic-variety", value: 3 }, { id: "range-limit", value: 24 }],
};

export function briefForLesson(lesson: {
  slug: string;
  difficulty: number;
  category?: string | null;
}): Brief {
  const setup = SETUPS[lesson.slug] ?? {};
  const cap = lesson.difficulty <= 2 ? 1 : lesson.difficulty <= 5 ? 2 : lesson.difficulty <= 8 ? 3 : 4;

  const extras = EXTRA_CHECKS[lesson.slug] ?? [];
  const needsChords = extras.some(
    (c) => c.id === "chords-every-bar" || c.id === "authentic-cadence" || c.id === "melody-fits-chords"
  );
  const freedomCap = Math.max(cap, needsChords ? 2 : 1);

  const bars = Math.min(setup.bars ?? 4, freedomTier(freedomCap).maxBars);

  // Every lesson asks for the same three basics; the extras are what makes the
  // exercise about this lesson.
  const checks: Check[] = [
    { id: "fills-all-bars" },
    { id: "in-key" },
    { id: "ends-on-tonic" },
    { id: "min-notes", value: Math.max(6, bars * 2) },
    ...extras,
  ];
  const seen = new Set<string>();

  return {
    setup: emptyScore({
      key: setup.key ?? "C",
      mode: setup.mode ?? "major",
      meter: setup.meter ?? { beats: 4, unit: 4 },
      bars,
      tempo: setup.tempo ?? ((setup.meter?.unit ?? 4) === 8 ? 84 : 92),
      instrument: setup.instrument ?? "PIANO",
    }),
    checks: checks.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true))),
    freedomCap,
  };
}

export type { Score };
