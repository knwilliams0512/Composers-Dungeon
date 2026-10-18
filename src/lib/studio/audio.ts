/**
 * Studio playback: a small synthesiser that can hold a whole orchestra.
 *
 * Each instrument family gets an envelope and harmonic recipe chosen to be
 * recognisable rather than realistic — a bowed line should swell where a
 * plucked one should decay, so a composer can tell parts apart by ear while
 * checking their work.
 */

import { ticksPerBeat } from "@/lib/score";
import { instrumentById, type Timbre } from "./instruments";
import {
  audibleParts,
  measureOffsets,
  meterAt,
  pedalsOf,
  transposeOf,
  type StudioScore,
} from "./model";
import { buildTimeMap, gainCurve, type TimeMap } from "./timing";

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

interface Recipe {
  /** Oscillator type and relative level for each partial. */
  partials: { type: OscillatorType; ratio: number; gain: number }[];
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  /** Scales the whole voice so families sit at comparable loudness. */
  level: number;
}

const RECIPES: Record<Timbre, Recipe> = {
  bowed: {
    partials: [
      { type: "sawtooth", ratio: 1, gain: 0.6 },
      { type: "triangle", ratio: 2, gain: 0.15 },
    ],
    attack: 0.09, decay: 0.12, sustain: 0.75, release: 0.25, level: 0.5,
  },
  plucked: {
    partials: [
      { type: "triangle", ratio: 1, gain: 0.7 },
      { type: "sine", ratio: 2, gain: 0.2 },
      { type: "sine", ratio: 3, gain: 0.08 },
    ],
    attack: 0.004, decay: 0.5, sustain: 0.05, release: 0.3, level: 0.65,
  },
  reed: {
    partials: [
      { type: "square", ratio: 1, gain: 0.35 },
      { type: "sawtooth", ratio: 1, gain: 0.2 },
      { type: "sine", ratio: 3, gain: 0.1 },
    ],
    attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.16, level: 0.45,
  },
  flute: {
    partials: [
      { type: "sine", ratio: 1, gain: 0.75 },
      { type: "sine", ratio: 2, gain: 0.12 },
      { type: "triangle", ratio: 3, gain: 0.05 },
    ],
    attack: 0.06, decay: 0.08, sustain: 0.85, release: 0.18, level: 0.55,
  },
  brass: {
    partials: [
      { type: "sawtooth", ratio: 1, gain: 0.5 },
      { type: "square", ratio: 2, gain: 0.12 },
      { type: "sine", ratio: 3, gain: 0.08 },
    ],
    attack: 0.045, decay: 0.14, sustain: 0.78, release: 0.2, level: 0.5,
  },
  struck: {
    partials: [
      { type: "triangle", ratio: 1, gain: 0.7 },
      { type: "sine", ratio: 2.01, gain: 0.25 },
      { type: "sine", ratio: 4, gain: 0.08 },
    ],
    attack: 0.003, decay: 0.75, sustain: 0.12, release: 0.45, level: 0.6,
  },
  voice: {
    partials: [
      { type: "sine", ratio: 1, gain: 0.6 },
      { type: "triangle", ratio: 2, gain: 0.22 },
      { type: "sine", ratio: 3, gain: 0.12 },
    ],
    attack: 0.07, decay: 0.12, sustain: 0.8, release: 0.28, level: 0.5,
  },
  electronic: {
    partials: [
      { type: "sawtooth", ratio: 1, gain: 0.4 },
      { type: "square", ratio: 1.005, gain: 0.3 },
      { type: "sine", ratio: 0.5, gain: 0.15 },
    ],
    attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.35, level: 0.45,
  },
  drum: {
    partials: [{ type: "triangle", ratio: 1, gain: 0.8 }],
    attack: 0.001, decay: 0.16, sustain: 0.01, release: 0.1, level: 0.7,
  },
};

export interface ScheduledNote {
  pitch: number;
  /** Seconds from the start of the schedule. */
  at: number;
  seconds: number;
  timbre: Timbre;
  gain: number;
  pan: number;
  /** Percussion pitches map to noise rather than a tone. */
  noise?: boolean;
}

