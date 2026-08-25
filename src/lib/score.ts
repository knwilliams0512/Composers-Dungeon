/**
 * The score format, the music theory it needs, and the check engine that
 * decides whether a piece meets a trial's standards.
 *
 * Everything here is pure and shared: the editor uses it to show live feedback
 * while you write, and the server uses the exact same functions to decide
 * whether a submission passes. The client's copy is a convenience — the
 * server's run is the one that awards XP.
 *
 * Time is measured in ticks, where a whole note is 16 ticks. A beat of unit U
 * lasts 16/U ticks, so a quarter note is 4 ticks in 4/4 and an eighth is 2.
 */

export const TICKS_PER_WHOLE = 16;

export interface ScoreNote {
  /** Tick offset from the start of the piece. */
  start: number;
  /** Length in ticks. */
  duration: number;
  /** MIDI note number: 60 is middle C. */
  pitch: number;
  /**
   * How the writer spelled this note: -1 flat, 0 natural, +1 sharp. A MIDI
   * number alone cannot say whether 63 is D# or Eb, and the two sit on
   * different lines of the staff — so when someone picks an accidental and
   * clicks a line, that intent is recorded here and the engraver honours it.
   * Absent for notes written on the grid, which are spelled to suit the key.
   */
  spell?: -1 | 0 | 1;
}

export type ChordQuality = "maj" | "min" | "dim";

export interface ScoreChord {
  start: number;
  duration: number;
  /** Scale degree 1–7. */
  degree: number;
  quality: ChordQuality;
}

export interface ScoreMeter {
  beats: number;
  unit: number;
}

export interface Score {
  version: 1;
  /** Tonic pitch class name, e.g. "C", "F#", "Bb". */
  key: string;
  mode: "major" | "minor";
  meter: ScoreMeter;
  tempo: number;
  bars: number;
  instrument: string;
  melody: ScoreNote[];
  chords: ScoreChord[];
}

/* -------------------------------------------------------------------------- */
/* Pitch and scale                                                             */
/* -------------------------------------------------------------------------- */

const PITCH_CLASSES: Record<string, number> = {
  C: 0, "B#": 0,
  "C#": 1, Db: 1,
  D: 2,
  "D#": 3, Eb: 3,
  E: 4, Fb: 4,
  F: 5, "E#": 5,
  "F#": 6, Gb: 6,
  G: 7,
  "G#": 8, Ab: 8,
  A: 9,
  "A#": 10, Bb: 10,
  B: 11, Cb: 11,
};

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

/**
 * Sharps (positive) or flats (negative) in a major key's signature. Minor keys
 * derive from this: a minor key carries three fewer sharps than the major of
 * the same letter, so D minor is one flat where D major is two sharps.
 */
const MAJOR_SHARPS: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
};

/**
 * How many sharps (+) or flats (-) this key and mode take.
 *
 * A signature can hold at most seven of either, so keys that would ask for
 * more are written as the enharmonic key a player would actually read: D♭
 * minor wants eight flats and is written as C♯ minor's four sharps. Without
 * this the extra accidentals fall off the end of the signature and the notes
 * are spelled against a signature that was never printed.
 */
export function keySignatureCount(key: string, mode: "major" | "minor" = "major"): number {
  const base = MAJOR_SHARPS[key] ?? 0;
  const raw = mode === "minor" ? base - 3 : base;
  if (raw < -7) return raw + 12;
  if (raw > 7) return raw - 12;
  return raw;
}

export const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
export const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];

export function keyPitchClass(key: string): number {
  return PITCH_CLASSES[key] ?? 0;
}

export function scaleSteps(mode: "major" | "minor"): number[] {
  return mode === "major" ? MAJOR_STEPS : MINOR_STEPS;
}

/** Semitone each natural letter sits at within its octave. */
const LETTER_SEMIS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTER_ORDER = ["C", "D", "E", "F", "G", "A", "B"] as const;

/** Letters this key's signature sharpens or flattens, in signature order. */
const SHARP_LETTERS = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_LETTERS = ["B", "E", "A", "D", "G", "C", "F"];

function keyLetterAlterations(key: string, mode: "major" | "minor"): Map<string, 1 | -1> {
  const n = keySignatureCount(key, mode);
  const out = new Map<string, 1 | -1>();
  if (n > 0) for (const l of SHARP_LETTERS.slice(0, n)) out.set(l, 1);
  if (n < 0) for (const l of FLAT_LETTERS.slice(0, -n)) out.set(l, -1);
  return out;
}

