/**
 * The Proving Grounds: short, timed training drills.
 *
 * The Academy explains theory and the Dungeon asks you to compose with it.
 * Neither ever asks you to *recognise* anything at speed, which is the one
 * skill that separates someone who knows what a minor sixth is from someone
 * who hears one. These are the drills for that: sixty seconds, one question at
 * a time, a combo that builds while you are right.
 *
 * Everything here is pure. A drill generates a question, the question carries
 * its own answer, and nothing needs a browser — so scripts/check-drills.mjs can
 * generate thousands of them and prove each has exactly one right answer.
 * Scoring is re-run on the server from the same functions, because a score
 * posted by a client is not a score.
 */
import { LETTERS } from "@/lib/notation";

export const DRILL_KEYS = [
  "INTERVAL_EAR",
  "CHORD_QUALITY",
  "SCALE_MODE",
  "STAFF_READ",
  "KEY_SIGNATURE",
  "RHYTHM_ECHO",
] as const;
export type DrillKey = (typeof DRILL_KEYS)[number];

export interface DrillInfo {
  key: DrillKey;
  name: string;
  /** What the drill trains, in one line. */
  blurb: string;
  /** The instruction shown while a question is up. */
  prompt: string;
  icon: string;
  accent: string;
  skill: string;
  /** How a question is answered. */
  mode: "CHOICE" | "TAP";
  /** Seconds in a round. */
  seconds: number;
}

export const DRILLS: Record<DrillKey, DrillInfo> = {
  INTERVAL_EAR: {
    key: "INTERVAL_EAR",
    name: "Interval Ear",
    blurb: "Two notes sound. Name the distance between them.",
    prompt: "What interval was that?",
    icon: "chord",
    accent: "#f292b0",
    skill: "MELODY",
    mode: "CHOICE",
    seconds: 60,
  },
  CHORD_QUALITY: {
    key: "CHORD_QUALITY",
    name: "Chord Colour",
    blurb: "A chord sounds. Name what kind it is.",
    prompt: "What chord was that?",
    icon: "column",
    accent: "#a3b4ff",
    skill: "HARMONY",
    mode: "CHOICE",
    seconds: 60,
  },
  SCALE_MODE: {
    key: "SCALE_MODE",
    name: "The Seven Doors",
    blurb: "A scale runs past. Name the mode it came from.",
    prompt: "Which scale was that?",
    icon: "arch",
    accent: "#c28ef5",
    skill: "HARMONY",
    mode: "CHOICE",
    seconds: 75,
  },
  STAFF_READ: {
    key: "STAFF_READ",
    name: "Sight of the Staff",
    blurb: "A note on the staff. Name it before the next one comes.",
    prompt: "Name this note",
    icon: "book",
    accent: "#8fbcff",
    skill: "TECHNIQUE",
    mode: "CHOICE",
    seconds: 45,
  },
  KEY_SIGNATURE: {
    key: "KEY_SIGNATURE",
    name: "The Gatekeeper's Seal",
    blurb: "Sharps and flats at the clef. Name the key they guard.",
    prompt: "Which key is this?",
    icon: "scroll",
    accent: "#f2cf68",
    skill: "TECHNIQUE",
    mode: "CHOICE",
    seconds: 60,
  },
  RHYTHM_ECHO: {
    key: "RHYTHM_ECHO",
    name: "Echo of the Drum",
    blurb: "A rhythm is struck. Strike it back.",
    prompt: "Tap the rhythm back",
    icon: "bolt",
    accent: "#6fe9b4",
    skill: "RHYTHM",
    mode: "TAP",
    seconds: 75,
  },
};

/* -------------------------------------------------------------------------- */
/* Questions                                                                  */
/* -------------------------------------------------------------------------- */

export interface AudioCue {
  /** MIDI pitches, played in order. Several at one `at` sound together. */
  notes: { pitch: number; at: number; seconds: number }[];
}

export interface StaffCue {
  clef: "treble" | "bass";
  /** Staff step from the bottom line of that clef. */
  step: number;
  accidental: 0 | 1 | -1;
}

export interface SignatureCue {
  /** Positive for sharps, negative for flats. */
  count: number;
}

export interface DrillQuestion {
  drill: DrillKey;
  /** Shown as buttons; exactly one is correct. */
  choices: string[];
  answer: string;
  /** A line shown after answering, so a drill still teaches. */
  note: string;
  audio?: AudioCue;
  staff?: StaffCue;
  signature?: SignatureCue;
  /** Onsets in beats, for RHYTHM_ECHO. */
  rhythm?: number[];
}

/** Interval names by semitone distance, 1..12. */
export const INTERVAL_NAMES = [
  "Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th",
  "Tritone", "Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th",
  "Major 7th", "Octave",
] as const;

