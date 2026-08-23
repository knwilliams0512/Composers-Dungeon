"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { analyze, ticksPerBeat, totalTicks, triadFor, type Score } from "@/lib/score";

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/**
 * Plays back a saved piece, and draws it as a small piano roll so a
 * composition in the Library looks like music rather than a row of metadata.
 */
export function ScorePlayer({ score, compact = false }: { score: Score; compact?: boolean }) {
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

  async function play() {
    if (playing) {
      void ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
      setPlaying(false);
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    ctxRef.current = ctx;

    const secondsPerTick = 60 / score.tempo / ticksPerBeat(score.meter);
    const t0 = ctx.currentTime + 0.06;

    const voice = (pitch: number, at: number, seconds: number, gainPeak: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = midiToHz(pitch);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(gainPeak, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + seconds + 0.7);
    };

    for (const n of score.melody) {
      voice(n.pitch, t0 + n.start * secondsPerTick, n.duration * secondsPerTick, 0.2);
    }
    for (const c of score.chords) {
      triadFor(c.degree, score.key, score.mode).pitches.forEach((p, i) =>
        voice(p - 12, t0 + c.start * secondsPerTick + i * 0.012, c.duration * secondsPerTick, 0.08)
      );
    }

    setPlaying(true);
    const ms = (totalTicks(score) * secondsPerTick + 0.8) * 1000;
    timerRef.current = setTimeout(() => {
      void ctx.close().catch(() => {});
      ctxRef.current = null;
      setPlaying(false);
    }, ms);
  }

  const stats = analyze(score);
  const total = totalTicks(score);
  const low = stats.lowest ?? 60;
  const high = stats.highest ?? 72;
  const span = Math.max(1, high - low);
  const h = compact ? 34 : 56;

  return (
    <div className="rounded-lg border border-abyss-600/60 bg-abyss-900/50 p-2.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={play}
          aria-label={playing ? "Stop" : "Play this piece"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-700/60 bg-abyss-800 text-gold-300 transition-colors hover:border-gold-500 hover:text-gold-200"
        >
          <Icon name={playing ? "stop" : "play"} size={14} />
        </button>

        {/* Piano roll */}
        <svg
          viewBox={`0 0 ${Math.max(total, 1)} ${span + 2}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: h }}
          role="img"
          aria-label={`${stats.noteCount} notes over ${score.bars} bars`}
        >
          {score.chords.map((c, i) => (
            <rect
              key={`c${i}`}
              x={c.start}
              y={0}
              width={c.duration}
              height={span + 2}
              fill="rgba(79,99,168,0.13)"
            />
          ))}
          {score.melody.map((n, i) => (
            <rect
              key={i}
              x={n.start}
              y={high - n.pitch}
              width={Math.max(n.duration - 0.15, 0.4)}
              height={1}
              rx={0.35}
              fill="#e3c26d"
            />
          ))}
        </svg>
      </div>

      <p className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] uppercase tracking-widest text-parchment-500">
        <span>
          {score.key} {score.mode}
        </span>
        <span>
          {score.meter.beats}/{score.meter.unit}
        </span>
        <span>{score.bars} bars</span>
        <span>{score.tempo} bpm</span>
        <span>{stats.noteCount} notes</span>
      </p>
    </div>
  );
}
