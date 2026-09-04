"use client";

/**
 * The Studio's music glyphs, drawn as vectors rather than typed from a font.
 *
 * Every glyph is sized in staff spaces — the gap between two staff lines —
 * and takes that gap as `sp`. A glyph therefore scales exactly with the staff
 * it sits on, whether the page is a pocket score or a conductor's full score,
 * and no font has to be shipped or waited on.
 *
 * Coordinates are the page's millimetres; the canvas applies zoom above this.
 */

import type { Clef } from "@/lib/studio/instruments";
import type { Articulation, Dynamic, NoteheadStyle, Ornament } from "@/lib/studio/model";

export const INK = "#161616";
export const INK_SOFT = "rgba(22,22,22,0.62)";
export const INK_FAINT = "rgba(22,22,22,0.26)";
export const SELECT = "#1a73e8";
export const PLAYING = "#e8710a";

interface G {
  x: number;
  y: number;
  sp: number;
  color?: string;
}

/* -------------------------------------------------------------------------- */
/* Clefs                                                                       */
/* -------------------------------------------------------------------------- */

/** `y` is the staff's top line; each clef anchors itself to its own line. */
export function ClefGlyph({
  clef,
  x,
  y,
  sp,
  color = INK,
}: { clef: Clef } & G) {
  if (clef === "treble") {
    // The spiral wraps the G line: the second line up from the bottom.
    const gLine = y + sp * 3;
    return (
      <g
        transform={`translate(${x + sp * 1.4}, ${gLine}) scale(${sp / 9})`}
        fill="none"
        stroke={color}
        strokeLinecap="round"
      >
        <path
          d="M 0 9 C -14 2, -13 -14, -1 -21 C 10 -27, 20 -19, 19 -8 C 18 3, 8 10, -2 13 C -14 17, -21 9, -20 0"
          strokeWidth={3.2}
        />
        <path d="M -2 -34 C 8 -28, 10 -18, 6 -2 L -2 34" strokeWidth={3.2} />
        <circle cx="-4" cy="37" r="4.2" fill={color} stroke="none" />
      </g>
    );
  }
  if (clef === "bass") {
    // Two dots straddle the F line: the second line down from the top.
    const fLine = y + sp;
    return (
      <g transform={`translate(${x + sp * 1.2}, ${fLine})`} fill={color}>
        <path
          transform={`scale(${sp / 9})`}
          d="M -6 -9 C 2 -13, 12 -9, 12 0 C 12 12, 2 20, -8 25 C -6 20, 4 13, 4 2 C 4 -5, -1 -7, -6 -4 Z"
        />
        <circle cx={sp * 1.65} cy={-sp * 0.5} r={sp * 0.19} />
        <circle cx={sp * 1.65} cy={sp * 0.5} r={sp * 0.19} />
      </g>
    );
  }
  if (clef === "alto" || clef === "tenor") {
    // The C clef's waist marks middle C: the middle line for alto, the
    // fourth line up for tenor.
    const cLine = clef === "alto" ? y + sp * 2 : y + sp;
    return (
      <g transform={`translate(${x + sp * 0.6}, ${cLine})`} fill={color} stroke={color}>
        <rect x={0} y={-sp * 2} width={sp * 0.32} height={sp * 4} stroke="none" />
        <rect x={sp * 0.5} y={-sp * 2} width={sp * 0.18} height={sp * 4} stroke="none" />
        <path
          transform={`translate(${sp * 0.8}, 0) scale(${sp / 9})`}
          d="M 0 -18 C 9 -18, 12 -11, 9 -6 C 7 -2, 2 -3, 2 -7 C 5 -6, 6 -9, 4 -11 C 1 -14, -3 -10, -2 -3 L -2 0 C -3 7, 1 11, 4 8 C 6 6, 5 3, 2 4 C 2 0, 7 -1, 9 3 C 12 8, 9 15, 0 15 Z"
          stroke="none"
        />
        <path
          transform={`translate(${sp * 0.8}, 0) scale(${sp / 9}) scale(1,-1)`}
          d="M 0 -18 C 9 -18, 12 -11, 9 -6 C 7 -2, 2 -3, 2 -7 C 5 -6, 6 -9, 4 -11 C 1 -14, -3 -10, -2 -3 L -2 0 C -3 7, 1 11, 4 8 C 6 6, 5 3, 2 4 C 2 0, 7 -1, 9 3 C 12 8, 9 15, 0 15 Z"
          stroke="none"
        />
      </g>
    );
  }
  if (clef === "percussion") {
    const mid = y + sp * 2;
    return (
      <g fill={color}>
        <rect x={x + sp * 0.7} y={mid - sp * 1.1} width={sp * 0.42} height={sp * 2.2} />
        <rect x={x + sp * 1.7} y={mid - sp * 1.1} width={sp * 0.42} height={sp * 2.2} />
      </g>
    );
  }
  // Tablature: the letters TAB stacked down the staff.
  return (
    <text
      x={x + sp * 0.5}
      y={y + sp * 3.1}
      fill={color}
      fontSize={sp * 2.4}
      fontFamily="Georgia, serif"
      fontWeight={700}
      letterSpacing={sp * 0.05}
    >
      TAB
    </text>
  );
}

