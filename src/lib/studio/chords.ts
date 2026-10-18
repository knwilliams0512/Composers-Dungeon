/**
 * Chord symbols, as chords rather than as words.
 *
 * The Studio could already print "Cmaj7" above a staff — as a text mark, which
 * is to say as seven characters that happen to look like a chord. Nothing could
 * read it, nothing could transpose it, nothing could play it, and MusicXML
 * received it as a floating <words> element that no other program would
 * recognise as harmony. A lead sheet typed that way is a picture of a lead
 * sheet.
 *
 * So a chord symbol stores a root, a quality and an optional slash bass, and
 * this file is the one place that knows what each quality means. Three things
 * come out of it, and they must agree:
 *
 *   - `suffix`, what gets printed after the root;
 *   - `intervals`, the semitones above the root, which is what makes the
 *     symbol readable by a machine;
 *   - `kind` plus `degrees`, the MusicXML vocabulary, so another program reads
 *     the harmony as harmony.
 *
 * MusicXML's <kind> list is fixed and smaller than the set of chords people
 * write, which is why the altered dominants come out as `dominant` plus
 * <degree> elements rather than as kinds of their own. Every emitted <kind>
 * below is a value from that list; scripts/check-chords.ts holds them to it.
 */

import type { ChordQuality, ChordSymbol } from "./model";

/** A MusicXML <degree>: an added, altered or removed scale degree. */
export interface ChordDegree {
  /** 5, 9, 11, 13 — the degree being spoken about. */
  value: number;
  /** Semitones of alteration: -1 flat, +1 sharp, 0 plain. */
  alter: number;
  type: "add" | "alter" | "subtract";
}

export interface QualitySpec {
  /** Printed after the root: "m7", "7♭9", "" for a plain major. */
  suffix: string;
  /** Spoken in full, for a menu. */
  label: string;
  /** Semitones above the root, root included. */
  intervals: number[];
  /** A value from MusicXML's fixed <kind> vocabulary. */
  kind: string;
  /** Degree alterations that <kind> alone cannot express. */
  degrees?: ChordDegree[];
}

/* -------------------------------------------------------------------------- */