/**
 * Note name for display, spelled to suit the key *signature* — not the key
 * letter. The distinction matters in minor: D minor takes one flat, so its
 * sixth degree is Bb, even though D major would spell that pitch A#. Getting
 * this wrong puts a note on the wrong staff line, contradicting the very
 * signature drawn beside it.
 *
 * The signature's own letters are tried first, so a key gets the seven
 * distinct letters it is entitled to: F# major's seventh degree is E#, not the
 * F that a plain sharp table would return — which would spell two different
 * degrees with the same letter and stack them on one staff line. Notes outside
 * the key fall back to the ordinary sharp or flat table.
 */
export function pitchName(pitch: number, key = "C", mode: "major" | "minor" = "major"): string {
  const pc = ((pitch % 12) + 12) % 12;
  const alterations = keyLetterAlterations(key, mode);

  for (const letter of LETTER_ORDER) {
    const alt = alterations.get(letter) ?? 0;
    if (((LETTER_SEMIS[letter] + alt + 12) % 12) !== pc) continue;
    // The letter's own octave, not the sounding pitch's: B# sounds with the C
    // above it but belongs to the octave below.
    const octave = Math.floor((pitch - alt) / 12) - 1;
    const suffix = alt === 1 ? "#" : alt === -1 ? "b" : "";
    return `${letter}${suffix}${octave}`;
  }

  const names = keySignatureCount(key, mode) < 0 ? FLAT_NAMES : SHARP_NAMES;
  return `${names[pc]}${Math.floor(pitch / 12) - 1}`;
}

/** Scale degree 1–7 for a pitch in the key, or null when chromatic. */
export function scaleDegree(pitch: number, key: string, mode: "major" | "minor"): number | null {
  const rel = (((pitch - keyPitchClass(key)) % 12) + 12) % 12;
  const idx = scaleSteps(mode).indexOf(rel);
  return idx === -1 ? null : idx + 1;
}

export function isDiatonic(pitch: number, key: string, mode: "major" | "minor"): boolean {
  return scaleDegree(pitch, key, mode) !== null;
}

/** Ascending diatonic pitches between two MIDI bounds, low to high. */
export function scalePitches(
  key: string,
  mode: "major" | "minor",
  lowest: number,
  highest: number
): number[] {
  const out: number[] = [];
  for (let p = lowest; p <= highest; p++) {
    if (isDiatonic(p, key, mode)) out.push(p);
  }
  return out;
}

/** The diatonic triad built on a scale degree, and its quality. */
export function triadFor(
  degree: number,
  key: string,
  mode: "major" | "minor",
  octave = 3
): { pitches: number[]; quality: ChordQuality } {
  const steps = scaleSteps(mode);
  const root = keyPitchClass(key) + 12 * (octave + 1) + steps[(degree - 1) % 7];
  const third =
    keyPitchClass(key) + 12 * (octave + 1) + steps[(degree + 1) % 7] + (degree + 1 >= 7 ? 12 : 0);
  const fifth =
    keyPitchClass(key) + 12 * (octave + 1) + steps[(degree + 3) % 7] + (degree + 3 >= 7 ? 12 : 0);
  const pitches = [root, third, fifth].map((p, i) => (i > 0 && p < root ? p + 12 : p));
  const t = pitches[1] - pitches[0];
  const f = pitches[2] - pitches[0];
  const quality: ChordQuality = f === 6 ? "dim" : t === 3 ? "min" : "maj";
  return { pitches, quality };
}

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

export function romanNumeral(degree: number, quality: ChordQuality): string {
  const base = ROMAN[(degree - 1) % 7];
  if (quality === "maj") return base;
  if (quality === "min") return base.toLowerCase();
  return `${base.toLowerCase()}°`;
}

/* -------------------------------------------------------------------------- */
/* Timing                                                                      */
/* -------------------------------------------------------------------------- */

export function ticksPerBeat(meter: ScoreMeter): number {
  return TICKS_PER_WHOLE / meter.unit;
}

export function ticksPerBar(meter: ScoreMeter): number {
  return meter.beats * ticksPerBeat(meter);
}

export function totalTicks(score: Pick<Score, "meter" | "bars">): number {
  return ticksPerBar(score.meter) * score.bars;
}

export function emptyScore(init: Partial<Score> = {}): Score {
  return {
    version: 1,
    key: "C",
    mode: "major",
    meter: { beats: 4, unit: 4 },
    tempo: 96,
    bars: 4,
    instrument: "PIANO",
    melody: [],
    chords: [],
    ...init,
  };
}

/* -------------------------------------------------------------------------- */
/* Analysis                                                                    */
/* -------------------------------------------------------------------------- */