/** How much horizontal room a clef needs before the key signature. */
export function clefWidth(clef: Clef, sp: number): number {
  if (clef === "treble") return sp * 4.4;
  if (clef === "bass") return sp * 4;
  if (clef === "alto" || clef === "tenor") return sp * 4;
  if (clef === "percussion") return sp * 3;
  return sp * 5;
}

/* -------------------------------------------------------------------------- */
/* Accidentals                                                                 */
/* -------------------------------------------------------------------------- */

export function SharpGlyph({ x, y, sp, color = INK }: G) {
  const s = sp / 9;
  return (
    <g
      transform={`translate(${x}, ${y}) scale(${s})`}
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
    >
      <line x1="-2.6" y1="-7.5" x2="-2.6" y2="7.5" />
      <line x1="2.6" y1="-8.5" x2="2.6" y2="6.5" />
      <line x1="-5.5" y1="-2.8" x2="5.5" y2="-4.6" strokeWidth={2.5} />
      <line x1="-5.5" y1="3.4" x2="5.5" y2="1.6" strokeWidth={2.5} />
    </g>
  );
}

export function FlatGlyph({ x, y, sp, color = INK }: G) {
  const s = sp / 9;
  return (
    <g
      transform={`translate(${x}, ${y}) scale(${s})`}
      fill="none"
      stroke={color}
      strokeLinecap="round"
    >
      <line x1="-3" y1="-12" x2="-3" y2="5.5" strokeWidth={1.7} />
      <path d="M -3 -1 C 3 -5, 7 0, -3 5.5" strokeWidth={2} />
    </g>
  );
}

export function NaturalGlyph({ x, y, sp, color = INK }: G) {
  const s = sp / 9;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} stroke={color} strokeLinecap="round">
      <line x1="-2.6" y1="-9" x2="-2.6" y2="4.5" strokeWidth={1.7} />
      <line x1="2.6" y1="-4.5" x2="2.6" y2="9" strokeWidth={1.7} />
      <line x1="-2.6" y1="-3.2" x2="2.6" y2="-5" strokeWidth={2.3} />
      <line x1="-2.6" y1="4.6" x2="2.6" y2="2.8" strokeWidth={2.3} />
    </g>
  );
}

export function Accidental({
  kind,
  x,
  y,
  sp,
  color,
}: { kind: "sharp" | "flat" | "natural" } & G) {
  if (kind === "sharp") return <SharpGlyph x={x} y={y} sp={sp} color={color} />;
  if (kind === "flat") return <FlatGlyph x={x} y={y} sp={sp} color={color} />;
  return <NaturalGlyph x={x} y={y} sp={sp} color={color} />;
}

/* -------------------------------------------------------------------------- */
/* Noteheads, stems and flags                                                  */
/* -------------------------------------------------------------------------- */

