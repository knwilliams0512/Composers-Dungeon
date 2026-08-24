"use client";

import { useCallback, useMemo } from "react";
import {
  engrave,
  tickX,
  type EngravedScore,
  type MeasureBox,
  type StaffBox,
  type System,
} from "@/lib/studio/engrave";
import { instrumentById } from "@/lib/studio/instruments";
import {
  keyAt,
  meterAt,
  partName,
  partShortName,
  type Part,
  type Staff,
  type StudioNote,
  type StudioScore,
} from "@/lib/studio/model";
import { accidentalFor, noteValue, signatureSteps, stepForPitch } from "@/lib/studio/staff";
import {
  Accidental,
  ArticulationGlyph,
  Barline,
  Brace,
  Bracket,
  ClefGlyph,
  DynamicGlyph,
  Flag,
  HairpinGlyph,
  INK,
  INK_FAINT,
  INK_SOFT,
  Notehead,
  OrnamentGlyph,
  PLAYING,
  Rest,
  SELECT,
  TimeSignature,
  clefWidth,
} from "./glyphs";

/**
 * The engraved score itself: real pages of sheet music, drawn from the layout
 * the engraver computed, and the surface the composer writes on.
 *
 * Nothing here decides where anything goes — `lib/studio/engrave.ts` did that.
 * This draws what it is told and turns clicks back into musical positions.
 */

export interface Selection {
  kind: "note" | "measure" | "part" | "none";
  noteIds?: string[];
  measureIndex?: number;
  partId?: string;
  staffId?: string;
}

export interface CanvasProps {
  score: StudioScore;
  zoom: number;
  selection: Selection;
  /** Absolute tick the playhead sits at, or null when stopped. */
  playhead: number | null;
  /** Where the next note will be written. */
  cursor: { measureIndex: number; tick: number; partId: string; staffId: string } | null;
  noteInput: boolean;
  onSelect: (sel: Selection) => void;
  onPlaceNote: (partId: string, staffId: string, tick: number, step: number, clef: string) => void;
  onRemoveNote: (partId: string, staffId: string, noteId: string) => void;
  onMoveCursor: (measureIndex: number, tick: number, partId: string, staffId: string) => void;
}

const PAGE_SHADOW = "0 2px 14px rgba(0,0,0,0.28)";

