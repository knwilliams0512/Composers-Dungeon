"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Freedom } from "@/lib/composer-freedom";
import {
  pitchName,
  romanNumeral,
  ticksPerBar,
  ticksPerBeat,
  triadFor,
  type Score,
  type ScoreNote,
} from "@/lib/score";
import {
  accidentalGlyph,
  pitchForStaffStep,
  restsForGaps,
  sharpsInKey,
  staffStep,
  FLAT_STEPS,
  SHARP_STEPS,
} from "@/lib/notation";

/**
 * Sheet music, engraved live in SVG — the same score the piano roll edits,
 * drawn the way Flat.io or MuseScore would draw it: wrapped systems on a
 * parchment page, each with its clef, signature and meter; stems, flags,
 * dots, accidentals, ledger lines and rests all placed by the rules.
 *
 * Clicking a line or space writes a note there, spelled to the key; clicking
 * a note head takes it away.
 */

/* ---- Page metrics --------------------------------------------------------- */

const GAP = 9; // distance between staff lines
const HALF = GAP / 2; // one staff step
const STAFF_H = GAP * 4;
const TOP_PAD = GAP * 5; // room above for ledger lines and stems
const BOTTOM_PAD = GAP * 5;
const SYSTEM_H = TOP_PAD + STAFF_H + BOTTOM_PAD;
const HEAD_RX = GAP * 0.62;
const HEAD_RY = GAP * 0.46;
const STEM_LEN = GAP * 3.4;
/** Fallback page width, used only until the sheet has measured itself. */
const PAGE_W = 920;

const INK = "#2b2115"; // sepia ink on parchment
const INK_SOFT = "rgba(43,33,21,0.55)";
const INK_FAINT = "rgba(43,33,21,0.3)";
const ACCENT = "#8a6b23"; // gilded ink for the playhead and highlights

/* ---- Small glyphs, drawn rather than fonted ------------------------------- */

function TrebleClef({ x, midY }: { x: number; midY: number }) {
  // A stylised G clef: recognisable spiral around the G line, drawn to scale
  // with the staff rather than relying on any font shipping the glyph.
  const s = GAP / 9;
  return (
    <g transform={`translate(${x}, ${midY}) scale(${s})`} fill="none" stroke={INK} strokeLinecap="round">
      <path
        d="M 0 9
           C -14 2, -13 -14, -1 -21
           C 10 -27, 20 -19, 19 -8
           C 18 3, 8 10, -2 13
           C -14 17, -21 9, -20 0"
        strokeWidth={3.4}
      />
      <path d="M -2 -34 C 8 -28, 10 -18, 6 -2 L -2 34" strokeWidth={3.4} />
      <circle cx="-4" cy="37" r="4.4" fill={INK} stroke="none" />
    </g>
  );
}

function SharpGlyph({ x, y, color = INK }: { x: number; y: number; color?: string }) {
  const s = GAP / 9;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} stroke={color} strokeWidth={1.7} strokeLinecap="round">
      <line x1="-2.6" y1="-7.5" x2="-2.6" y2="7.5" />
      <line x1="2.6" y1="-8.5" x2="2.6" y2="6.5" />
      <line x1="-5.5" y1="-2.8" x2="5.5" y2="-4.6" strokeWidth={2.6} />
      <line x1="-5.5" y1="3.4" x2="5.5" y2="1.6" strokeWidth={2.6} />
    </g>
  );
}

function FlatGlyph({ x, y, color = INK }: { x: number; y: number; color?: string }) {
  const s = GAP / 9;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} fill="none" stroke={color} strokeLinecap="round">
      <line x1="-3" y1="-12" x2="-3" y2="5.5" strokeWidth={1.7} />
      <path d="M -3 -1 C 3 -5, 7 0, -3 5.5" strokeWidth={2} />
    </g>
  );
}

