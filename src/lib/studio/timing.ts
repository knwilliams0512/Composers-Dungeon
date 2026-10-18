/**
 * Where every tick of a score falls in time, and how loud it is there.
 *
 * Playback used to work from a single number — `60 / tempo / ticksPerBeat` —
 * and multiply every tick by it. That is exactly right for a score with one
 * tempo and no holds, and silently wrong for everything else:
 *
 *   - a fermata is a hold, and a hold that does not hold is not a fermata. The
 *     mark printed, the export carried it, and playback drove straight through.
 *   - a crescendo is a change of loudness over time. The hairpin printed and
 *     the sound stayed exactly where the last printed dynamic had left it, so
 *     the most basic expressive marking in music did nothing at all.
 *
 * Both need the same thing: a function from tick to seconds that is allowed to
 * bend, and a function from tick to gain that is allowed to slope. A flat
 * multiplier cannot be either. So this builds a piecewise-linear map of both,
 * once, and everything that plays or draws a playhead reads it.
 *
 * The map is invertible on purpose. A playhead has to go the other way —
 * seconds back to ticks — and with a bending map that is no longer a division.
 */

import { ticksPerBeat } from "@/lib/score";
import { measureOffsets, meterAt, type Dynamic, type Fermata, type StudioScore } from "./model";

/* -------------------------------------------------------------------------- */
/* Holds                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * How much longer a fermata holds its note, as a multiple of the written
 * length.
 *
 * These are interpretations, not facts — a fermata's length is the performer's
 * decision and always has been. They are the conventional readings: the wedge
 * asks for a brief lean on the note, the plain arch for about double, the
 * square bracket for a long hold, and the double arch for as long as the hall
 * will take. What matters is that they differ and that they are written down
 * where a reader can argue with them.
 */
export const FERMATA_HOLD: Record<Fermata, number> = {
  angled: 1.4,
  normal: 2,
  square: 2.75,
  "very-long": 3.5,
};

/* -------------------------------------------------------------------------- */
/* The time map                                                               */
/* -------------------------------------------------------------------------- */

/** One stretch of the piece played at a constant rate. */
export interface TimeSpan {
  /** Ticks, half-open: [from, to). */
  from: number;
  to: number;
  secondsPerTick: number;
  /** Seconds from the start of the piece at `from`. */
  at: number;
}

export interface TimeMap {
  spans: TimeSpan[];
  /** Seconds from the start of the piece to a tick. */
  secondsAt: (tick: number) => number;
  /** The inverse, for a playhead. */
  tickAt: (seconds: number) => number;
  totalTicks: number;
  totalSeconds: number;
  /** The rate with no holds applied, which is what a bar ruler wants. */
  baseSecondsPerTick: number;
}

/**
 * Build the map.
 *
 * A fermata slows one stretch of the piece — the held note's own length — and
 * everything resumes afterwards. Slowing the *tempo* rather than lengthening
 * the one note is what makes this right for an ensemble: when the whole band
 * holds a chord, every part holds it, and a map that stretched only the note
 * carrying the mark would leave the other parts moving underneath it.
 *
 * Fermatas at the same tick in different parts are one hold, taking the
 * longest. Two conductors do not hold the same chord twice.
 */
export function buildTimeMap(score: StudioScore): TimeMap {
  const baseSecondsPerTick = 60 / Math.max(1, score.tempo) / ticksPerBeat(score.meter);
  const { total } = measureOffsets(score);

  // Collect holds: tick -> { length, factor }, keeping the longest claim.
  const holds = new Map<number, { length: number; factor: number }>();
  const claim = (start: number, length: number, fermata: Fermata) => {
    if (length <= 0) return;
    const factor = FERMATA_HOLD[fermata] ?? FERMATA_HOLD.normal;
    const have = holds.get(start);
    if (!have || factor * length > have.factor * have.length) {
      holds.set(start, { length, factor });
    }
  };
  for (const part of score.parts) {
    for (const staff of part.staves) {
      for (const voice of staff.voices) {
        for (const n of voice.notes) if (n.fermata) claim(n.start, n.duration, n.fermata);
        for (const r of voice.rests) if (r.fermata) claim(r.start, r.duration, r.fermata);
      }
    }
  }

  const spans: TimeSpan[] = [];
  const points = Array.from(holds.keys()).sort((a, b) => a - b);
  let cursor = 0;
  let seconds = 0;

  const addSpan = (from: number, to: number, rate: number) => {
    if (to <= from) return;
    spans.push({ from, to, secondsPerTick: rate, at: seconds });
    seconds += (to - from) * rate;
  };

  for (const start of points) {
    const hold = holds.get(start)!;
    // A hold inside a stretch already held — overlapping fermatas — is folded
    // into the one already running rather than compounding it.
    if (start < cursor) continue;
    addSpan(cursor, start, baseSecondsPerTick);
    const end = Math.min(total, start + hold.length);
    addSpan(start, end, baseSecondsPerTick * hold.factor);
    cursor = end;
  }
  addSpan(cursor, total, baseSecondsPerTick);
  if (spans.length === 0) addSpan(0, Math.max(1, total), baseSecondsPerTick);

  const last = spans[spans.length - 1];
  const totalSeconds = last.at + (last.to - last.from) * last.secondsPerTick;

  const secondsAt = (tick: number): number => {
    if (tick <= 0) return 0;
    for (const s of spans) {
      if (tick < s.to) return s.at + (Math.max(s.from, tick) - s.from) * s.secondsPerTick;
    }
    // Past the end, time keeps running at the final rate so a trailing note
    // does not collapse onto the last tick.
    return totalSeconds + (tick - last.to) * last.secondsPerTick;
  };

  const tickAt = (sec: number): number => {
    if (sec <= 0) return 0;
    for (const s of spans) {
      const end = s.at + (s.to - s.from) * s.secondsPerTick;
      if (sec < end) return s.from + (sec - s.at) / s.secondsPerTick;
    }
    return last.to + (sec - totalSeconds) / last.secondsPerTick;
  };

  return { spans, secondsAt, tickAt, totalTicks: total, totalSeconds, baseSecondsPerTick };
}