export function ScoreCanvas({
  score,
  zoom,
  selection,
  playhead,
  cursor,
  noteInput,
  onSelect,
  onPlaceNote,
  onRemoveNote,
  onMoveCursor,
}: CanvasProps) {
  const engraved: EngravedScore = useMemo(() => engrave(score), [score]);

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {engraved.pages.map((page) => (
        <PageView
          key={page.index}
          page={page}
          engraved={engraved}
          score={score}
          zoom={zoom}
          selection={selection}
          playhead={playhead}
          cursor={cursor}
          noteInput={noteInput}
          onSelect={onSelect}
          onPlaceNote={onPlaceNote}
          onRemoveNote={onRemoveNote}
          onMoveCursor={onMoveCursor}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function PageView({
  page,
  engraved,
  score,
  zoom,
  selection,
  playhead,
  cursor,
  noteInput,
  onSelect,
  onPlaceNote,
  onRemoveNote,
  onMoveCursor,
}: {
  page: EngravedScore["pages"][number];
  engraved: EngravedScore;
} & Omit<CanvasProps, "score"> & { score: StudioScore }) {
  const L = score.layout;
  const sp = L.staffSize / 4;
  const parts = engraved.visibleParts;

  /** Turn a click anywhere on the page into the staff and tick beneath it. */
  const locate = useCallback(
    (evt: React.MouseEvent<SVGSVGElement>) => {
      const svg = evt.currentTarget;
      const rect = svg.getBoundingClientRect();
      const mx = ((evt.clientX - rect.left) / rect.width) * page.width;
      const my = ((evt.clientY - rect.top) / rect.height) * page.height;

      let best: { system: System; staff: StaffBox; measure: MeasureBox; dist: number } | null = null;
      for (const system of page.systems) {
        for (const staff of system.staves) {
          const mid = staff.y + staff.lineGap * 2;
          const dist = Math.abs(my - mid);
          // Only claim clicks within a staff's own vertical territory.
          if (dist > staff.lineGap * 6) continue;
          const measure = system.measures.find((m) => mx >= m.x && mx < m.x + m.width);
          if (!measure) continue;
          if (!best || dist < best.dist) best = { system, staff, measure, dist };
        }
      }
      if (!best) return null;

      const { staff, measure } = best;
      // Which line or space: step 0 is the bottom line, and y grows downward.
      const bottomLine = staff.y + staff.lineGap * 4;
      const step = Math.round((bottomLine - my) / (staff.lineGap / 2));

      // Which tick: snap to the grid the current duration implies.
      const body = measure.width - measure.headWidth;
      const into = Math.max(0, Math.min(1, (mx - measure.x - measure.headWidth) / (body || 1)));
      const rawTick = measure.startTick + into * measure.ticks;

      return { staff, measure, step, tick: rawTick };
    },
    [page]
  );

  const handleClick = (evt: React.MouseEvent<SVGSVGElement>) => {
    const hit = locate(evt);
    if (!hit) return;
    const part = parts[hit.staff.partIndex];
    const staffModel = part.staves[hit.staff.staffIndex];
    if (noteInput) {
      onPlaceNote(part.id, staffModel.id, hit.tick, hit.step, staffModel.clef);
    } else {
      onMoveCursor(hit.measure.index, hit.tick, part.id, staffModel.id);
      onSelect({
        kind: "measure",
        measureIndex: hit.measure.index,
        partId: part.id,
        staffId: staffModel.id,
      });
    }
  };

  const pxW = page.width * zoom;
  const pxH = page.height * zoom;

  return (
    <div
      className="relative bg-white"
      style={{ width: pxW, height: pxH, boxShadow: PAGE_SHADOW }}
    >
      <svg
        viewBox={`0 0 ${page.width} ${page.height}`}
        width={pxW}
        height={pxH}
        onClick={handleClick}
        style={{ display: "block", cursor: noteInput ? "crosshair" : "default" }}
      >
        {page.index === 0 && <TitleBlock score={score} page={page} />}

        {page.systems.map((system, si) => (
          <SystemView
            key={si}
            system={system}
            score={score}
            parts={parts}
            sp={sp}
            selection={selection}
            playhead={playhead}
            cursor={cursor}
            onSelect={onSelect}
            onRemoveNote={onRemoveNote}
          />
        ))}

        {L.showPageNumbers && page.index >= 0 && (
          <text
            x={page.width / 2}
            y={page.height - L.margins.bottom / 2}
            textAnchor="middle"
            fontSize={sp * 1.4}
            fill={INK_SOFT}
            fontFamily="Georgia, serif"
          >
            {page.index + 1}
          </text>
        )}
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function TitleBlock({
  score,
  page,
}: {
  score: StudioScore;
  page: EngravedScore["pages"][number];
}) {
  const { info, layout } = score;
  const cx = page.width / 2;
  let y = layout.margins.top;
  const rows: React.ReactNode[] = [];
  if (info.title) {
    y += 7;
    rows.push(
      <text key="t" x={cx} y={y} textAnchor="middle" fontSize={7} fontFamily="Georgia, serif" fontWeight={700} fill={INK}>
        {info.title}
      </text>
    );
  }
  if (info.subtitle) {
    y += 5.5;
    rows.push(
      <text key="s" x={cx} y={y} textAnchor="middle" fontSize={4} fontFamily="Georgia, serif" fontStyle="italic" fill={INK_SOFT}>
        {info.subtitle}
      </text>
    );
  }
  if (info.lyricist) {
    rows.push(
      <text key="l" x={layout.margins.left} y={y + 5} fontSize={3.4} fontFamily="Georgia, serif" fill={INK_SOFT}>
        {info.lyricist}
      </text>
    );
  }
  if (info.composer || info.arranger) {
    rows.push(
      <text
        key="c"
        x={page.width - layout.margins.right}
        y={y + 5}
        textAnchor="end"
        fontSize={3.4}
        fontFamily="Georgia, serif"
        fill={INK_SOFT}
      >
        {[info.composer, info.arranger && `arr. ${info.arranger}`].filter(Boolean).join(" · ")}
      </text>
    );
  }
  return <g>{rows}</g>;
}

/* -------------------------------------------------------------------------- */

function SystemView({
  system,
  score,
  parts,
  sp,
  selection,
  playhead,
  cursor,
  onSelect,
  onRemoveNote,
}: {
  system: System;
  score: StudioScore;
  parts: Part[];
  sp: number;
  selection: Selection;
  playhead: number | null;
  cursor: CanvasProps["cursor"];
  onSelect: (s: Selection) => void;
  onRemoveNote: (partId: string, staffId: string, noteId: string) => void;
}) {
  const L = score.layout;
  const first = system.measures[0];
  const last = system.measures[system.measures.length - 1];
  if (!first || !last) return null;

  const top = system.staves[0].y;
  const bottom =
    system.staves[system.staves.length - 1].y + system.staves[system.staves.length - 1].lineGap * 4;

  return (
    <g>
      {/* Staff lines */}
      {system.staves.map((staff) => {
        const part = parts[staff.partIndex];
        const lines = staff.lines;
        // A one-line percussion staff draws only its middle line.
        const start = lines === 5 ? 0 : Math.floor((5 - lines) / 2);
        return (
          <g key={staff.staffId}>
            {Array.from({ length: lines }).map((_, i) => {
              const y = staff.y + (start + i) * staff.lineGap;
              return (
                <line
                  key={i}
                  x1={system.contentX}
                  y1={y}
                  x2={last.x + last.width}
                  y2={y}
                  stroke={INK}
                  strokeWidth={sp * 0.09}
                />
              );
            })}
          </g>
        );
      })}

      {/* The left edge: system barline, brackets, braces and part names */}
      <rect x={system.contentX} y={top} width={sp * 0.13} height={bottom - top} fill={INK} />

      {score.groups.map((g) => {
        const indices = system.staves.filter((s) => g.partIds.includes(s.partId));
        if (indices.length === 0) return null;
        const gTop = Math.min(...indices.map((s) => s.y));
        const gBottom = Math.max(...indices.map((s) => s.y + s.lineGap * 4));
        return g.symbol === "brace" ? (
          <Brace key={g.id} x={system.contentX - sp * 1.6} top={gTop} bottom={gBottom} sp={sp} />
        ) : (
          <Bracket key={g.id} x={system.contentX - sp * 1.6} top={gTop} bottom={gBottom} sp={sp} />
        );
      })}

      {/* A keyboard instrument's own two staves get a brace of their own. */}
      {parts.map((p, pi) => {
        if (p.staves.length < 2) return null;
        if (!instrumentById(p.instrumentId).brace) return null;
        const own = system.staves.filter((s) => s.partIndex === pi);
        if (own.length < 2) return null;
        const bTop = Math.min(...own.map((s) => s.y));
        const bBottom = Math.max(...own.map((s) => s.y + s.lineGap * 4));
        return (
          <Brace key={`brace-${p.id}`} x={system.contentX - sp * 1.5} top={bTop} bottom={bBottom} sp={sp} />
        );
      })}

      {system.labels !== "none" &&
        parts.map((p, pi) => {
          const own = system.staves.filter((s) => s.partIndex === pi);
          if (own.length === 0) return null;
          const cy =
            (Math.min(...own.map((s) => s.y)) +
              Math.max(...own.map((s) => s.y + s.lineGap * 4))) /
            2;
          return (
            <text
              key={`label-${p.id}`}
              x={system.contentX - sp * 2.2}
              y={cy + sp * 0.4}
              textAnchor="end"
              fontSize={sp * 1.25}
              fontFamily="Georgia, serif"
              fill={INK}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect({ kind: "part", partId: p.id });
              }}
            >
              {system.labels === "full" ? partName(p) : partShortName(p)}
            </text>
          );
        })}

      {/* Measures */}
      {system.measures.map((measure) => (
        <MeasureView
          key={measure.index}
          measure={measure}
          system={system}
          score={score}
          parts={parts}
          sp={sp}
          selection={selection}
          onSelect={onSelect}
          onRemoveNote={onRemoveNote}
        />
      ))}

      {/* Measure numbers above the system */}
      {L.measureNumbers !== "none" &&
        system.measures.map((m, i) =>
          L.measureNumbers === "every" || i === 0 ? (
            <text
              key={`n${m.index}`}
              x={m.x + sp * 0.4}
              y={top - sp * 1.1}
              fontSize={sp * 1}
              fill={INK_SOFT}
              fontFamily="Georgia, serif"
            >
              {m.index + 1}
            </text>
          ) : null
        )}

      {/* Rehearsal marks */}
      {system.measures.map((m) => {
        const mark = score.measures[m.index]?.rehearsal;
        if (!mark) return null;
        return (
          <g key={`r${m.index}`}>
            <rect
              x={m.x - sp * 0.2}
              y={top - sp * 3.6}
              width={sp * (1.2 + mark.length * 0.9)}
              height={sp * 2}
              fill="none"
              stroke={INK}
              strokeWidth={sp * 0.1}
            />
            <text x={m.x + sp * 0.4} y={top - sp * 2.2} fontSize={sp * 1.5} fontWeight={700} fontFamily="Georgia, serif" fill={INK}>
              {mark}
            </text>
          </g>
        );
      })}

      {/* Tempo, at the very start of the piece */}
      {system.measures[0].index === 0 && (
        <text
          x={system.contentX}
          y={top - sp * 2.4}
          fontSize={sp * 1.5}
          fontFamily="Georgia, serif"
          fontWeight={700}
          fill={INK}
        >
          ♩ = {score.tempo}
        </text>
      )}

      {/* Playhead */}
      {playhead !== null &&
        (() => {
          const m = system.measures.find(
            (mm) => playhead >= mm.startTick && playhead < mm.startTick + mm.ticks
          );
          if (!m) return null;
          const x = tickX(m, playhead);
          return (
            <rect x={x - sp * 0.08} y={top - sp} width={sp * 0.16} height={bottom - top + sp * 2} fill={PLAYING} opacity={0.75} />
          );
        })()}

      {/* Note-entry cursor */}
      {cursor !== null &&
        (() => {
          const m = system.measures.find((mm) => mm.index === cursor.measureIndex);
          if (!m) return null;
          const staff = system.staves.find(
            (s) => parts[s.partIndex]?.id === cursor.partId &&
              parts[s.partIndex]?.staves[s.staffIndex]?.id === cursor.staffId
          );
          if (!staff) return null;
          const x = tickX(m, cursor.tick);
          return (
            <rect
              x={x - sp * 0.06}
              y={staff.y - sp * 0.8}
              width={sp * 0.12}
              height={staff.lineGap * 4 + sp * 1.6}
              fill={SELECT}
              opacity={0.85}
            />
          );
        })()}
    </g>
  );
}

/* -------------------------------------------------------------------------- */

function MeasureView({
  measure,
  system,
  score,
  parts,
  sp,
  selection,
  onSelect,
  onRemoveNote,
}: {
  measure: MeasureBox;
  system: System;
  score: StudioScore;
  parts: Part[];
  sp: number;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onRemoveNote: (partId: string, staffId: string, noteId: string) => void;
}) {
  const meter = meterAt(score, measure.index);
  const { key, mode } = keyAt(score, measure.index);
  const measureModel = score.measures[measure.index];
  const selected = selection.kind === "measure" && selection.measureIndex === measure.index;

  const top = system.staves[0].y;
  const bottom =
    system.staves[system.staves.length - 1].y + system.staves[system.staves.length - 1].lineGap * 4;

  return (
    <g>
      {selected && (
        <rect
          x={measure.x}
          y={top - sp}
          width={measure.width}
          height={bottom - top + sp * 2}
          fill={SELECT}
          opacity={0.07}
        />
      )}

      {system.staves.map((staff) => {
        const part = parts[staff.partIndex];
        const staffModel = part.staves[staff.staffIndex];
        return (
          <StaffMeasure
            key={staff.staffId}
            staff={staff}
            staffModel={staffModel}
            part={part}
            measure={measure}
            meter={meter}
            musicKey={key}
            mode={mode}
            sp={sp}
            selection={selection}
            onSelect={onSelect}
            onRemoveNote={onRemoveNote}
          />
        );
      })}

      {/* The barline closing this measure, drawn through the whole system */}
      <Barline
        style={measureModel?.barline ?? "single"}
        x={measure.x + measure.width}
        top={top}
        bottom={bottom}
        sp={sp}
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */

function StaffMeasure({
  staff,
  staffModel,
  part,
  measure,
  meter,
  musicKey,
  mode,
  sp,
  selection,
  onSelect,
  onRemoveNote,
}: {
  staff: StaffBox;
  staffModel: Staff;
  part: Part;
  measure: MeasureBox;
  meter: { beats: number; unit: number };
  musicKey: string;
  mode: "major" | "minor";
  sp: number;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onRemoveNote: (partId: string, staffId: string, noteId: string) => void;
}) {
  const gap = staff.lineGap;
  const bottomLine = staff.y + gap * 4;
  const midLine = staff.y + gap * 2;
  const yForStep = (step: number) => bottomLine - (step * gap) / 2;

  let headX = measure.x + sp * 0.6;

  const heads: React.ReactNode[] = [];

  if (measure.showsClef) {
    heads.push(
      <ClefGlyph key="clef" clef={staffModel.clef} x={headX} y={staff.y} sp={gap} />
    );
    headX += clefWidth(staffModel.clef, gap);
  }

  if (measure.showsKey && staffModel.clef !== "percussion" && staffModel.clef !== "tab") {
    const steps = signatureSteps(staffModel.clef, musicKey, mode);
    const isSharp = signatureIsSharp(musicKey, mode);
    steps.forEach((st, i) => {
      heads.push(
        <Accidental
          key={`sig${i}`}
          kind={isSharp ? "sharp" : "flat"}
          x={headX + i * gap * 1.1 + gap * 0.5}
          y={yForStep(st)}
          sp={gap}
        />
      );
    });
    if (steps.length > 0) headX += steps.length * gap * 1.1 + gap * 0.7;
  }

  if (measure.showsMeter) {
    heads.push(
      <TimeSignature key="meter" beats={meter.beats} unit={meter.unit} x={headX + gap} y={staff.y} sp={gap} />
    );
    headX += gap * 2.8;
  }

  /* ---- Notes and rests ------------------------------------------------- */

  const from = measure.startTick;
  const to = from + measure.ticks;

  const bodies: React.ReactNode[] = [];

  staffModel.voices.forEach((voice, vi) => {
    const inBar = voice.notes.filter((n) => n.start >= from && n.start < to);

    // Notes starting on the same tick form a chord and share one stem.
    const byTick = new Map<number, StudioNote[]>();
    for (const n of inBar) {
      const list = byTick.get(n.start) ?? [];
      list.push(n);
      byTick.set(n.start, list);
    }

    for (const [tick, chord] of Array.from(byTick.entries())) {
      const x = tickX(measure, tick);
      const value = noteValue(chord[0].duration);
      const steps = chord.map((n) =>
        stepForPitch(n.pitch, staffModel.clef, musicKey, mode, n.spell)
      );
      const avg = steps.reduce((a, b) => a + b, 0) / steps.length;
      // Two voices on one staff always point away from each other; a single
      // voice follows the old rule of stemming away from the middle line.
      const forced = chord[0].stem;
      const up =
        forced === "up" ? true : forced === "down" ? false
        : staffModel.voices.length > 1 ? vi === 0
        : avg < 4;

      bodies.push(
        <ChordGroup
          key={`${voice.id}-${tick}`}
          chord={chord}
          steps={steps}
          x={x}
          up={up}
          value={value}
          gap={gap}
          yForStep={yForStep}
          staffTop={staff.y}
          clef={staffModel.clef}
          musicKey={musicKey}
          mode={mode}
          selection={selection}
          onSelect={onSelect}
          onRemove={(id) => onRemoveNote(part.id, staffModel.id, id)}
        />
      );
    }

    for (const r of voice.rests) {
      if (r.start < from || r.start >= to) continue;
      bodies.push(
        <Rest
          key={r.id}
          value={r.duration}
          x={tickX(measure, r.start)}
          midY={midLine}
          sp={gap}
          color={INK_SOFT}
        />
      );
    }

    // A voice with nothing in the bar rests for its whole length.
    if (inBar.length === 0 && voice.rests.every((r) => r.start < from || r.start >= to)) {
      if (staffModel.voices.length === 1 || vi === 0) {
        bodies.push(
          <Rest
            key={`empty-${voice.id}`}
            value={16}
            x={measure.x + measure.headWidth + (measure.width - measure.headWidth) / 2}
            midY={midLine}
            sp={gap}
            color={INK_FAINT}
          />
        );
      }
    }
  });

  /* ---- Dynamics, hairpins and text ------------------------------------- */

  const marks: React.ReactNode[] = [];
  for (const d of staffModel.dynamics) {
    if (d.start < from || d.start >= to) continue;
    marks.push(
      <DynamicGlyph key={d.id} value={d.value} x={tickX(measure, d.start)} y={bottomLine + gap * 3} sp={gap} />
    );
  }
  for (const h of staffModel.hairpins) {
    if (h.start >= to || h.start + h.duration <= from) continue;
    const x1 = tickX(measure, Math.max(from, h.start));
    const x2 = tickX(measure, Math.min(to - 0.01, h.start + h.duration));
    marks.push(
      <HairpinGlyph key={h.id} kind={h.kind} x1={x1} x2={x2} y={bottomLine + gap * 2.6} sp={gap} />
    );
  }
  for (const t of staffModel.texts) {
    if (t.start < from || t.start >= to) continue;
    const isLyric = t.kind === "lyric";
    marks.push(
      <text
        key={t.id}
        x={tickX(measure, t.start)}
        y={isLyric ? bottomLine + gap * 4.2 : staff.y - gap * 1.4}
        fontSize={gap * 1.25}
        fontFamily="Georgia, serif"
        fontStyle={t.kind === "expression" ? "italic" : "normal"}
        fontWeight={t.kind === "tempo" ? 700 : 400}
        fill={INK}
        textAnchor={isLyric ? "middle" : "start"}
      >
        {t.text}
      </text>
    );
  }

  return (
    <g>
      {heads}
      {bodies}
      {marks}
    </g>
  );
}

/** True when this key's signature is written with sharps. */
function signatureIsSharp(key: string, mode: "major" | "minor"): boolean {
  const steps = signatureSteps("treble", key, mode);
  if (steps.length === 0) return true;
  // The sharp table starts on F (step 8); the flat table starts on B (step 4).
  return steps[0] === 8;
}

/* -------------------------------------------------------------------------- */

function ChordGroup({
  chord,
  steps,
  x,
  up,
  value,
  gap,
  yForStep,
  staffTop,
  clef,
  musicKey,
  mode,
  selection,
  onSelect,
  onRemove,
}: {
  chord: StudioNote[];
  steps: number[];
  x: number;
  up: boolean;
  value: ReturnType<typeof noteValue>;
  gap: number;
  yForStep: (s: number) => number;
  staffTop: number;
  clef: string;
  musicKey: string;
  mode: "major" | "minor";
  selection: Selection;
  onSelect: (s: Selection) => void;
  onRemove: (id: string) => void;
}) {
  const selectedIds = new Set(selection.noteIds ?? []);
  const highest = Math.max(...steps);
  const lowest = Math.min(...steps);

  const stemTop = up ? yForStep(highest) - gap * 3.4 : yForStep(lowest) + gap * 3.4;
  const stemX = up ? x + gap * 0.58 : x - gap * 0.58;

  return (
    <g>
      {/* Ledger lines, above and below the staff, for the outermost notes */}
      {ledgerSteps(lowest, highest).map((st) => (
        <line
          key={`l${st}`}
          x1={x - gap * 0.95}
          y1={yForStep(st)}
          x2={x + gap * 0.95}
          y2={yForStep(st)}
          stroke={INK}
          strokeWidth={gap * 0.09}
        />
      ))}

      {/* Stem */}
      {value.stemmed && (
        <line
          x1={stemX}
          y1={yForStep(up ? lowest : highest)}
          x2={stemX}
          y2={stemTop}
          stroke={INK}
          strokeWidth={gap * 0.12}
        />
      )}

      {/* Flags, on the outermost note only */}
      {value.stemmed && value.flags > 0 && (
        <Flag count={value.flags} x={stemX} y={stemTop} up={up} sp={gap} />
      )}

      {chord.map((n, i) => {
        const step = steps[i];
        const y = yForStep(step);
        const isSel = selectedIds.has(n.id);
        const color = isSel ? SELECT : INK;
        const acc = accidentalFor(n.pitch, clef as never, musicKey, mode, n.spell);

        return (
          <g key={n.id}>
            {acc && <Accidental kind={acc} x={x - gap * 1.5} y={y} sp={gap} color={color} />}

            <g
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                if (e.altKey || e.metaKey) onRemove(n.id);
                else onSelect({ kind: "note", noteIds: [n.id] });
              }}
            >
              <Notehead
                style={n.notehead ?? "normal"}
                hollow={value.hollow}
                x={x}
                y={y}
                sp={gap}
                color={color}
              />
              {/* A generous invisible target so small noteheads stay clickable */}
              <circle cx={x} cy={y} r={gap * 0.9} fill="transparent" />
            </g>

            {/* Dots sit in a space, never on a line */}
            {Array.from({ length: n.dots ?? value.dots }).map((_, di) => (
              <circle
                key={di}
                cx={x + gap * (1.15 + di * 0.45)}
                cy={step % 2 === 0 ? y - gap * 0.5 : y}
                r={gap * 0.16}
                fill={color}
              />
            ))}

            {/* Articulations, on the side away from the stem */}
            {(n.articulations ?? []).map((a, ai) => (
              <ArticulationGlyph
                key={a}
                kind={a}
                x={x}
                y={up ? y + gap * (1.2 + ai * 0.7) : y - gap * (1.2 + ai * 0.7)}
                sp={gap}
                above={!up}
                color={color}
              />
            ))}

            {/* Ornaments always sit above the staff */}
            {(n.ornaments ?? []).map((o, oi) => (
              <OrnamentGlyph
                key={o}
                kind={o}
                x={x}
                y={staffTop - gap * (1.2 + oi * 1.4)}
                sp={gap}
                color={color}
              />
            ))}

            {n.tie && (
              <path
                d={`M ${x + gap * 0.7} ${y + (up ? gap * 0.6 : -gap * 0.6)} q ${gap * 1.4} ${up ? gap : -gap}, ${gap * 2.8} 0`}
                fill="none"
                stroke={color}
                strokeWidth={gap * 0.1}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

/** The ledger lines a chord needs, above and below the five staff lines. */
function ledgerSteps(lowest: number, highest: number): number[] {
  const out: number[] = [];
  for (let s = 10; s <= highest; s += 2) out.push(s);
  for (let s = -2; s >= lowest; s -= 2) out.push(s);
  return out;
}
