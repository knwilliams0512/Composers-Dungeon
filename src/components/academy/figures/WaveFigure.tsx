"use client";

import { useState } from "react";
import type { FigureInteraction } from "./LessonFigure";
import type { SpectrumFigure as SpectrumSpec, WaveFigure as WaveSpec } from "@/lib/lesson-figure";

/**
 * Sound itself, before it is music.
 *
 * Two lessons make claims a staff cannot illustrate, because they are about
 * the air rather than the notation: that doubling a frequency produces the
 * same note higher, and that a piano and a violin playing the same pitch are
 * told apart by their overtones. Both are facts with a shape. Drawing the
 * shape is the difference between a reader taking it on trust and a reader
 * seeing why it has to be true.
 */

/* ---- Waves ---------------------------------------------------------------- */

const W_WIDTH = 460;
const ROW_H = 54;
const PAD_L = 54;

const TRACE_COLOURS = ["#c98f4b", "#7c6cf0", "#3fb0a6"];

export function WaveFigure({
  spec,
  accent,
  lit,
  onPick,
}: { spec: WaveSpec; accent: string } & FigureInteraction) {
  const cycles = spec.cycles ?? 2;
  const height = spec.traces.length * ROW_H + 26;
  const plotW = W_WIDTH - PAD_L - 12;

  /** One cycle of a sine, sampled finely enough that the curve reads as one. */
  const path = (multiple: number, midY: number) => {
    const steps = 240;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const x = PAD_L + (i / steps) * plotW;
      const phase = (i / steps) * cycles * multiple * Math.PI * 2;
      const y = midY - Math.sin(phase) * (ROW_H / 2 - 9);
      d += `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
    }
    return d;
  };

  return (
    <svg
      viewBox={`0 0 ${W_WIDTH} ${height}`}
      width="100%"
      style={{ maxWidth: "520px" }}
      role="img"
      aria-label={spec.caption ?? "Waveform diagram"}
    >
      {spec.traces.map((trace, i) => {
        const midY = 16 + i * ROW_H + ROW_H / 2;
        const colour = trace.accent ? accent : TRACE_COLOURS[i % TRACE_COLOURS.length];
        const pitch = 57 + Math.round(12 * Math.log2(trace.multiple));
        return (
          <g
            key={i}
            onClick={onPick ? () => onPick(i, [pitch]) : undefined}
            style={onPick ? { cursor: "pointer" } : undefined}
          >
            {onPick && <title>{trace.label ?? `${trace.multiple}×`}</title>}
            <rect
              x={PAD_L}
              y={midY - ROW_H / 2}
              width={W_WIDTH - 12 - PAD_L}
              height={ROW_H}
              fill={lit === i ? accent : "transparent"}
              opacity={lit === i ? 0.16 : 0}
              rx={4}
            />
            <line
              x1={PAD_L}
              x2={W_WIDTH - 12}
              y1={midY}
              y2={midY}
              stroke="rgba(240,235,225,0.14)"
              strokeWidth={1}
            />
            <path d={path(trace.multiple, midY)} fill="none" stroke={colour} strokeWidth={2} />
            {trace.label && (
              <text
                x={PAD_L - 10}
                y={midY + 4}
                textAnchor="end"
                fontSize={11}
                fontWeight={600}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fill={colour}
              >
                {trace.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Where the cycles meet. Every trace crosses zero together here, which
          is the thing the picture exists to show. */}
      {Array.from({ length: cycles + 1 }).map((_, i) => (
        <line
          key={`t${i}`}
          x1={PAD_L + (i / cycles) * plotW}
          x2={PAD_L + (i / cycles) * plotW}
          y1={10}
          y2={height - 14}
          stroke="rgba(240,235,225,0.2)"
          strokeWidth={1}
          strokeDasharray="3 4"
        />
      ))}
    </svg>
  );
}

/* ---- Spectrum ------------------------------------------------------------- */

const S_WIDTH = 460;
const S_HEIGHT = 186;
const S_BASE = 128;

export function SpectrumFigure({
  spec,
  accent,
  onPick,
}: { spec: SpectrumSpec; accent: string } & FigureInteraction) {
  // Switching a partial off and hearing what goes with it is the only way to
  // make "timbre is the recipe of overtones" land. Nothing else in the lesson
  // can demonstrate it, because it is a claim about hearing.
  const [off, setOff] = useState<Set<number>>(() => new Set());
  const recipe = (partials: { harmonic: number; level: number }[]) => {
    const highestHere = Math.max(...partials.map((p) => p.harmonic));
    const levels: number[] = [];
    for (let h = 1; h <= highestHere; h++) {
      const found = partials.find((p) => p.harmonic === h);
      levels.push(found && !off.has(h) ? found.level : 0);
    }
    return levels;
  };
  const toggle = (harmonic: number, partials: { harmonic: number; level: number }[]) => {
    const next = new Set(off);
    if (next.has(harmonic)) next.delete(harmonic);
    else next.add(harmonic);
    setOff(next);
    if (!onPick) return;
    const highestHere = Math.max(...partials.map((p) => p.harmonic));
    const levels: number[] = [];
    for (let h = 1; h <= highestHere; h++) {
      const found = partials.find((p) => p.harmonic === h);
      levels.push(found && !next.has(h) ? found.level : 0);
    }
    if (levels.some((l) => l > 0)) onPick(`h${harmonic}`, [69], levels);
  };
  const sets = [
    { name: spec.name ?? "", partials: spec.partials, colour: accent },
    ...(spec.compare
      ? [{ name: spec.compare.name, partials: spec.compare.partials, colour: "#7c6cf0" }]
      : []),
  ];
  const highest = Math.max(
    ...sets.flatMap((set) => set.partials.map((p) => p.harmonic))
  );
  const slotW = (S_WIDTH - 50) / highest;
  const barW = sets.length > 1 ? Math.min(9, slotW / 2.6) : Math.min(16, slotW * 0.55);

  return (
    <svg
      viewBox={`0 0 ${S_WIDTH} ${S_HEIGHT}`}
      width="100%"
      style={{ maxWidth: "520px" }}
      role="img"
      aria-label={spec.caption ?? "Overtone spectrum"}
    >
      {/* The axis stops where the bars do; running it to the frame edge
          invented three harmonics that are not in the figure. */}
      <line
        x1={34}
        x2={34 + highest * slotW + 4}
        y1={S_BASE}
        y2={S_BASE}
        stroke="rgba(240,235,225,0.3)"
        strokeWidth={1}
      />
      <text
        x={34}
        y={S_BASE + 30}
        fontSize={10}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="rgba(240,235,225,0.45)"
      >
        {spec.fundamental ? `1 = ${spec.fundamental}` : "harmonic"}
      </text>

      {sets.map((set, si) =>
        set.partials.map((partial) => {
          const centre = 34 + (partial.harmonic - 0.5) * slotW;
          const x =
            sets.length > 1 ? centre - barW - 1 + si * (barW + 2) : centre - barW / 2;
          const h = Math.max(2, partial.level * (S_BASE - 22));
          const silent = off.has(partial.harmonic);
          return (
            <g
              key={`${si}-${partial.harmonic}`}
              onClick={onPick ? () => toggle(partial.harmonic, set.partials) : undefined}
              style={onPick ? { cursor: "pointer" } : undefined}
            >
              {onPick && (
                <title>{`Harmonic ${partial.harmonic}${silent ? " — off" : ""}`}</title>
              )}
              <rect
                x={x - 2}
                y={18}
                width={barW + 4}
                height={S_BASE - 18}
                fill="transparent"
              />
              <rect
                x={x}
                y={S_BASE - h}
                width={barW}
                height={h}
                rx={1.5}
                fill={silent ? "rgba(240,235,225,0.18)" : set.colour}
                opacity={si === 0 ? 0.95 : 0.75}
              />
              {si === 0 && (
                <text
                  x={centre}
                  y={S_BASE + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fill="rgba(240,235,225,0.5)"
                >
                  {partial.harmonic}
                </text>
              )}
            </g>
          );
        })
      )}

      {onPick && (
        <g
          onClick={() => onPick("all", [69], recipe(sets[0].partials))}
          style={{ cursor: "pointer" }}
        >
          <title>Hear this recipe</title>
          <rect
            x={S_WIDTH - 112}
            y={S_HEIGHT - 26}
            width={96}
            height={20}
            rx={10}
            fill="rgba(240,235,225,0.08)"
          />
          <text
            x={S_WIDTH - 64}
            y={S_HEIGHT - 12}
            textAnchor="middle"
            fontSize={10}
            letterSpacing={1.2}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fill="rgba(240,235,225,0.75)"
          >
            HEAR IT
          </text>
        </g>
      )}

      {sets.length > 1 &&
        sets.map((set, i) => (
          <g key={`k${i}`}>
            <rect x={S_WIDTH - 118} y={10 + i * 16} width={10} height={10} rx={2} fill={set.colour} />
            <text
              x={S_WIDTH - 104}
              y={19 + i * 16}
              fontSize={11}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fill="rgba(240,235,225,0.72)"
            >
              {set.name}
            </text>
          </g>
        ))}
    </svg>
  );
}
