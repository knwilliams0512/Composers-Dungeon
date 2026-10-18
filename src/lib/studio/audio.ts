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

export interface Recipe {
  /** Oscillator type and relative level for each partial. */
  partials: { type: OscillatorType; ratio: number; gain: number }[];
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  /** Scales the whole voice so families sit at comparable loudness. */
  level: number;

  /*
   * The four below are what a fixed stack of oscillators cannot do on its own,
   * and each models something every acoustic instrument actually does.
   */

  /**
   * How far above the fundamental the tone reaches when played hard, as a
   * multiple of it.
   *
   * A static mix of partials gives a note one spectrum for its whole life. No
   * real instrument has that: the spectrum is widest at the attack and narrows
   * as the energy leaves. This is the top of that range, and it is relative to
   * the fundamental rather than absolute, so a low note is rich and a high note
   * is not — which is also true of every instrument.
   */
  brightness: number;

  /**
   * What fraction of that reach is left by the end of the note.
   *
   * 1 would be a tone that never darkens, which is the synthesiser sound this
   * replaces. A plucked string drops furthest and fastest; a bowed line, where
   * the player keeps putting energy in, barely drops at all.
   */
  damping: number;

  /**
   * The noise at the moment of onset — bow scratch, breath, the hammer's thump
   * — as a fraction of the note's level, and how long it lasts.
   *
   * It is a very short burst and it matters out of all proportion to its
   * length: the attack transient is most of what the ear uses to tell
   * instruments apart, which is why a recording with its first forty
   * milliseconds removed is so hard to identify.
   */
  transient?: { level: number; seconds: number };

  /**
   * How much faster a high note dies than a low one, from 0 to 1.
   *
   * A piano's top octave decays in under a second while its bottom rings for
   * twenty. Only matters where the note is struck or plucked and then left
   * alone — a bowed or blown note lasts as long as the player wants it to.
   */
  pitchDecay?: number;

  /**
   * Cents of detune between two copies of the fundamental.
   *
   * A string section is sixteen players who are not exactly in tune with each
   * other, and that is where its warmth comes from rather than from any
   * harmonic. One cent is inaudible as pitch and audible as width.
   */
  detune?: number;
}

export const RECIPES: Record<Timbre, Recipe> = {
  // Bowed: the player keeps feeding energy in, so the tone barely darkens.
  // The scratch at the start is the bow catching, and the detune is a section
  // rather than a soloist.
  bowed: {
    partials: [
      { type: "sawtooth", ratio: 1, gain: 0.6 },
      { type: "triangle", ratio: 2, gain: 0.15 },
    ],
    attack: 0.09, decay: 0.12, sustain: 0.75, release: 0.25, level: 0.5,
    brightness: 11, damping: 0.72,
    transient: { level: 0.1, seconds: 0.05 },
    detune: 7,
  },
  // Plucked: all the energy arrives at once and then leaves. The spectrum
  // collapses faster than anything else here, and the top strings die first.
  plucked: {
    partials: [
      { type: "triangle", ratio: 1, gain: 0.7 },
      { type: "sine", ratio: 2, gain: 0.2 },
      { type: "sine", ratio: 3, gain: 0.08 },
    ],
    attack: 0.004, decay: 0.5, sustain: 0.05, release: 0.3, level: 0.65,
    brightness: 14, damping: 0.22,
    transient: { level: 0.22, seconds: 0.012 },
    pitchDecay: 0.75,
  },
  // Reed: bright and buzzy, and the breath noise is part of the sound rather
  // than an artefact of it.
  reed: {
    partials: [
      { type: "square", ratio: 1, gain: 0.35 },
      { type: "sawtooth", ratio: 1, gain: 0.2 },
      { type: "sine", ratio: 3, gain: 0.1 },
    ],
    attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.16, level: 0.45,
    brightness: 13, damping: 0.78,
    transient: { level: 0.12, seconds: 0.04 },
  },
  // Flute: almost a sine, and the breath is a large part of what identifies
  // it — take the transient away and it stops sounding like an instrument.
  flute: {
    partials: [
      { type: "sine", ratio: 1, gain: 0.75 },
      { type: "sine", ratio: 2, gain: 0.12 },
      { type: "triangle", ratio: 3, gain: 0.05 },
    ],
    attack: 0.06, decay: 0.08, sustain: 0.85, release: 0.18, level: 0.55,
    brightness: 6, damping: 0.85,
    transient: { level: 0.18, seconds: 0.055 },
  },
  // Brass: the one family where loudness and brightness are most obviously the
  // same control. A trumpet at fortissimo is not a louder trumpet, it is a
  // different spectrum, which is what the velocity term below is for.
  brass: {
    partials: [
      { type: "sawtooth", ratio: 1, gain: 0.5 },
      { type: "square", ratio: 2, gain: 0.12 },
      { type: "sine", ratio: 3, gain: 0.08 },
    ],
    attack: 0.045, decay: 0.14, sustain: 0.78, release: 0.2, level: 0.5,
    brightness: 16, damping: 0.6,
    transient: { level: 0.08, seconds: 0.03 },
  },
  // Struck: the hammer thump is a real part of a piano note, and the top
  // octave dies in under a second while the bottom rings for twenty.
  struck: {
    partials: [
      { type: "triangle", ratio: 1, gain: 0.7 },
      { type: "sine", ratio: 2.01, gain: 0.25 },
      { type: "sine", ratio: 4, gain: 0.08 },
    ],
    attack: 0.003, decay: 0.75, sustain: 0.12, release: 0.45, level: 0.6,
    brightness: 12, damping: 0.3,
    transient: { level: 0.2, seconds: 0.014 },
    pitchDecay: 0.85,
  },
  voice: {
    partials: [
      { type: "sine", ratio: 1, gain: 0.6 },
      { type: "triangle", ratio: 2, gain: 0.22 },
      { type: "sine", ratio: 3, gain: 0.12 },
    ],
    attack: 0.07, decay: 0.12, sustain: 0.8, release: 0.28, level: 0.5,
    brightness: 8, damping: 0.8,
    transient: { level: 0.07, seconds: 0.045 },
    detune: 4,
  },
  // The one voice with no acoustic original, so it keeps its static spectrum
  // on purpose — a synthesiser that darkens like a piano is just a worse piano.
  electronic: {
    partials: [
      { type: "sawtooth", ratio: 1, gain: 0.4 },
      { type: "square", ratio: 1.005, gain: 0.3 },
      { type: "sine", ratio: 0.5, gain: 0.15 },
    ],
    attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.35, level: 0.45,
    brightness: 20, damping: 0.95,
    detune: 11,
  },
  drum: {
    partials: [{ type: "triangle", ratio: 1, gain: 0.8 }],
    attack: 0.001, decay: 0.16, sustain: 0.01, release: 0.1, level: 0.7,
    brightness: 18, damping: 0.4,
  },
};

