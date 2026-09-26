import { Flag, Notehead, Rest } from "@/components/studio/glyphs";
import { INK, INK_SOFT } from "@/lib/studio/ink";
import type { RhythmFigure as Spec } from "@/lib/lesson-figure";
import { ticksPerBar, ticksPerBeat } from "@/lib/score";
import { noteValue } from "@/lib/studio/staff";

/**
 * Rhythm as length against the beat.
 *
 * A note value on a staff tells you what it is called; it does not show you
 * that a half note is two quarters, or where a dotted rhythm actually lands.
 * Here every duration is drawn to scale over a ruled beat grid, so "off the
 * beat" is something you can see rather than something you have to be told.
 */

const H = 44; // bar height
const TOP = 30; // room for the counts
const BOTTOM = 26; // room for labels
const PER_TICK = 15;

export function RhythmFigure({ spec, accent }: { spec: Spec; accent: string }) {
  const beat = ticksPerBeat(spec.meter);
  const barTicks = ticksPerBar(spec.meter);
  const total = spec.row.reduce((t, c) => t + c.duration, 0);
  const bars = Math.max(1, Math.ceil(total / barTicks));
  const span = bars * barTicks;

  const width = span * PER_TICK + 2;
  const height = TOP + H + BOTTOM;
  const x = (tick: number) => tick * PER_TICK + 1;

  const beats: number[] = [];
  for (let t = 0; t <= span; t += beat) beats.push(t);

  let cursor = 0;
  const cells = spec.row.map((cell) => {
    const placed = { ...cell, start: cursor };
    cursor += cell.duration;
    return placed;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: `${Math.min(width * 1.2, 660)}px` }}
      role="img"
      aria-label={spec.caption ?? "Rhythm diagram"}
    >
      {/* The beat grid, with the downbeat of each bar drawn strongest */}
      {beats.map((t) => {
        const isBar = t % barTicks === 0;
        return (
          <line
            key={t}
            x1={x(t)}
            x2={x(t)}
            y1={TOP - 4}
            y2={TOP + H + 4}
            stroke={isBar ? INK : INK_SOFT}
            strokeWidth={isBar ? 1.6 : 0.8}
            strokeDasharray={isBar ? undefined : "3 3"}
          />
        );
      })}

      {!spec.hideCounts &&
        beats.slice(0, -1).map((t) => (
          <text
            key={`c${t}`}
            x={x(t) + 4}
            y={TOP - 10}
            fontSize={11}
            fontWeight={600}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fill={t % barTicks === 0 ? INK : "rgba(22,22,22,0.5)"}
          >
            {Math.floor((t % barTicks) / beat) + 1}
          </text>
        ))}

      {cells.map((cell, i) => {
        const left = x(cell.start);
        const w = cell.duration * PER_TICK;
        const value = noteValue(cell.duration);
        const midY = TOP + H / 2;
        const colour = cell.accent ? accent : INK;
        return (
          <g key={i}>
            <rect
              x={left + 1.5}
              y={TOP}
              width={Math.max(3, w - 3)}
              height={H}
              rx={4}
              fill={
                cell.rest
                  ? "rgba(22,22,22,0.08)"
                  : cell.accent
                    ? `color-mix(in srgb, ${accent} 30%, #faf7f0)`
                    : "#faf7f0"
              }
              stroke={cell.rest ? INK_SOFT : colour}
              strokeWidth={cell.rest ? 0.8 : 1.2}
              strokeDasharray={cell.rest ? "4 3" : undefined}
            />
            {cell.rest ? (
              <Rest value={cell.duration} x={left + w / 2} midY={midY} sp={9} />
            ) : (
              <g>
                <Notehead hollow={value.hollow} x={left + 13} y={midY + 4} sp={9} color={colour} />
                {value.stemmed && (
                  <line
                    x1={left + 18.6}
                    x2={left + 18.6}
                    y1={midY + 4}
                    y2={midY - 16}
                    stroke={colour}
                    strokeWidth={1.2}
                  />
                )}
                {/* An eighth without its flag is a quarter, and this is the
                    one diagram where that distinction is the whole lesson. */}
                {value.flags > 0 && (
                  <Flag count={value.flags} x={left + 18.6} y={midY - 16} up sp={9} color={colour} />
                )}
                {Array.from({ length: value.dots }).map((_, d) => (
                  <circle
                    key={d}
                    cx={left + 22 + d * 4}
                    cy={midY + 4}
                    r={1.6}
                    fill={colour}
                  />
                ))}
              </g>
            )}
            {cell.label && (
              <text
                x={left + w / 2}
                y={TOP + H + 16}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fill={cell.accent ? accent : "rgba(22,22,22,0.66)"}
              >
                {cell.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
