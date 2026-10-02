"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleFigure } from "./CircleFigure";
import { playSequence, stopAll, tone, type SequenceEvent } from "./figure-audio";
import { FormFigure, ScoreOrderFigure } from "./FormFigure";
import { KeyboardFigure } from "./KeyboardFigure";
import { RhythmFigure } from "./RhythmFigure";
import { StaffFigure } from "./StaffFigure";
import { SpectrumFigure, WaveFigure } from "./WaveFigure";
import { Icon } from "@/components/ui/Icon";
import { placeNotes, type LessonFigure as Spec } from "@/lib/lesson-figure";
import { TICKS_PER_WHOLE } from "@/lib/score";
import { inkAccent } from "@/lib/studio/ink";

/**
 * One figure, framed — and playable.
 *
 * A picture of a minor third teaches half of what a minor third is, so every
 * figure that can sound does: press play and it runs, lighting whatever is
 * sounding as it goes, or press any single note, key, cell or chord to hear
 * that one thing alone. Hearing a chord you pointed at is the shortest route
 * from a shape on a page to a sound someone recognises, and it is the whole
 * reason these are components rather than pictures.
 *
 * The audio lives here rather than in each figure, so the page keeps one
 * context and one thing sounds at a time. The figures below stay drawing
 * code: they say what is where, and call back when it is pressed.
 */

/** A pace a figure can be followed at, rather than performed at. */
const TEMPO = 96;
const SECONDS_PER_TICK = 60 / TEMPO / (TICKS_PER_WHOLE / 4);

function sequenceFor(spec: Spec): SequenceEvent[] {
  if (spec.kind === "staff") {
    if (spec.silent) return [];
    const placed = placeNotes(spec.notes);
    const onsets = Array.from(new Set(placed.map((n) => n.start))).sort((a, b) => a - b);
    return onsets.map((onset) => {
      const here = placed.filter((n) => n.start === onset);
      return {
        pitches: here.filter((n) => !n.rest).map((n) => n.pitch),
        at: onset * SECONDS_PER_TICK,
        length: Math.max(...here.map((n) => n.duration)) * SECONDS_PER_TICK,
        key: onset,
      };
    });
  }
  if (spec.kind === "keyboard") {
    if (spec.silent) return [];
    const marks = (spec.marks ?? []).filter((m) => m.tone !== "muted");
    return marks.map((mark, i) => ({
      pitches: [mark.pitch],
      at: i * 0.46,
      length: 0.52,
      key: mark.pitch,
    }));
  }
  if (spec.kind === "rhythm") {
    if (spec.silent) return [];
    let cursor = 0;
    return spec.row.map((cell, i) => {
      const at = cursor * SECONDS_PER_TICK;
      cursor += cell.duration;
      // One pitch throughout: the figure is about length, not melody.
      return {
        pitches: cell.rest ? [] : [72],
        at,
        length: cell.duration * SECONDS_PER_TICK,
        key: i,
      };
    });
  }
  if (spec.kind === "wave") {
    // The lowest trace is a comfortable A; the others are its multiples, which
    // is the only claim the picture makes.
    return spec.traces.map((trace, i) => ({
      pitches: [57 + Math.round(12 * Math.log2(trace.multiple))],
      at: i * 0.7,
      length: 0.8,
      key: i,
    }));
  }
  return [];
}

/** What every interactive figure is handed. */
export interface FigureInteraction {
  /** The key currently sounding, so the figure can light it. */
  lit?: string | number | null;
  onPick?: (key: string | number, pitches: number[], partials?: number[]) => void;
}

