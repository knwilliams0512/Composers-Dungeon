/**
 * The layout engine: it decides where everything goes before anything is drawn.
 *
 * The job is the one a human engraver does with a pencil — work out how many
 * measures fit on a line, how many lines fit on a page, how much horizontal
 * room each measure has earned, and how far apart the staves must sit so that
 * nothing collides. The renderer that follows only reads coordinates.
 *
 * All output is in millimetres on the page, with the origin at the page's
 * top-left corner. The view layer scales millimetres to screen pixels, so zoom
 * never has to re-run any of this.
 */

import { keySignatureCount, ticksPerBar } from "@/lib/score";
import { instrumentById } from "./instruments";
import {
  PAGE_SIZES,
  keyAt,
  measureOffsets,
  meterAt,
  partIsEmpty,
  type Measure,
  type Part,
  type StudioScore,
} from "./model";

/** One staff of one part, positioned inside a system. */
export interface StaffBox {
  partId: string;
  staffId: string;
  partIndex: number;
  staffIndex: number;
  /** Top of the staff's five lines, in millimetres from the page top. */
  y: number;
  /** Distance between two adjacent staff lines. */
  lineGap: number;
  lines: number;
}

/** One measure's slot inside a system. */
export interface MeasureBox {
  index: number;
  /** Left edge, in millimetres from the page's left edge. */
  x: number;
  width: number;
  /** First tick of the measure, absolute in the piece. */
  startTick: number;
  ticks: number;
  /** True when this measure prints a clef, key or meter at its head. */
  showsClef: boolean;
  showsKey: boolean;
  showsMeter: boolean;
  /** Room taken by those head glyphs, measured from the measure's left edge. */
  headWidth: number;
}

export interface System {
  /** Top of the system's first staff. */
  y: number;
  /** Height from the first staff's top line to the last staff's bottom line. */
  height: number;
  /** Left edge of the first measure — after the part labels and brackets. */
  contentX: number;
  contentWidth: number;
  staves: StaffBox[];
  measures: MeasureBox[];
  /** Print full part names (first system) or short ones. */
  labels: "full" | "short" | "none";
}

export interface Page {
  index: number;
  width: number;
  height: number;
  systems: System[];
}

export interface EngravedScore {
  pages: Page[];
  /** Parts that were actually drawn, in order — empty ones may be hidden. */
  visibleParts: Part[];
  /** Millimetres per staff space, the unit staff-relative sizes are given in. */
  space: number;
}

/* -------------------------------------------------------------------------- */

/** Width in millimetres a key signature needs, given its accidental count. */
function keyWidth(accidentals: number, space: number): number {
  return Math.abs(accidentals) * space * 1.1 + (accidentals === 0 ? 0 : space * 0.6);
}

/**
 * How much horizontal room a measure has earned. Engravers give more space to
 * measures with more, and shorter, notes — a bar of sixteenths must not be
 * crammed into the same width as a bar holding one whole note. The square root
 * is the classical compromise: it grows with density but never linearly, or a
 * busy bar would swallow the system.
 */
function measureDemand(score: StudioScore, index: number, parts: Part[]): number {
  const { starts } = measureOffsets(score);
  const from = starts[index];
  const ticks = score.measures[index].pickupTicks ?? ticksPerBar(meterAt(score, index));
  const to = from + ticks;
  let events = 0;
  for (const p of parts) {
    for (const s of p.staves) {
      for (const v of s.voices) {
        for (const n of v.notes) if (n.start >= from && n.start < to) events++;
        for (const r of v.rests) if (r.start >= from && r.start < to) events++;
      }
    }
  }
  const beats = ticks / 4;
  return Math.max(1, beats) * (0.65 + Math.sqrt(Math.max(1, events)) * 0.35);
}

/* -------------------------------------------------------------------------- */

