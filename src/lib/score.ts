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

/** Keys conventionally spelled with flats. */
const FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb", "d", "g", "c", "f", "bb", "eb"]);

export const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
export const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];

export function keyPitchClass(key: string): number {
  return PITCH_CLASSES[key] ?? 0;
}

export function scaleSteps(mode: "major" | "minor"): number[] {
  return mode === "major" ? MAJOR_STEPS : MINOR_STEPS;
}

/** Note name for display, spelled to suit the key. */
export function pitchName(pitch: number, key = "C"): string {
  const names = FLAT_KEYS.has(key) ? FLAT_NAMES : SHARP_NAMES;
  return `${names[((pitch % 12) + 12) % 12]}${Math.floor(pitch / 12) - 1}`;
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
    run: (_s, a, v) => ({
      passed: a.rangeSemitones <= v,
      detail: `${a.rangeSemitones} semitone${a.rangeSemitones === 1 ? "" : "s"} from lowest to highest`,
    }),
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
    run: (_s, a, v) => ({
      passed: a.longestRepeat <= v,
      detail: `Longest run of one pitch: ${a.longestRepeat}`,
    }),
  },
  "leap-recovery": {
    label: () => "Leaps are answered by a step back",
    hint: "After a jump of a fourth or more, step back the other way.",
    run: (_s, a) => {
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
    run: (_s, a) => ({
      passed: a.restTicks > 0,
      detail: a.restTicks > 0 ? "There is space between phrases" : "No silence anywhere",
    }),
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