export class StudioPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private live: { stop: (t: number) => void }[] = [];

  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  async resume(): Promise<void> {
    const ctx = this.ensure();
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});
  }

  now(): number {
    return this.ensure().currentTime;
  }

  setMasterVolume(v: number) {
    this.ensure();
    if (this.master) this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  /** Silences everything currently sounding and forgets it. */
  stopAll() {
    const t = this.ctx?.currentTime ?? 0;
    for (const v of this.live) {
      try {
        v.stop(t);
      } catch {
        /* a voice that already ended throws; nothing to do about it */
      }
    }
    this.live = [];
  }

  voice(n: ScheduledNote, offset: number) {
    const ctx = this.ensure();
    if (!this.master) return;
    const r = RECIPES[n.timbre];
    const at = offset + n.at;
    const hold = Math.max(0.05, n.seconds);
    const peak = Math.max(0.0001, n.gain * r.level);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(peak, at + r.attack);
    env.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, peak * r.sustain),
      at + r.attack + r.decay
    );
    env.gain.setValueAtTime(Math.max(0.0001, peak * r.sustain), at + hold);
    env.gain.exponentialRampToValueAtTime(0.0001, at + hold + r.release);

    const panner = ctx.createStereoPanner?.();
    if (panner) {
      panner.pan.value = Math.max(-1, Math.min(1, n.pan));
      env.connect(panner).connect(this.master);
    } else {
      env.connect(this.master);
    }

    const end = at + hold + r.release + 0.02;

    if (n.noise) {
      const len = Math.ceil(ctx.sampleRate * (hold + r.release + 0.05));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = midiToHz(n.pitch);
      bp.Q.value = 1.2;
      src.connect(bp).connect(env);
      src.start(at);
      src.stop(end);
      this.live.push({ stop: (t) => src.stop(Math.max(t, at)) });
      return;
    }

    for (const p of r.partials) {
      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.value = midiToHz(n.pitch) * p.ratio;
      const g = ctx.createGain();
      g.gain.value = p.gain;
      osc.connect(g).connect(env);
      osc.start(at);
      osc.stop(end);
      this.live.push({ stop: (t) => osc.stop(Math.max(t, at)) });
    }
  }

  /** A metronome click; the downbeat is pitched higher. */
  tick(at: number, strong: boolean) {
    const ctx = this.ensure();
    if (!this.master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = strong ? 1600 : 1100;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(strong ? 0.14 : 0.08, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
    osc.connect(g).connect(this.master);
    osc.start(at);
    osc.stop(at + 0.08);
    this.live.push({ stop: (t) => osc.stop(Math.max(t, at)) });
  }

  close() {
    this.stopAll();
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.master = null;
  }
}

/**
 * Turn a score into a flat list of notes with absolute times, honouring mutes,
 * solos, transposition, dynamics, hairpins, fermatas, pedalling, articulations
 * and per-part volume and pan.
 *
 * Times come from the score's time map rather than from one multiplier, which
 * is what lets a fermata hold. Loudness comes from the staff's gain curve
 * rather than from the last printed dynamic, which is what lets a crescendo
 * grow. Both live in ./timing.ts; the reasons they have to are written there.
 */
export function scheduleScore(
  score: StudioScore,
  opts: { from?: number; to?: number } = {}
): { notes: ScheduledNote[]; time: TimeMap; totalTicks: number } {
  const time = buildTimeMap(score);
  const { total } = measureOffsets(score);
  const from = opts.from ?? 0;
  const to = opts.to ?? total;
  const base = time.secondsAt(from);

  const notes: ScheduledNote[] = [];

  for (const part of audibleParts(score)) {
    const inst = instrumentById(part.instrumentId);
    const shift = score.layout.concertPitch ? 0 : transposeOf(part);
    const isDrum = inst.timbre === "drum";

    for (const staff of part.staves) {
      const gainAt = gainCurve(staff);
      // Sustain and sostenuto both stop a note being damped when its written
      // length runs out; una corda changes the colour, not the length, so it
      // is not consulted here.
      const holding = pedalsOf(staff).filter((p) => p.kind !== "una-corda");
      const pedalEnd = (tick: number): number | null => {
        for (const p of holding) {
          if (tick < p.start || tick >= p.start + p.duration) continue;
          // A retake lifts the dampers, so the note survives only until the
          // next notch rather than to the end of the whole line.
          const next = (p.retakes ?? []).filter((r) => r > tick).sort((a, b) => a - b)[0];
          return next ?? p.start + p.duration;
        }
        return null;
      };

      for (const voice of staff.voices) {
        for (const n of voice.notes) {
          if (n.start + n.duration <= from || n.start >= to) continue;

          // The written length in real time, which under a fermata is longer
          // than the same number of ticks anywhere else in the piece.
          let seconds = time.secondsAt(n.start + n.duration) - time.secondsAt(n.start);
          const arts = n.articulations ?? [];
          if (arts.includes("staccato")) seconds *= 0.5;
          if (arts.includes("staccatissimo")) seconds *= 0.3;
          if (arts.includes("tenuto")) seconds *= 1.0;
          if (arts.includes("portato")) seconds *= 0.75;

          // Under the pedal a note rings on past its notehead, which is the
          // whole reason a pianist uses one. A staccato note under the pedal
          // still rings: the foot wins over the finger, as it does in the room.
          const held = pedalEnd(n.start);
          if (held !== null) {
            const ring = time.secondsAt(Math.min(held, to)) - time.secondsAt(n.start);
            seconds = Math.max(seconds, ring);
          }

          let gain = (n.velocity !== undefined ? n.velocity / 127 : gainAt(n.start)) * part.volume;
          if (arts.includes("accent")) gain = Math.min(1, gain * 1.35);
          if (arts.includes("marcato")) gain = Math.min(1, gain * 1.5);

          notes.push({
            pitch: n.pitch + shift,
            at: time.secondsAt(n.start) - base,
            seconds: Math.max(0.04, seconds),
            timbre: inst.timbre,
            gain,
            pan: part.pan,
            noise: isDrum,
          });
        }
      }
    }
  }

  notes.sort((a, b) => a.at - b.at);
  return { notes, time, totalTicks: total };
}

/**
 * Metronome click times, in seconds from the start of a range.
 *
 * Driven by the same time map as the notes. A click track computed from a flat
 * multiplier would walk away from the music at the first fermata and never
 * come back, which makes the metronome worse than no metronome.
 */
export function metronomeTicks(
  score: StudioScore,
  from: number,
  to: number,
  time: TimeMap
): { at: number; strong: boolean }[] {
  const out: { at: number; strong: boolean }[] = [];
  const { starts } = measureOffsets(score);
  const base = time.secondsAt(from);
  for (let i = 0; i < score.measures.length; i++) {
    const meter = meterAt(score, i);
    const beat = ticksPerBeat(meter);
    const barStart = starts[i];
    const barTicks = score.measures[i].pickupTicks ?? beat * meter.beats;
    for (let t = barStart; t < barStart + barTicks; t += beat) {
      if (t < from || t >= to) continue;
      out.push({ at: time.secondsAt(t) - base, strong: t === barStart });
    }
  }
  return out;
}
