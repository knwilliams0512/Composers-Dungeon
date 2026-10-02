"use client";

import type { FigureInteraction } from "./LessonFigure";
import type { CircleFigure as Spec } from "@/lib/lesson-figure";
import { keyPitchClass } from "@/lib/score";

/**
 * The circle of fifths.
 *
 * Every key a fifth from its neighbour, so the signature grows by one sharp
 * clockwise and one flat anticlockwise — which is the whole reason the circle
 * is worth drawing rather than listing. The relative minor sits inside its
 * major, because that is the relationship, not a separate fact to memorise.
 */

const MAJOR = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
const MINOR = ["a", "e", "b", "f#", "c#", "g#", "d#", "bb", "f", "c", "g", "d"];
const SIGNATURE = ["", "1♯", "2♯", "3♯", "4♯", "5♯", "6♯", "5♭", "4♭", "3♭", "2♭", "1♭"];

const SIZE = 340;
const C = SIZE / 2;
const R_OUTER = 126;
/**
 * The signature count sits outside its key, on the same radius. Offsetting it
 * upward in y instead pushed the bottom of the circle inward, where "6♯" and
 * D-sharp minor landed on each other.
 */
const R_SIG = 154;
/** The relative minors ring just inside their majors, which is the point. */
const R_MINOR = 96;
const R_BOUND = 76;

function pointAt(i: number, r: number): { x: number; y: number } {
  const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
  return { x: C + Math.cos(angle) * r, y: C + Math.sin(angle) * r };
}

/**
 * The triad on a tonic, in a comfortable octave.
 *
 * Pressing a key should play that key, not a note named after it — hearing C
 * major and then E major is how the distance around the circle stops being a
 * diagram and becomes a sound.
 */
function triadOf(name: string, minor: boolean): number[] {
  const root = 60 + keyPitchClass(name.replace(/^[a-g]/, (c) => c.toUpperCase()));
  return [root, root + (minor ? 3 : 4), root + 7];
}

export function CircleFigure({
  spec,
  accent,
  lit,
  onPick,
}: { spec: Spec; accent: string } & FigureInteraction) {
  const highlighted = new Set((spec.highlight ?? []).map((k) => k.trim()));
  const arrowFrom = spec.arrow ? MAJOR.indexOf(spec.arrow.from) : -1;
  const arrowTo = spec.arrow ? MAJOR.indexOf(spec.arrow.to) : -1;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      style={{ maxWidth: "360px" }}
      role="img"
      aria-label={spec.caption ?? "The circle of fifths"}
    >
      <circle cx={C} cy={C} r={R_OUTER + 20} fill="rgba(12,10,20,0.35)" />
      <circle
        cx={C}
        cy={C}
        r={R_OUTER + 20}
        fill="none"
        stroke="rgba(240,235,225,0.16)"
        strokeWidth={1}
      />
      <circle
        cx={C}
        cy={C}
        r={R_BOUND}
        fill="none"
        stroke="rgba(240,235,225,0.12)"
        strokeWidth={1}
      />
      <text
        x={C}
        y={C - 4}
        textAnchor="middle"
        fontSize={9}
        letterSpacing={1.5}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="rgba(240,235,225,0.32)"
      >
        MAJOR
      </text>
      <text
        x={C}
        y={C + 10}
        textAnchor="middle"
        fontSize={9}
        letterSpacing={1.5}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="rgba(240,235,225,0.32)"
      >
        minor
      </text>

      {MAJOR.map((key, i) => {
        const outer = pointAt(i, R_OUTER);
        const inner = pointAt(i, R_MINOR);
        const sig = pointAt(i, R_SIG);
        const on = highlighted.has(key) || lit === key;
        return (
          <g
            key={key}
            onClick={onPick ? () => onPick(key, triadOf(key, false)) : undefined}
            style={onPick ? { cursor: "pointer" } : undefined}
          >
            {onPick && <title>{`${key} major — ${SIGNATURE[i] || "no sharps or flats"}`}</title>}
            <circle
              cx={outer.x}
              cy={outer.y}
              r={19}
              fill={on ? accent : "rgba(12,10,20,0.85)"}
              stroke={on ? accent : "rgba(240,235,225,0.25)"}
              strokeWidth={1.4}
            />
            <text
              x={outer.x}
              y={outer.y + 5}
              textAnchor="middle"
              fontSize={14}
              fontWeight={700}
              fontFamily="Georgia, serif"
              fill={on ? "#0c0a14" : "rgba(240,235,225,0.9)"}
            >
              {key}
            </text>
            <text
              x={sig.x}
              y={sig.y + 3}
              textAnchor="middle"
              fontSize={9}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fill="rgba(240,235,225,0.5)"
            >
              {SIGNATURE[i]}
            </text>
            <text
              x={inner.x}
              y={inner.y + 4}
              textAnchor="middle"
              fontSize={13}
              fontStyle="italic"
              fontFamily="Georgia, serif"
              fill={
                highlighted.has(MINOR[i]) || lit === MINOR[i]
                  ? accent
                  : "rgba(240,235,225,0.55)"
              }
              style={onPick ? { cursor: "pointer" } : undefined}
              onClick={
                onPick
                  ? (e) => {
                      // The minor label sits inside its major's group, so the
                      // click has to be claimed or the major sounds instead.
                      e.stopPropagation();
                      onPick(MINOR[i], triadOf(MINOR[i], true));
                    }
                  : undefined
              }
            >
              {MINOR[i]}
            </text>
          </g>
        );
      })}

      {spec.arrow && arrowFrom >= 0 && arrowTo >= 0 && (
        <g>
          <defs>
            <marker
              id="cof-arrow"
              markerWidth="7"
              markerHeight="7"
              refX="5"
              refY="3.5"
              orient="auto"
            >
              <path d="M 0 0 L 7 3.5 L 0 7 z" fill={accent} />
            </marker>
          </defs>
          <line
            x1={pointAt(arrowFrom, R_OUTER - 22).x}
            y1={pointAt(arrowFrom, R_OUTER - 22).y}
            x2={pointAt(arrowTo, R_OUTER - 22).x}
            y2={pointAt(arrowTo, R_OUTER - 22).y}
            stroke={accent}
            strokeWidth={2}
            markerEnd="url(#cof-arrow)"
          />
          {spec.arrow.text && (
            <text
              x={C}
              y={C + 5}
              textAnchor="middle"
              fontSize={12}
              fontWeight={600}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fill={accent}
            >
              {spec.arrow.text}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