/* -------------------------------------------------------------------------- */
/* What a note's filter and envelope actually do                              */
/* -------------------------------------------------------------------------- */

/** A filter below the fundamental silences the note, so this is the floor. */
export const MIN_CUTOFF = 80;
/** Above this nothing is audible anyway, and some devices misbehave. */
export const MAX_CUTOFF = 18000;

export interface VoiceParams {
  /** Hz, at the moment of attack. */
  cutoffStart: number;
  /** Hz, by the end of the note. */
  cutoffEnd: number;
  /** Seconds — the recipe's decay, shortened for high notes where it applies. */
  decay: number;
  /** 0-1, the attack noise's level after velocity is taken into account. */
  transientLevel: number;
  /** The fundamental, for anything that needs it. */
  fundamental: number;
}

/**
 * Work out a note's filter and envelope from its pitch and how hard it is
 * played.
 *
 * Separated from the audio graph so it can be checked: none of this needs an
 * AudioContext, and all of it is arithmetic with properties worth asserting —
 * above all that the cutoff never lands below the fundamental, which would
 * silence the note entirely rather than merely dull it.
 *
 * The velocity term is the part that matters most musically. Playing an
 * acoustic instrument harder produces more harmonics, not simply more
 * amplitude, which is why a synthesiser whose dynamics are only a volume
 * control sounds like a volume control. Here a quiet note reaches a third as
 * far up the spectrum as a loud one, and that difference is most of what makes
 * pp and ff sound like different playing rather than the same playing turned
 * down.
 */
