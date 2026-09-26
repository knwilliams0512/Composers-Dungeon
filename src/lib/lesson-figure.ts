/**
 * Figures: the picture a lesson draws of what it is talking about.
 *
 * A lesson used to be prose with, at best, a line of monospace text standing in
 * for music — "C D E F G" for a scale, "I – IV – V – I" for a progression.
 * That is a description of notation, not notation, and it asks the one thing a
 * beginner cannot yet do: hear the page. Every concept here has a shape on a
 * staff, a place on a keyboard, a length against a beat, and the lesson should
 * show it.
 *
 * A figure is data, not markup, for three reasons. It goes in the lesson's
 * existing `content` JSON, so nothing about the database changes and an
 * installed copy picks the figures up from the next re-seed like any other
 * content fix. It can be checked — scripts/check-figures.ts reads these specs
 * and asserts the music in them is true, which prose in a body paragraph can
 * never be. And the same spec draws itself and plays itself, so what a person
 * sees and what they hear cannot drift apart.
 *
 * Pitches are MIDI numbers (60 is middle C) and durations are the ticks of
 * src/lib/score.ts, where TICKS_PER_WHOLE is 16 — so 4 is a quarter note.
 */

import { TICKS_PER_WHOLE, type ScoreMeter } from "@/lib/score";

/* -------------------------------------------------------------------------- */
/* Notation                                                                    */
/* -------------------------------------------------------------------------- */

export interface FigureNote {
  /** MIDI number. 60 is middle C. */
  pitch: number;
  /** Ticks; 4 is a quarter note. Omitted means a quarter. */
  duration?: number;
  /**
   * How to spell it: -1 flat, 0 natural, +1 sharp. Without this the engraver
   * spells to the key, which is right for a scale and wrong for the whole
   * point of a lesson on enharmonics.
   */
  spell?: -1 | 0 | 1;
  /** Written under the note: a letter name, a degree, a finger, an interval. */
  label?: string;
  /**
   * Sounds with the note before it rather than after. This is how a figure
   * writes an interval or a chord: three notes, two of them stacked.
   */
  stack?: boolean;
  /**
   * An absolute tick, for a voice that does not follow the one before it —
   * an accompaniment under a melody, where the bass changes once a bar while
   * the tune moves four times. It neither follows the cursor nor advances it.
   */
  at?: number;
  /** Silence of this length instead of a note. `pitch` is ignored. */
  rest?: boolean;
  /** Drawn in the lesson's accent colour: the note the paragraph is about. */
  accent?: boolean;
}

export interface FigureBracket {
  /** Indices into `notes`, inclusive. */
  from: number;
  to: number;
  text: string;
}