function NaturalGlyph({ x, y, color = INK }: { x: number; y: number; color?: string }) {
  const s = GAP / 9;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} stroke={color} strokeLinecap="round">
      <line x1="-2.6" y1="-9" x2="-2.6" y2="4.5" strokeWidth={1.7} />
      <line x1="2.6" y1="-4.5" x2="2.6" y2="9" strokeWidth={1.7} />
      <line x1="-2.6" y1="-3.2" x2="2.6" y2="-5" strokeWidth={2.4} />
      <line x1="-2.6" y1="4.6" x2="2.6" y2="2.8" strokeWidth={2.4} />
    </g>
  );
}

function Accidental({ kind, x, y, color }: { kind: "sharp" | "flat" | "natural"; x: number; y: number; color?: string }) {
  if (kind === "sharp") return <SharpGlyph x={x} y={y} color={color} />;
  if (kind === "flat") return <FlatGlyph x={x} y={y} color={color} />;
  return <NaturalGlyph x={x} y={y} color={color} />;
}

function RestGlyphShape({ value, x, midY }: { value: number; x: number; midY: number }) {
  // midY is the middle staff line (B4).
  if (value === 16) {
    // Whole rest hangs from the fourth line.
    return <rect x={x - GAP * 0.7} y={midY - GAP} width={GAP * 1.4} height={GAP * 0.5} fill={INK_SOFT} />;
  }
  if (value === 8) {
    // Half rest sits on the middle line.
    return <rect x={x - GAP * 0.7} y={midY - GAP * 0.5} width={GAP * 1.4} height={GAP * 0.5} fill={INK_SOFT} />;
  }
  if (value === 4) {
    const s = GAP / 9;
    return (
      <path
        transform={`translate(${x}, ${midY}) scale(${s})`}
        d="M -2 -14 L 5 -6 C 1 -2, 1 2, 5 6 C -1 4, -3 7, 0 13 C -7 8, -6 3, -2 0 C -6 -4, -6 -9, -2 -14 Z"
        fill={INK_SOFT}
      />
    );
  }
  // Eighth and sixteenth: slash with one or two hooks.
  const s = GAP / 9;
  const hooks = value === 2 ? 1 : 2;
  return (
    <g transform={`translate(${x}, ${midY}) scale(${s})`} stroke={INK_SOFT} fill={INK_SOFT} strokeLinecap="round">
      <line x1={3} y1={-8} x2={-3} y2={12} strokeWidth={1.8} />
      {Array.from({ length: hooks }).map((_, i) => (
        <g key={i}>
          <path d={`M ${3 - i * 2} ${-8 + i * 7} C ${-2 - i * 2} ${-4 + i * 7}, ${-5 - i * 2} ${-6 + i * 7}, ${-6 - i * 2} ${-9 + i * 7}`} fill="none" strokeWidth={1.6} />
          <circle cx={-6 - i * 2} cy={-9 + i * 7} r={2.2} stroke="none" />
        </g>
      ))}
    </g>
  );
}

/* ---- The engraver --------------------------------------------------------- */

interface Ghost {
  system: number;
  tick: number;
  step: number;
}