export interface ScoreAnalysis {
  notes: ScoreNote[];
  noteCount: number;
  filledTicks: number;
  totalTicks: number;
  lowest: number | null;
  highest: number | null;
  rangeSemitones: number;
  intervals: number[];
  stepCount: number;
  leapCount: number;
  climaxCount: number;
  longestRepeat: number;
  distinctDurations: number;
  restTicks: number;
  /** Bar index → whether every tick in that bar is covered by a note. */
  barsUsed: boolean[];
}

export function analyze(score: Score): ScoreAnalysis {
  const notes = [...score.melody].sort((a, b) => a.start - b.start || a.pitch - b.pitch);
  const total = totalTicks(score);
  const barTicks = ticksPerBar(score.meter);

  const pitches = notes.map((n) => n.pitch);
  const lowest = pitches.length ? Math.min(...pitches) : null;
  const highest = pitches.length ? Math.max(...pitches) : null;

  const intervals: number[] = [];
  for (let i = 1; i < notes.length; i++) intervals.push(notes[i].pitch - notes[i - 1].pitch);

  const stepCount = intervals.filter((i) => Math.abs(i) > 0 && Math.abs(i) <= 2).length;
  const leapCount = intervals.filter((i) => Math.abs(i) > 2).length;
  const climaxCount = highest === null ? 0 : pitches.filter((p) => p === highest).length;

  let longestRepeat = 0;
  let run = 0;
  for (let i = 0; i < notes.length; i++) {
    if (i > 0 && notes[i].pitch === notes[i - 1].pitch) run++;
    else run = 1;
    longestRepeat = Math.max(longestRepeat, run);
  }

  const filledTicks = notes.reduce((sum, n) => sum + n.duration, 0);
  const barsUsed: boolean[] = [];
  for (let b = 0; b < score.bars; b++) {
    const from = b * barTicks;
    const to = from + barTicks;
    const covered = notes.some((n) => n.start < to && n.start + n.duration > from);
    barsUsed.push(covered);
  }

  return {
    notes,
    noteCount: notes.length,
    filledTicks,
    totalTicks: total,
    lowest,
    highest,
    rangeSemitones: lowest !== null && highest !== null ? highest - lowest : 0,
    intervals,
    stepCount,
    leapCount,
    climaxCount,
    longestRepeat,
    distinctDurations: new Set(notes.map((n) => n.duration)).size,
    restTicks: Math.max(0, total - filledTicks),
    barsUsed,
  };
}

/* -------------------------------------------------------------------------- */
/* Checks                                                                      */
/* -------------------------------------------------------------------------- */

export type CheckId =
  | "fills-all-bars"
  | "min-notes"
  | "in-key"
  | "ends-on-tonic"
  | "starts-on-chord-tone"
  | "range-limit"
  | "mostly-stepwise"
  | "single-climax"
  | "no-long-repeats"
  | "leap-recovery"
  | "rhythmic-variety"
  | "uses-rests"
  | "chords-every-bar"
  | "authentic-cadence"
  | "motif-repetition"
  | "melody-fits-chords";

export interface Check {
  id: CheckId;
  /** Optional numeric parameter; each check documents its own meaning. */
  value?: number;
}

export interface CheckResult {
  id: CheckId;
  label: string;
  passed: boolean;
  detail: string;
  /** How-to help shown when it hasn't passed yet. */
  hint?: string;
}

