import {
  Accidental,
  Barline,
  ClefGlyph,
  Flag,
  Notehead,
  Rest,
  TimeSignature,
} from "@/components/studio/glyphs";
import { clefWidth, INK, INK_SOFT } from "@/lib/studio/ink";
import { packLevels, placeNotes, type StaffFigure as Spec } from "@/lib/lesson-figure";
import { keySignatureCount, ticksPerBar } from "@/lib/score";
import { accidentalFor, noteValue, signatureSteps, stepForPitch } from "@/lib/studio/staff";

/**
 * A lesson's music, engraved.
 *
 * Every rule here — where a pitch sits under this clef, which accidental the
 * signature already covers, what a duration is written as — comes from the
 * same functions the Studio's engraver uses, so a figure cannot quietly
 * disagree with the editor the lesson is teaching someone to use. What this
 * adds is the apparatus a diagram needs and a score does not: a label under a
 * note, a bracket over a span, a chord name under a bar.
 */

const SP = 9; // staff space
const STAFF_H = SP * 4;
const MIN_COLUMN = SP * 3.4;
/** Ledger lines and stems, before any brackets are stacked on top. */
const PAD_TOP_BASE = SP * 4.5;
const PAD_BOTTOM_BASE = SP * 4.2;
const BRACKET_STEP = SP * 2.4;
const LABEL_STEP = SP * 1.5;


/** Staff steps are counted from the bottom line, so the top line is 8. */
function yForStep(step: number, top: number): number {
  return top + STAFF_H - (step * SP) / 2;
}

