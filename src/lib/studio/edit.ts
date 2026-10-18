/**
 * Score edits, as pure functions.
 *
 * Every one takes a score and returns a new score, touching nothing else. That
 * keeps undo a matter of remembering old values, and keeps the editor's event
 * handlers short enough to read.
 */

import { ticksPerBar } from "@/lib/score";
import { ensembleById, instrumentById } from "./instruments";
import type { Clef } from "./instruments";
import {
  emptyVoice,
  measureOffsets,
  meterAt,
  partFor,
  staffFor,
  uid,
  type Articulation,
  type BarlineStyle,
  type ChordQuality,
  type ChordSymbol,
  type Dynamic,
  type Fermata,
  type Measure,
  type Ornament,
  type Part,
  type PedalLine,
  type RepeatDirective,
  type RepeatSign,
  type Staff,
  type StudioNote,
  type StudioRest,
  type StudioScore,
} from "./model";

/* -------------------------------------------------------------------------- */
/* Notes                                                                       */
/* -------------------------------------------------------------------------- */

/** Replace one staff wherever it lives, leaving the rest of the score alone. */
function mapStaff(
  score: StudioScore,
  partId: string,
  staffId: string,
  fn: (s: Staff) => Staff
): StudioScore {
  return {
    ...score,
    parts: score.parts.map((p) =>
      p.id !== partId
        ? p
        : { ...p, staves: p.staves.map((s) => (s.id === staffId ? fn(s) : s)) }
    ),
  };
}

function mapVoice(
  score: StudioScore,
  partId: string,
  staffId: string,
  voiceIndex: number,
  fn: (notes: StudioNote[]) => StudioNote[]
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => {
    const voices = [...s.voices];
    while (voices.length <= voiceIndex) voices.push(emptyVoice());
    voices[voiceIndex] = { ...voices[voiceIndex], notes: fn(voices[voiceIndex].notes) };
    return { ...s, voices };
  });
}

/**
 * Write a note, or take it away again if an identical one is already there.
 *
 * Anything the new note overlaps in the same voice is trimmed or removed, the
 * way a notation editor overwrites rather than stacking notes on top of each
 * other. Notes at the very same tick are left alone: those are the chord the
 * writer is building.
 */
export function toggleNote(
  score: StudioScore,
  opts: {
    partId: string;
    staffId: string;
    voiceIndex: number;
    tick: number;
    pitch: number;
    duration: number;
    spell?: -1 | 0 | 1;
    dots?: 0 | 1 | 2;
    chord?: boolean;
  }
): StudioScore {
  const { partId, staffId, voiceIndex, tick, pitch, duration, spell, dots, chord } = opts;

  return mapVoice(score, partId, staffId, voiceIndex, (notes) => {
    const existing = notes.find((n) => n.start === tick && n.pitch === pitch);
    if (existing) return notes.filter((n) => n !== existing);

    const kept = notes.filter((n) => {
      if (chord && n.start === tick) return true;
      // Drop anything this note lands on top of.
      return n.start + n.duration <= tick || n.start >= tick + duration;
    });

    const note: StudioNote = { id: uid(), start: tick, duration, pitch };
    if (spell !== undefined) note.spell = spell;
    if (dots) note.dots = dots;

    return [...kept, note].sort((a, b) => a.start - b.start || a.pitch - b.pitch);
  });
}

export function removeNote(
  score: StudioScore,
  partId: string,
  staffId: string,
  noteId: string
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => ({
    ...s,
    voices: s.voices.map((v) => ({ ...v, notes: v.notes.filter((n) => n.id !== noteId) })),
  }));
}

/** Apply a patch to whichever note carries this id, wherever it lives. */
export function updateNote(
  score: StudioScore,
  noteId: string,
  patch: Partial<StudioNote>
): StudioScore {
  return {
    ...score,
    parts: score.parts.map((p) => ({
      ...p,
      staves: p.staves.map((s) => ({
        ...s,
        voices: s.voices.map((v) => ({
          ...v,
          notes: v.notes.map((n) => (n.id === noteId ? { ...n, ...patch } : n)),
        })),
      })),
    })),
  };
}

