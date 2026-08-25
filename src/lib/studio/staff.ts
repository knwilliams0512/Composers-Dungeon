/**
 * Clef-aware staff placement.
 *
 * `lib/notation.ts` does this for the treble staff, which is all the game's
 * simpler editor ever needed. A full score has a viola reading alto and a
 * cello reading bass, so the same arithmetic here takes the clef as an
 * argument: every clef is just a different diatonic index sitting on the
 * staff's bottom line.
 */

import { keySignatureCount, pitchName } from "@/lib/score";
import { signatureAlterations } from "@/lib/notation";
import type { Clef } from "./instruments";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const LETTER_SEMIS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NATURAL_BY_SEMI: Record<number, string> = {
  0: "C", 2: "D", 4: "E", 5: "F", 7: "G", 9: "A", 11: "B",
};

/**
 * Diatonic index of the note on each clef's bottom staff line. A diatonic
 * index counts letters from C0: E4 is 4×7 + 2 = 30.
 */
const BOTTOM_LINE: Record<Clef, number> = {
  treble: 30, // E4
  bass: 18, // G2
  alto: 24, // F3
  tenor: 22, // D3
  percussion: 30, // arbitrary; percussion parts are positional, not pitched
  tab: 30,
};

/** Where a clef's signature accidentals sit, as staff steps from the bottom line. */
const SIG_STEPS: Record<Clef, { sharps: number[]; flats: number[] }> = {
  treble: { sharps: [8, 5, 9, 6, 3, 7, 4], flats: [4, 7, 3, 6, 2, 5, 1] },
  bass: { sharps: [6, 3, 7, 4, 1, 5, 2], flats: [2, 5, 1, 4, 0, 3, -1] },
  alto: { sharps: [7, 4, 8, 5, 2, 6, 3], flats: [3, 6, 2, 5, 1, 4, 0] },
  tenor: { sharps: [2, 6, 3, 7, 4, 8, 5], flats: [5, 1, 4, 0, 3, -1, 2] },
  percussion: { sharps: [], flats: [] },
  tab: { sharps: [], flats: [] },
};

export function signatureSteps(clef: Clef, key: string, mode: "major" | "minor"): number[] {
  const n = keySignatureCount(key, mode);
  const table = SIG_STEPS[clef];
  if (n > 0) return table.sharps.slice(0, n);
  if (n < 0) return table.flats.slice(0, -n);
  return [];
}

/** The letter a staff line or space carries under a given clef. */
export function letterAtStep(step: number, clef: Clef): string {
  const idx = step + BOTTOM_LINE[clef];
  return LETTERS[((idx % 7) + 7) % 7];
}

/**
 * The staff step for a pitch: 0 is the bottom line, 1 the space above it.
 * When `spell` records the writer's chosen accidental, the letter is recovered
 * by undoing it — E♭ and D♯ sound alike but occupy different lines, and a note
 * belongs where its author put it.
 */
export function stepForPitch(
  pitch: number,
  clef: Clef,
  key: string,
  mode: "major" | "minor",
  spell?: -1 | 0 | 1
): number {
  let letter: string;
  let octave: number;
  if (spell !== undefined && NATURAL_BY_SEMI[(((pitch - spell) % 12) + 12) % 12]) {
    const natural = pitch - spell;
    letter = NATURAL_BY_SEMI[((natural % 12) + 12) % 12];
    octave = Math.floor(natural / 12) - 1;
  } else {
    // `pitchName` already spells to the key signature's own letters, so it is
    // the single authority on how a pitch is written.
    const name = pitchName(pitch, key, mode);
    letter = name[0];
    octave = parseInt(name.replace(/[^-\d]/g, ""), 10);
  }
  return octave * 7 + LETTERS.indexOf(letter as (typeof LETTERS)[number]) - BOTTOM_LINE[clef];
}

/** The pitch a click on a staff step should write, spelled by the key. */
export function pitchForStep(
  step: number,
  clef: Clef,
  key: string,
  mode: "major" | "minor",
  accidental: -1 | 0 | 1 | null = null
): number {
  const idx = step + BOTTOM_LINE[clef];
  const letter = LETTERS[((idx % 7) + 7) % 7];
  const octave = Math.floor(idx / 7);
  const base = (octave + 1) * 12 + LETTER_SEMIS[letter];
  if (accidental !== null) return base + accidental;
  return base + (signatureAlterations(key, mode).get(letter) ?? 0);
}

