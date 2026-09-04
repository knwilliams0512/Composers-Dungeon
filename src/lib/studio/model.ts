/**
 * The Studio's score format: many instruments, many staves, many voices.
 *
 * It deliberately keeps the tick and pitch conventions of the game's simpler
 * `Score` (16 ticks to a whole note, MIDI numbers for pitch, `spell` for the
 * writer's chosen accidental), so every staff-placement function in
 * `lib/notation.ts` applies unchanged to a Studio part.
 */

import type { ScoreMeter } from "@/lib/score";
import { ticksPerBar } from "@/lib/score";
import { instrumentById, type Clef } from "./instruments";

export const STUDIO_VERSION = 1 as const;

/* -------------------------------------------------------------------------- */
/* Notation attached to a note                                                 */
/* -------------------------------------------------------------------------- */

export type Articulation =
  | "staccato"
  | "staccatissimo"
  | "tenuto"
  | "accent"
  | "marcato"
  | "portato";

export type Ornament =
  // Shakes and turns
  | "trill"
  | "trill-sharp"
  | "trill-flat"
  | "mordent"
  | "inverted-mordent"
  | "turn"
  | "inverted-turn"
  // Repeated-note figures
  | "tremolo-1"
  | "tremolo-2"
  | "tremolo-3"
  // Spread chords
  | "arpeggio"
  | "arpeggio-up"
  | "arpeggio-down"
  // Small notes before the beat
  | "grace"
  | "appoggiatura"
  // Sliding between pitches
  | "glissando"
  | "portamento"
  | "bend"
  | "fall"
  | "doit";

export type Dynamic =
  | "ppp" | "pp" | "p" | "mp" | "mf" | "f" | "ff" | "fff"
  | "sfz" | "fp";

export type NoteheadStyle = "normal" | "cross" | "diamond" | "triangle" | "slash";

export type StemDirection = "auto" | "up" | "down";

export interface StudioNote {
  id: string;
  /** Ticks from the start of the piece. */
  start: number;
  duration: number;
  /** Written MIDI pitch — the transposition is applied at playback. */
  pitch: number;
  /** The writer's chosen accidental: -1 flat, 0 natural, +1 sharp. */
  spell?: -1 | 0 | 1;
  /** 0–127; drives playback loudness independently of the printed dynamic. */
  velocity?: number;
  articulations?: Articulation[];
  ornaments?: Ornament[];
  /** Tied into the note that follows at the same pitch. */
  tie?: boolean;
  /** Start (`"begin"`) or end (`"end"`) of a slur. */
  slur?: "begin" | "end";
  notehead?: NoteheadStyle;
  stem?: StemDirection;
  /** Dots printed after the notehead. The duration already includes them. */
  dots?: 0 | 1 | 2;
  /** Members of a tuplet share an id; `ratio` is played-in-the-time-of. */
  tuplet?: { id: string; ratio: [number, number] };
  /** Fret and string for tablature staves. */
  tab?: { string: number; fret: number };
}

/** A rest the writer placed deliberately, as opposed to an implied silence. */
export interface StudioRest {
  id: string;
  start: number;
  duration: number;
  dots?: 0 | 1 | 2;
}

/** One rhythmic layer on a staff. Voice 1 stems up, voice 2 stems down. */
export interface Voice {
  id: string;
  notes: StudioNote[];
  rests: StudioRest[];
}

/* -------------------------------------------------------------------------- */
/* Markings that hang off a position rather than a note                        */
/* -------------------------------------------------------------------------- */

export interface DynamicMark {
  id: string;
  start: number;
  value: Dynamic;
}

export interface Hairpin {
  id: string;
  start: number;
  duration: number;
  kind: "crescendo" | "diminuendo";
}

export type TextKind =
  | "tempo"
  | "rehearsal"
  | "technique"
  | "expression"
  | "staff"
  | "system"
  | "lyric";

export interface TextMark {
  id: string;
  start: number;
  kind: TextKind;
  text: string;
  /** Which syllable slot, for lyrics under a melisma. */
  verse?: number;
}

export interface OctaveLine {
  id: string;
  start: number;
  duration: number;
  /** +1 for 8va, -1 for 8vb, +2 for 15ma. */
  shift: 1 | -1 | 2 | -2;
}

/* -------------------------------------------------------------------------- */
/* Staves and parts                                                            */
/* -------------------------------------------------------------------------- */