export function voiceParams(pitch: number, velocity: number, r: Recipe): VoiceParams {
  const fundamental = midiToHz(pitch);
  const v = Math.max(0, Math.min(1, velocity));

  // A third of the reach at silence, all of it at full. Never none, or a
  // quiet note would be a sine wave.
  const reach = r.brightness * (0.34 + 0.66 * v);

  const clamp = (hz: number) =>
    Math.max(MIN_CUTOFF, Math.min(MAX_CUTOFF, hz));

  // The floor is the fundamental with room above it: a lowpass at or below the
  // fundamental removes the note rather than its brightness.
  const floor = fundamental * 1.6;
  const cutoffStart = clamp(Math.max(floor, fundamental * reach));
  const cutoffEnd = clamp(Math.max(floor, cutoffStart * r.damping));

  // High notes decay faster where the note is struck and then left alone. 60
  // is middle C, and the exponent gives roughly a halving per octave at full
  // strength — which is about right for a piano.
  let decay = r.decay;
  if (r.pitchDecay) {
    const octaves = (pitch - 60) / 12;
    decay = r.decay * Math.pow(2, -octaves * r.pitchDecay);
    decay = Math.max(0.02, Math.min(r.decay * 4, decay));
  }

  return {
    cutoffStart,
    cutoffEnd,
    decay,
    transientLevel: (r.transient?.level ?? 0) * (0.4 + 0.6 * v),
    fundamental,
  };
}

export interface ScheduledNote {
  pitch: number;
  /** Seconds from the start of the schedule. */
  at: number;
  seconds: number;
  timbre: Timbre;
  gain: number;
  /**
   * How hard the note is played, 0-1, before the mixer touches it.
   *
   * Separate from `gain` on purpose. Gain is loudness and includes the part's
   * fader; velocity is the performance, and it is what decides the note's
   * brightness. Turning a part down in the mix should make it quieter, not
   * make the player play more gently.
   */
  velocity: number;
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
    const params = voiceParams(n.pitch, n.velocity ?? n.gain, r);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(peak, at + r.attack);
    env.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, peak * r.sustain),
      at + r.attack + params.decay
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
      bp.frequency.value = params.fundamental;
      bp.Q.value = 1.2;
      src.connect(bp).connect(env);
      src.start(at);
      src.stop(end);
      this.live.push({ stop: (t) => src.stop(Math.max(t, at)) });
      return;
    }

    /*
     * The tone filter.
     *
     * One low-pass between the oscillators and the envelope, opening at the
     * attack and closing across the note. Without it every note has one
     * spectrum for its whole life, which is the single thing that most makes a
     * stack of oscillators sound like a stack of oscillators.
     */
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.Q.value = 0.7;
    tone.frequency.setValueAtTime(params.cutoffStart, at);
    tone.frequency.exponentialRampToValueAtTime(
      params.cutoffEnd,
      at + Math.max(0.05, Math.min(hold, r.attack + params.decay * 2))
    );
    tone.connect(env);

    // The attack transient: bow scratch, breath, hammer. Very short, and most
    // of what the ear uses to tell one instrument from another.
    if (r.transient && params.transientLevel > 0.001) {
      const len = Math.max(1, Math.ceil(ctx.sampleRate * r.transient.seconds));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        // Decaying rather than flat, or it reads as a click instead of an onset.
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = Math.min(MAX_CUTOFF, params.fundamental * 3);
      bp.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.value = params.transientLevel * r.level;
      src.connect(bp).connect(g).connect(env);
      src.start(at);
      src.stop(at + r.transient.seconds + 0.01);
      this.live.push({ stop: (t) => src.stop(Math.max(t, at)) });
    }

    for (const p of r.partials) {
      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.value = params.fundamental * p.ratio;
      const g = ctx.createGain();
      g.gain.value = p.gain;
      osc.connect(g).connect(tone);
      osc.start(at);
      osc.stop(end);
      this.live.push({ stop: (t) => osc.stop(Math.max(t, at)) });

      // A second copy of the fundamental, a few cents off, for anything that
      // is a section rather than a soloist. One cent is inaudible as pitch and
      // audible as width.
      if (r.detune && p.ratio === 1) {
        const twin = ctx.createOscillator();
        twin.type = p.type;
        twin.frequency.value = params.fundamental;
        twin.detune.value = r.detune;
        const tg = ctx.createGain();
        tg.gain.value = p.gain * 0.5;
        twin.connect(tg).connect(tone);
        twin.start(at);
        twin.stop(end);
        this.live.push({ stop: (t) => twin.stop(Math.max(t, at)) });
      }
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

          // How hard it is played, before the mixer. This is what decides the
          // note's brightness; the fader below decides only its loudness.
          let velocity = n.velocity !== undefined ? n.velocity / 127 : gainAt(n.start);
          if (arts.includes("accent")) velocity = Math.min(1, velocity * 1.35);
          if (arts.includes("marcato")) velocity = Math.min(1, velocity * 1.5);
          const gain = Math.min(1, velocity * part.volume);

          notes.push({
            pitch: n.pitch + shift,
            at: time.secondsAt(n.start) - base,
            seconds: Math.max(0.04, seconds),
            timbre: inst.timbre,
            gain,
            velocity,
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