export const CHORD_QUALITIES: Record<ChordQuality, QualitySpec> = {
  /* ---- Triads ----------------------------------------------------------- */
  maj: { suffix: "", label: "major", intervals: [0, 4, 7], kind: "major" },
  min: { suffix: "m", label: "minor", intervals: [0, 3, 7], kind: "minor" },
  dim: { suffix: "dim", label: "diminished", intervals: [0, 3, 6], kind: "diminished" },
  aug: { suffix: "+", label: "augmented", intervals: [0, 4, 8], kind: "augmented" },
  sus2: { suffix: "sus2", label: "suspended 2nd", intervals: [0, 2, 7], kind: "suspended-second" },
  sus4: { suffix: "sus4", label: "suspended 4th", intervals: [0, 5, 7], kind: "suspended-fourth" },
  // Two notes, no third, so it is neither major nor minor — which is the point
  // of it, and why MusicXML gives it its own kind.
  five: { suffix: "5", label: "power chord", intervals: [0, 7], kind: "power" },

  /* ---- Sevenths --------------------------------------------------------- */
  maj7: { suffix: "maj7", label: "major 7th", intervals: [0, 4, 7, 11], kind: "major-seventh" },
  min7: { suffix: "m7", label: "minor 7th", intervals: [0, 3, 7, 10], kind: "minor-seventh" },
  dom7: { suffix: "7", label: "dominant 7th", intervals: [0, 4, 7, 10], kind: "dominant" },
  // Minor triad, major seventh. MusicXML calls it major-minor, which reads
  // backwards until you realise it names the seventh first.
  "min-maj7": {
    suffix: "m(maj7)",
    label: "minor with a major 7th",
    intervals: [0, 3, 7, 11],
    kind: "major-minor",
  },
  dim7: {
    suffix: "dim7",
    label: "diminished 7th",
    intervals: [0, 3, 6, 9],
    kind: "diminished-seventh",
  },
  "half-dim7": {
    suffix: "m7♭5",
    label: "half-diminished",
    intervals: [0, 3, 6, 10],
    kind: "half-diminished",
  },
  aug7: {
    suffix: "+7",
    label: "augmented 7th",
    intervals: [0, 4, 8, 10],
    kind: "augmented-seventh",
  },
  dom7sus4: {
    suffix: "7sus4",
    label: "dominant 7th, suspended 4th",
    intervals: [0, 5, 7, 10],
    kind: "dominant",
    degrees: [
      { value: 4, alter: 0, type: "add" },
      { value: 3, alter: 0, type: "subtract" },
    ],
  },

  /* ---- Sixths ----------------------------------------------------------- */
  maj6: { suffix: "6", label: "major 6th", intervals: [0, 4, 7, 9], kind: "major-sixth" },
  min6: { suffix: "m6", label: "minor 6th", intervals: [0, 3, 7, 9], kind: "minor-sixth" },

  /* ---- Extensions ------------------------------------------------------- */
  maj9: { suffix: "maj9", label: "major 9th", intervals: [0, 4, 7, 11, 14], kind: "major-ninth" },
  min9: { suffix: "m9", label: "minor 9th", intervals: [0, 3, 7, 10, 14], kind: "minor-ninth" },
  dom9: { suffix: "9", label: "dominant 9th", intervals: [0, 4, 7, 10, 14], kind: "dominant-ninth" },
  // The textbook stack. In practice a player drops the 11th from a dominant
  // 13th, and often the 3rd from an 11th, but what is *printed* is the full
  // chord and this is what the symbol means.
  dom11: {
    suffix: "11",
    label: "dominant 11th",
    intervals: [0, 4, 7, 10, 14, 17],
    kind: "dominant-11th",
  },
  dom13: {
    suffix: "13",
    label: "dominant 13th",
    intervals: [0, 4, 7, 10, 14, 17, 21],
    kind: "dominant-13th",
  },
  // A ninth with no seventh under it, which is why it is "add" and not "9".
  add9: {
    suffix: "add9",
    label: "major, added 9th",
    intervals: [0, 4, 7, 14],
    kind: "major",
    degrees: [{ value: 9, alter: 0, type: "add" }],
  },

  /* ---- Altered dominants ------------------------------------------------ */
  dom7b5: {
    suffix: "7♭5",
    label: "dominant 7th, flat 5th",
    intervals: [0, 4, 6, 10],
    kind: "dominant",
    degrees: [{ value: 5, alter: -1, type: "alter" }],
  },
  // The same four pitches as an augmented 7th. Both spellings are in use and
  // mean different things about where the chord is going, so both are offered.
  dom7sharp5: {
    suffix: "7♯5",
    label: "dominant 7th, sharp 5th",
    intervals: [0, 4, 8, 10],
    kind: "dominant",
    degrees: [{ value: 5, alter: 1, type: "alter" }],
  },
  dom7b9: {
    suffix: "7♭9",
    label: "dominant 7th, flat 9th",
    intervals: [0, 4, 7, 10, 13],
    kind: "dominant",
    degrees: [{ value: 9, alter: -1, type: "add" }],
  },
  dom7sharp9: {
    suffix: "7♯9",
    label: "dominant 7th, sharp 9th",
    intervals: [0, 4, 7, 10, 15],
    kind: "dominant",
    degrees: [{ value: 9, alter: 1, type: "add" }],
  },
  dom7sharp11: {
    suffix: "7♯11",
    label: "dominant 7th, sharp 11th",
    intervals: [0, 4, 7, 10, 18],
    kind: "dominant",
    degrees: [{ value: 11, alter: 1, type: "add" }],
  },
  dom7b13: {
    suffix: "7♭13",
    label: "dominant 7th, flat 13th",
    intervals: [0, 4, 7, 10, 20],
    kind: "dominant",
    degrees: [{ value: 13, alter: -1, type: "add" }],
  },
};