/* -------------------------------------------------------------------------- */
/* Loudness over time                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The printed dynamics, in order of loudness.
 *
 * A hairpin with no dynamic printed after it has to go *somewhere*, and the
 * only honest answer is one step along this ladder — which is what a performer
 * does with an unresolved crescendo. sfz and fp are left out of the ladder
 * deliberately: they are attacks, not levels, so "one louder than sfz" is not a
 * thing anyone could play.
 */
export const DYNAMIC_LADDER: Dynamic[] = ["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"];

/** 0-1 playback gain for each printed dynamic. */
export const DYNAMIC_GAIN: Record<Dynamic, number> = {
  ppp: 0.12,
  pp: 0.2,
  p: 0.32,
  mp: 0.45,
  mf: 0.6,
  f: 0.75,
  ff: 0.9,
  fff: 1,
  // An accent on one note rather than a level: loud at the moment of attack.
  sfz: 1,
  // Loud then immediately soft. The attack is what the symbol names, and the
  // drop belongs to the note's envelope rather than to the piece's level.
  fp: 0.75,
};

interface GainSource {
  dynamics: { start: number; value: Dynamic }[];
  hairpins: { start: number; duration: number; kind: "crescendo" | "diminuendo" }[];
}

/**
 * A function giving the loudness in force at any tick on one staff.
 *
 * Discrete dynamics are steps: a mark holds until the next replaces it. A
 * hairpin is a ramp between the level it starts at and the level it reaches,
 * and the level it reaches is whatever dynamic is printed at or just after its
 * end — which is how the notation works, the hairpin being the journey and the
 * next mark being the destination. With nothing printed at the far end, it
 * moves one step along the ladder, in the direction it points.
 *
 * An unresolved hairpin then *latches*: the level it arrived at stays in force
 * until something else is printed. That is the only reading a performer would
 * accept — nobody crescendos for four bars and then drops back to where they
 * started because the composer forgot to write the f. The first version of this
 * function did exactly that, and scripts/check-timing.ts caught it.
 */
export function gainCurve(staff: GainSource): (tick: number) => number {
  const marks = [...staff.dynamics].sort((a, b) => a.start - b.start);
  const hairpins = [...staff.hairpins]
    .filter((h) => h.duration > 0)
    .sort((a, b) => a.start - b.start);

  const step = (from: Dynamic, direction: 1 | -1): Dynamic => {
    const i = DYNAMIC_LADDER.indexOf(from);
    // sfz and fp are not on the ladder; a hairpin out of one starts from mf,
    // which is the level they are played around.
    const base = i === -1 ? DYNAMIC_LADDER.indexOf("mf") : i;
    const next = Math.max(0, Math.min(DYNAMIC_LADDER.length - 1, base + direction));
    return DYNAMIC_LADDER[next];
  };

  /*
   * Every point at which the standing level changes, printed or implied.
   *
   * Built in time order because each hairpin's starting level depends on
   * everything before it — including the level a previous unresolved hairpin
   * latched. A score can hold a chain of them: a crescendo to an implied f,
   * then another crescendo from that f.
   */
  const levels: { start: number; value: Dynamic }[] = [{ start: -Infinity, value: "mf" }];
  const levelAt = (tick: number): Dynamic => {
    let value: Dynamic = "mf";
    for (const l of levels) {
      if (l.start > tick) break;
      value = l.value;
    }
    return value;
  };

  /** Where each hairpin starts and ends, in gain, once resolved. */
  const ramps = new Map<(typeof hairpins)[number], { from: number; to: number }>();

  const events = [
    ...marks.map((m) => ({ at: m.start, mark: m, hairpin: null as null | (typeof hairpins)[number] })),
    ...hairpins.map((h) => ({ at: h.start, mark: null, hairpin: h })),
  ].sort((a, b) => a.at - b.at || (a.mark ? -1 : 1));

  for (const e of events) {
    if (e.mark) {
      levels.push({ start: e.mark.start, value: e.mark.value });
      continue;
    }
    const h = e.hairpin!;
    const fromLevel = levelAt(h.start);
    const end = h.start + h.duration;
    // A dynamic printed where the hairpin lands is the target. The small window
    // is there because a mark is written at the hairpin's end, not one tick
    // after it, and floating-point tick arithmetic should not decide this.
    const landed = marks.find((m) => m.start >= end - 1e-9 && m.start <= end + 1);
    const toLevel = landed ? landed.value : step(fromLevel, h.kind === "crescendo" ? 1 : -1);
    ramps.set(h, { from: DYNAMIC_GAIN[fromLevel], to: DYNAMIC_GAIN[toLevel] });
    // Latch it, unless the printed mark is already going to do that.
    if (!landed) levels.push({ start: end, value: toLevel });
  }

  levels.sort((a, b) => a.start - b.start);

  return (tick: number): number => {
    for (const h of hairpins) {
      if (tick < h.start || tick >= h.start + h.duration) continue;
      const r = ramps.get(h);
      if (!r) break;
      const t = Math.max(0, Math.min(1, (tick - h.start) / h.duration));
      return r.from + (r.to - r.from) * t;
    }
    return DYNAMIC_GAIN[levelAt(tick)];
  };
}