export function engrave(score: StudioScore): EngravedScore {
  const L = score.layout;
  const raw = PAGE_SIZES[L.pageSize];
  const pageW = L.orientation === "portrait" ? raw.w : raw.h;
  const pageH = L.orientation === "portrait" ? raw.h : raw.w;

  // A staff "space" is the gap between two lines: five lines span four of them.
  const space = L.staffSize / 4;

  const visibleParts = score.parts.filter(
    (p) => p.visible && !(L.hideEmptyStaves && partIsEmpty(p) && score.parts.length > 1)
  );
  const parts = visibleParts.length > 0 ? visibleParts : score.parts.slice(0, 1);

  // Room down the left edge for part names and the bracket column.
  const longestLabel = Math.max(
    ...parts.map((p) => (p.name ?? instrumentById(p.instrumentId).name).length),
    4
  );
  const labelWidth = Math.min(38, longestLabel * 1.5 + 6);
  const bracketWidth = score.groups.length > 0 || parts.some((p) => p.staves.length > 1) ? 3 : 0;

  const contentLeft = L.margins.left + labelWidth + bracketWidth;
  const contentWidth = pageW - contentLeft - L.margins.right;
  const shortContentLeft = L.margins.left + Math.min(20, longestLabel * 0.9 + 5) + bracketWidth;
  const shortContentWidth = pageW - shortContentLeft - L.margins.right;

  /* ---- Vertical shape of one system ------------------------------------- */

  const staffHeight = L.staffSize;
  const staffGap = staffHeight * L.staffSpacing;
  const groupGap = staffHeight * L.groupSpacing;

  const groupOfPart = new Map<string, string>();
  for (const g of score.groups) for (const id of g.partIds) groupOfPart.set(id, g.id);

  /** Staff offsets from the top of a system, and the system's total height. */
  const staffLayout: { partIndex: number; staffIndex: number; dy: number }[] = [];
  let dy = 0;
  parts.forEach((p, pi) => {
    if (pi > 0) {
      const prevGroup = groupOfPart.get(parts[pi - 1].id);
      const thisGroup = groupOfPart.get(p.id);
      dy += prevGroup && thisGroup && prevGroup === thisGroup ? staffGap : staffGap + groupGap;
    }
    p.staves.forEach((_, si) => {
      if (si > 0) dy += staffHeight * 1.3;
      staffLayout.push({ partIndex: pi, staffIndex: si, dy });
    });
  });
  const systemHeight = dy + staffHeight;
  const systemGap = staffHeight * L.systemSpacing;

  /* ---- Flow measures into systems --------------------------------------- */

  const { starts } = measureOffsets(score);
  const demands = score.measures.map((_, i) => measureDemand(score, i, parts));

  interface Run { from: number; to: number }
  const runs: Run[] = [];
  let runStart = 0;
  let runDemand = 0;
  // The first measure of every system re-prints the clef and key signature.
  const openKey = keyAt(score, 0);
  const perSystemHead =
    space * 4 + keyWidth(Math.abs(keySignatureCount(openKey.key, openKey.mode)), space);

  const target =
    L.measuresPerSystem === "auto" ? null : Math.max(1, L.measuresPerSystem);

  for (let i = 0; i < score.measures.length; i++) {
    const forced = i > runStart && score.measures[i - 1].systemBreak;
    const full =
      target !== null
        ? i - runStart >= target
        : runDemand > 0 &&
          (runDemand + demands[i]) * L.measureSpacing * space * 3.2 + perSystemHead >
            contentWidth;
    if (forced || full) {
      runs.push({ from: runStart, to: i - 1 });
      runStart = i;
      runDemand = 0;
    }
    runDemand += demands[i];
  }
  if (runStart < score.measures.length) {
    runs.push({ from: runStart, to: score.measures.length - 1 });
  }

  /* ---- Place systems on pages ------------------------------------------- */

  const usableTop = L.margins.top;
  const usableBottom = pageH - L.margins.bottom - (L.showPageNumbers ? 6 : 0);

  // The first page carries the title block, so it starts lower.
  const titleBlock =
    (score.info.title ? 10 : 0) +
    (score.info.subtitle ? 6 : 0) +
    (score.info.composer || score.info.arranger ? 6 : 0) +
    (score.info.title || score.info.composer ? 6 : 0);

  const pages: Page[] = [];
  let page: Page = { index: 0, width: pageW, height: pageH, systems: [] };
  let cursorY = usableTop + titleBlock;

  const pushPage = () => {
    pages.push(page);
    page = { index: pages.length, width: pageW, height: pageH, systems: [] };
    cursorY = usableTop;
  };

  runs.forEach((run, runIndex) => {
    if (page.systems.length > 0 && cursorY + systemHeight > usableBottom) pushPage();

    const isFirst = runIndex === 0;
    const cx = isFirst ? contentLeft : shortContentLeft;
    const cw = isFirst ? contentWidth : shortContentWidth;

    /* Horizontal: share the line among this system's measures by demand. */
    const runDemands = [];
    for (let i = run.from; i <= run.to; i++) runDemands.push(demands[i]);
    const totalDemand = runDemands.reduce((a, b) => a + b, 0) || 1;

    const headKey = keyAt(score, run.from);
    const sigCount = Math.abs(keySignatureCount(headKey.key, headKey.mode));
    const headWidth = space * 4 + keyWidth(sigCount, space) + space * 3;
    const free = Math.max(cw * 0.25, cw - headWidth);

    const measures: MeasureBox[] = [];
    let x = cx;
    for (let i = run.from; i <= run.to; i++) {
      const isRunHead = i === run.from;
      const prevMeter = i > 0 ? meterAt(score, i - 1) : null;
      const thisMeter = meterAt(score, i);
      const meterChanged =
        prevMeter === null || prevMeter.beats !== thisMeter.beats || prevMeter.unit !== thisMeter.unit;
      const prevKey = i > 0 ? keyAt(score, i - 1) : null;
      const thisKey = keyAt(score, i);
      const keyChanged =
        prevKey === null || prevKey.key !== thisKey.key || prevKey.mode !== thisKey.mode;

      const share = (demands[i] / totalDemand) * free;
      const mHead = isRunHead
        ? headWidth
        : (keyChanged ? keyWidth(sigCount, space) : 0) + (meterChanged ? space * 2.6 : 0);
      const width = share + (isRunHead ? headWidth : mHead);

      measures.push({
        index: i,
        x,
        width,
        startTick: starts[i],
        ticks: score.measures[i].pickupTicks ?? ticksPerBar(thisMeter),
        showsClef: isRunHead,
        showsKey: isRunHead || keyChanged,
        showsMeter: isRunHead ? meterChanged || i === 0 : meterChanged,
        headWidth: mHead,
      });
      x += width;
    }

    // Absorb rounding so the last measure lands exactly on the right margin.
    const overshoot = x - (cx + cw);
    if (measures.length > 0 && Math.abs(overshoot) > 0.01) {
      measures[measures.length - 1].width -= overshoot;
    }

    const staves = staffLayout.map((sl) => {
      const p = parts[sl.partIndex];
      const st = p.staves[sl.staffIndex];
      const scale = p.staffScale ?? 1;
      return {
        partId: p.id,
        staffId: st.id,
        partIndex: sl.partIndex,
        staffIndex: sl.staffIndex,
        y: cursorY + sl.dy,
        lineGap: (staffHeight * scale) / 4,
        lines: st.lines,
      };
    });

    page.systems.push({
      y: cursorY,
      height: systemHeight,
      contentX: cx,
      contentWidth: cw,
      staves,
      measures,
      labels: isFirst ? "full" : parts.length > 1 ? "short" : "none",
    });

    cursorY += systemHeight + systemGap;

    if (score.measures[run.to]?.pageBreak) pushPage();
  });

  // A page break on the final measure leaves a trailing empty page behind.
  if (page.systems.length > 0 || pages.length === 0) pages.push(page);

  return { pages, visibleParts: parts, space };
}

/** X position within a measure for a given tick. */
export function tickX(measure: MeasureBox, tick: number): number {
  const body = measure.width - measure.headWidth;
  const into = Math.max(0, Math.min(measure.ticks, tick - measure.startTick));
  return measure.x + measure.headWidth + (into / measure.ticks) * body * 0.94 + body * 0.03;
}

/** The measure box on a page containing a tick, if it is on that page. */
export function findMeasureBox(
  page: Page,
  tick: number
): { system: System; measure: MeasureBox } | null {
  for (const system of page.systems) {
    for (const measure of system.measures) {
      if (tick >= measure.startTick && tick < measure.startTick + measure.ticks) {
        return { system, measure };
      }
    }
  }
  return null;
}

/** Locate a measure index anywhere in the engraved score. */
export function locateMeasure(
  engraved: EngravedScore,
  index: number
): { page: Page; system: System; measure: MeasureBox } | null {
  for (const page of engraved.pages) {
    for (const system of page.systems) {
      const measure = system.measures.find((m) => m.index === index);
      if (measure) return { page, system, measure };
    }
  }
  return null;
}