/**
 * The accidental a note must print: null when the key signature already says
 * it, "natural" when the note contradicts the signature.
 */
export function accidentalFor(
  pitch: number,
  clef: Clef,
  key: string,
  mode: "major" | "minor",
  spell?: -1 | 0 | 1
): "sharp" | "flat" | "natural" | null {
  let letter: string;
  let accidental: -1 | 0 | 1;
  if (spell !== undefined && NATURAL_BY_SEMI[(((pitch - spell) % 12) + 12) % 12]) {
    letter = NATURAL_BY_SEMI[(((pitch - spell) % 12) + 12) % 12];
    accidental = spell;
  } else {
    const name = pitchName(pitch, key, mode);
    letter = name[0];
    accidental = name.includes("#") ? 1 : name.includes("b") ? -1 : 0;
  }
  const sig = signatureAlterations(key, mode).get(letter) ?? 0;
  if (accidental === sig) return null;
  if (accidental === 1) return "sharp";
  if (accidental === -1) return "flat";
  return "natural";
}

/* -------------------------------------------------------------------------- */
/* Note values                                                                 */
/* -------------------------------------------------------------------------- */

export interface NoteValue {
  /** Undotted base length in ticks. */
  base: number;
  dots: 0 | 1 | 2;
  /** Flags on the stem: 0 for a quarter, 1 for an eighth, 2 for a sixteenth. */
  flags: number;
  hollow: boolean;
  stemmed: boolean;
}

const BASE_VALUES = [
  { base: 32, flags: 0, hollow: true, stemmed: false }, // breve territory
  { base: 16, flags: 0, hollow: true, stemmed: false }, // whole
  { base: 8, flags: 0, hollow: true, stemmed: true }, // half
  { base: 4, flags: 0, hollow: false, stemmed: true }, // quarter
  { base: 2, flags: 1, hollow: false, stemmed: true }, // eighth
  { base: 1, flags: 2, hollow: false, stemmed: true }, // sixteenth
  { base: 0.5, flags: 3, hollow: false, stemmed: true }, // thirty-second
  { base: 0.25, flags: 4, hollow: false, stemmed: true }, // sixty-fourth
];

/**
 * Read a duration in ticks back into the note it was written as. Dots extend a
 * note by half again, then by a further quarter, so 6 ticks is a dotted half
 * and 7 a double-dotted one.
 */
export function noteValue(duration: number): NoteValue {
  for (const v of BASE_VALUES) {
    if (Math.abs(duration - v.base) < 0.01) return { ...v, dots: 0 };
    if (Math.abs(duration - v.base * 1.5) < 0.01) return { ...v, dots: 1 };
    if (Math.abs(duration - v.base * 1.75) < 0.01) return { ...v, dots: 2 };
  }
  // Anything unrecognised is drawn as the largest value that fits.
  const v = BASE_VALUES.find((b) => b.base <= duration) ?? BASE_VALUES[BASE_VALUES.length - 1];
  return { ...v, dots: 0 };
}

/** Ticks for a base value with dots applied. */
export function durationFor(base: number, dots: 0 | 1 | 2): number {
  if (dots === 1) return base * 1.5;
  if (dots === 2) return base * 1.75;
  return base;
}

/** The palette of durations the toolbar offers, longest first. */
export const DURATION_PALETTE = [
  { base: 16, label: "Whole", symbol: "𝅝" },
  { base: 8, label: "Half", symbol: "𝅗𝅥" },
  { base: 4, label: "Quarter", symbol: "♩" },
  { base: 2, label: "Eighth", symbol: "♪" },
  { base: 1, label: "16th", symbol: "𝅘𝅥𝅯" },
  { base: 0.5, label: "32nd", symbol: "𝅘𝅥𝅰" },
  { base: 0.25, label: "64th", symbol: "𝅘𝅥𝅱" },
] as const;
