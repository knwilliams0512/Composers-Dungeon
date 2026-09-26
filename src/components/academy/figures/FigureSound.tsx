"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Hear the figure.
 *
 * A picture of a minor third teaches half of what a minor third is. The same
 * spec that drew the figure is flattened to onsets on the server and handed
 * here, so what a person sees and what they hear are the same data and cannot
 * drift apart the way a diagram and a separately-authored audio file would.
 *
 * Deliberately plain: an oscillator per note, no samples to ship, no library.
 * A lesson figure is two seconds of C-D-E, not a performance.
 */

export interface SoundEvent {
  /** MIDI number; -1 for a rest, which simply occupies its time. */
  pitch: number;
  /** Seconds from the start. */
  at: number;
  /** Seconds. */
  length: number;
}

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export function FigureSound({ events, label }: { events: SoundEvent[]; label: string }) {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void ctxRef.current?.close().catch(() => {});
    },
    []
  );

  function stop() {
    if (timerRef.current) clearTimeout(timerRef.current);
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setPlaying(false);
  }

  function play() {
    if (playing) {
      stop();
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    ctxRef.current = ctx;
    setPlaying(true);

    const t0 = ctx.currentTime + 0.06;
    let end = t0;
    for (const event of events) {
      if (event.pitch < 0) {
        end = Math.max(end, t0 + event.at + event.length);
        continue;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = midiToHz(event.pitch);
      const start = t0 + event.at;
      const finish = start + Math.max(0.12, event.length * 0.92);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, finish);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(finish + 0.03);
      end = Math.max(end, finish);
    }

    timerRef.current = setTimeout(
      stop,
      Math.max(300, (end - ctx.currentTime) * 1000 + 120)
    );
  }

  return (
    <button
      type="button"
      onClick={play}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-parchment-100/15 bg-abyss-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-parchment-300 transition hover:border-gold-500/50 hover:text-gold-200"
      aria-label={playing ? `Stop ${label}` : `Play ${label}`}
    >
      <Icon name={playing ? "pause" : "play"} size={11} />
      {playing ? "Stop" : "Hear it"}
    </button>
  );
}