export function LessonFigure({ spec, accent }: { spec: Spec; accent: string }) {
  const [playing, setPlaying] = useState(false);
  const [lit, setLit] = useState<string | number | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      stopRef.current?.();
      stopAll();
    },
    []
  );

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(false);
    setLit(null);
  }, []);

  const sequence = sequenceFor(spec);

  const play = useCallback(() => {
    if (playing) {
      stop();
      return;
    }
    const events = sequenceFor(spec);
    if (events.length === 0) return;
    setPlaying(true);
    stopRef.current = playSequence(events, (key) => {
      setLit(key);
      if (key === null) {
        stopRef.current = null;
        setPlaying(false);
      }
    });
  }, [playing, spec, stop]);

  /** Pressing one thing hears that thing, and nothing else. */
  const onPick = useCallback(
    (key: string | number, pitches: number[], partials?: number[]) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      stopRef.current?.();
      stopRef.current = null;
      setPlaying(false);
      for (const pitch of pitches) tone(pitch, { length: 0.75, partials });
      setLit(key);
      timerRef.current = setTimeout(
        () => setLit((now) => (now === key ? null : now)),
        pitches.length > 0 ? 760 : 420
      );
    },
    []
  );

  // Notation and the beat grid are drawn in engraver's ink, so they need the
  // page. The keyboard is a dark object in the world and the rest are
  // diagrams; they keep the surface they sit on.
  const onPage = spec.kind === "staff" || spec.kind === "rhythm";
  const caption = "caption" in spec ? spec.caption : undefined;
  const onPageAccent = inkAccent(accent);
  const shared: FigureInteraction = { lit, onPick };

  return (
    <figure
      className="mt-4 overflow-hidden rounded-xl border backdrop-blur"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 32%, transparent)`,
        background: "rgba(8,7,12,0.5)",
      }}
    >
      <div
        className="flex items-center justify-between gap-3 border-b px-3.5 py-2"
        style={{
          borderColor: `color-mix(in srgb, ${accent} 22%, transparent)`,
          background: `color-mix(in srgb, ${accent} 10%, transparent)`,
        }}
      >
        <figcaption
          className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          {caption ?? "On the page"}
        </figcaption>
        {sequence.length > 0 && (
          <button
            type="button"
            onClick={play}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-parchment-100/15 bg-abyss-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-parchment-300 transition hover:border-gold-500/50 hover:text-gold-200"
            aria-label={
              playing
                ? `Stop ${caption ?? "this example"}`
                : `Play ${caption ?? "this example"}`
            }
          >
            <Icon name={playing ? "pause" : "play"} size={11} />
            {playing ? "Stop" : "Hear it"}
          </button>
        )}
      </div>

      <div
        className={`flex justify-center overflow-x-auto px-3 py-4${onPage ? "" : " [&>*]:w-full"}`}
        style={
          onPage
            ? {
                // Notation belongs on paper. The warmth keeps it from glaring
                // out of a dark page the way plain white would.
                background: "linear-gradient(180deg, #f7f3ea 0%, #f2ece0 100%)",
              }
            : undefined
        }
      >
        {spec.kind === "staff" && <StaffFigure spec={spec} accent={onPageAccent} {...shared} />}
        {spec.kind === "keyboard" && <KeyboardFigure spec={spec} accent={accent} {...shared} />}
        {spec.kind === "rhythm" && <RhythmFigure spec={spec} accent={onPageAccent} {...shared} />}
        {spec.kind === "circle" && <CircleFigure spec={spec} accent={accent} {...shared} />}
        {spec.kind === "form" && <FormFigure spec={spec} accent={accent} />}
        {spec.kind === "scoreOrder" && <ScoreOrderFigure spec={spec} accent={accent} />}
        {spec.kind === "wave" && <WaveFigure spec={spec} accent={accent} {...shared} />}
        {spec.kind === "spectrum" && <SpectrumFigure spec={spec} accent={accent} {...shared} />}
      </div>

      {(sequence.length > 0 || spec.kind === "spectrum" || spec.kind === "circle") && (
        <p className="border-t border-parchment-100/8 px-3.5 py-1.5 text-[10px] text-parchment-500">
          {spec.kind === "spectrum"
            ? "Press an overtone to switch it off, and hear the colour change."
            : "Press anything in the figure to hear just that."}
        </p>
      )}
    </figure>
  );
}
