"use client";

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
import type { FigureInteraction } from "./LessonFigure";
import { keySignatureCount, pitchName, ticksPerBar } from "@/lib/score";
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

export function StaffFigure({
  spec,
  accent,
  lit,
  onPick,
}: { spec: Spec; accent: string } & FigureInteraction) {
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

  // A grand staff is two staves and a brace, treble over bass. It is the only
  // way to draw middle C honestly: a ledger line below the upper staff and a
  // ledger line above the lower one, which are the same key on the piano.
  const staves: { clef: "treble" | "bass"; top: number }[] = spec.grandStaff
    ? [
        { clef: "treble", top },
        { clef: "bass", top: top + STAFF_H + SP * 5 },
      ]
    : [{ clef, top }];
  const lastStaff = staves[staves.length - 1];
  const systemBottom = lastStaff.top + STAFF_H;

  /* ---- Head matter: clef, signature, metre ------------------------------- */
  let x = SP * 1.2 + (spec.grandStaff ? SP * 1.4 : 0);
  const clefX = x;
  x += Math.max(...staves.map((st) => clefWidth(st.clef, SP)));

  // Every staff of a system carries the same signature, drawn on its own lines.
  const sigStepsFor = (c: "treble" | "bass") => signatureSteps(c, key, mode);
  // The count carries the sign: positive is sharps, negative flats. Asking the
  // key name which it is would get F major and every minor key wrong.
  const accidentalKind = keySignatureCount(key, mode) < 0 ? "flat" : "sharp";
  const sigX = x;
  x += sigStepsFor(staves[0].clef).length * SP * 1.15;
  if (sigStepsFor(staves[0].clef).length > 0) x += SP * 0.6;

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
    const extra = here.some(
      (n) =>
        !n.rest &&
        accidentalFor(n.pitch, staves[n.staff ?? 0]?.clef ?? clef, key, mode, n.spell) !== null
    )
      ? SP * 1.1
      : 0;
    const label = Math.max(0, ...here.map((n) => (n.label ? n.label.length : 0)));
    cursor += Math.max(MIN_COLUMN, span * perTick, label * SP * 0.52) + extra;
  });
  const width = cursor + SP * 1.6;
  const labelY = systemBottom + SP * 3.4;
  const harmonyY = labelY + labelRows * LABEL_STEP + SP * 0.6;
  const height =
    Math.max(
      systemBottom + PAD_BOTTOM_BASE,
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
      {/* Staves */}
      {staves.map((st, si) => (
        <g key={si}>
          {[0, 1, 2, 3, 4].map((line) => (
            <line
              key={line}
              x1={SP * 0.4}
              x2={width - SP * 0.4}
              y1={st.top + line * SP}
              y2={st.top + line * SP}
              stroke={INK_SOFT}
              strokeWidth={0.9}
            />
          ))}
          <ClefGlyph clef={st.clef} x={clefX} y={st.top} sp={SP} />
          {sigStepsFor(st.clef).map((step, i) => (
            <Accidental
              key={i}
              kind={accidentalKind}
              x={sigX + i * SP * 1.15}
              y={yForStep(step, st.top)}
              sp={SP}
            />
          ))}
          {!spec.hideMeter && (
            <TimeSignature
              beats={meter.beats}
              unit={meter.unit}
              x={meterX + SP}
              y={st.top}
              sp={SP}
            />
          )}
        </g>
      ))}

      {/* The brace: one player, two staves. Drawn rather than described,
          because it is the thing that says "these are read together". */}
      {spec.grandStaff && (
        <path
          d={`M ${SP * 1.7} ${top}
              C ${SP * 0.2} ${top + STAFF_H * 0.5}, ${SP * 1.9} ${(top + systemBottom) / 2 - SP}, ${SP * 0.9} ${(top + systemBottom) / 2}
              C ${SP * 1.9} ${(top + systemBottom) / 2 + SP}, ${SP * 0.2} ${systemBottom - STAFF_H * 0.5}, ${SP * 1.7} ${systemBottom}`}
          fill="none"
          stroke={INK}
          strokeWidth={SP * 0.26}
          strokeLinecap="round"
        />
      )}

      {/* Barlines run the whole system, which is what joins the staves */}
      <Barline x={SP * 0.4} top={top} bottom={systemBottom} sp={SP} />
      <Barline style="final" x={width - SP * 0.9} top={top} bottom={systemBottom} sp={SP} />
      {barLines.map((bx, i) => (
        <Barline key={i} x={bx} top={top} bottom={systemBottom} sp={SP} />
      ))}

      {/* Notes, one group per onset and staff: a chord shares a stem, but a
          chord cannot share one across a brace. */}
      {onsets.flatMap((onset) =>
        staves.flatMap((st, si) => {
        const onStaff = notes.filter((n) => n.start === onset && (n.staff ?? 0) === si);
        if (onStaff.length === 0) return [];
        // A melody note and a held accompaniment note can begin together, and
        // they are not one chord: they are two voices with different lengths.
        // Drawing them on one stem printed a whole note as a quarter, so each
        // length in a column gets its own stem.
        const lengths = Array.from(new Set(onStaff.map((n) => n.duration))).sort((a, b) => a - b);
        return lengths.map((length, li) => {
        const group = onStaff.filter((n) => n.duration === length);
        const cx = xByOnset.get(onset) ?? 0;
        const heads = group.filter((n) => !n.rest);
        const rests = group.filter((n) => n.rest);
        const value = noteValue(length);
        const steps = heads.map((n) => stepForPitch(n.pitch, st.clef, key, mode, n.spell));
        const lowest = steps.length ? Math.min(...steps) : 4;
        const highest = steps.length ? Math.max(...steps) : 4;
        // With two voices in a column the shorter one takes the upper stem and
        // the longer one the lower, the way two parts on a stave are written.
        const up = lengths.length > 1 ? li === 0 : (lowest + highest) / 2 < 4;
        const stemX = up ? cx + SP * 0.6 : cx - SP * 0.6;
        const stemFrom = yForStep(up ? lowest : highest, st.top);
        const stemTo = yForStep(up ? highest : lowest, st.top) + (up ? -SP * 3.4 : SP * 3.4);

        // Two noteheads a step apart cannot both sit on the same side of the
        // stem — they would be drawn on top of each other. The upper of the
        // pair moves across, which is what an engraver does.
        const sortedSteps = [...steps].sort((a, b) => a - b);
        const shifted = new Set<number>();
        for (let i = 1; i < sortedSteps.length; i++) {
          if (sortedSteps[i] - sortedSteps[i - 1] === 1 && !shifted.has(sortedSteps[i - 1])) {
            shifted.add(sortedSteps[i]);
          }
        }

        const sounding = group.filter((n) => !n.rest).map((n) => n.pitch);
        const isLit = lit === onset;
        // The whole column is the target, not the notehead: a chord is one
        // sound, and a 9px ellipse is not something a finger can hit.
        return (
          <g
            key={`${onset}-${si}-${length}`}
            onClick={onPick ? () => onPick(onset, sounding) : undefined}
            style={onPick ? { cursor: "pointer" } : undefined}
            role={onPick ? "button" : undefined}
            tabIndex={onPick && si === 0 && li === 0 ? 0 : undefined}
            onKeyDown={
              onPick && si === 0 && li === 0
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPick(onset, sounding);
                    }
                  }
                : undefined
            }
          >
            {onPick && (
              <title>
                {sounding.length === 0
                  ? "Rest"
                  : sounding.map((p) => pitchName(p, key, mode)).join(" + ")}
              </title>
            )}
            {/* An invisible pad so the column can be pressed anywhere down it */}
            {onPick && (
              <rect
                x={cx - SP * 1.6}
                y={st.top - SP * 2}
                width={SP * 3.2}
                height={STAFF_H + SP * 4}
                fill={isLit ? accent : "transparent"}
                opacity={isLit ? 0.14 : 0}
                rx={SP * 0.5}
              />
            )}
            {rests.map((r, i) => (
              <Rest key={`r${i}`} value={r.duration} x={cx} midY={st.top + STAFF_H / 2} sp={SP} />
            ))}

            {heads.length > 0 && value.stemmed && (
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
            {heads.length > 0 && value.flags > 0 && (
              <Flag count={value.flags} x={stemX} y={stemTo} up={up} sp={SP} />
            )}

            {heads.map((note, i) => {
              const step = steps[i];
              const y = yForStep(step, st.top);
              const colour = note.accent || isLit ? accent : INK;
              const acc = accidentalFor(note.pitch, st.clef, key, mode, note.spell);
              return (
                <g key={i}>
                  {ledgerLines(step).map((ls) => (
                    <line
                      key={ls}
                      x1={cx - SP * 1.05}
                      x2={cx + SP * 1.05}
                      y1={yForStep(ls, st.top)}
                      y2={yForStep(ls, st.top)}
                      stroke={INK_SOFT}
                      strokeWidth={0.9}
                    />
                  ))}
                  {acc && (
                    <Accidental kind={acc} x={cx - SP * 1.5} y={y} sp={SP} color={colour} />
                  )}
                  <Notehead
                    hollow={value.hollow}
                    x={cx + (shifted.has(step) ? SP * (up ? 1.2 : -1.2) : 0)}
                    y={y}
                    sp={SP}
                    color={colour}
                  />
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
        });
        })
      )}

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
