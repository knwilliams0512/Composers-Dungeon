import { pitchName, ticksPerBar, type ScoreMeter } from "@/lib/score";

/**
 * Staff-notation math: everything the engraver needs to place a MIDI pitch on
 * a treble staff, spelled correctly for the key. Pure functions, no drawing.
 *
 * The unit throughout is the "staff step": one line-or-space. Step 0 is E4,
 * the bottom line of the treble staff; each +1 moves up one line or space.
 */

export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const LETTER_SEMIS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Sharps (positive) or flats (negative) in the key signature. */
const MAJOR_SHARPS: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5,
};

export function sharpsInKey(key: string, mode: "major" | "minor"): number {
  const base = MAJOR_SHARPS[key] ?? 0;
  // The relative major sits three fifths up: A minor shares C major's empty
  // signature, E minor carries one sharp, C minor three flats.
  return mode === "minor" ? base - 3 : base;
}

/** Order the accidentals appear in a signature, as letters. */
const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];

/** Which letters this signature alters, and in which direction. */
export function signatureAlterations(key: string, mode: "major" | "minor"): Map<string, 1 | -1> {
  const n = sharpsInKey(key, mode);
  const out = new Map<string, 1 | -1>();
  if (n > 0) for (const l of SHARP_ORDER.slice(0, n)) out.set(l, 1);
  if (n < 0) for (const l of FLAT_ORDER.slice(0, -n)) out.set(l, -1);
  return out;
}

/** Staff steps (0 = E4) where the signature's glyphs sit on a treble staff. */
export const SHARP_STEPS = [8, 5, 9, 6, 3, 7, 4];
export const FLAT_STEPS = [4, 7, 3, 6, 2, 5, 1];

export interface Spelled {
  letter: string;
  /** -1 flat, 0 natural, +1 sharp — as spelled for this key. */
  accidental: -1 | 0 | 1;
  octave: number;
}

/** How the key would spell this MIDI pitch: G major writes F#, F major writes Bb. */
export function spellPitch(pitch: number, key: string): Spelled {
  const name = pitchName(pitch, key); // e.g. "F#4", "Bb3", "C5"
  const letter = name[0];
  const accidental = name.includes("#") ? 1 : name.includes("b") ? -1 : 0;
  const octave = parseInt(name.replace(/[^-\d]/g, ""), 10);
  return { letter, accidental, octave };
}

const E4_INDEX = 4 * 7 + 2; // diatonic index of the treble staff's bottom line

/** Line-or-space for a pitch: 0 = bottom line (E4), 8 = top line (F5). */
export function staffStep(pitch: number, key: string): number {
  const s = spellPitch(pitch, key);
  return s.octave * 7 + LETTERS.indexOf(s.letter as (typeof LETTERS)[number]) - E4_INDEX;
}

/**
 * The accidental glyph a note needs in front of it, given the signature:
 * null when the signature already covers it, "natural" when the note defies
 * a signature sharp or flat.
 */
export function accidentalGlyph(
  pitch: number,
  key: string,
  mode: "major" | "minor"
): "sharp" | "flat" | "natural" | null {
  const s = spellPitch(pitch, key);
  const sig = signatureAlterations(key, mode).get(s.letter) ?? 0;
  if (s.accidental === sig) return null;
  if (s.accidental === 1) return "sharp";
  if (s.accidental === -1) return "flat";
  return "natural";
}

/**
 * The MIDI pitch a click on a staff step should produce. The signature is
 * applied automatically — clicking the F line in G major writes F# — and an
 * explicit accidental overrides it, exactly as Flat.io's toolbar does.
 */
export function pitchForStaffStep(
  step: number,
  key: string,
  mode: "major" | "minor",
  accidental: -1 | 0 | 1 | null = null
): number {
  const idx = step + E4_INDEX;
  const letter = LETTERS[((idx % 7) + 7) % 7];
  const octave = Math.floor(idx / 7);
  const base = (octave + 1) * 12 + LETTER_SEMIS[letter];
  if (accidental !== null) return base + accidental;
  return base + (signatureAlterations(key, mode).get(letter) ?? 0);
}

/* -------------------------------------------------------------------------- */
/* Rests                                                                       */
/* -------------------------------------------------------------------------- */

export interface RestGlyph {
  start: number;
  /** 16 whole, 8 half, 4 quarter, 2 eighth, 1 sixteenth. */
  value: 16 | 8 | 4 | 2 | 1;
}

const REST_VALUES = [16, 8, 4, 2, 1] as const;

/**
 * Decompose the silent stretches of a bar into standard rest values, largest
 * first, never crossing a bar line. A completely silent bar gets the single
 * centred whole rest engravers use regardless of meter.
 */
export function restsForGaps(
  melody: { start: number; duration: number }[],
  meter: ScoreMeter,
  bars: number
): RestGlyph[] {
  const barTicks = ticksPerBar(meter);
  const total = barTicks * bars;
  const covered = new Array<boolean>(total).fill(false);
  for (const n of melody) {
    for (let t = n.start; t < Math.min(total, n.start + n.duration); t++) covered[t] = true;
  }
  const out: RestGlyph[] = [];
  for (let b = 0; b < bars; b++) {
    const from = b * barTicks;
    const to = from + barTicks;
    let silent = true;
    for (let t = from; t < to; t++) if (covered[t]) silent = false;
    if (silent) {
      out.push({ start: from, value: 16 });
      continue;
    }
    let t = from;
    while (t < to) {
      if (covered[t]) {
        t++;
        continue;
      }
      let end = t;
      while (end < to && !covered[end]) end++;
      let at = t;
      let left = end - t;
      while (left > 0) {
        const v = REST_VALUES.find((r) => r <= left) ?? 1;
        out.push({ start: at, value: v as RestGlyph["value"] });
        at += v;
        left -= v;
      }
      t = end;
    }
  }
  return out;
}
