"use client";

import { DRILLS } from "@/lib/drills";

/**
 * A small staff for the reading drills: five lines, a clef, and either one
 * notehead or a key signature. Drawn here rather than reusing the engraver,
 * which lays out whole systems and would have to be talked down to a single
 * glyph.
 *
 * Geometry: one staff step is half a line gap, step 0 is the bottom line.
 */
const GAP = 14;
const TOP = 26;
const LEFT = 56;
const WIDTH = 260;

function y(step: number) {
  // Step 0 sits on the bottom line, which is four gaps below the top line.
  return TOP + 4 * GAP - (step * GAP) / 2;
}

const SHARP_STEPS_TREBLE = [8, 5, 9, 6, 3, 7, 4];
const FLAT_STEPS_TREBLE = [4, 7, 3, 6, 2, 5, 1];

export function StaffFigure({
  clef,
  step,
  signature,
  accent,
}: {
  clef: "treble" | "bass";
  /** A notehead at this step, when given. */
  step?: number;
  /** Sharps (positive) or flats (negative) at the clef. */
  signature?: number;
  accent: string;
}) {
  const lines = [0, 1, 2, 3, 4].map((i) => TOP + i * GAP);
  // A bass signature sits two steps lower than the treble one.
  const shift = clef === "bass" ? -2 : 0;
  const count = signature ? Math.abs(signature) : 0;
  const sharp = (signature ?? 0) > 0;
  const steps = (sharp ? SHARP_STEPS_TREBLE : FLAT_STEPS_TREBLE)
    .slice(0, count)
    .map((s) => s + shift);

  // Ledger lines for a notehead sitting off the staff.
  const ledgers: number[] = [];
  if (step !== undefined) {
    for (let s = -2; s >= step; s -= 2) ledgers.push(s);
    for (let s = 10; s <= step; s += 2) ledgers.push(s);
  }

  const noteX = LEFT + 40 + (count ? count * 13 + 14 : 0);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} 108`}
      className="mx-auto h-auto w-full max-w-[340px]"
      role="img"
      aria-label={
        step !== undefined
          ? `A note on the ${clef} staff`
          : `A key signature of ${count} ${sharp ? "sharps" : "flats"}`
      }
    >
      {lines.map((ly) => (
        <line key={ly} x1={18} x2={WIDTH - 14} y1={ly} y2={ly} stroke="currentColor" strokeOpacity={0.45} strokeWidth={1.4} />
      ))}

      <text
        x={22}
        y={clef === "treble" ? TOP + 4 * GAP + 4 : TOP + 3 * GAP + 2}
        fontSize={clef === "treble" ? 70 : 56}
        fill={accent}
        style={{ fontFamily: "serif" }}
      >
        {clef === "treble" ? "\u{1D11E}" : "\u{1D122}"}
      </text>

      {steps.map((s, i) => (
        <text
          key={`${s}-${i}`}
          x={LEFT + 34 + i * 13}
          y={y(s) + 6}
          fontSize={26}
          fill="currentColor"
          style={{ fontFamily: "serif" }}
        >
          {sharp ? "♯" : "♭"}
        </text>
      ))}

      {step !== undefined && (
        <>
          {ledgers.map((s) => (
            <line
              key={s}
              x1={noteX - 15}
              x2={noteX + 15}
              y1={y(s)}
              y2={y(s)}
              stroke="currentColor"
              strokeOpacity={0.7}
              strokeWidth={1.4}
            />
          ))}
          <ellipse cx={noteX} cy={y(step)} rx={8.5} ry={6.2} fill={accent} transform={`rotate(-18 ${noteX} ${y(step)})`} />
        </>
      )}
    </svg>
  );
}

export const DRILL_LIST = DRILLS;