export const CHORD_QUALITY_KEYS = Object.keys(CHORD_QUALITIES) as ChordQuality[];

/* -------------------------------------------------------------------------- */
/* Roots                                                                      */
/* -------------------------------------------------------------------------- */

const LETTER_SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** The seven letters, for a picker. */
export const CHORD_LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

/**
 * A root's pitch class, or null if it is not a root.
 *
 * Double accidentals are allowed because they are real: the chord built on the
 * flattened supertonic of a minor key is spelled with one, and refusing it
 * would push a writer into a wrong spelling to get the right sound.
 */
export function rootSemitone(root: string): number | null {
  const m = /^([A-G])(#{1,2}|b{1,2}|)$/.exec(root.trim());
  if (!m) return null;
  const base = LETTER_SEMITONE[m[1]];
  const alter = m[2].startsWith("#") ? m[2].length : m[2].startsWith("b") ? -m[2].length : 0;
  return (((base + alter) % 12) + 12) % 12;
}

/** Root as it is printed: "Bb" is typed, "B♭" is read. */
export function prettyRoot(root: string): string {
  return root.replace(/#/g, "♯").replace(/b/g, "♭");
}

/* -------------------------------------------------------------------------- */
/* Reading a symbol                                                           */
/* -------------------------------------------------------------------------- */

/** The symbol as it appears above the staff: "C", "Am7", "G7♭9", "C/G". */
export function chordSymbolText(c: ChordSymbol): string {
  const spec = CHORD_QUALITIES[c.quality];
  const body = prettyRoot(c.root) + (spec?.suffix ?? "");
  return c.bass ? `${body}/${prettyRoot(c.bass)}` : body;
}

/** Spoken in full, for a tooltip or a screen reader: "A minor 7th". */
export function chordSymbolLabel(c: ChordSymbol): string {
  const spec = CHORD_QUALITIES[c.quality];
  const body = `${prettyRoot(c.root)} ${spec?.label ?? c.quality}`;
  return c.bass ? `${body} over ${prettyRoot(c.bass)}` : body;
}

/**
 * The pitch classes a symbol names, lowest first from the root.
 *
 * Pitch classes rather than pitches: a chord symbol says what the harmony is,
 * not which octave anybody plays it in. A slash bass is included even when it
 * is not a member of the chord, because that is exactly when it matters.
 */
export function chordPitchClasses(c: ChordSymbol): number[] {
  const rootPc = rootSemitone(c.root);
  const spec = CHORD_QUALITIES[c.quality];
  if (rootPc === null || !spec) return [];
  const out = spec.intervals.map((i) => (rootPc + i) % 12);
  const bassPc = c.bass ? rootSemitone(c.bass) : null;
  if (bassPc !== null && !out.includes(bassPc)) out.unshift(bassPc);
  return Array.from(new Set(out));
}

/** Sounding pitches for a symbol, voiced from a given bottom note. */
export function chordVoicing(c: ChordSymbol, bottom = 48): number[] {
  const rootPc = rootSemitone(c.root);
  const spec = CHORD_QUALITIES[c.quality];
  if (rootPc === null || !spec) return [];
  // Put the root at or just above `bottom`, then stack the intervals on it.
  const root = bottom + (((rootPc - (bottom % 12)) % 12) + 12) % 12;
  const notes = spec.intervals.map((i) => root + i);
  const bassPc = c.bass ? rootSemitone(c.bass) : null;
  if (bassPc !== null) {
    // The slash bass goes below everything, which is the whole instruction.
    const bass = root - 12 + ((((bassPc - ((root - 12) % 12)) % 12) + 12) % 12);
    notes.unshift(bass <= root ? bass : bass - 12);
  }
  return Array.from(new Set(notes)).sort((a, b) => a - b);
}