export function Notehead({
  style = "normal",
  hollow,
  x,
  y,
  sp,
  color = INK,
}: { style?: NoteheadStyle; hollow: boolean } & G) {
  const rx = sp * 0.62;
  const ry = sp * 0.47;
  const common = {
    fill: hollow ? "none" : color,
    stroke: color,
    strokeWidth: hollow ? sp * 0.16 : 0,
  };
  if (style === "cross") {
    return (
      <g stroke={color} strokeWidth={sp * 0.2} strokeLinecap="round">
        <line x1={x - rx} y1={y - ry} x2={x + rx} y2={y + ry} />
        <line x1={x - rx} y1={y + ry} x2={x + rx} y2={y - ry} />
      </g>
    );
  }
  if (style === "diamond") {
    return (
      <path
        d={`M ${x} ${y - ry * 1.2} L ${x + rx} ${y} L ${x} ${y + ry * 1.2} L ${x - rx} ${y} Z`}
        {...common}
      />
    );
  }
  if (style === "triangle") {
    return (
      <path
        d={`M ${x} ${y - ry * 1.3} L ${x + rx} ${y + ry} L ${x - rx} ${y + ry} Z`}
        {...common}
      />
    );
  }
  if (style === "slash") {
    return (
      <path
        d={`M ${x - rx} ${y + ry * 1.4} L ${x + rx * 0.4} ${y - ry * 1.4} L ${x + rx} ${y - ry * 1.4} L ${x - rx * 0.4} ${y + ry * 1.4} Z`}
        fill={color}
      />
    );
  }
  // The oval is tilted the way a broad-nibbed pen leaves it.
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(-20 ${x} ${y})`} {...common} />;
}

/** One flag per beam level, curling off the end of the stem. */
export function Flag({
  count,
  x,
  y,
  up,
  sp,
  color = INK,
}: { count: number; up: boolean } & G) {
  if (count <= 0) return null;
  const dir = up ? 1 : -1;
  return (
    <g fill={color}>
      {Array.from({ length: count }).map((_, i) => {
        const oy = y + i * sp * 0.9 * dir;
        return (
          <path
            key={i}
            d={
              up
                ? `M ${x} ${oy} C ${x + sp * 1.1} ${oy + sp * 0.6}, ${x + sp * 1.2} ${oy + sp * 1.5}, ${x + sp * 0.5} ${oy + sp * 2.3} C ${x + sp * 1.3} ${oy + sp * 1.3}, ${x + sp * 0.7} ${oy + sp * 0.7}, ${x} ${oy + sp * 0.75} Z`
                : `M ${x} ${oy} C ${x + sp * 1.1} ${oy - sp * 0.6}, ${x + sp * 1.2} ${oy - sp * 1.5}, ${x + sp * 0.5} ${oy - sp * 2.3} C ${x + sp * 1.3} ${oy - sp * 1.3}, ${x + sp * 0.7} ${oy - sp * 0.7}, ${x} ${oy - sp * 0.75} Z`
            }
          />
        );
      })}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Rests                                                                       */
/* -------------------------------------------------------------------------- */

/** `midY` is the staff's middle line, where rests are centred. */
export function Rest({
  value,
  x,
  midY,
  sp,
  color = INK,
}: {
  /** Ticks: 16 whole, 8 half, 4 quarter, 2 eighth, 1 sixteenth. */
  value: number;
  x: number;
  midY: number;
  sp: number;
  color?: string;
}) {
  if (value >= 16) {
    // The whole rest hangs beneath the fourth line.
    return <rect x={x - sp * 0.62} y={midY - sp} width={sp * 1.24} height={sp * 0.46} fill={color} />;
  }
  if (value >= 8) {
    // The half rest sits on the middle line.
    return <rect x={x - sp * 0.62} y={midY - sp * 0.46} width={sp * 1.24} height={sp * 0.46} fill={color} />;
  }
  if (value >= 4) {
    const s = sp / 9;
    return (
      <path
        transform={`translate(${x}, ${midY}) scale(${s})`}
        d="M -2 -14 L 5 -6 C 1 -2, 1 2, 5 6 C -1 4, -3 7, 0 13 C -7 8, -6 3, -2 0 C -6 -4, -6 -9, -2 -14 Z"
        fill={color}
      />
    );
  }
  const s = sp / 9;
  const hooks = value >= 2 ? 1 : 2;
  return (
    <g
      transform={`translate(${x}, ${midY}) scale(${s})`}
      stroke={color}
      fill={color}
      strokeLinecap="round"
    >
      <line x1={3} y1={-8} x2={-3} y2={12} strokeWidth={1.7} />
      {Array.from({ length: hooks }).map((_, i) => (
        <g key={i}>
          <path
            d={`M ${3 - i * 2} ${-8 + i * 7} C ${-2 - i * 2} ${-4 + i * 7}, ${-5 - i * 2} ${-6 + i * 7}, ${-6 - i * 2} ${-9 + i * 7}`}
            fill="none"
            strokeWidth={1.5}
          />
          <circle cx={-6 - i * 2} cy={-9 + i * 7} r={2.1} stroke="none" />
        </g>
      ))}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Articulations and ornaments                                                 */
/* -------------------------------------------------------------------------- */

export function ArticulationGlyph({
  kind,
  x,
  y,
  sp,
  above,
  color = INK,
}: { kind: Articulation; above: boolean } & G) {
  const dir = above ? -1 : 1;
  switch (kind) {
    case "staccato":
      return <circle cx={x} cy={y} r={sp * 0.17} fill={color} />;
    case "staccatissimo":
      return (
        <path
          d={`M ${x} ${y + sp * 0.7 * dir} L ${x - sp * 0.22} ${y} L ${x + sp * 0.22} ${y} Z`}
          fill={color}
        />
      );
    case "tenuto":
      return (
        <rect x={x - sp * 0.45} y={y - sp * 0.07} width={sp * 0.9} height={sp * 0.14} fill={color} />
      );
    case "accent":
      return (
        <path
          d={`M ${x - sp * 0.5} ${y - sp * 0.35} L ${x + sp * 0.5} ${y} L ${x - sp * 0.5} ${y + sp * 0.35}`}
          fill="none"
          stroke={color}
          strokeWidth={sp * 0.15}
          strokeLinecap="round"
        />
      );
    case "marcato":
      return (
        <path
          d={`M ${x - sp * 0.4} ${y + sp * 0.55 * dir} L ${x} ${y} L ${x + sp * 0.4} ${y + sp * 0.55 * dir}`}
          fill="none"
          stroke={color}
          strokeWidth={sp * 0.16}
          strokeLinecap="round"
        />
      );
    case "portato":
      return (
        <g fill={color}>
          <circle cx={x} cy={y} r={sp * 0.15} />
          <rect
            x={x - sp * 0.45}
            y={y + sp * 0.35 * dir - sp * 0.06}
            width={sp * 0.9}
            height={sp * 0.12}
          />
        </g>
      );
  }
}

export function OrnamentGlyph({
  kind,
  x,
  y,
  sp,
  color = INK,
}: { kind: Ornament } & G) {
  const stroke = { fill: "none", stroke: color, strokeWidth: sp * 0.14, strokeLinecap: "round" as const };

  /** The wavy line a trill or a slide rides on. */
  const wave = (from: number, to: number, at: number) => {
    const step = sp * 0.5;
    let d = `M ${from} ${at}`;
    for (let x0 = from; x0 < to; x0 += step) {
      d += ` q ${step / 2} ${-sp * 0.35}, ${step} 0`;
    }
    return d;
  };

  switch (kind) {
    case "trill":
    case "trill-sharp":
    case "trill-flat":
      return (
        <g>
          <text
            x={x}
            y={y}
            fill={color}
            fontSize={sp * 1.7}
            fontFamily="Georgia, serif"
            fontStyle="italic"
            fontWeight={700}
            textAnchor="middle"
          >
            tr
          </text>
          {kind !== "trill" && (
            <text
              x={x + sp * 0.95}
              y={y - sp * 1.05}
              fill={color}
              fontSize={sp * 1.15}
              textAnchor="middle"
            >
              {kind === "trill-sharp" ? "\u266F" : "\u266D"}
            </text>
          )}
        </g>
      );

    case "mordent":
    case "inverted-mordent":
      return (
        <g {...stroke}>
          <path
            d={`M ${x - sp} ${y} l ${sp * 0.5} ${-sp * 0.4} l ${sp * 0.5} ${sp * 0.4} l ${sp * 0.5} ${-sp * 0.4} l ${sp * 0.5} ${sp * 0.4}`}
          />
          {/* The lower mordent carries a stroke through it; the upper does not. */}
          {kind === "mordent" && <line x1={x} y1={y - sp * 0.7} x2={x} y2={y + sp * 0.55} />}
        </g>
      );

    case "turn":
    case "inverted-turn":
      return (
        <g transform={kind === "inverted-turn" ? `rotate(180 ${x} ${y})` : undefined}>
          <path
            d={`M ${x - sp} ${y + sp * 0.2} c ${sp * 0.15} ${-sp * 0.5}, ${sp * 0.7} ${-sp * 0.5}, ${sp * 0.85} 0 c ${sp * 0.15} ${sp * 0.5}, ${sp * 0.7} ${sp * 0.5}, ${sp * 0.85} 0`}
            {...stroke}
          />
        </g>
      );

    case "tremolo-1":
    case "tremolo-2":
    case "tremolo-3": {
      const bars = kind === "tremolo-1" ? 1 : kind === "tremolo-2" ? 2 : 3;
      return (
        <g fill={color}>
          {Array.from({ length: bars }).map((_, i) => (
            <rect
              key={i}
              x={x - sp * 0.5}
              y={y + i * sp * 0.42}
              width={sp}
              height={sp * 0.22}
              transform={`skewY(-22)`}
            />
          ))}
        </g>
      );
    }

    case "arpeggio":
    case "arpeggio-up":
    case "arpeggio-down":
      return (
        <g>
          <path
            d={`M ${x} ${y} q ${sp * 0.4} ${sp * 0.4}, 0 ${sp * 0.8} q ${-sp * 0.4} ${sp * 0.4}, 0 ${sp * 0.8}`}
            {...stroke}
          />
          {/* An arrowhead names the direction the chord is rolled. */}
          {kind === "arpeggio-up" && (
            <path d={`M ${x - sp * 0.28} ${y + sp * 0.3} L ${x} ${y - sp * 0.2} L ${x + sp * 0.28} ${y + sp * 0.3} Z`} fill={color} />
          )}
          {kind === "arpeggio-down" && (
            <path d={`M ${x - sp * 0.28} ${y + sp * 1.3} L ${x} ${y + sp * 1.8} L ${x + sp * 0.28} ${y + sp * 1.3} Z`} fill={color} />
          )}
        </g>
      );

    case "glissando":
      return <path d={wave(x, x + sp * 3, y)} {...stroke} />;

    case "portamento":
      return <line x1={x} y1={y + sp * 0.5} x2={x + sp * 3} y2={y - sp * 0.5} {...stroke} />;

    case "bend":
      return (
        <path d={`M ${x} ${y + sp} q ${sp * 1.2} 0, ${sp * 1.5} ${-sp * 1.4}`} {...stroke} />
      );

    case "fall":
      return (
        <path d={`M ${x} ${y} q ${sp * 0.9} ${sp * 0.2}, ${sp * 1.4} ${sp * 1.3}`} {...stroke} />
      );

    case "doit":
      return (
        <path d={`M ${x} ${y + sp} q ${sp * 0.9} ${-sp * 0.2}, ${sp * 1.4} ${-sp * 1.3}`} {...stroke} />
      );

    case "grace":
    case "appoggiatura":
      // Both draw as a small note beside the main one, not as a mark above it.
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Dynamics and text                                                           */
/* -------------------------------------------------------------------------- */

export function DynamicGlyph({
  value,
  x,
  y,
  sp,
  color = INK,
}: { value: Dynamic } & G) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontSize={sp * 2.1}
      fontFamily="Georgia, 'Times New Roman', serif"
      fontStyle="italic"
      fontWeight={700}
      letterSpacing={-sp * 0.08}
    >
      {value}
    </text>
  );
}

export function HairpinGlyph({
  kind,
  x1,
  x2,
  y,
  sp,
  color = INK_SOFT,
}: {
  kind: "crescendo" | "diminuendo";
  x1: number;
  x2: number;
  y: number;
  sp: number;
  color?: string;
}) {
  const h = sp * 0.55;
  const d =
    kind === "crescendo"
      ? `M ${x1} ${y} L ${x2} ${y - h} M ${x1} ${y} L ${x2} ${y + h}`
      : `M ${x1} ${y - h} L ${x2} ${y} M ${x1} ${y + h} L ${x2} ${y}`;
  return <path d={d} stroke={color} strokeWidth={sp * 0.12} fill="none" strokeLinecap="round" />;
}

/* -------------------------------------------------------------------------- */
/* Barlines and time signatures                                                */
/* -------------------------------------------------------------------------- */

export function TimeSignature({
  beats,
  unit,
  x,
  y,
  sp,
  color = INK,
}: { beats: number; unit: number } & G) {
  const common = {
    fill: color,
    fontSize: sp * 2.5,
    fontFamily: "Georgia, serif",
    fontWeight: 700,
    textAnchor: "middle" as const,
  };
  return (
    <g>
      <text x={x} y={y + sp * 1.75} {...common}>
        {beats}
      </text>
      <text x={x} y={y + sp * 3.85} {...common}>
        {unit}
      </text>
    </g>
  );
}

export function Barline({
  style = "single",
  x,
  top,
  bottom,
  sp,
  color = INK,
}: {
  style?: string;
  x: number;
  top: number;
  bottom: number;
  sp: number;
  color?: string;
}) {
  const thin = sp * 0.13;
  const thick = sp * 0.4;
  const dot = (cx: number) => (
    <>
      <circle cx={cx} cy={(top + bottom) / 2 - sp * 0.5} r={sp * 0.2} fill={color} />
      <circle cx={cx} cy={(top + bottom) / 2 + sp * 0.5} r={sp * 0.2} fill={color} />
    </>
  );
  switch (style) {
    case "double":
      return (
        <g fill={color}>
          <rect x={x - sp * 0.5} y={top} width={thin} height={bottom - top} />
          <rect x={x} y={top} width={thin} height={bottom - top} />
        </g>
      );
    case "final":
      return (
        <g fill={color}>
          <rect x={x - sp * 0.65} y={top} width={thin} height={bottom - top} />
          <rect x={x - sp * 0.4} y={top} width={thick} height={bottom - top} />
        </g>
      );
    case "repeat-start":
      return (
        <g fill={color}>
          <rect x={x} y={top} width={thick} height={bottom - top} />
          <rect x={x + sp * 0.55} y={top} width={thin} height={bottom - top} />
          {dot(x + sp * 1.05)}
        </g>
      );
    case "repeat-end":
      return (
        <g fill={color}>
          {dot(x - sp * 1.05)}
          <rect x={x - sp * 0.68} y={top} width={thin} height={bottom - top} />
          <rect x={x - sp * 0.4} y={top} width={thick} height={bottom - top} />
        </g>
      );
    case "repeat-both":
      return (
        <g fill={color}>
          {dot(x - sp * 1.05)}
          <rect x={x - sp * 0.68} y={top} width={thin} height={bottom - top} />
          <rect x={x - sp * 0.3} y={top} width={thick} height={bottom - top} />
          <rect x={x + sp * 0.35} y={top} width={thin} height={bottom - top} />
          {dot(x + sp * 0.85)}
        </g>
      );
    case "dashed":
      return (
        <line
          x1={x}
          y1={top}
          x2={x}
          y2={bottom}
          stroke={color}
          strokeWidth={thin}
          strokeDasharray={`${sp * 0.5} ${sp * 0.4}`}
        />
      );
    default:
      return <rect x={x} y={top} width={thin} height={bottom - top} fill={color} />;
  }
}

/** The bracket that joins a family of instruments down the left edge. */
export function Bracket({
  x,
  top,
  bottom,
  sp,
  color = INK,
}: { x: number; top: number; bottom: number; sp: number; color?: string }) {
  return (
    <g fill={color}>
      <rect x={x} y={top} width={sp * 0.34} height={bottom - top} />
      <path
        d={`M ${x + sp * 0.34} ${top} c ${sp * 0.9} ${-sp * 0.1}, ${sp * 1.1} ${-sp * 0.5}, ${sp * 1.2} ${-sp * 0.9} c ${-sp * 0.8} ${sp * 0.2}, ${-sp * 1.1} ${sp * 0.4}, ${-sp * 1.54} ${sp * 0.5} Z`}
      />
      <path
        d={`M ${x + sp * 0.34} ${bottom} c ${sp * 0.9} ${sp * 0.1}, ${sp * 1.1} ${sp * 0.5}, ${sp * 1.2} ${sp * 0.9} c ${-sp * 0.8} ${-sp * 0.2}, ${-sp * 1.1} ${-sp * 0.4}, ${-sp * 1.54} ${-sp * 0.5} Z`}
      />
    </g>
  );
}

/** The brace that joins the two staves of a keyboard instrument. */
export function Brace({
  x,
  top,
  bottom,
  sp,
  color = INK,
}: { x: number; top: number; bottom: number; sp: number; color?: string }) {
  const mid = (top + bottom) / 2;
  const w = sp * 1.1;
  return (
    <path
      d={`M ${x + w} ${top}
          C ${x + w * 0.1} ${top + (mid - top) * 0.28}, ${x + w * 0.85} ${mid - (mid - top) * 0.28}, ${x} ${mid}
          C ${x + w * 0.85} ${mid + (bottom - mid) * 0.28}, ${x + w * 0.1} ${bottom - (bottom - mid) * 0.28}, ${x + w} ${bottom}`}
      fill="none"
      stroke={color}
      strokeWidth={sp * 0.28}
      strokeLinecap="round"
    />
  );
}
