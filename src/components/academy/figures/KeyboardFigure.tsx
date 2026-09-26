import { packLevels, type KeyboardFigure as Spec } from "@/lib/lesson-figure";

/**
 * The keyboard, with the notes under discussion marked.
 *
 * Almost every fundamental is easier to see here than anywhere else: why there
 * is no black key between E and F, what a half step actually is, why the same
 * key is D sharp and E flat. The staff says where a note is written; this says
 * where it lives.
 */

const WHITE_W = 26;
const WHITE_H = 116;
const BLACK_W = 16;
const BLACK_H = 72;
const BRACKET_STEP = 18;
const TOP_BASE = 14; // the keys themselves need no room above

/** Semitone offsets within an octave that are black keys. */
const BLACK = new Set([1, 3, 6, 8, 10]);
const LETTER = ["C", "C", "D", "D", "E", "F", "F", "G", "G", "A", "A", "B"];

function whiteCount(from: number, to: number): number {
  let n = 0;
  for (let p = from; p <= to; p++) if (!BLACK.has(((p % 12) + 12) % 12)) n++;
  return n;
}

/** Left edge of a key, measured in white keys from the start of the range. */
function xFor(pitch: number, from: number): number {
  const whites = whiteCount(from, pitch - 1);
  const pc = ((pitch % 12) + 12) % 12;
  if (!BLACK.has(pc)) return whites * WHITE_W;
  // A black key straddles the boundary between the two whites around it.
  return whites * WHITE_W - BLACK_W / 2;
}

const TONES: Record<string, string> = {
  root: "#c98f4b",
  target: "#7c6cf0",
  step: "#3fb0a6",
  muted: "rgba(22,22,22,0.22)",
};

export function KeyboardFigure({ spec, accent }: { spec: Spec; accent: string }) {
  const from = spec.from ?? 60;
  const to = spec.to ?? 72;
  const marks = spec.marks ?? [];
  const markFor = new Map(marks.map((m) => [m.pitch, m]));

  const whites: number[] = [];
  const blacks: number[] = [];
  for (let p = from; p <= to; p++) {
    (BLACK.has(((p % 12) + 12) % 12) ? blacks : whites).push(p);
  }

  const brackets = spec.brackets ?? [];
  // Pitch is the axis here, so the packer measures spans in semitones.
  const levels = packLevels(brackets.map((b) => ({ from: b.from, to: b.to })));
  const rows = levels.length > 0 ? Math.max(...levels) + 1 : 0;
  const TOP = TOP_BASE + rows * BRACKET_STEP;

  const width = whiteCount(from, to) * WHITE_W + 2;
  const height = TOP + WHITE_H + 30;

  const fill = (pitch: number, black: boolean) => {
    const mark = markFor.get(pitch);
    if (!mark) return black ? "#1b1a22" : "#faf7f0";
    if (mark.tone === "muted") return black ? "#26242e" : "#e8e3d8";
    return TONES[mark.tone ?? "root"] ?? accent;
  };

  const textOn = (pitch: number, black: boolean) => {
    const mark = markFor.get(pitch);
    if (mark && mark.tone !== "muted") return "#0c0a14";
    return black ? "#cdc7bb" : "rgba(22,22,22,0.62)";
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: `${Math.min(width * 1.6, 620)}px` }}
      role="img"
      aria-label={spec.caption ?? "Keyboard diagram"}
    >
      {whites.map((p) => {
        const x = xFor(p, from);
        const mark = markFor.get(p);
        return (
          <g key={p}>
            <rect
              x={x}
              y={TOP}
              width={WHITE_W}
              height={WHITE_H}
              rx={3}
              fill={fill(p, false)}
              stroke="rgba(22,22,22,0.45)"
              strokeWidth={1}
            />
            {mark?.label && (
              <text
                x={x + WHITE_W / 2}
                y={TOP + WHITE_H - 10}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fill={textOn(p, false)}
              >
                {mark.label}
              </text>
            )}
          </g>
        );
      })}

      {blacks.map((p) => {
        const x = xFor(p, from);
        const mark = markFor.get(p);
        return (
          <g key={p}>
            <rect
              x={x}
              y={TOP}
              width={BLACK_W}
              height={BLACK_H}
              rx={2}
              fill={fill(p, true)}
              stroke="rgba(22,22,22,0.6)"
              strokeWidth={1}
            />
            {mark?.label && (
              <text
                x={x + BLACK_W / 2}
                y={TOP + BLACK_H - 7}
                textAnchor="middle"
                fontSize={9}
                fontWeight={700}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fill={textOn(p, true)}
              >
                {mark.label}
              </text>
            )}
          </g>
        );
      })}

      {brackets.map((b, i) => {
        const pcA = ((b.from % 12) + 12) % 12;
        const pcB = ((b.to % 12) + 12) % 12;
        const x1 = xFor(b.from, from) + (BLACK.has(pcA) ? BLACK_W : WHITE_W) / 2;
        const x2 = xFor(b.to, from) + (BLACK.has(pcB) ? BLACK_W : WHITE_W) / 2;
        const y = TOP - 10 - levels[i] * BRACKET_STEP;
        return (
          <g key={i}>
            <path
              d={`M ${x1} ${y + 6} L ${x1} ${y} L ${x2} ${y} L ${x2} ${y + 6}`}
              fill="none"
              stroke={accent}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
            <text
              x={(x1 + x2) / 2}
              y={y - 5}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fill={accent}
            >
              {b.text}
            </text>
          </g>
        );
      })}

      {/* Letter names along the bottom, so the map is readable on its own */}
      {whites.map((p) => (
        <text
          key={`n${p}`}
          x={xFor(p, from) + WHITE_W / 2}
          y={TOP + WHITE_H + 16}
          textAnchor="middle"
          fontSize={10}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fill="rgba(240,235,225,0.45)"
        >
          {LETTER[((p % 12) + 12) % 12]}
        </text>
      ))}
    </svg>
  );
}