export interface Staff {
  id: string;
  clef: Clef;
  /** Clef changes partway through, keyed by tick. */
  clefChanges?: { start: number; clef: Clef }[];
  lines: number;
  voices: Voice[];
  dynamics: DynamicMark[];
  hairpins: Hairpin[];
  texts: TextMark[];
  octaveLines: OctaveLine[];
}

export interface Part {
  id: string;
  /** An id from the instrument catalogue. */
  instrumentId: string;
  /** Overrides the catalogue name — lets a player write "Violin III". */
  name?: string;
  shortName?: string;
  staves: Staff[];
  /** Sounding minus written, overriding the catalogue default. */
  transpose?: number;
  visible: boolean;
  muted: boolean;
  solo: boolean;
  /** 0–1. */
  volume: number;
  /** -1 hard left to +1 hard right. */
  pan: number;
  /** Relative staff size, 1 being the score's default. */
  staffScale?: number;
}

/** A bracket or brace drawn down the left edge across a run of parts. */
export interface PartGroup {
  id: string;
  label: string;
  /** Part ids, in score order. */
  partIds: string[];
  symbol: "bracket" | "brace" | "line";
  /** Draw a single barline through the whole group. */
  barlineSpan?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Measures and global timeline                                                */
/* -------------------------------------------------------------------------- */

export type BarlineStyle =
  | "single"
  | "double"
  | "final"
  | "repeat-start"
  | "repeat-end"
  | "repeat-both"
  | "dashed";

export interface Measure {
  id: string;
  /** Meter change taking effect at this measure, if any. */
  meter?: ScoreMeter;
  /** Key change taking effect at this measure, if any. */
  key?: string;
  mode?: "major" | "minor";
  barline?: BarlineStyle;
  /** Rehearsal letter or number printed above the system. */
  rehearsal?: string;
  /** A pickup measure holds fewer ticks than its meter implies. */
  pickupTicks?: number;
  /** Force a system break after this measure. */
  systemBreak?: boolean;
  /** Force a page break after this measure. */
  pageBreak?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Layout and document settings                                                */
/* -------------------------------------------------------------------------- */

export type PageSize = "A4" | "Letter" | "Legal" | "Tabloid" | "A3";

/** Page dimensions in millimetres, portrait. */
export const PAGE_SIZES: Record<PageSize, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  Letter: { w: 216, h: 279 },
  Legal: { w: 216, h: 356 },
  Tabloid: { w: 279, h: 432 },
  A3: { w: 297, h: 420 },
};

export interface Layout {
  pageSize: PageSize;
  orientation: "portrait" | "landscape";
  /** Millimetres. */
  margins: { top: number; right: number; bottom: number; left: number };
  /** Height of one staff's five lines, in millimetres. */
  staffSize: number;
  /** Gap between staves within a system, in staff heights. */
  staffSpacing: number;
  /** Gap between systems, in staff heights. */
  systemSpacing: number;
  /** Extra gap between bracketed groups, in staff heights. */
  groupSpacing: number;
  /** Horizontal breathing room per measure, as a multiplier. */
  measureSpacing: number;
  /** Target measures per system when spacing automatically. */
  measuresPerSystem: number | "auto";
  showPageNumbers: boolean;
  /** "none", "system" (first measure of each system) or "every". */
  measureNumbers: "none" | "system" | "every";
  hideEmptyStaves: boolean;
  musicFont: "bravura" | "engraved" | "handwritten";
  concertPitch: boolean;
}

export interface ScoreInfo {
  title: string;
  subtitle: string;
  composer: string;
  arranger: string;
  lyricist: string;
  copyright: string;
  description: string;
}

export interface StudioScore {
  version: typeof STUDIO_VERSION;
  info: ScoreInfo;
  /** The opening key and meter; measures may override either later. */
  key: string;
  mode: "major" | "minor";
  meter: ScoreMeter;
  tempo: number;
  parts: Part[];
  groups: PartGroup[];
  measures: Measure[];
  layout: Layout;
  masterVolume: number;
}

/* -------------------------------------------------------------------------- */
/* Construction                                                                */
/* -------------------------------------------------------------------------- */

let idCounter = 0;
/** Ids need only be unique inside one score, not across the universe. */
export function uid(prefix = "n"): string {
  idCounter += 1;
  return `${prefix}${Date.now().toString(36)}${idCounter.toString(36)}`;
}

export function emptyVoice(): Voice {
  return { id: uid("v"), notes: [], rests: [] };
}

export function staffFor(clef: Clef, lines = 5): Staff {
  return {
    id: uid("s"),
    clef,
    lines,
    voices: [emptyVoice()],
    dynamics: [],
    hairpins: [],
    texts: [],
    octaveLines: [],
  };
}

export function partFor(instrumentId: string, name?: string): Part {
  const inst = instrumentById(instrumentId);
  return {
    id: uid("p"),
    instrumentId,
    name,
    staves: inst.clefs.map((c) => staffFor(c, inst.lines ?? (c === "tab" ? 6 : 5))),
    visible: true,
    muted: false,
    solo: false,
    volume: 0.8,
    pan: 0,
  };
}

export function emptyMeasures(count: number): Measure[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uid("m"),
    barline: i === count - 1 ? ("final" as const) : undefined,
  }));
}