interface CheckDef {
  label: (v: number) => string;
  hint: string;
  run: (score: Score, a: ScoreAnalysis, v: number) => { passed: boolean; detail: string };
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

const DEFS: Record<CheckId, CheckDef> = {
  "fills-all-bars": {
    label: () => "Every bar has music in it",
    hint: "Empty bars read as a piece that stopped rather than finished. Fill each one.",
    run: (score, a) => {
      const empty = a.barsUsed.map((u, i) => (u ? null : i + 1)).filter(Boolean) as number[];
      return {
        passed: empty.length === 0,
        detail: empty.length === 0 ? "All bars used" : `Empty: bar ${empty.join(", ")}`,
      };
    },
  },
  "min-notes": {
    label: (v) => `At least ${v} notes`,
    hint: "A melody needs enough material to have a shape.",
    run: (_s, a, v) => ({
      passed: a.noteCount >= v,
      detail: `${a.noteCount} note${a.noteCount === 1 ? "" : "s"}`,
    }),
  },
  "in-key": {
    label: () => "Stays in the key",
    hint: "Only use notes from the scale shown on the left of the grid.",
    run: (score, a) => {
      if (a.noteCount === 0) return { passed: false, detail: "No notes yet" };
      const strays = a.notes.filter((n) => !isDiatonic(n.pitch, score.key, score.mode));
      return {
        passed: strays.length === 0,
        detail:
          strays.length === 0
            ? "Every note belongs to the key"
            : `${strays.length} note${strays.length === 1 ? "" : "s"} outside the key`,
      };
    },
  },
  "ends-on-tonic": {
    label: () => "Ends on the tonic",
    hint: "Finish on the key note — it is what makes an ending sound like an ending.",
    run: (score, a) => {
      const last = a.notes[a.notes.length - 1];
      if (!last) return { passed: false, detail: "No notes yet" };
      const deg = scaleDegree(last.pitch, score.key, score.mode);
      return {
        passed: deg === 1,
        detail: deg === 1 ? "Final note is the tonic" : `Final note is degree ${deg ?? "chromatic"}`,
      };
    },
  },
  "starts-on-chord-tone": {
    label: () => "Starts on a note of the tonic chord",
    hint: "Open on degree 1, 3 or 5 so the key is clear from the first note.",
    run: (score, a) => {
      const first = a.notes[0];
      if (!first) return { passed: false, detail: "No notes yet" };
      const deg = scaleDegree(first.pitch, score.key, score.mode);
      const ok = deg === 1 || deg === 3 || deg === 5;
      return { passed: ok, detail: ok ? `Opens on degree ${deg}` : `Opens on degree ${deg ?? "chromatic"}` };
    },
  },
  "range-limit": {
    label: (v) => `Range within ${v} semitones`,
    hint: "Keep the melody singable — a wide range is hard to hold together.",
    run: (_s, a, v) => {
      if (a.noteCount === 0) return { passed: false, detail: "No notes yet" };
      return {
        passed: a.rangeSemitones <= v,
        detail: `${a.rangeSemitones} semitone${a.rangeSemitones === 1 ? "" : "s"} from lowest to highest`,
      };
    },
  },
  "mostly-stepwise": {
    label: (v) => `At least ${Math.round(v * 100)}% stepwise motion`,
    hint: "Move mostly to neighbouring notes; save leaps for moments that matter.",
    run: (_s, a, v) => {
      const moving = a.intervals.filter((i) => i !== 0).length;
      const ratio = moving === 0 ? 0 : a.stepCount / moving;
      return {
        passed: moving > 0 && ratio >= v,
        detail: moving === 0 ? "No movement yet" : `${pct(ratio)} of moves are steps`,
      };
    },
  },
  "single-climax": {
    label: () => "One clear high point",
    hint: "Reach the highest note exactly once — hitting it repeatedly spends it.",
    run: (_s, a) => ({
      passed: a.climaxCount === 1,
      detail:
        a.climaxCount === 0
          ? "No notes yet"
          : a.climaxCount === 1
            ? "The peak is reached once"
            : `The highest note appears ${a.climaxCount} times`,
    }),
  },
  "no-long-repeats": {
    label: (v) => `No note repeated more than ${v} times in a row`,
    hint: "Repetition without change stops being a device and becomes a stutter.",
    run: (_s, a, v) => {
      if (a.noteCount === 0) return { passed: false, detail: "No notes yet" };
      return {
        passed: a.longestRepeat <= v,
        detail: `Longest run of one pitch: ${a.longestRepeat}`,
      };
    },
  },
  "leap-recovery": {
    label: () => "Leaps are answered by a step back",
    hint: "After a jump of a fourth or more, step back the other way.",
    run: (_s, a) => {
      if (a.notes.length < 2) return { passed: false, detail: "Not enough melody yet" };
      let bad = 0;
      for (let i = 0; i < a.intervals.length; i++) {
        const leap = a.intervals[i];
        if (Math.abs(leap) < 5) continue;
        const next = a.intervals[i + 1];
        if (next === undefined) continue;
        const opposite = Math.sign(next) !== Math.sign(leap);
        if (!(opposite && Math.abs(next) <= 2)) bad++;
      }
      return {
        passed: bad === 0,
        detail: bad === 0 ? "Every leap resolves by step" : `${bad} leap${bad === 1 ? "" : "s"} left hanging`,
      };
    },
  },
  "rhythmic-variety": {
    label: (v) => `At least ${v} different note lengths`,
    hint: "All-equal note lengths march. Mix long and short.",
    run: (_s, a, v) => ({
      passed: a.distinctDurations >= v,
      detail: `${a.distinctDurations} distinct length${a.distinctDurations === 1 ? "" : "s"}`,
    }),
  },
  "uses-rests": {
    label: () => "Leaves space for breath",
    hint: "Silence is material. Leave at least one gap.",
    run: (_s, a) => {
      if (a.noteCount === 0) return { passed: false, detail: "No notes yet" };
      return {
        passed: a.restTicks > 0,
        detail: a.restTicks > 0 ? "There is space between phrases" : "No silence anywhere",
      };
    },
  },
  "chords-every-bar": {
    label: () => "Every bar is harmonised",
    hint: "Place a chord in each bar of the harmony lane.",
    run: (score) => {
      const barTicks = ticksPerBar(score.meter);
      const missing: number[] = [];
      for (let b = 0; b < score.bars; b++) {
        const from = b * barTicks;
        const to = from + barTicks;
        if (!score.chords.some((c) => c.start < to && c.start + c.duration > from)) {
          missing.push(b + 1);
        }
      }
      return {
        passed: missing.length === 0,
        detail: missing.length === 0 ? "All bars harmonised" : `No chord in bar ${missing.join(", ")}`,
      };
    },
  },
  "authentic-cadence": {
    label: () => "Ends with a V–I cadence",
    hint: "Put the dominant (V) in the second-to-last bar and the tonic (I) in the last.",
    run: (score) => {
      const sorted = [...score.chords].sort((a, b) => a.start - b.start);
      if (sorted.length < 2) return { passed: false, detail: "Needs at least two chords" };
      const last = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2];
      const ok = prev.degree === 5 && last.degree === 1;
      return {
        passed: ok,
        detail: ok
          ? "Closes V–I"
          : `Closes ${romanNumeral(prev.degree, prev.quality)}–${romanNumeral(last.degree, last.quality)}`,
      };
    },
  },
  "motif-repetition": {
    label: () => "A recognisable idea comes back",
    hint: "Repeat your opening figure later — same shape, on any pitch level.",
    run: (_s, a) => {
      // A motif is a contour: the first three intervals. It returns if that
      // same interval sequence appears again anywhere later.
      const iv = a.intervals;
      if (iv.length < 6) return { passed: false, detail: "Not enough melody yet" };
      const motif = iv.slice(0, 3).join(",");
      for (let i = 3; i <= iv.length - 3; i++) {
        if (iv.slice(i, i + 3).join(",") === motif) {
          return { passed: true, detail: "Your opening figure returns" };
        }
      }
      return { passed: false, detail: "The opening idea never comes back" };
    },
  },
  "melody-fits-chords": {
    label: (v) => `${Math.round(v * 100)}% of strong beats land on a chord tone`,
    hint: "On each strong beat, use a note that belongs to that bar's chord.",
    run: (score, a, v) => {
      if (score.chords.length === 0) return { passed: false, detail: "No chords to fit" };
      const beat = ticksPerBeat(score.meter);
      const strong = a.notes.filter((n) => n.start % (beat * 2) === 0);
      if (strong.length === 0) return { passed: false, detail: "No notes on strong beats" };
      let fits = 0;
      for (const n of strong) {
        const chord = score.chords.find(
          (c) => c.start <= n.start && c.start + c.duration > n.start
        );
        if (!chord) continue;
        const tones = triadFor(chord.degree, score.key, score.mode).pitches.map((p) => p % 12);
        if (tones.includes(((n.pitch % 12) + 12) % 12)) fits++;
      }
      const ratio = fits / strong.length;
      return { passed: ratio >= v, detail: `${pct(ratio)} of strong beats are chord tones` };
    },
  },
};