export function findNote(
  score: StudioScore,
  noteId: string
): { note: StudioNote; partId: string; staffId: string; voiceIndex: number } | null {
  for (const p of score.parts) {
    for (const s of p.staves) {
      for (let vi = 0; vi < s.voices.length; vi++) {
        const note = s.voices[vi].notes.find((n) => n.id === noteId);
        if (note) return { note, partId: p.id, staffId: s.id, voiceIndex: vi };
      }
    }
  }
  return null;
}

/** Toggle one articulation on a note. */
export function toggleArticulation(
  score: StudioScore,
  noteId: string,
  articulation: Articulation
): StudioScore {
  const found = findNote(score, noteId);
  if (!found) return score;
  const have = found.note.articulations ?? [];
  return updateNote(score, noteId, {
    articulations: have.includes(articulation)
      ? have.filter((a) => a !== articulation)
      : [...have, articulation],
  });
}

export function toggleOrnament(
  score: StudioScore,
  noteId: string,
  ornament: Ornament
): StudioScore {
  const found = findNote(score, noteId);
  if (!found) return score;
  const have = found.note.ornaments ?? [];
  return updateNote(score, noteId, {
    ornaments: have.includes(ornament)
      ? have.filter((o) => o !== ornament)
      : [...have, ornament],
  });
}

/** Hold a note, or let go of it again. */
export function toggleFermata(
  score: StudioScore,
  noteId: string,
  fermata: Fermata = "normal"
): StudioScore {
  const found = findNote(score, noteId);
  if (!found) return score;
  // Clicking the same shape twice takes it off; clicking a different one
  // changes the shape rather than removing and re-adding it.
  const next = found.note.fermata === fermata ? undefined : fermata;
  return updateNote(score, noteId, { fermata: next });
}

/**
 * Write a fingering over a note, or clear it.
 *
 * Four characters, because that is what fits above a notehead and because
 * anything longer is a technique instruction rather than a fingering. Blank
 * clears it rather than printing an empty string, which would still reserve
 * the space above the staff.
 */
export function setFingering(score: StudioScore, noteId: string, text: string): StudioScore {
  const found = findNote(score, noteId);
  if (!found) return score;
  const clean = text.trim().slice(0, 4);
  return updateNote(score, noteId, { fingering: clean.length > 0 ? clean : undefined });
}

/** Hold a rest — the pause before a chorale's last chord. */
export function toggleRestFermata(
  score: StudioScore,
  partId: string,
  staffId: string,
  restId: string,
  fermata: Fermata = "normal"
): StudioScore {
  return mapStaff(score, partId, staffId, (st) => ({
    ...st,
    voices: st.voices.map((v) => ({
      ...v,
      rests: v.rests.map((r: StudioRest) =>
        r.id !== restId ? r : { ...r, fermata: r.fermata === fermata ? undefined : fermata }
      ),
    })),
  }));
}

/**
 * Respell a note as its enharmonic twin: D♯ becomes E♭ and back. The sounding
 * pitch never moves — only the line it is written on.
 */
export function respell(score: StudioScore, noteId: string): StudioScore {
  const found = findNote(score, noteId);
  if (!found) return score;
  const current = found.note.spell;
  // Sharp becomes flat, flat becomes sharp, and an unmarked note picks a side.
  const next: -1 | 0 | 1 = current === 1 ? -1 : current === -1 ? 1 : 1;
  return updateNote(score, noteId, { spell: next });
}

/* -------------------------------------------------------------------------- */
/* Dynamics, hairpins and text                                                 */
/* -------------------------------------------------------------------------- */

export function addDynamic(
  score: StudioScore,
  partId: string,
  staffId: string,
  start: number,
  value: Dynamic
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => ({
    ...s,
    dynamics: [...s.dynamics.filter((d) => d.start !== start), { id: uid("d"), start, value }],
  }));
}

export function addHairpin(
  score: StudioScore,
  partId: string,
  staffId: string,
  start: number,
  duration: number,
  kind: "crescendo" | "diminuendo"
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => ({
    ...s,
    hairpins: [...s.hairpins, { id: uid("h"), start, duration, kind }],
  }));
}

export function addText(
  score: StudioScore,
  partId: string,
  staffId: string,
  start: number,
  kind: "tempo" | "rehearsal" | "technique" | "expression" | "staff" | "system" | "lyric",
  text: string
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => ({
    ...s,
    texts: [...s.texts, { id: uid("t"), start, kind, text }],
  }));
}