export const CHORD_SHAPES: { name: string; semis: number[] }[] = [
  { name: "Major", semis: [0, 4, 7] },
  { name: "Minor", semis: [0, 3, 7] },
  { name: "Diminished", semis: [0, 3, 6] },
  { name: "Augmented", semis: [0, 4, 8] },
  { name: "Dominant 7th", semis: [0, 4, 7, 10] },
  { name: "Major 7th", semis: [0, 4, 7, 11] },
  { name: "Minor 7th", semis: [0, 3, 7, 10] },
  { name: "Half-diminished 7th", semis: [0, 3, 6, 10] },
  { name: "Diminished 7th", semis: [0, 3, 6, 9] },
];

/** The seven modes as semitone patterns from their own tonic. */
export const MODE_SHAPES: { name: string; semis: number[] }[] = [
  { name: "Ionian (major)", semis: [0, 2, 4, 5, 7, 9, 11, 12] },
  { name: "Dorian", semis: [0, 2, 3, 5, 7, 9, 10, 12] },
  { name: "Phrygian", semis: [0, 1, 3, 5, 7, 8, 10, 12] },
  { name: "Lydian", semis: [0, 2, 4, 6, 7, 9, 11, 12] },
  { name: "Mixolydian", semis: [0, 2, 4, 5, 7, 9, 10, 12] },
  { name: "Aeolian (natural minor)", semis: [0, 2, 3, 5, 7, 8, 10, 12] },
  { name: "Locrian", semis: [0, 1, 3, 5, 6, 8, 10, 12] },
  { name: "Harmonic minor", semis: [0, 2, 3, 5, 7, 8, 11, 12] },
];

/**
 * Keys by signature count, sharps positive. Both names are listed for a
 * signature so the question can ask for one and never accept the other as
 * wrong: each question fixes major or minor and says which it wants.
 */
export const SIGNATURE_KEYS: { count: number; major: string; minor: string }[] = [
  { count: -7, major: "C♭ major", minor: "A♭ minor" },
  { count: -6, major: "G♭ major", minor: "E♭ minor" },
  { count: -5, major: "D♭ major", minor: "B♭ minor" },
  { count: -4, major: "A♭ major", minor: "F minor" },
  { count: -3, major: "E♭ major", minor: "C minor" },
  { count: -2, major: "B♭ major", minor: "G minor" },
  { count: -1, major: "F major", minor: "D minor" },
  { count: 0, major: "C major", minor: "A minor" },
  { count: 1, major: "G major", minor: "E minor" },
  { count: 2, major: "D major", minor: "B minor" },
  { count: 3, major: "A major", minor: "F♯ minor" },
  { count: 4, major: "E major", minor: "C♯ minor" },
  { count: 5, major: "B major", minor: "G♯ minor" },
  { count: 6, major: "F♯ major", minor: "D♯ minor" },
  { count: 7, major: "C♯ major", minor: "A♯ minor" },
];

type Rand = () => number;
const pick = <T>(xs: readonly T[], rnd: Rand): T => xs[Math.floor(rnd() * xs.length)];
const int = (lo: number, hi: number, rnd: Rand) => lo + Math.floor(rnd() * (hi - lo + 1));

/** Distractors: `count` wrong answers drawn from `pool`, never the answer. */
function distractors(pool: readonly string[], answer: string, count: number, rnd: Rand): string[] {
  const rest = pool.filter((p) => p !== answer);
  const out: string[] = [];
  while (out.length < Math.min(count, rest.length)) {
    const c = pick(rest, rnd);
    if (!out.includes(c)) out.push(c);
  }
  return out;
}

function shuffled<T>(xs: T[], rnd: Rand): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Difficulty rises with the streak: more choices, harder material. */
function choiceCount(streak: number): number {
  return streak >= 12 ? 6 : streak >= 6 ? 5 : 4;
}