export function StaffFigure({ spec, accent }: { spec: Spec; accent: string }) {
  const key = spec.key ?? "C";
  const mode = spec.mode ?? "major";
  const clef = spec.clef ?? "treble";
  const meter = spec.meter ?? { beats: 4, unit: 4 };
  const notes = placeNotes(spec.notes);

  const brackets = spec.brackets ?? [];
  const levels = packLevels(brackets);
  const bracketRows = levels.length > 0 ? Math.max(...levels) + 1 : 0;
  // A chord writes one label per note, so the room under the staff depends on
  // how many the busiest column carries.
  const labelRows = Math.max(
    0,
    ...notes.map((n, i) =>
      n.label ? notes.filter((o) => o.start === n.start).indexOf(notes[i]) + 1 : 0
    )
  );

  const top = PAD_TOP_BASE + bracketRows * BRACKET_STEP;
  const midY = top + STAFF_H / 2;

  /* ---- Head matter: clef, signature, metre ------------------------------- */
  let x = SP * 1.2;
  const clefX = x;
  x += clefWidth(clef, SP);

  const sigSteps = signatureSteps(clef, key, mode);
  // The count carries the sign: positive is sharps, negative flats. Asking the
  // key name which it is would get F major and every minor key wrong.
  const accidentalKind = keySignatureCount(key, mode) < 0 ? "flat" : "sharp";
  const sigX = x;
  x += sigSteps.length * SP * 1.15;
  if (sigSteps.length > 0) x += SP * 0.6;

  const meterX = x;
  if (!spec.hideMeter) x += SP * 2.6;

  /* ---- Columns ------------------------------------------------------------ */
  // One x per onset, advanced by how long that onset lasts, so a half note is
  // visibly twice the room of a quarter without the page growing unreadable.
  const onsets = Array.from(new Set(notes.map((n) => n.start))).sort((a, b) => a - b);
  const xByOnset = new Map<number, number>();
  const perTick = SP * 1.15;
  let cursor = x + SP * 0.8;
  onsets.forEach((onset, i) => {
    xByOnset.set(onset, cursor);
    const here = notes.filter((n) => n.start === onset);
    const span =
      i + 1 < onsets.length
        ? onsets[i + 1] - onset
        : Math.max(...here.map((n) => n.duration));
    // An accidental needs room in front of its head; so does a wide label.
    const extra = here.some((n) =>
      !n.rest && accidentalFor(n.pitch, clef, key, mode, n.spell) !== null
    )
      ? SP * 1.1
      : 0;
    const label = Math.max(0, ...here.map((n) => (n.label ? n.label.length : 0)));
    cursor += Math.max(MIN_COLUMN, span * perTick, label * SP * 0.52) + extra;
  });
  const width = cursor + SP * 1.6;
  const labelY = top + STAFF_H + SP * 3.4;
  const harmonyY = labelY + labelRows * LABEL_STEP + SP * 0.6;
  const height =
    Math.max(
      top + STAFF_H + PAD_BOTTOM_BASE,
      (spec.harmony?.length ? harmonyY : labelY + labelRows * LABEL_STEP) + SP * 1.4
    );

  const barTicks = ticksPerBar(meter);
  const total = Math.max(...notes.map((n) => n.start + n.duration));
  const barLines: number[] = [];
  if (!spec.hideBarlines && barTicks > 0) {
    for (let t = barTicks; t < total; t += barTicks) {
      const at = xByOnset.get(t);
      if (at !== undefined) barLines.push(at - SP * 1.1);
    }
  }

  const bracketY = top - SP * 2.2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: `${Math.min(width * 1.25, 720)}px` }}
      role="img"
      aria-label={spec.caption ?? "Music example"}
    >
      {/* Staff */}
      {[0, 1, 2, 3, 4].map((line) => (
        <line
          key={line}
          x1={SP * 0.4}
          x2={width - SP * 0.4}
          y1={top + line * SP}
          y2={top + line * SP}
          stroke={INK_SOFT}
          strokeWidth={0.9}
        />
      ))}
      <Barline x={SP * 0.4} top={top} bottom={top + STAFF_H} sp={SP} />
      <Barline
        style="final"
        x={width - SP * 0.9}
        top={top}
        bottom={top + STAFF_H}
        sp={SP}
      />
      {barLines.map((bx, i) => (
        <Barline key={i} x={bx} top={top} bottom={top + STAFF_H} sp={SP} />
      ))}

      <ClefGlyph clef={clef} x={clefX} y={top} sp={SP} />

      {sigSteps.map((step, i) => (
        <Accidental
          key={i}
          kind={accidentalKind}
          x={sigX + i * SP * 1.15}
          y={yForStep(step, top)}
          sp={SP}
        />
      ))}

      {!spec.hideMeter && (
        <TimeSignature beats={meter.beats} unit={meter.unit} x={meterX + SP} y={top} sp={SP} />
      )}

      {/* Notes, one group per onset so a chord shares a stem */}
      {onsets.map((onset) => {
        const group = notes.filter((n) => n.start === onset);
        const cx = xByOnset.get(onset) ?? 0;
        const sounding = group.filter((n) => !n.rest);
        const rests = group.filter((n) => n.rest);
        const value = noteValue(group[0].duration);
        const steps = sounding.map((n) => stepForPitch(n.pitch, clef, key, mode, n.spell));
        const lowest = steps.length ? Math.min(...steps) : 4;
        const highest = steps.length ? Math.max(...steps) : 4;
        const up = (lowest + highest) / 2 < 4;
        const stemX = up ? cx + SP * 0.6 : cx - SP * 0.6;
        const stemFrom = yForStep(up ? lowest : highest, top);
        const stemTo = yForStep(up ? highest : lowest, top) + (up ? -SP * 3.4 : SP * 3.4);

        return (
          <g key={onset}>
            {rests.map((r, i) => (
              <Rest key={`r${i}`} value={r.duration} x={cx} midY={midY} sp={SP} />
            ))}

            {sounding.length > 0 && value.stemmed && (
              <line
                x1={stemX}
                x2={stemX}
                y1={stemFrom}
                y2={stemTo}
                stroke={INK}
                strokeWidth={SP * 0.13}
                strokeLinecap="round"
              />
            )}
            {sounding.length > 0 && value.flags > 0 && (
              <Flag count={value.flags} x={stemX} y={stemTo} up={up} sp={SP} />
            )}

            {sounding.map((note, i) => {
              const step = steps[i];
              const y = yForStep(step, top);
              const colour = note.accent ? accent : INK;
              const acc = accidentalFor(note.pitch, clef, key, mode, note.spell);
              return (
                <g key={i}>
                  {ledgerLines(step).map((ls) => (
                    <line
                      key={ls}
                      x1={cx - SP * 1.05}
                      x2={cx + SP * 1.05}
                      y1={yForStep(ls, top)}
                      y2={yForStep(ls, top)}
                      stroke={INK_SOFT}
                      strokeWidth={0.9}
                    />
                  ))}
                  {acc && (
                    <Accidental kind={acc} x={cx - SP * 1.5} y={y} sp={SP} color={colour} />
                  )}
                  <Notehead hollow={value.hollow} x={cx} y={y} sp={SP} color={colour} />
                  {Array.from({ length: value.dots }).map((_, d) => (
                    <circle
                      key={d}
                      cx={cx + SP * (1.1 + d * 0.45)}
                      cy={y + (step % 2 === 0 ? -SP * 0.5 : 0)}
                      r={SP * 0.15}
                      fill={colour}
                    />
                  ))}
                </g>
              );
            })}

            {group.map(
              (note, i) =>
                note.label && (
                  <text
                    key={`l${i}`}
                    x={cx}
                    y={labelY + i * LABEL_STEP}
                    textAnchor="middle"
                    fontSize={SP * 1.15}
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                    fontWeight={600}
                    fill={note.accent ? accent : INK_SOFT}
                  >
                    {note.label}
                  </text>
                )
            )}
          </g>
        );
      })}

      {/* Harmony under the staff */}
      {(spec.harmony ?? []).map((h, i) => {
        const note = notes[h.at];
        if (!note) return null;
        return (
          <text
            key={i}
            x={xByOnset.get(note.start) ?? 0}
            y={harmonyY}
            textAnchor="middle"
            fontSize={SP * 1.35}
            fontFamily="Georgia, serif"
            fontWeight={700}
            fill={accent}
          >
            {h.text}
          </text>
        );
      })}

      {/* Brackets over a span, packed onto as few lines as they need */}
      {brackets.map((b, i) => {
        const a = notes[b.from];
        const z = notes[b.to];
        if (!a || !z) return null;
        const x1 = (xByOnset.get(a.start) ?? 0) - SP * 0.4;
        const x2 = (xByOnset.get(z.start) ?? 0) + SP * 0.4;
        const y = bracketY - levels[i] * BRACKET_STEP;
        return (
          <g key={i}>
            <path
              d={`M ${x1} ${y + SP * 0.7} L ${x1} ${y} L ${x2} ${y} L ${x2} ${y + SP * 0.7}`}
              fill="none"
              stroke={accent}
              strokeWidth={SP * 0.13}
              strokeLinecap="round"
            />
            <text
              x={(x1 + x2) / 2}
              y={y - SP * 0.5}
              textAnchor="middle"
              fontSize={SP * 1.1}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontWeight={600}
              fill={accent}
            >
              {b.text}
            </text>
          </g>
        );
      })}

    </svg>
  );
}

/** Which ledger lines a step needs: every even step outside the staff. */
function ledgerLines(step: number): number[] {
  const out: number[] = [];
  if (step > 8) for (let s = 10; s <= step; s += 2) out.push(s);
  if (step < 0) for (let s = -2; s >= step; s -= 2) out.push(s);
  return out;
}