export function addOctaveLine(
  score: StudioScore,
  partId: string,
  staffId: string,
  start: number,
  duration: number,
  shift: 1 | -1
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => ({
    ...s,
    octaveLines: [...s.octaveLines, { id: uid("o"), start, duration, shift }],
  }));
}

/* -------------------------------------------------------------------------- */
/* Pedal lines                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Lay a pedal line down.
 *
 * Overlapping lines of the same kind are merged rather than stacked: a piano
 * has one sustain pedal and it is either down or up, so two overlapping sustain
 * lines are not a richer marking, they are a contradiction. Different kinds do
 * overlap freely — sustain and sostenuto held together is ordinary Debussy.
 */
export function addPedal(
  score: StudioScore,
  partId: string,
  staffId: string,
  start: number,
  duration: number,
  kind: PedalLine["kind"] = "sustain"
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => {
    const existing = s.pedals ?? [];
    const end = start + duration;
    const sameKind = existing.filter((p) => p.kind === kind);
    const touching = sameKind.filter((p) => p.start <= end && p.start + p.duration >= start);
    const from = Math.min(start, ...touching.map((p) => p.start));
    const to = Math.max(end, ...touching.map((p) => p.start + p.duration));
    // A merged line keeps the retakes of everything it swallowed, which is
    // what a pianist means: the notches stay where the harmony changes.
    const retakes = Array.from(
      new Set(touching.flatMap((p) => p.retakes ?? []).filter((t) => t > from && t < to))
    ).sort((a, b) => a - b);
    const kept = existing.filter((p) => !touching.includes(p));
    return {
      ...s,
      pedals: [
        ...kept,
        { id: uid("ped"), start: from, duration: to - from, kind, ...(retakes.length ? { retakes } : {}) },
      ].sort((a, b) => a.start - b.start),
    };
  });
}

export function removePedal(
  score: StudioScore,
  partId: string,
  staffId: string,
  pedalId: string
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => ({
    ...s,
    pedals: (s.pedals ?? []).filter((p) => p.id !== pedalId),
  }));
}

/** Put a lift-and-retake notch in a pedal line, or take one out. */
export function togglePedalRetake(
  score: StudioScore,
  partId: string,
  staffId: string,
  pedalId: string,
  tick: number
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => ({
    ...s,
    pedals: (s.pedals ?? []).map((p) => {
      if (p.id !== pedalId) return p;
      // A notch outside the line would be invisible, so it is refused here
      // rather than being stored and ignored at draw time.
      if (tick <= p.start || tick >= p.start + p.duration) return p;
      const have = p.retakes ?? [];
      const near = have.find((t) => Math.abs(t - tick) < 1e-9);
      const retakes =
        near !== undefined ? have.filter((t) => t !== near) : [...have, tick].sort((a, b) => a - b);
      return { ...p, retakes: retakes.length > 0 ? retakes : undefined };
    }),
  }));
}

/* -------------------------------------------------------------------------- */
/* Chord symbols                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Write a chord symbol above the staff.
 *
 * One per tick, replacing whatever was there — two chord symbols on the same
 * beat is not a richer harmony, it is an unreadable page. Same rule as
 * `addDynamic`, for the same reason.
 */
export function addChordSymbol(
  score: StudioScore,
  partId: string,
  staffId: string,
  start: number,
  root: string,
  quality: ChordQuality,
  bass?: string
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => ({
    ...s,
    chordSymbols: [
      ...(s.chordSymbols ?? []).filter((c) => c.start !== start),
      { id: uid("ch"), start, root, quality, ...(bass ? { bass } : {}) },
    ].sort((a, b) => a.start - b.start),
  }));
}

export function removeChordSymbol(
  score: StudioScore,
  partId: string,
  staffId: string,
  chordId: string
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => ({
    ...s,
    chordSymbols: (s.chordSymbols ?? []).filter((c) => c.id !== chordId),
  }));
}

export function updateChordSymbol(
  score: StudioScore,
  partId: string,
  staffId: string,
  chordId: string,
  patch: Partial<Omit<ChordSymbol, "id">>
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => ({
    ...s,
    chordSymbols: (s.chordSymbols ?? []).map((c) => (c.id === chordId ? { ...c, ...patch } : c)),
  }));
}