const DEFAULT_VALUES: Partial<Record<CheckId, number>> = {
  "min-notes": 8,
  "range-limit": 12,
  "mostly-stepwise": 0.6,
  "no-long-repeats": 3,
  "rhythmic-variety": 2,
  "melody-fits-chords": 0.6,
};

export function describeCheck(check: Check): string {
  const value = check.value ?? DEFAULT_VALUES[check.id] ?? 0;
  return DEFS[check.id]?.label(value) ?? check.id;
}

/** Runs every check against a score. This is the pass/fail authority. */
export function runChecks(score: Score, checks: Check[]): {
  passed: boolean;
  results: CheckResult[];
  passedCount: number;
} {
  const a = analyze(score);
  const results = checks.map((check) => {
    const def = DEFS[check.id];
    const value = check.value ?? DEFAULT_VALUES[check.id] ?? 0;
    if (!def) {
      return { id: check.id, label: check.id, passed: true, detail: "Unknown check — skipped" };
    }
    const outcome = def.run(score, a, value);
    return {
      id: check.id,
      label: def.label(value),
      passed: outcome.passed,
      detail: outcome.detail,
      hint: outcome.passed ? undefined : def.hint,
    };
  });
  return {
    passed: results.every((r) => r.passed),
    results,
    passedCount: results.filter((r) => r.passed).length,
  };
}