export function generateQuestion(drill: DrillKey, streak = 0, rnd: Rand = Math.random): DrillQuestion {
  const n = choiceCount(streak);

  switch (drill) {
    case "INTERVAL_EAR": {
      // Early on, stay inside the intervals a beginner has actually met.
      const maxSemis = streak >= 10 ? 12 : streak >= 4 ? 12 : 7;
      const semis = int(1, maxSemis, rnd);
      const root = int(55, 67, rnd);
      const answer = INTERVAL_NAMES[semis - 1];
      const melodic = rnd() < 0.7;
      const notes = melodic
        ? [
            { pitch: root, at: 0, seconds: 0.6 },
            { pitch: root + semis, at: 0.7, seconds: 0.8 },
          ]
        : [
            { pitch: root, at: 0, seconds: 1.3 },
            { pitch: root + semis, at: 0, seconds: 1.3 },
          ];
      return {
        drill,
        choices: shuffled([answer, ...distractors(INTERVAL_NAMES, answer, n - 1, rnd)], rnd),
        answer,
        note: `${semis} semitone${semis === 1 ? "" : "s"} — ${answer}${melodic ? "" : ", sounded together"}.`,
        audio: { notes },
      };
    }

    case "CHORD_QUALITY": {
      const triadsOnly = streak < 5;
      const pool = triadsOnly ? CHORD_SHAPES.slice(0, 4) : CHORD_SHAPES;
      const shape = pick(pool, rnd);
      const root = int(52, 64, rnd);
      const names = pool.map((s) => s.name);
      return {
        drill,
        choices: shuffled([shape.name, ...distractors(names, shape.name, n - 1, rnd)], rnd),
        answer: shape.name,
        note: `Intervals from the root: ${shape.semis.slice(1).join(", ")} semitones.`,
        audio: {
          notes: shape.semis.map((s) => ({ pitch: root + s, at: 0, seconds: 1.6 })),
        },
      };
    }

    case "SCALE_MODE": {
      const pool = streak < 6 ? MODE_SHAPES.slice(0, 6) : MODE_SHAPES;
      const shape = pick(pool, rnd);
      const root = int(55, 62, rnd);
      const names = pool.map((s) => s.name);
      return {
        drill,
        choices: shuffled([shape.name, ...distractors(names, shape.name, n - 1, rnd)], rnd),
        answer: shape.name,
        note: `Steps: ${shape.semis
          .slice(1)
          .map((s, i) => s - shape.semis[i])
          .join("-")} semitones.`,
        audio: {
          notes: shape.semis.map((s, i) => ({ pitch: root + s, at: i * 0.32, seconds: 0.3 })),
        },
      };
    }

    case "STAFF_READ": {
      const clef: "treble" | "bass" = rnd() < 0.5 ? "treble" : "bass";
      // Step 0 is the bottom line: E4 in treble, G2 in bass. Keep inside one
      // ledger line either side so the drill stays about reading, not counting.
      const step = int(-2, 10, rnd);
      const bottomLetter = clef === "treble" ? "E" : "G";
      const bottomIndex = LETTERS.indexOf(bottomLetter as (typeof LETTERS)[number]);
      const answer = LETTERS[(((bottomIndex + step) % 7) + 7) % 7];
      return {
        drill,
        choices: shuffled([answer, ...distractors(LETTERS, answer, Math.min(n, 6) - 1, rnd)], rnd),
        answer,
        note: `${clef === "treble" ? "Treble" : "Bass"} clef, ${
          step < 0 ? "below" : "on or above"
        } the bottom line.`,
        staff: { clef, step, accidental: 0 },
      };
    }

    case "KEY_SIGNATURE": {
      const span = streak >= 8 ? 7 : streak >= 4 ? 5 : 3;
      const options = SIGNATURE_KEYS.filter((k) => Math.abs(k.count) <= span);
      const entry = pick(options, rnd);
      const wantMajor = rnd() < 0.65;
      const answer = wantMajor ? entry.major : entry.minor;
      const pool = options.map((k) => (wantMajor ? k.major : k.minor));
      const n2 = Math.min(n, pool.length);
      return {
        drill,
        choices: shuffled([answer, ...distractors(pool, answer, n2 - 1, rnd)], rnd),
        answer,
        note:
          entry.count === 0
            ? "No sharps and no flats."
            : `${Math.abs(entry.count)} ${entry.count > 0 ? "sharp" : "flat"}${
                Math.abs(entry.count) === 1 ? "" : "s"
              } — ${entry.major} or its relative, ${entry.minor}.`,
        signature: { count: entry.count },
      };
    }

    case "RHYTHM_ECHO": {
      // Onsets in beats within a 4-beat bar. Always starts on beat 1, so there
      // is something to lock onto.
      const density = streak >= 8 ? 6 : streak >= 4 ? 5 : 4;
      const grid = streak >= 8 ? [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] : [0, 1, 1.5, 2, 3, 3.5];
      const chosen = new Set<number>([0]);
      while (chosen.size < density) chosen.add(pick(grid, rnd));
      const rhythm = Array.from(chosen).sort((a, b) => a - b);
      return {
        drill,
        choices: [],
        answer: rhythm.join(","),
        note: `${rhythm.length} strikes: beats ${rhythm.map((r) => r + 1).join(", ")}.`,
        rhythm,
        audio: {
          notes: rhythm.map((r) => ({ pitch: 72, at: r * 0.5, seconds: 0.12 })),
        },
      };
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Scoring                                                                    */
/* -------------------------------------------------------------------------- */

/** Points for one right answer at a given combo. The combo caps at 5x. */
export function pointsFor(combo: number): number {
  return 10 * Math.min(5, 1 + Math.floor(combo / 3));
}

/** Tapped rhythm vs. the one played, within a tolerance in beats. */
export function rhythmMatches(expected: number[], tapped: number[], tolerance = 0.28): boolean {
  if (tapped.length !== expected.length) return false;
  return expected.every((e, i) => Math.abs(e - tapped[i]) <= tolerance);
}

export interface RoundSummary {
  score: number;
  correct: number;
  total: number;
  bestCombo: number;
}

/** XP for a finished round. Accuracy matters more than raw volume. */
export function xpForRound(r: RoundSummary): number {
  if (r.total === 0) return 0;
  const accuracy = r.correct / r.total;
  return Math.round(20 + r.score * 0.25 + accuracy * 40);
}