/* -------------------------------------------------------------------------- */
/* Measures                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Insert an empty measure. Everything written after the insertion point shifts
 * later by exactly one measure's worth of ticks, so no music is lost or
 * reordered — the new bar opens a gap rather than overwriting.
 */
export function insertMeasure(score: StudioScore, at: number): StudioScore {
  const index = Math.max(0, Math.min(score.measures.length, at));
  const { starts } = measureOffsets(score);
  const boundary = index < starts.length ? starts[index] : measureOffsets(score).total;
  const shift = ticksPerBar(meterAt(score, Math.min(index, score.measures.length - 1)));

  const measures = [...score.measures];
  measures.splice(index, 0, { id: uid("m") });

  return {
    ...score,
    measures,
    parts: score.parts.map((p) => ({
      ...p,
      staves: p.staves.map((s) => ({
        ...s,
        voices: s.voices.map((v) => ({
          ...v,
          notes: v.notes.map((n) => (n.start >= boundary ? { ...n, start: n.start + shift } : n)),
          rests: v.rests.map((r) => (r.start >= boundary ? { ...r, start: r.start + shift } : r)),
        })),
        dynamics: s.dynamics.map((d) => (d.start >= boundary ? { ...d, start: d.start + shift } : d)),
        hairpins: s.hairpins.map((h) => (h.start >= boundary ? { ...h, start: h.start + shift } : h)),
        texts: s.texts.map((t) => (t.start >= boundary ? { ...t, start: t.start + shift } : t)),
        octaveLines: s.octaveLines.map((o) =>
          o.start >= boundary ? { ...o, start: o.start + shift } : o
        ),
      })),
    })),
  };
}

/** Delete a measure and pull everything after it back into the gap. */
export function deleteMeasure(score: StudioScore, index: number): StudioScore {
  if (score.measures.length <= 1) return score;
  if (index < 0 || index >= score.measures.length) return score;

  const { starts } = measureOffsets(score);
  const from = starts[index];
  const span = score.measures[index].pickupTicks ?? ticksPerBar(meterAt(score, index));
  const to = from + span;

  const measures = score.measures.filter((_, i) => i !== index);

  const shiftBack = <T extends { start: number }>(items: T[]): T[] =>
    items
      .filter((i) => i.start < from || i.start >= to)
      .map((i) => (i.start >= to ? { ...i, start: i.start - span } : i));

  return {
    ...score,
    measures,
    parts: score.parts.map((p) => ({
      ...p,
      staves: p.staves.map((s) => ({
        ...s,
        voices: s.voices.map((v) => ({
          ...v,
          notes: shiftBack(v.notes),
          rests: shiftBack(v.rests),
        })),
        dynamics: shiftBack(s.dynamics),
        hairpins: shiftBack(s.hairpins),
        texts: shiftBack(s.texts),
        octaveLines: shiftBack(s.octaveLines),
      })),
    })),
  };
}

export function updateMeasure(
  score: StudioScore,
  index: number,
  patch: Partial<Measure>
): StudioScore {
  return {
    ...score,
    measures: score.measures.map((m, i) => (i === index ? { ...m, ...patch } : m)),
  };
}

export function setBarline(
  score: StudioScore,
  index: number,
  barline: BarlineStyle
): StudioScore {
  return updateMeasure(score, index, { barline });
}

/**
 * Put a segno or a coda at a measure, or take it away.
 *
 * Only one of each may exist in a score. Two segni make "D.S." ambiguous —
 * there is no way to say which one it means — so setting a second one moves the
 * first rather than adding to it. That is a real constraint of the notation,
 * not a simplification.
 */
export function setRepeatSign(
  score: StudioScore,
  index: number,
  sign: RepeatSign | null
): StudioScore {
  return {
    ...score,
    measures: score.measures.map((m, i) => {
      if (i === index) {
        const next = sign === null || m.sign === sign ? undefined : sign;
        return { ...m, sign: next };
      }
      // Clear the same sign anywhere else it sits.
      return sign !== null && m.sign === sign ? { ...m, sign: undefined } : m;
    }),
  };
}

/** Print an instruction at the end of a measure: D.S. al Coda, Fine, To Coda. */
export function setRepeatDirective(
  score: StudioScore,
  index: number,
  directive: RepeatDirective | null
): StudioScore {
  const current = score.measures[index]?.directive;
  return updateMeasure(score, index, {
    directive: directive === null || current === directive ? undefined : directive,
  });
}

