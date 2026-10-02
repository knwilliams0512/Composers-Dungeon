"use client";

/**
 * The sound behind every figure.
 *
 * One audio context for the whole page rather than one per figure: a browser
 * caps how many a document may open, and a lesson can carry five figures. It
 * is created on the first click, because every browser refuses to start one
 * before a gesture, and a figure that silently does nothing the first time it
 * is pressed is worse than one with no sound at all.
 *
 * The tone is a small additive stack rather than a single oscillator. A pure
 * sine is a poor teacher: it has no overtones, so an octave played on it does
 * not demonstrate the thing the octave lesson is claiming, and two sines a
 * third apart beat unpleasantly. Three partials is enough to sound like an
 * instrument and cheap enough to schedule fifty of.
 */

let ctx: AudioContext | null = null;

export function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx && ctx.state !== "closed") {
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

export const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** Relative loudness of the first partials, which is what makes it a tone. */
const DEFAULT_PARTIALS = [1, 0.4, 0.18, 0.08];

export interface ToneOptions {
  /** Seconds from now. */
  at?: number;
  /** Seconds. */
  length?: number;
  gain?: number;
  /** Override the overtone recipe — the timbre figure varies exactly this. */
  partials?: number[];
}

/** Schedules one note and returns the time it finishes. */
export function tone(midi: number, options: ToneOptions = {}): number {
  const audio = audioContext();
  if (!audio) return 0;
  const at = audio.currentTime + (options.at ?? 0) + 0.02;
  const length = Math.max(0.12, options.length ?? 0.5);
  const gain = options.gain ?? 0.22;
  const partials = options.partials ?? DEFAULT_PARTIALS;
  const total = partials.reduce((sum, level) => sum + level, 0) || 1;

  partials.forEach((level, i) => {
    if (level <= 0) return;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = midiToHz(midi) * (i + 1);
    const peak = (gain * level) / total;
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + length);
    osc.connect(amp).connect(audio.destination);
    osc.start(at);
    osc.stop(at + length + 0.04);
  });
  return at + length;
}

export interface SequenceEvent {
  /** MIDI numbers sounding together. Empty is a rest. */
  pitches: number[];
  /** Seconds from the start of the sequence. */
  at: number;
  length: number;
  /** Passed back to onStep so a figure can light the right thing. */
  key?: string | number;
  partials?: number[];
}

/**
 * Plays a sequence and reports where it has got to.
 *
 * The callback is what makes a figure follow itself: the staff lights the
 * notehead that is sounding, so a person who cannot yet read the rhythm can
 * still see which note they are hearing. It is the whole reason playback is
 * worth having in a lesson rather than just a recording.
 */
export function playSequence(
  events: SequenceEvent[],
  onStep?: (key: string | number | null) => void
): () => void {
  const audio = audioContext();
  if (!audio || events.length === 0) return () => {};
  const timers: ReturnType<typeof setTimeout>[] = [];
  let end = 0;
  for (const event of events) {
    for (const pitch of event.pitches) {
      end = Math.max(end, tone(pitch, { at: event.at, length: event.length, partials: event.partials }));
    }
    if (onStep) {
      timers.push(setTimeout(() => onStep(event.key ?? null), event.at * 1000));
    }
    end = Math.max(end, audio.currentTime + event.at + event.length);
  }
  if (onStep) {
    timers.push(setTimeout(() => onStep(null), (end - audio.currentTime) * 1000 + 80));
  }
  return () => {
    timers.forEach(clearTimeout);
    onStep?.(null);
    // Silencing mid-flight means replacing the context: scheduled oscillators
    // cannot be un-scheduled, and a lesson figure is short enough that losing
    // the context costs nothing.
    try {
      void ctx?.close();
    } catch {
      /* already closing */
    }
    ctx = null;
  };
}

/** Stops everything this page has scheduled. */
export function stopAll(): void {
  try {
    void ctx?.close();
  } catch {
    /* already closing */
  }
  ctx = null;
}