export interface StaffFigure {
  kind: "staff";
  caption?: string;
  /** Tonic, e.g. "C", "F#", "Bb". Defaults to C. */
  key?: string;
  mode?: "major" | "minor";
  meter?: ScoreMeter;
  clef?: "treble" | "bass";
  /** Hide the time signature when the figure is about pitch, not metre. */
  hideMeter?: boolean;
  /** Draw bar lines every bar's worth of ticks. On by default. */
  hideBarlines?: boolean;
  notes: FigureNote[];
  /** Spanning labels — "whole step", "a fifth", "the answer". */
  brackets?: FigureBracket[];
  /** Harmony written under the staff, by note index. */
  harmony?: { at: number; text: string }[];
  /** Silences playback for a figure that is deliberately wrong. */
  silent?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Keyboard                                                                    */
/* -------------------------------------------------------------------------- */

export interface KeyboardMark {
  pitch: number;
  label?: string;
  /** root: the note being counted from. target: where you land. */
  tone?: "root" | "target" | "step" | "muted";
}

export interface KeyboardFigure {
  kind: "keyboard";
  caption?: string;
  /** Range drawn, as MIDI numbers. Defaults to one octave from middle C. */
  from?: number;
  to?: number;
  marks?: KeyboardMark[];
  /** A span drawn above the keys, e.g. "a whole step". */
  brackets?: { from: number; to: number; text: string }[];
  silent?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Rhythm                                                                      */
/* -------------------------------------------------------------------------- */

export interface RhythmCell {
  /** Ticks. */
  duration: number;
  rest?: boolean;
  label?: string;
  accent?: boolean;
}

export interface RhythmFigure {
  kind: "rhythm";
  caption?: string;
  meter: ScoreMeter;
  /** The row of durations, laid end to end against the beat grid. */
  row: RhythmCell[];
  /** Label every beat line with its count — "1 2 3 4". On by default. */
  hideCounts?: boolean;
  silent?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Circle of fifths                                                            */
/* -------------------------------------------------------------------------- */

export interface CircleFigure {
  kind: "circle";
  caption?: string;
  /** Tonics to light up, e.g. ["C", "G", "D"]. */
  highlight?: string[];
  /** Drawn as an arrow from one key to another, e.g. a modulation. */
  arrow?: { from: string; to: string; text?: string };
}

/* -------------------------------------------------------------------------- */
/* Form                                                                        */
/* -------------------------------------------------------------------------- */

export interface FormSection {
  label: string;
  /** Relative width. Defaults to 1. */
  bars?: number;
  /** Sections sharing a tone are the same material returning. */
  tone?: "a" | "b" | "c" | "intro" | "coda";
  note?: string;
}

export interface FormFigure {
  kind: "form";
  caption?: string;
  sections: FormSection[];
}

/* -------------------------------------------------------------------------- */
/* Score order                                                                 */
/* -------------------------------------------------------------------------- */

export interface ScoreOrderFigure {
  kind: "scoreOrder";
  caption?: string;
  groups: { name: string; staves: string[] }[];
  /** Index into the flattened stave list, drawn as the one being discussed. */
  highlight?: number[];
}

/* -------------------------------------------------------------------------- */

export type LessonFigure =
  | StaffFigure
  | KeyboardFigure
  | RhythmFigure
  | CircleFigure
  | FormFigure
  | ScoreOrderFigure;

export const FIGURE_KINDS = [
  "staff",
  "keyboard",
  "rhythm",
  "circle",
  "form",
  "scoreOrder",
] as const;

/* -------------------------------------------------------------------------- */
/* Placement                                                                   */
/* -------------------------------------------------------------------------- */

export interface PlacedNote extends FigureNote {
  index: number;
  start: number;
  duration: number;
}

/**
 * Turns the figure's running list of notes into onsets.
 *
 * Notes follow one another by their own length, except that a stacked note
 * sounds with the one before it — which is the whole mechanism behind writing
 * an interval or a chord without asking an author to count ticks by hand.
 */
export function placeNotes(notes: FigureNote[]): PlacedNote[] {
  const out: PlacedNote[] = [];
  let cursor = 0;
  let previousStart = 0;
  notes.forEach((note, index) => {
    const duration = note.duration ?? TICKS_PER_WHOLE / 4;
    if (note.at !== undefined) {
      out.push({ ...note, index, start: note.at, duration });
      return;
    }
    const start = note.stack && index > 0 ? previousStart : cursor;
    out.push({ ...note, index, start, duration });
    if (!note.stack) {
      previousStart = cursor;
      cursor += duration;
    } else {
      // A stack that outlasts what it is stacked on still moves the cursor.
      cursor = Math.max(cursor, start + duration);
    }
  });
  return out;
}

/** Total length of a figure in ticks. */
export function figureTicks(notes: FigureNote[]): number {
  return placeNotes(notes).reduce((end, n) => Math.max(end, n.start + n.duration), 0);
}

/**
 * Reads a figure off a lesson section without trusting it.
 *
 * Lesson content is authored here and checked before release, but it arrives
 * through a JSON column that an older or hand-edited database could hold
 * anything in, and a lesson is not worth losing over a bad figure.
 */
export function readFigure(raw: unknown): LessonFigure | null {
  if (!raw || typeof raw !== "object") return null;
  const kind = (raw as { kind?: unknown }).kind;
  if (typeof kind !== "string") return null;
  if (!(FIGURE_KINDS as readonly string[]).includes(kind)) return null;
  const figure = raw as LessonFigure;
  switch (figure.kind) {
    case "staff":
      return Array.isArray(figure.notes) && figure.notes.length > 0 ? figure : null;
    case "keyboard":
      return figure;
    case "rhythm":
      return Array.isArray(figure.row) && figure.row.length > 0 && figure.meter ? figure : null;
    case "circle":
      return figure;
    case "form":
      return Array.isArray(figure.sections) && figure.sections.length > 0 ? figure : null;
    case "scoreOrder":
      return Array.isArray(figure.groups) && figure.groups.length > 0 ? figure : null;
  }
}

/**
 * Which line each bracket is drawn on.
 *
 * A bracket per line is what a first draft does, and it makes a figure with
 * three of them three times too tall — the top one leaving the frame
 * altogether, which is exactly how a label saying "half" ended up as a row of
 * clipped pixels. Brackets that do not overlap can share a line; this is the
 * same packing a calendar does with events.
 */
export function packLevels(spans: { from: number; to: number }[]): number[] {
  const ends: number[] = [];
  return spans.map((span) => {
    const level = ends.findIndex((end) => end < span.from);
    if (level === -1) {
      ends.push(span.to);
      return ends.length - 1;
    }
    ends[level] = span.to;
    return level;
  });
}