/**
 * Bracket a measure as a first-time (or nth-time) bar.
 *
 * An empty or nonsensical pass list clears the bracket instead of printing an
 * empty one. Passes are de-duplicated and sorted because "2.2.3." is a typo
 * every time, and the printed order of a volta is always ascending.
 */
export function setVolta(score: StudioScore, index: number, passes: number[]): StudioScore {
  const clean = Array.from(new Set(passes.filter((n) => Number.isInteger(n) && n >= 1 && n <= 16)))
    .sort((a, b) => a - b);
  return updateMeasure(score, index, { volta: clean.length > 0 ? clean : undefined });
}

/** How many times a repeated section is played in total. 2 is the plain sign. */
export function setRepeatTimes(score: StudioScore, index: number, times: number): StudioScore {
  const n = Math.round(times);
  return updateMeasure(score, index, {
    repeatTimes: n >= 3 && n <= 32 ? n : undefined,
  });
}

/* -------------------------------------------------------------------------- */
/* Parts                                                                       */
/* -------------------------------------------------------------------------- */

export function addPart(score: StudioScore, instrumentId: string): StudioScore {
  return { ...score, parts: [...score.parts, partFor(instrumentId)] };
}

export function removePart(score: StudioScore, partId: string): StudioScore {
  if (score.parts.length <= 1) return score;
  return {
    ...score,
    parts: score.parts.filter((p) => p.id !== partId),
    groups: score.groups
      .map((g) => ({ ...g, partIds: g.partIds.filter((id) => id !== partId) }))
      .filter((g) => g.partIds.length > 1),
  };
}

export function updatePart(
  score: StudioScore,
  partId: string,
  patch: Partial<Part>
): StudioScore {
  return {
    ...score,
    parts: score.parts.map((p) => {
      if (p.id !== partId) return p;
      const next = { ...p, ...patch };
      // Switching instrument re-clefs the part, unless the writer already
      // chose clefs of their own by adding or removing staves.
      if (patch.instrumentId && patch.instrumentId !== p.instrumentId) {
        const inst = instrumentById(patch.instrumentId);
        if (p.staves.length === inst.clefs.length) {
          next.staves = p.staves.map((s, i) => ({ ...s, clef: inst.clefs[i] ?? s.clef }));
        }
        // A name the writer typed survives; a default name follows the change.
        if (p.name === instrumentById(p.instrumentId).name) next.name = undefined;
      }
      return next;
    }),
  };
}

export function reorderParts(score: StudioScore, from: number, to: number): StudioScore {
  const parts = [...score.parts];
  const [moved] = parts.splice(from, 1);
  parts.splice(to, 0, moved);
  return { ...score, parts };
}

export function setClef(
  score: StudioScore,
  partId: string,
  staffId: string,
  clef: Clef
): StudioScore {
  return mapStaff(score, partId, staffId, (s) => ({ ...s, clef }));
}

export function addStaffToPart(score: StudioScore, partId: string): StudioScore {
  return {
    ...score,
    parts: score.parts.map((p) =>
      p.id === partId ? { ...p, staves: [...p.staves, staffFor("bass")] } : p
    ),
  };
}

export function addVoice(score: StudioScore, partId: string, staffId: string): StudioScore {
  return mapStaff(score, partId, staffId, (s) =>
    s.voices.length >= 4 ? s : { ...s, voices: [...s.voices, emptyVoice()] }
  );
}

/**
 * Replace the whole instrumentation with an ensemble template, keeping the
 * measures and the music of any part whose instrument survives the change.
 */
export function applyEnsemble(score: StudioScore, ensembleId: string): StudioScore {
  const ensemble = ensembleById(ensembleId);
  if (!ensemble) return score;

  const spare = [...score.parts];
  const parts = ensemble.parts.map((instrumentId) => {
    const reuseIndex = spare.findIndex((p) => p.instrumentId === instrumentId);
    if (reuseIndex >= 0) return spare.splice(reuseIndex, 1)[0];
    return partFor(instrumentId);
  });

  const groups = (ensemble.groups ?? []).map((g) => ({
    id: uid("g"),
    label: g.label,
    partIds: parts.slice(g.from, g.to + 1).map((p) => p.id),
    symbol: "bracket" as const,
  }));

  return { ...score, parts, groups };
}