export const DEFAULT_LAYOUT: Layout = {
  pageSize: "A4",
  orientation: "portrait",
  margins: { top: 20, right: 15, bottom: 20, left: 15 },
  staffSize: 7,
  staffSpacing: 1.6,
  systemSpacing: 2.4,
  groupSpacing: 1,
  measureSpacing: 1,
  measuresPerSystem: "auto",
  showPageNumbers: true,
  measureNumbers: "system",
  hideEmptyStaves: false,
  musicFont: "bravura",
  concertPitch: false,
};

export function emptyStudioScore(init: Partial<StudioScore> = {}): StudioScore {
  return {
    version: STUDIO_VERSION,
    info: {
      title: "Untitled Score",
      subtitle: "",
      composer: "",
      arranger: "",
      lyricist: "",
      copyright: "",
      description: "",
      ...init.info,
    },
    key: init.key ?? "C",
    mode: init.mode ?? "major",
    meter: init.meter ?? { beats: 4, unit: 4 },
    tempo: init.tempo ?? 90,
    parts: init.parts ?? [partFor("piano")],
    groups: init.groups ?? [],
    measures: init.measures ?? emptyMeasures(16),
    layout: { ...DEFAULT_LAYOUT, ...init.layout },
    masterVolume: init.masterVolume ?? 0.8,
  };
}

/* -------------------------------------------------------------------------- */
/* Queries                                                                     */
/* -------------------------------------------------------------------------- */

/** The meter in force at a given measure, following every change before it. */
export function meterAt(score: StudioScore, measureIndex: number): ScoreMeter {
  let m = score.meter;
  for (let i = 0; i <= measureIndex && i < score.measures.length; i++) {
    if (score.measures[i].meter) m = score.measures[i].meter!;
  }
  return m;
}

export function keyAt(
  score: StudioScore,
  measureIndex: number
): { key: string; mode: "major" | "minor" } {
  let key = score.key;
  let mode = score.mode;
  for (let i = 0; i <= measureIndex && i < score.measures.length; i++) {
    if (score.measures[i].key) key = score.measures[i].key!;
    if (score.measures[i].mode) mode = score.measures[i].mode!;
  }
  return { key, mode };
}

/** Tick at which each measure begins, plus the total length of the piece. */
export function measureOffsets(score: StudioScore): { starts: number[]; total: number } {
  const starts: number[] = [];
  let t = 0;
  for (let i = 0; i < score.measures.length; i++) {
    starts.push(t);
    t += score.measures[i].pickupTicks ?? ticksPerBar(meterAt(score, i));
  }
  return { starts, total: t };
}

/** Which measure a tick falls in, clamped to the score. */
export function measureAtTick(score: StudioScore, tick: number): number {
  const { starts } = measureOffsets(score);
  for (let i = starts.length - 1; i >= 0; i--) if (tick >= starts[i]) return i;
  return 0;
}

/** Sounding transposition for a part: its override, else the catalogue's. */
export function transposeOf(part: Part): number {
  return part.transpose ?? instrumentById(part.instrumentId).transpose;
}

export function partName(part: Part): string {
  return part.name ?? instrumentById(part.instrumentId).name;
}

export function partShortName(part: Part): string {
  return part.shortName ?? instrumentById(part.instrumentId).short;
}

/** Every note in a part, across staves and voices — for analysis and playback. */
export function notesOfPart(part: Part): StudioNote[] {
  return part.staves.flatMap((s) => s.voices.flatMap((v) => v.notes));
}

/** True when nothing is written in the part at all. */
export function partIsEmpty(part: Part): boolean {
  return notesOfPart(part).length === 0;
}

/**
 * Parts that should actually sound: a solo anywhere silences everything not
 * soloed, which is what every mixer in the world does.
 */
export function audibleParts(score: StudioScore): Part[] {
  const soloed = score.parts.filter((p) => p.solo);
  const pool = soloed.length > 0 ? soloed : score.parts;
  return pool.filter((p) => !p.muted);
}