export function StaffView({
  score,
  freedom,
  playhead,
  readOnly,
  accidentalMode,
  allowedPitches,
  onToggleNote,
  onSetChord,
}: {
  score: Score;
  freedom: Freedom;
  playhead: number | null;
  readOnly: boolean;
  /** Explicit accidental for placement: null follows the key signature. */
  accidentalMode: -1 | 0 | 1 | null;
  /** The same pitch range the grid offers at this freedom tier. */
  allowedPitches: number[];
  onToggleNote: (pitch: number, tick: number) => void;
  onSetChord: (barIndex: number, degree: number | null) => void;
}) {
  const allowed = useMemo(() => new Set(allowedPitches), [allowedPitches]);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const svgRefs = useRef<(SVGSVGElement | null)[]>([]);

  // How many bars fit on a line depends on how wide the sheet actually is, not
  // on a guess: the Workshop, a lesson page and a phone all give it different
  // room, and a system wider than its parchment gets its last bar clipped off.
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [pageW, setPageW] = useState(PAGE_W);
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const measure = () => {
      // Padding is 16px either side at the small breakpoint, 24px above it.
      const pad = window.innerWidth >= 640 ? 48 : 32;
      setPageW(Math.max(280, el.clientWidth - pad));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const barTicks = ticksPerBar(score.meter);
  const beatTicks = ticksPerBeat(score.meter);
  const sharps = sharpsInKey(score.key, score.mode);
  const sigCount = Math.abs(sharps);

  /* Layout: clef + key signature lead every system; the meter only the first,
     which is how engraved music does it.

     Bars are then *justified* — stretched so a system fills the page — rather
     than drawn at a fixed pixel width. Fixed widths leave a ragged right edge
     and, in a narrow panel like a dungeon trial, drop to one lonely bar per
     line with half the parchment blank beside it. */
  const sigW = 46 + sigCount * 11;
  const meterW = 26;
  const leadInFor = (sys: number) => sigW + (sys === 0 ? meterW : 0);
  const leadIn = leadInFor(0);
  const TAIL = 14;

  const usable = Math.max(120, pageW - leadIn - TAIL);
  // A bar needs this much room before it is worth putting two on a line.
  const minBarW = barTicks * 9;
  const barsPerSystem = Math.max(1, Math.min(4, Math.floor(usable / minBarW)));
  // Stretch to fill, but never blow a single bar up to the whole page.
  const barW = Math.min(usable / barsPerSystem, barTicks * 20);
  const pxPerTick = barW / barTicks;
  const systems = Math.ceil(score.bars / barsPerSystem);

  const notesBySystem = useMemo(() => {
    const out: ScoreNote[][] = Array.from({ length: systems }, () => []);
    for (const n of score.melody) {
      const sys = Math.floor(n.start / (barTicks * barsPerSystem));
      if (out[sys]) out[sys].push(n);
    }
    return out;
  }, [score.melody, systems, barTicks, barsPerSystem]);

  const rests = useMemo(
    () => restsForGaps(score.melody, score.meter, score.bars),
    [score.melody, score.meter, score.bars]
  );

  const midLineStep = 4; // B4, middle line
  const stepY = (step: number, baseY: number) => baseY + STAFF_H - step * HALF;

  function systemMeta(sys: number) {
    const startBar = sys * barsPerSystem;
    const bars = Math.min(barsPerSystem, score.bars - startBar);
    const startTick = startBar * barTicks;
    const lead = leadInFor(sys);
    const width = lead + bars * barW + TAIL;
    return { startBar, bars, startTick, width, lead };
  }

  function tickX(tick: number, sys: number) {
    const { startTick, lead } = systemMeta(sys);
    return lead + (tick - startTick) * pxPerTick + pxPerTick * 0.55;
  }

  /* ---- Interaction -------------------------------------------------------- */

  function locate(e: React.MouseEvent<SVGSVGElement>, sys: number): Ghost | null {
    const svg = svgRefs.current[sys];
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { startTick, bars, lead } = systemMeta(sys);
    if (x < lead - 4) return null;
    const tick = startTick + Math.floor((x - lead) / pxPerTick / (freedom.gridStep || 1)) * freedom.gridStep;
    if (tick < startTick || tick >= startTick + bars * barTicks) return null;
    const step = Math.round((TOP_PAD + STAFF_H - y) / HALF);
    const pitch = pitchForStaffStep(step, score.key, score.mode, accidentalMode);
    if (!allowed.has(pitch)) return null; // outside what this tier has earned
    return { system: sys, tick, step };
  }

  function place(g: Ghost) {
    if (readOnly) return;
    const pitch = pitchForStaffStep(g.step, score.key, score.mode, accidentalMode);
    onToggleNote(pitch, g.tick);
  }

  /* ---- Render ------------------------------------------------------------- */

  return (
    <div
      ref={sheetRef}
      data-staff-sheet
      className="overflow-x-auto rounded-lg p-4 sm:p-6"
      style={{
        background: "linear-gradient(160deg, #efe3c4, #e6d5ae 55%, #dfcaa0)",
        boxShadow: "inset 0 0 60px rgba(120,90,40,0.25), 0 2px 12px rgba(0,0,0,0.5)",
      }}
    >
      <div className="mb-1 flex items-baseline justify-between px-1">
        <p className="font-display text-sm tracking-wide" style={{ color: INK }}>
          {score.key} {score.mode} · {score.meter.beats}/{score.meter.unit} · ♩ = {score.tempo}
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: INK_SOFT }}>
          {readOnly ? "score" : "click a line or space to write"}
        </p>
      </div>

      {Array.from({ length: systems }).map((_, sys) => {
        const { startBar, bars, startTick, width, lead } = systemMeta(sys);
        const endTick = startTick + bars * barTicks;
        const sysNotes = notesBySystem[sys] ?? [];
        const sysRests = rests.filter((r) => r.start >= startTick && r.start < endTick);
        const showPlayhead = playhead !== null && playhead >= startTick && playhead < endTick;

        return (
          <div key={sys} className="relative">
            <svg
              ref={(el) => {
                svgRefs.current[sys] = el;
              }}
              width={width}
              height={SYSTEM_H}
              viewBox={`0 0 ${width} ${SYSTEM_H}`}
              className={readOnly ? "" : "cursor-crosshair"}
              onMouseMove={(e) => setGhost(locate(e, sys))}
              onMouseLeave={() => setGhost((g) => (g?.system === sys ? null : g))}
              onClick={(e) => {
                const g = locate(e, sys);
                if (g) place(g);
              }}
            >
              {/* Staff lines */}
              {[0, 1, 2, 3, 4].map((l) => (
                <line
                  key={l}
                  x1={8}
                  x2={width - 8}
                  y1={TOP_PAD + l * GAP}
                  y2={TOP_PAD + l * GAP}
                  stroke={INK_SOFT}
                  strokeWidth={1.1}
                />
              ))}

              {/* Bar lines */}
              {Array.from({ length: bars + 1 }).map((_, b) => {
                const x = lead + b * barW;
                const last = sys === systems - 1 && b === bars;
                return (
                  <g key={b}>
                    <line x1={x} x2={x} y1={TOP_PAD} y2={TOP_PAD + STAFF_H} stroke={INK} strokeWidth={last ? 3 : 1.2} />
                    {last && (
                      <line x1={x - 5} x2={x - 5} y1={TOP_PAD} y2={TOP_PAD + STAFF_H} stroke={INK} strokeWidth={1.1} />
                    )}
                    {b < bars && (
                      <text
                        x={x + 4}
                        y={TOP_PAD - GAP * 1.6}
                        fontSize={9}
                        fill={INK_FAINT}
                        fontFamily="var(--font-display, serif)"
                      >
                        {startBar + b + 1}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Clef, signature, meter */}
              <TrebleClef x={26} midY={TOP_PAD + STAFF_H / 2 + GAP} />
              {Array.from({ length: sigCount }).map((_, i) => {
                const step = sharps > 0 ? SHARP_STEPS[i] : FLAT_STEPS[i];
                const x = 48 + i * 11;
                const y = stepY(step, TOP_PAD);
                return sharps > 0 ? <SharpGlyph key={i} x={x} y={y} /> : <FlatGlyph key={i} x={x} y={y} />;
              })}
              {sys === 0 && (
                <>
                  <text
                    x={lead - 14}
                    y={TOP_PAD + GAP * 1.7}
                    textAnchor="middle"
                    fontSize={GAP * 2.1}
                    fontWeight={700}
                    fill={INK}
                    fontFamily="var(--font-display, serif)"
                  >
                    {score.meter.beats}
                  </text>
                  <text
                    x={lead - 14}
                    y={TOP_PAD + GAP * 3.8}
                    textAnchor="middle"
                    fontSize={GAP * 2.1}
                    fontWeight={700}
                    fill={INK}
                    fontFamily="var(--font-display, serif)"
                  >
                    {score.meter.unit}
                  </text>
                </>
              )}

              {/* Beat guides, whisper-faint */}
              {Array.from({ length: bars * score.meter.beats }).map((_, i) => {
                const x = lead + (i * beatTicks) * pxPerTick;
                if (i % score.meter.beats === 0) return null;
                return (
                  <line
                    key={i}
                    x1={x}
                    x2={x}
                    y1={TOP_PAD + STAFF_H + GAP * 0.8}
                    y2={TOP_PAD + STAFF_H + GAP * 1.4}
                    stroke={INK_FAINT}
                    strokeWidth={1}
                  />
                );
              })}

              {/* Rests */}
              {sysRests.map((r, i) => (
                <RestGlyphShape key={i} value={r.value} x={tickX(r.start, sys)} midY={stepY(midLineStep, TOP_PAD)} />
              ))}

              {/* Chord numerals above the staff */}
              {Array.from({ length: bars }).map((_, b) => {
                const chord = score.chords.find((c) => c.start === (startBar + b) * barTicks);
                if (!chord) return null;
                const { quality } = triadFor(chord.degree, score.key, score.mode);
                return (
                  <text
                    key={b}
                    x={lead + b * barW + barW / 2}
                    y={TOP_PAD - GAP * 1.5}
                    textAnchor="middle"
                    fontSize={12}
                    fontStyle="italic"
                    fill={INK_SOFT}
                    fontFamily="var(--font-display, serif)"
                  >
                    {romanNumeral(chord.degree, quality)}
                  </text>
                );
              })}

              {/* Notes */}
              {sysNotes.map((n, i) => {
                const step = staffStep(n.pitch, score.key);
                const x = tickX(n.start, sys);
                const y = stepY(step, TOP_PAD);
                const open = n.duration >= 8; // half and longer: open head
                const whole = n.duration >= 16;
                const dotted = [3, 6, 12, 24].includes(n.duration);
                const stemUp = step < midLineStep;
                const acc = accidentalGlyph(n.pitch, score.key, score.mode);

                /* Ledger lines: every gap-line between the staff and the note */
                const ledgers: number[] = [];
                for (let s = -2; s >= step; s -= 2) ledgers.push(s);
                for (let s = 10; s <= step; s += 2) ledgers.push(s);

                return (
                  <g key={i}>
                    {ledgers.map((s) => (
                      <line
                        key={s}
                        x1={x - HEAD_RX - 3.5}
                        x2={x + HEAD_RX + 3.5}
                        y1={stepY(s, TOP_PAD)}
                        y2={stepY(s, TOP_PAD)}
                        stroke={INK_SOFT}
                        strokeWidth={1.2}
                      />
                    ))}
                    {acc && <Accidental kind={acc} x={x - HEAD_RX - 8} y={y} />}
                    <ellipse
                      cx={x}
                      cy={y}
                      rx={HEAD_RX}
                      ry={HEAD_RY}
                      transform={`rotate(-18 ${x} ${y})`}
                      fill={open ? "none" : INK}
                      stroke={INK}
                      strokeWidth={open ? 1.8 : 0}
                    />
                    {!whole && (
                      <line
                        x1={stemUp ? x + HEAD_RX - 0.8 : x - HEAD_RX + 0.8}
                        x2={stemUp ? x + HEAD_RX - 0.8 : x - HEAD_RX + 0.8}
                        y1={y}
                        y2={stemUp ? y - STEM_LEN : y + STEM_LEN}
                        stroke={INK}
                        strokeWidth={1.5}
                      />
                    )}
                    {/* Flags for eighths and shorter */}
                    {[1, 2, 3].includes(n.duration) &&
                      Array.from({ length: n.duration === 1 ? 2 : 1 }).map((_, f) => {
                        const sx = stemUp ? x + HEAD_RX - 0.8 : x - HEAD_RX + 0.8;
                        const sy = stemUp ? y - STEM_LEN + f * 6 : y + STEM_LEN - f * 6;
                        return (
                          <path
                            key={f}
                            d={
                              stemUp
                                ? `M ${sx} ${sy} C ${sx + 8} ${sy + 4}, ${sx + 9} ${sy + 10}, ${sx + 5} ${sy + 16}`
                                : `M ${sx} ${sy} C ${sx + 8} ${sy - 4}, ${sx + 9} ${sy - 10}, ${sx + 5} ${sy - 16}`
                            }
                            fill="none"
                            stroke={INK}
                            strokeWidth={2}
                            strokeLinecap="round"
                          />
                        );
                      })}
                    {dotted && (
                      <circle cx={x + HEAD_RX + 5} cy={step % 2 === 0 ? y - HALF : y} r={1.9} fill={INK} />
                    )}
                    {/* Invisible hit target for removal */}
                    {!readOnly && (
                      <circle
                        cx={x}
                        cy={y}
                        r={GAP * 0.9}
                        fill="transparent"
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleNote(n.pitch, n.start);
                        }}
                      />
                    )}
                  </g>
                );
              })}

              {/* Ghost note under the cursor */}
              {!readOnly && ghost && ghost.system === sys && (
                (() => {
                  const gx = tickX(ghost.tick, sys);
                  const gy = stepY(ghost.step, TOP_PAD);
                  const pitch = pitchForStaffStep(ghost.step, score.key, score.mode, accidentalMode);
                  return (
                    <g pointerEvents="none" opacity={0.45}>
                      <ellipse cx={gx} cy={gy} rx={HEAD_RX} ry={HEAD_RY} transform={`rotate(-18 ${gx} ${gy})`} fill={ACCENT} />
                      <text x={gx} y={TOP_PAD + STAFF_H + GAP * 3.4} textAnchor="middle" fontSize={10} fill={ACCENT} fontFamily="var(--font-display, serif)">
                        {pitchName(pitch, score.key)}
                      </text>
                    </g>
                  );
                })()
              )}

              {/* Playhead */}
              {showPlayhead && playhead !== null && (
                <line
                  x1={tickX(playhead, sys)}
                  x2={tickX(playhead, sys)}
                  y1={TOP_PAD - GAP * 2}
                  y2={TOP_PAD + STAFF_H + GAP * 2}
                  stroke={ACCENT}
                  strokeWidth={1.6}
                  opacity={0.85}
                />
              )}
            </svg>

            {/* Harmony selects, one per bar, aligned under the system */}
            {freedom.chords && !readOnly && (
              <div className="mb-2 flex" style={{ paddingLeft: lead, width }}>
                {Array.from({ length: bars }).map((_, b) => {
                  const barIndex = startBar + b;
                  const chord = score.chords.find((c) => c.start === barIndex * barTicks);
                  return (
                    <div key={b} style={{ width: barW }} className="px-1">
                      <select
                        value={chord ? chord.degree : ""}
                        onChange={(e) => onSetChord(barIndex, e.target.value === "" ? null : Number(e.target.value))}
                        className="w-full rounded border bg-transparent px-1 py-0.5 text-center text-xs focus:outline-none"
                        style={{ borderColor: INK_FAINT, color: INK }}
                        aria-label={`Chord for bar ${barIndex + 1}`}
                      >
                        <option value="">—</option>
                        {freedom.chordDegrees.map((d) => {
                          const { quality } = triadFor(d, score.key, score.mode);
                          return (
                            <option key={d} value={d}>
                              {romanNumeral(d, quality)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <p className="mt-1 px-1 text-right text-[10px] italic" style={{ color: INK_FAINT }}>
        — Composer&apos;s Dungeon manuscript —
      </p>
    </div>
  );
}
