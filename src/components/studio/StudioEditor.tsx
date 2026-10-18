"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ticksPerBeat, keySignatureCount, pitchName } from "@/lib/score";
import { StudioPlayer, metronomeTicks, scheduleScore } from "@/lib/studio/audio";
import { engrave } from "@/lib/studio/engrave";
import { instrumentById, gmProgram, isDrumKit } from "@/lib/studio/instruments";
import type { Clef } from "@/lib/studio/instruments";
import {
  keyAt,
  measureAtTick,
  measureOffsets,
  meterAt,
  transposeOf,
  type Articulation,
  type BarlineStyle,
  type Dynamic,
  type Layout,
  type Ornament,
  type Fermata,
  type Part,
  type ScoreInfo,
  type StudioNote,
  type StudioScore,
} from "@/lib/studio/model";
import {
  addChordSymbol,
  addDynamic,
  addHairpin,
  addOctaveLine,
  addPedal,
  addText,
  addVoice,
  applyEnsemble,
  addPart,
  deleteMeasure,
  findNote,
  insertMeasure,
  removeChordSymbol,
  removeNote,
  removePart,
  reorderParts,
  respell,
  setBarline,
  setClef,
  setFingering,
  setRepeatDirective,
  setRepeatSign,
  setRepeatTimes,
  setVolta,
  toggleArticulation,
  toggleFermata,
  toggleNote,
  toggleOrnament,
  toggleRestFermata,
  updateMeasure,
  updateNote,
  updatePart,
} from "@/lib/studio/edit";
import { durationFor, pitchForStep } from "@/lib/studio/staff";
import { Icon } from "@/components/ui/Icon";
import { ScoreCanvas, type Selection } from "./ScoreCanvas";
import { InstrumentPanel } from "./InstrumentPanel";
import { Inspector } from "./Inspector";
import { Mixer } from "./Mixer";
import { NotationToolbar, type ToolbarActions, type ToolTab } from "./NotationToolbar";
import { NotationPanel } from "./NotationPanel";
import { scoreToMidi } from "@/lib/studio/midi";
import { scoreToMusicXml } from "@/lib/studio/musicxml";
import { clampPitch } from "@/lib/studio/range";
import { DrumPad, Fretboard, PianoKeyboard } from "./PianoKeyboard";
import { TopBar, type SaveState } from "./TopBar";

/**
 * The composition workspace.
 *
 * It owns the score and the undo stack, and hands slices of both to the panels
 * around the page. Every edit routes through `apply`, which is the only place
 * that pushes history — so undo is always exactly one edit's worth.
 */

const MAX_HISTORY = 100;

export function StudioEditor({
  initialScore,
  scoreId,
  onSave,
  onChange,
}: {
  initialScore: StudioScore;
  scoreId: string;
  onSave?: (score: StudioScore) => Promise<{ ok: boolean }>;
  /**
   * Reports the score as it is written, for hosts that submit it themselves
   * rather than autosaving — a dungeon trial keeps the current score so its
   * own submit button can send it.
   */
  onChange?: (score: StudioScore) => void;
}) {
  const [score, setScore] = useState<StudioScore>(initialScore);
  const [selection, setSelection] = useState<Selection>({ kind: "none" });
  const [cursor, setCursor] = useState<{
    measureIndex: number;
    tick: number;
    partId: string;
    staffId: string;
  } | null>(null);

  /* ---- Tools ------------------------------------------------------------ */
  const [tab, setTab] = useState<ToolTab>("notes");
  const [duration, setDuration] = useState(4);
  const [dots, setDots] = useState<0 | 1 | 2>(0);
  const [accidental, setAccidental] = useState<-1 | 0 | 1 | null>(null);
  const [restMode, setRestMode] = useState(false);
  const [voice, setVoice] = useState(0);
  const [noteInput, setNoteInput] = useState(true);

  /* ---- View ------------------------------------------------------------- */
  const [zoom, setZoom] = useState(3.4);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  /** Narrow enough that a panel beside the score would leave no score. */
  const [narrow, setNarrow] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const [bottomPanel, setBottomPanel] = useState<"none" | "piano" | "fretboard" | "drums">("piano");
  const [baseOctave, setBaseOctave] = useState(3);
  const [showMixer, setShowMixer] = useState(false);
  const [dialog, setDialog] = useState<string | null>(null);

  /* ---- Transport -------------------------------------------------------- */
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [loop, setLoop] = useState(false);
  const [metronome, setMetronome] = useState(false);
  const [countIn, setCountIn] = useState(false);

  /* ---- Saving ----------------------------------------------------------- */
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Two docked panels are wider than a phone, which would squeeze the score to
  // nothing. Below that width they start closed and open over the canvas
  // instead of beside it, so the music always has the screen.
  useEffect(() => {
    const measure = () => {
      const isNarrow = window.innerWidth < 1024;
      setNarrow(isNarrow);
      if (isNarrow) {
        setShowLeft(false);
        setShowRight(false);
        setBottomPanel("none");
        // Floored: with no lower bound, a very narrow or not-yet-measured
        // window makes this negative, and the page is then drawn with a
        // negative width, which is not a valid SVG at all.
        setZoom((z) => Math.max(0.5, Math.min(z, (window.innerWidth - 24) / 210)));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const undoStack = useRef<StudioScore[]>([]);
  const redoStack = useRef<StudioScore[]>([]);
  const playerRef = useRef<StudioPlayer | null>(null);
  const rafRef = useRef<number | null>(null);
  const loopRef = useRef(loop);
  loopRef.current = loop;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { total, starts } = useMemo(() => measureOffsets(score), [score]);
  const engraved = useMemo(() => engrave(score), [score]);

  /* ---- Editing ---------------------------------------------------------- */

  /** The one door every edit goes through, so history stays consistent. */
  const apply = useCallback((fn: (s: StudioScore) => StudioScore) => {
    setScore((current) => {
      const next = fn(current);
      if (next === current) return current;
      undoStack.current.push(current);
      if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
      redoStack.current = [];
      setSaveState("dirty");
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    setScore((current) => {
      redoStack.current.push(current);
      return prev;
    });
    setSaveState("dirty");
  }, []);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    setScore((current) => {
      undoStack.current.push(current);
      return next;
    });
    setSaveState("dirty");
  }, []);

  /* ---- Reporting the score outward -------------------------------------- */

  // Held in a ref so a host that passes an inline callback does not re-run
  // this on every render of its own.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    onChangeRef.current?.(score);
  }, [score]);

  /* ---- Autosave --------------------------------------------------------- */

  useEffect(() => {
    if (saveState !== "dirty" || !onSave) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await onSave(score);
        setSaveState(res.ok ? "saved" : "error");
        if (res.ok) setLastSavedAt(new Date());
      } catch {
        setSaveState("error");
      }
    }, 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [score, saveState, onSave]);

  /* ---- Where notes land ------------------------------------------------- */

  /** The staff the cursor is on, defaulting to the first visible one. */
  const target = useMemo(() => {
    if (cursor) {
      const part = score.parts.find((p) => p.id === cursor.partId);
      const staff = part?.staves.find((s) => s.id === cursor.staffId);
      if (part && staff) return { part, staff, tick: cursor.tick, measureIndex: cursor.measureIndex };
    }
    const part = score.parts.find((p) => p.visible) ?? score.parts[0];
    return { part, staff: part.staves[0], tick: 0, measureIndex: 0 };
  }, [cursor, score.parts]);

  const noteDuration = durationFor(duration, dots);

  /** Snap a raw tick to the grid the chosen duration implies. */
  const snap = useCallback(
    (tick: number, measureIndex: number) => {
      const grid = Math.max(0.25, Math.min(duration, ticksPerBeat(meterAt(score, measureIndex))));
      const start = starts[measureIndex] ?? 0;
      return start + Math.round((tick - start) / grid) * grid;
    },
    [duration, score, starts]
  );

  const placeAtStep = useCallback(
    (partId: string, staffId: string, rawTick: number, step: number, clef: string) => {
      const measureIndex = measureAtTick(score, rawTick);
      const { key, mode } = keyAt(score, measureIndex);
      const tick = snap(rawTick, measureIndex);
      const pitch = pitchForStep(step, clef as Clef, key, mode, accidental);

      if (restMode) {
        apply((s) => ({
          ...s,
          parts: s.parts.map((p) =>
            p.id !== partId
              ? p
              : {
                  ...p,
                  staves: p.staves.map((st) =>
                    st.id !== staffId
                      ? st
                      : {
                          ...st,
                          voices: st.voices.map((v, vi) =>
                            vi !== voice
                              ? v
                              : {
                                  ...v,
                                  rests: [
                                    ...v.rests.filter((r) => r.start !== tick),
                                    { id: `r${tick}-${Date.now()}`, start: tick, duration: noteDuration },
                                  ],
                                }
                          ),
                        }
                  ),
                }
          ),
        }));
      } else {
        apply((s) =>
          toggleNote(s, {
            partId,
            staffId,
            voiceIndex: voice,
            tick,
            pitch,
            duration: noteDuration,
            spell: accidental ?? undefined,
            dots,
          })
        );
        previewPitch(pitch, partId);
      }

      setCursor({ measureIndex, tick: tick + noteDuration, partId, staffId });
    },
    [accidental, apply, dots, noteDuration, restMode, score, snap, voice]
  );

  /** Sound a single pitch so writing has an immediate answer. */
  const previewPitch = useCallback(
    (pitch: number, partId?: string) => {
      if (!playerRef.current) playerRef.current = new StudioPlayer();
      const p = playerRef.current;
      void p.resume().then(() => {
        const part = score.parts.find((x) => x.id === (partId ?? target.part.id));
        const inst = instrumentById(part?.instrumentId ?? "piano");
        const shift = part ? (score.layout.concertPitch ? 0 : transposeOf(part)) : 0;
        p.voice(
          {
            pitch: pitch + shift,
            at: 0,
            seconds: 0.45,
            timbre: inst.timbre,
            gain: 0.6,
            // A key pressed to hear a pitch is played at a normal effort, so
            // it comes out at the brightness of an mf rather than a whisper.
            velocity: 0.6,
            pan: part?.pan ?? 0,
          },
          p.now() + 0.01
        );
      });
    },
    [score, target.part.id]
  );

  /* ---- Playback --------------------------------------------------------- */

  const stop = useCallback(() => {
    playerRef.current?.stopAll();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlaying(false);
    setPlayhead(null);
  }, []);

  const play = useCallback(
    async (from?: number) => {
      if (playing) {
        stop();
        return;
      }
      if (!playerRef.current) playerRef.current = new StudioPlayer();
      const p = playerRef.current;
      await p.resume();
      p.setMasterVolume(score.masterVolume);

      const start = from ?? cursor?.tick ?? 0;
      const { notes, time } = scheduleScore(score, { from: start, to: total });
      // Real elapsed time, which is longer than tempo alone implies wherever a
      // fermata holds. Multiplying ticks by one rate would cut a held ending
      // off and, on loop, start the next pass early.
      const lengthSeconds = time.secondsAt(total) - time.secondsAt(start);

      // The count-in is not part of the piece, so it runs at the written tempo
      // whatever the first bar does.
      const beat = ticksPerBeat(score.meter) * time.baseSecondsPerTick;
      const countInSeconds = countIn ? beat * score.meter.beats : 0;

      let base = p.now() + 0.1;

      if (countIn) {
        for (let i = 0; i < score.meter.beats; i++) p.tick(base + i * beat, i === 0);
        base += countInSeconds;
      }

      const schedule = (at: number) => {
        for (const n of notes) p.voice(n, at);
        if (metronome) {
          for (const t of metronomeTicks(score, start, total, time)) {
            p.tick(at + t.at, t.strong);
          }
        }
      };

      schedule(base);
      setPlaying(true);

      let passStart = base;
      const frame = () => {
        const now = p.now();
        if (now >= passStart + lengthSeconds) {
          if (loopRef.current) {
            passStart += lengthSeconds;
            schedule(passStart);
          } else {
            stop();
            return;
          }
        }
        // Back through the map, not a division: with a bending map the
        // playhead would otherwise run ahead of the sound through every hold.
        setPlayhead(Math.max(start, time.tickAt(time.secondsAt(start) + (now - passStart))));
        rafRef.current = requestAnimationFrame(frame);
      };
      rafRef.current = requestAnimationFrame(frame);
    },
    [countIn, cursor, loop, metronome, playing, score, stop, total]
  );

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    playerRef.current?.close();
  }, []);

  /* ---- Keyboard --------------------------------------------------------- */

  const moveMeasure = useCallback(
    (delta: number) => {
      const at = cursor?.measureIndex ?? 0;
      const next = Math.max(0, Math.min(score.measures.length - 1, at + delta));
      setCursor({
        measureIndex: next,
        tick: starts[next],
        partId: target.part.id,
        staffId: target.staff.id,
      });
      setSelection({ kind: "measure", measureIndex: next, partId: target.part.id });
    },
    [cursor, score.measures.length, starts, target]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;

      if (e.key === " ") {
        e.preventDefault();
        void play();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (e.key === "Escape") {
        setNoteInput(false);
        setSelection({ kind: "none" });
        return;
      }
      if (e.key.toLowerCase() === "n") setNoteInput(true);
      if (e.key.toLowerCase() === "r") setRestMode((r) => !r);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveMeasure(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveMeasure(-1);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selection.kind === "note" && selection.noteIds?.length) {
          e.preventDefault();
          const ids = selection.noteIds;
          apply((s) => ids.reduce((acc, id) => {
            const f = findNote(acc, id);
            return f ? removeNote(acc, f.partId, f.staffId, id) : acc;
          }, s));
          setSelection({ kind: "none" });
        }
      }
      // Number keys pick a duration, as every notation editor does.
      const durMap: Record<string, number> = { "1": 16, "2": 8, "3": 4, "4": 2, "5": 1, "6": 0.5 };
      if (durMap[e.key] !== undefined) setDuration(durMap[e.key]);

      // Letter keys write pitches at the cursor.
      const letters = "cdefgab";
      if (noteInput && letters.includes(e.key.toLowerCase()) && !e.ctrlKey && !e.metaKey) {
        const idx = letters.indexOf(e.key.toLowerCase());
        const semis = [0, 2, 4, 5, 7, 9, 11][idx];
        // Clamped for the same reason the keyboard is: a high base octave
        // plus this two-octave offset can land past MIDI 127.
        const pitch = clampPitch((baseOctave + 2) * 12 + semis);
        const tick = cursor?.tick ?? 0;
        apply((s) =>
          toggleNote(s, {
            partId: target.part.id,
            staffId: target.staff.id,
            voiceIndex: voice,
            tick,
            pitch,
            duration: noteDuration,
            spell: accidental ?? undefined,
          })
        );
        previewPitch(pitch);
        setCursor({
          measureIndex: measureAtTick(score, tick + noteDuration),
          tick: tick + noteDuration,
          partId: target.part.id,
          staffId: target.staff.id,
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    accidental, apply, baseOctave, cursor, moveMeasure, noteDuration, noteInput,
    play, previewPitch, redo, score, selection, target, undo, voice,
  ]);

  /* ---- Selection helpers ------------------------------------------------ */

  const selectedNote = useMemo(() => {
    const id = selection.noteIds?.[0];
    if (!id) return null;
    const f = findNote(score, id);
    return f ? { note: f.note, partId: f.partId, staffId: f.staffId } : null;
  }, [selection, score]);

  const selectedMeasure = selection.measureIndex ?? cursor?.measureIndex ?? 0;

  /** The earliest tick among the selected notes, or null if none are. */
  const selectionStart = useCallback(
    (s: StudioScore): number | null => {
      const ids = new Set(selection.noteIds ?? []);
      if (ids.size === 0) return null;
      let first: number | null = null;
      for (const part of s.parts)
        for (const staff of part.staves)
          for (const v of staff.voices)
            for (const n of v.notes)
              if (ids.has(n.id) && (first === null || n.start < first)) first = n.start;
      return first;
    },
    [selection.noteIds]
  );

  /** The whole stretch the selected notes cover, first onset to last release. */
  const selectionSpan = useCallback(
    (s: StudioScore): { start: number; duration: number } | null => {
      const ids = new Set(selection.noteIds ?? []);
      if (ids.size === 0) return null;
      let from = Infinity;
      let to = -Infinity;
      for (const part of s.parts)
        for (const staff of part.staves)
          for (const v of staff.voices)
            for (const n of v.notes)
              if (ids.has(n.id)) {
                from = Math.min(from, n.start);
                to = Math.max(to, n.start + n.duration);
              }
      if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
      return { start: from, duration: Math.max(0, to - from) };
    },
    [selection.noteIds]
  );

  const forEachSelectedNote = useCallback(
    (fn: (s: StudioScore, id: string) => StudioScore) => {
      const ids = selection.noteIds ?? [];
      if (ids.length === 0) return;
      apply((s) => ids.reduce(fn, s));
    },
    [apply, selection.noteIds]
  );

  /* ---- Toolbar actions -------------------------------------------------- */

  // Typed against the contract, so a handler whose parameters do not match the
  // toolbar's declaration is a compile error rather than an implicit `any`.
  const actions = useMemo<ToolbarActions>(
    () => ({
      onSetDuration: setDuration,
      onSetDots: setDots,
      onSetAccidental: setAccidental,
      onToggleRest: () => setRestMode((r) => !r),
      onSetVoice: (v: number) => {
        setVoice(v);
        if (v >= target.staff.voices.length) {
          apply((s) => addVoice(s, target.part.id, target.staff.id));
        }
      },
      onSetNoteInput: setNoteInput,
      onTuplet: (ratio: [number, number]) => {
        // A tuplet squeezes `ratio[0]` notes into the time of `ratio[1]`.
        setDuration((d) => (d * ratio[1]) / ratio[0]);
      },
      onTie: () => forEachSelectedNote((s, id) => updateNote(s, id, { tie: true })),
      onArticulation: (a: Articulation) =>
        forEachSelectedNote((s, id) => toggleArticulation(s, id, a)),
      onOrnament: (o: Ornament) => forEachSelectedNote((s, id) => toggleOrnament(s, id, o)),
      // A dynamic goes where the music is: on the selected notes if there are
      // any, and only otherwise at the cursor.
      //
      // Writing it at the cursor unconditionally made dynamics look broken.
      // Clicking a dynamic does not move the cursor, and addDynamic replaces
      // whatever already sits on that tick — correctly, since two dynamics on
      // one beat is nonsense — so clicking pp then ff put both marks on the
      // same tick and left only ff. However many you clicked, the score ended
      // up with exactly one dynamic, so nothing ever contrasted with anything
      // and the obvious conclusion was that dynamics do nothing.
      onDynamic: (d: Dynamic) =>
        apply((s) =>
          addDynamic(s, target.part.id, target.staff.id, selectionStart(s) ?? cursor?.tick ?? 0, d)
        ),
      // A hairpin spans the selection, which is the whole point of one: select
      // the passage that grows, click crescendo. With no selection it falls
      // back to two beats from the cursor, as before.
      onHairpin: (k: "crescendo" | "diminuendo") =>
        apply((s) => {
          const span = selectionSpan(s);
          return addHairpin(
            s,
            target.part.id,
            target.staff.id,
            span?.start ?? cursor?.tick ?? 0,
            span && span.duration > 0 ? span.duration : ticksPerBeat(score.meter) * 2,
            k
          );
        }),
      onSlur: () => forEachSelectedNote((s, id) => updateNote(s, id, { slur: "begin" })),

      /*
       * A fermata goes on the selected notes, and failing that on whatever rest
       * sits under the cursor — because the commonest fermata in the repertoire
       * is over the rest before a final chord, and a hold that could only be
       * written over a note would not be able to say that.
       */
      onFermata: (shape: Fermata) => {
        const ids = selection.noteIds ?? [];
        if (ids.length > 0) {
          forEachSelectedNote((s, id) => toggleFermata(s, id, shape));
          return;
        }
        const tick = cursor?.tick ?? 0;
        apply((s) => {
          const staff = s.parts
            .find((pp) => pp.id === target.part.id)
            ?.staves.find((st) => st.id === target.staff.id);
          const rest = staff?.voices
            .flatMap((v) => v.rests)
            .find((r) => Math.abs(r.start - tick) < 1e-9);
          if (!rest) return s;
          return toggleRestFermata(s, target.part.id, target.staff.id, rest.id, shape);
        });
      },

      // A pedal line spans the selection, like a hairpin. With nothing
      // selected it covers the bar the cursor is in, which is the length a
      // pianist reaches for far more often than two beats.
      onPedal: (kind) =>
        apply((s) => {
          const span = selectionSpan(s);
          const bar = ticksPerBeat(s.meter) * s.meter.beats;
          return addPedal(
            s,
            target.part.id,
            target.staff.id,
            span?.start ?? cursor?.tick ?? 0,
            span && span.duration > 0 ? span.duration : bar,
            kind
          );
        }),

      onFingering: () => {
        const ids = selection.noteIds ?? [];
        if (ids.length === 0) return;
        const current = findNote(score, ids[0])?.note.fingering ?? "";
        const text = window.prompt("Fingering (blank to clear)", current);
        if (text === null) return;
        forEachSelectedNote((s, id) => setFingering(s, id, text));
      },

      onChordSymbol: (root, quality, bass) =>
        apply((s) =>
          addChordSymbol(
            s,
            target.part.id,
            target.staff.id,
            selectionStart(s) ?? cursor?.tick ?? 0,
            root,
            quality,
            bass
          )
        ),

      onClearChordSymbol: () =>
        apply((s) => {
          const tick = selectionStart(s) ?? cursor?.tick ?? 0;
          const staff = s.parts
            .find((pp) => pp.id === target.part.id)
            ?.staves.find((st) => st.id === target.staff.id);
          const here = (staff?.chordSymbols ?? []).find((c) => Math.abs(c.start - tick) < 1e-9);
          return here ? removeChordSymbol(s, target.part.id, target.staff.id, here.id) : s;
        }),

      onRepeatSign: (sign) => apply((s) => setRepeatSign(s, selectedMeasure, sign)),
      onRepeatDirective: (directive) =>
        apply((s) => setRepeatDirective(s, selectedMeasure, directive)),
      onVolta: (passes) => apply((s) => setVolta(s, selectedMeasure, passes)),
      onRepeatTimes: () => {
        const n = window.prompt("Play this repeat how many times in total?", "3");
        if (!n) return;
        const times = Number(n);
        if (!Number.isFinite(times)) return;
        apply((s) => setRepeatTimes(s, selectedMeasure, times));
      },
      onAddMeasure: (where: "before" | "after" | "end") =>
        apply((s) =>
          insertMeasure(
            s,
            where === "end"
              ? s.measures.length
              : where === "before"
                ? selectedMeasure
                : selectedMeasure + 1
          )
        ),
      onDeleteMeasure: () => apply((s) => deleteMeasure(s, selectedMeasure)),
      onBarline: (b: BarlineStyle) => apply((s) => setBarline(s, selectedMeasure, b)),
      onRehearsal: () => {
        const mark = window.prompt("Rehearsal mark", "A");
        if (mark) apply((s) => updateMeasure(s, selectedMeasure, { rehearsal: mark }));
      },
      onKeyChange: () => {
        const k = window.prompt("Key at this measure (e.g. G, Bb, F#)", score.key);
        if (k) apply((s) => updateMeasure(s, selectedMeasure, { key: k }));
      },
      onMeterChange: () => {
        const m = window.prompt("Time signature at this measure", `${score.meter.beats}/${score.meter.unit}`);
        if (!m) return;
        const [b, u] = m.split("/").map(Number);
        if (b > 0 && u > 0) apply((s) => updateMeasure(s, selectedMeasure, { meter: { beats: b, unit: u } }));
      },
      onText: (kind: "tempo" | "technique" | "expression" | "lyric" | "staff" | "system") => {
        const t = window.prompt(`${kind} text`);
        if (t) apply((s) => addText(s, target.part.id, target.staff.id, cursor?.tick ?? 0, kind, t));
      },
      onClefChange: (c: Clef) => apply((s) => setClef(s, target.part.id, target.staff.id, c)),
      onOctaveLine: (shift: 1 | -1) =>
        apply((s) =>
          addOctaveLine(s, target.part.id, target.staff.id, cursor?.tick ?? 0, ticksPerBeat(score.meter) * 4, shift)
        ),
      onNotehead: (n: StudioNote["notehead"]) =>
        forEachSelectedNote((s, id) => updateNote(s, id, { notehead: n })),
      onStem: (st: StudioNote["stem"]) =>
        forEachSelectedNote((s, id) => updateNote(s, id, { stem: st })),
      onEnharmonic: () => forEachSelectedNote((s, id) => respell(s, id)),
      onDelete: () => {
        if (selection.kind === "note" && selection.noteIds?.length) {
          const ids = selection.noteIds;
          apply((s) =>
            ids.reduce((acc, id) => {
              const f = findNote(acc, id);
              return f ? removeNote(acc, f.partId, f.staffId, id) : acc;
            }, s)
          );
          setSelection({ kind: "none" });
        } else if (selection.kind === "measure") {
          apply((s) => deleteMeasure(s, selectedMeasure));
        }
      },
    }),
    [apply, cursor, forEachSelectedNote, score, selectedMeasure, selection, selectionSpan, selectionStart, target]
  );

  /* ---- Render ----------------------------------------------------------- */

  const currentMeasure = playhead !== null ? measureAtTick(score, playhead) + 1 : null;

  return (
    <div className="cd-print-shell flex h-screen flex-col overflow-hidden bg-abyss-950">
      <TopBar
        title={score.info.title}
        saveState={saveState}
        lastSavedAt={lastSavedAt}
        canUndo={undoStack.current.length > 0}
        canRedo={redoStack.current.length > 0}
        transport={{
          playing,
          loop,
          metronome,
          countIn,
          tempo: score.tempo,
          position: currentMeasure,
          totalMeasures: score.measures.length,
        }}
        onTitle={(t) => apply((s) => ({ ...s, info: { ...s.info, title: t } }))}
        onUndo={undo}
        onRedo={redo}
        onPlay={() => void play()}
        onStop={stop}
        onRestart={() => {
          stop();
          void play(0);
        }}
        onPrevMeasure={() => moveMeasure(-1)}
        onNextMeasure={() => moveMeasure(1)}
        onToggleLoop={() => setLoop((l) => !l)}
        onToggleMetronome={() => setMetronome((m) => !m)}
        onToggleCountIn={() => setCountIn((c) => !c)}
        onTempo={(t) => apply((s) => ({ ...s, tempo: t }))}
        onToggleMixer={() => setShowMixer((m) => !m)}
        onMidiSettings={() => setDialog("midi")}
        onHistory={() => setDialog("history")}
        onComments={() => setDialog("comments")}
        onShare={() => setDialog("share")}
        onImport={() => setDialog("import")}
        onExport={() => setDialog("export")}
        onPrint={() => window.print()}
        onHelp={() => setDialog("help")}
      />

      {showTools && (
        <NotationToolbar
          state={{
            tab,
            duration,
            dots,
            accidental,
            restMode,
            voice,
            noteInput,
            hasSelection: selection.kind === "note" || selection.kind === "measure",
            voiceCount: target.staff.voices.length,
          }}
          actions={actions}
        />
      )}

      <div className="cd-print-keep relative flex min-h-0 flex-1">
        {showLeft && (
          <aside
            className={`w-60 shrink-0 border-r border-abyss-700 ${
              narrow ? "absolute inset-y-0 left-0 z-30 shadow-2xl" : ""
            }`}
          >
            <InstrumentPanel
              score={score}
              selectedPartId={selection.partId ?? null}
              onSelectPart={(id) => setSelection({ kind: "part", partId: id })}
              onUpdatePart={(id, patch) => apply((s) => updatePart(s, id, patch))}
              onAddInstrument={(iid) => apply((s) => addPart(s, iid))}
              onRemovePart={(id) => apply((s) => removePart(s, id))}
              onReorder={(from, to) => apply((s) => reorderParts(s, from, to))}
              onApplyEnsemble={(eid) => apply((s) => applyEnsemble(s, eid))}
            />
          </aside>
        )}

        {/* ---- The score itself ------------------------------------------ */}
        <main className="cd-print-keep relative min-w-0 flex-1 overflow-auto bg-[#3a3a3c]">
          <ScoreCanvas
            score={score}
            zoom={zoom}
            selection={selection}
            playhead={playhead}
            cursor={cursor}
            noteInput={noteInput}
            onSelect={setSelection}
            onPlaceNote={placeAtStep}
            onRemoveNote={(partId, staffId, noteId) =>
              apply((s) => removeNote(s, partId, staffId, noteId))
            }
            onMoveCursor={(measureIndex, tick, partId, staffId) =>
              setCursor({ measureIndex, tick: snap(tick, measureIndex), partId, staffId })
            }
          />

          <FloatingTools
            zoom={zoom}
            pages={engraved.pages.length}
            showLeft={showLeft}
            showRight={showRight}
            showTools={showTools}
            bottomPanel={bottomPanel}
            onZoom={setZoom}
            onFitPage={() => setZoom(2.4)}
            onFitWidth={() => setZoom(3.4)}
            onToggleLeft={() => setShowLeft((v) => !v)}
            onToggleRight={() => setShowRight((v) => !v)}
            onToggleTools={() => setShowTools((v) => !v)}
            onTogglePiano={() =>
              setBottomPanel((b) => (b === "piano" ? "none" : "piano"))
            }
          />
        </main>

        {showTools && !narrow && (
          <NotationPanel
            tab={tab}
            onTab={setTab}
            actions={actions}
            hasSelection={selection.kind === "note" || selection.kind === "measure"}
          />
        )}

        {showRight && (
          <aside
            className={`w-64 shrink-0 border-l border-abyss-700 ${
              narrow ? "absolute inset-y-0 right-0 z-30 shadow-2xl" : ""
            }`}
          >
            <Inspector
              score={score}
              selection={selection}
              selectedNote={selectedNote}
              onUpdateInfo={(patch) => apply((s) => ({ ...s, info: { ...s.info, ...patch } }))}
              onUpdateLayout={(patch: Partial<Layout>) =>
                apply((s) => ({ ...s, layout: { ...s.layout, ...patch } }))
              }
              onUpdatePart={(id, patch) => apply((s) => updatePart(s, id, patch))}
              onUpdateNote={(patch) =>
                selectedNote && apply((s) => updateNote(s, selectedNote.note.id, patch))
              }
              onUpdateScore={(patch) => apply((s) => ({ ...s, ...patch }))}
            />
          </aside>
        )}
      </div>

      {/* ---- Input surfaces --------------------------------------------- */}
      {bottomPanel === "piano" && (
        <PianoKeyboard
          baseOctave={baseOctave}
          onOctaveChange={setBaseOctave}
          onClose={() => setBottomPanel("none")}
          onPlay={(pitch, chord) => {
            previewPitch(pitch);
            if (!noteInput) return;
            // A held Shift stacks onto the chord that is already forming —
            // the last note actually written — not wherever the cursor has
            // since advanced to. Reading the cursor here instead means the
            // natural "click the root, then shift-click the third and fifth"
            // gesture leaves the root behind alone and chords the third and
            // fifth together one beat later, which is not a chord anyone
            // asked for.
            const voiceNotes = target.staff.voices[voice]?.notes ?? [];
            const tick = chord
              ? voiceNotes.length > 0
                ? Math.max(...voiceNotes.map((n) => n.start))
                : (cursor?.tick ?? 0)
              : (cursor?.tick ?? 0);
            apply((s) =>
              toggleNote(s, {
                partId: target.part.id,
                staffId: target.staff.id,
                voiceIndex: voice,
                tick,
                pitch,
                duration: noteDuration,
                spell: accidental ?? undefined,
                chord,
              })
            );
            if (!chord) {
              setCursor({
                measureIndex: measureAtTick(score, tick + noteDuration),
                tick: tick + noteDuration,
                partId: target.part.id,
                staffId: target.staff.id,
              });
            }
          }}
        />
      )}
      {bottomPanel === "fretboard" && (
        <Fretboard onPlay={(p) => previewPitch(p)} onClose={() => setBottomPanel("none")} />
      )}
      {bottomPanel === "drums" && (
        <DrumPad onPlay={(p) => previewPitch(p)} onClose={() => setBottomPanel("none")} />
      )}

      {showMixer && (
        <Mixer
          score={score}
          onUpdatePart={(id, patch) => apply((s) => updatePart(s, id, patch))}
          onMasterVolume={(v) => apply((s) => ({ ...s, masterVolume: v }))}
          onClose={() => setShowMixer(false)}
        />
      )}

      {dialog && (
        <StudioDialog
          kind={dialog}
          score={score}
          scoreId={scoreId}
          onClose={() => setDialog(null)}
          onBottomPanel={setBottomPanel}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function FloatingTools({
  zoom,
  pages,
  showLeft,
  showRight,
  showTools,
  bottomPanel,
  onZoom,
  onFitPage,
  onFitWidth,
  onToggleLeft,
  onToggleRight,
  onToggleTools,
  onTogglePiano,
}: {
  zoom: number;
  pages: number;
  showLeft: boolean;
  showRight: boolean;
  showTools: boolean;
  bottomPanel: string;
  onZoom: (z: number) => void;
  onFitPage: () => void;
  onFitWidth: () => void;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onToggleTools: () => void;
  onTogglePiano: () => void;
}) {
  const btn =
    "rounded p-1 text-parchment-300 transition-colors hover:bg-abyss-700 hover:text-parchment-100";
  return (
    <div className="pointer-events-none sticky bottom-3 left-0 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-abyss-600 bg-abyss-900/95 px-1.5 py-1 shadow-lg backdrop-blur">
        <button className={btn} onClick={() => onZoom(Math.max(1.2, zoom - 0.4))} title="Zoom out">
          <Icon name="zoomOut" size={14} />
        </button>
        <span className="w-9 text-center text-[10px] text-parchment-500">
          {Math.round((zoom / 3.4) * 100)}%
        </span>
        <button className={btn} onClick={() => onZoom(Math.min(9, zoom + 0.4))} title="Zoom in">
          <Icon name="zoomIn" size={14} />
        </button>
        <Divider />
        <button className={`${btn} text-[10px]`} onClick={onFitPage} title="Fit the whole page">
          Page
        </button>
        <button className={`${btn} text-[10px]`} onClick={onFitWidth} title="Fit to width">
          Width
        </button>
        <Divider />
        <span className="px-1 text-[10px] text-parchment-600">
          {pages} page{pages === 1 ? "" : "s"}
        </span>
        <Divider />
        <button
          className={`${btn} ${showLeft ? "text-gold-400" : ""}`}
          onClick={onToggleLeft}
          title="Instrument panel"
        >
          <Icon name="panelLeft" size={14} />
        </button>
        <button
          className={`${btn} ${showTools ? "text-gold-400" : ""}`}
          onClick={onToggleTools}
          title="Notation tools"
        >
          <Icon name="layers" size={14} />
        </button>
        <button
          className={`${btn} ${bottomPanel === "piano" ? "text-gold-400" : ""}`}
          onClick={onTogglePiano}
          title="On-screen piano"
        >
          <Icon name="piano" size={14} />
        </button>
        <button
          className={`${btn} ${showRight ? "text-gold-400" : ""}`}
          onClick={onToggleRight}
          title="Inspector"
        >
          <Icon name="panelRight" size={14} />
        </button>
        <button
          className={btn}
          onClick={() => document.documentElement.requestFullscreen?.()}
          title="Fullscreen"
        >
          <Icon name="expand" size={14} />
        </button>
      </div>
    </div>
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-abyss-600" />;
}

/* -------------------------------------------------------------------------- */

function StudioDialog({
  kind,
  score,
  scoreId,
  onClose,
  onBottomPanel,
}: {
  kind: string;
  score: StudioScore;
  scoreId: string;
  onClose: () => void;
  onBottomPanel: (b: "none" | "piano" | "fretboard" | "drums") => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        className="max-h-[75vh] w-full max-w-lg overflow-y-auto rounded-lg border border-abyss-600 bg-abyss-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center">
          <h2 className="text-sm font-semibold capitalize text-parchment-100">{kind}</h2>
          <button onClick={onClose} className="ml-auto text-parchment-500 hover:text-parchment-200">
            <Icon name="close" size={16} />
          </button>
        </div>
        <DialogBody kind={kind} score={score} scoreId={scoreId} onBottomPanel={onBottomPanel} />
      </div>
    </div>
  );
}

function DialogBody({
  kind,
  score,
  scoreId,
  onBottomPanel,
}: {
  kind: string;
  score: StudioScore;
  scoreId: string;
  onBottomPanel: (b: "none" | "piano" | "fretboard" | "drums") => void;
}) {
  const text = "text-sm text-parchment-400";

  if (kind === "help") {
    return (
      <div className="space-y-2 text-sm text-parchment-300">
        {[
          ["Space", "Play or stop"],
          ["N / Esc", "Note input mode / select mode"],
          ["1 – 6", "Whole, half, quarter, eighth, 16th, 32nd"],
          ["R", "Write rests instead of notes"],
          ["A – G", "Write that pitch at the cursor"],
          ["← →", "Move a measure at a time"],
          ["Del", "Delete the selection"],
          ["Ctrl+Z / Ctrl+Shift+Z", "Undo / redo"],
          ["Alt-click a note", "Delete it"],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-3">
            <kbd className="shrink-0 rounded bg-abyss-950 px-1.5 py-0.5 font-mono text-[11px] text-gold-300">
              {k}
            </kbd>
            <span className="text-parchment-400">{v}</span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "export") {
    return (
      <div className="space-y-2">
        <p className={text}>Download this score as:</p>
        <div className="grid grid-cols-2 gap-2">
          <ExportButton label="MusicXML" onClick={() => downloadMusicXml(score)} />
          <ExportButton label="MIDI" onClick={() => downloadMidi(score)} />
          <ExportButton label="JSON" onClick={() => downloadJson(score, scoreId)} />
          <ExportButton label="Print" onClick={() => window.print()} />
          <ExportButton label="Print / PDF" onClick={() => window.print()} />
        </div>
        <p className="pt-2 text-[11px] text-parchment-600">
          PDF is produced through your browser&apos;s print dialogue — choose &quot;Save as PDF&quot;.
        </p>
      </div>
    );
  }

  if (kind === "midi") {
    return (
      <div className="space-y-3">
        <p className={text}>
          Connect a MIDI keyboard and it will play into the score at the cursor. Browsers only
          expose MIDI devices over a secure connection.
        </p>
        <MidiStatus />
        <div className="border-t border-abyss-700 pt-3">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-parchment-600">
            Other input surfaces
          </p>
          <div className="flex gap-2">
            <button onClick={() => onBottomPanel("piano")} className="btn-secondary text-xs">
              Piano
            </button>
            <button onClick={() => onBottomPanel("fretboard")} className="btn-secondary text-xs">
              Fretboard
            </button>
            <button onClick={() => onBottomPanel("drums")} className="btn-secondary text-xs">
              Drum pads
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "share") {
    return (
      <div className="space-y-3">
        <p className={text}>Who may see this score:</p>
        {[
          ["Private", "Only you"],
          ["View only", "Anyone with the link can read it"],
          ["Comment", "Readers may leave comments"],
          ["Edit", "Collaborators may change the score"],
          ["Published", "Listed publicly in the Guild"],
        ].map(([label, note]) => (
          <label key={label} className="flex items-start gap-2">
            <input type="radio" name="vis" defaultChecked={label === "Private"} className="mt-1 accent-[#c9a84c]" />
            <span>
              <span className="text-sm text-parchment-200">{label}</span>
              <span className="block text-[11px] text-parchment-600">{note}</span>
            </span>
          </label>
        ))}
      </div>
    );
  }

  if (kind === "import") {
    return (
      <div className="space-y-3">
        <p className={text}>Bring in a score written elsewhere.</p>
        <input
          type="file"
          accept=".musicxml,.xml,.mxl,.mid,.midi,.json"
          className="w-full rounded border border-abyss-600 bg-abyss-950 p-2 text-xs text-parchment-300"
        />
        <p className="text-[11px] text-parchment-600">
          MusicXML and MIDI are read for pitches, rhythms and part names.
        </p>
      </div>
    );
  }

  if (kind === "history") {
    return (
      <div className="space-y-2">
        <p className={text}>Every save is kept. Restore any earlier version:</p>
        <div className="rounded border border-abyss-700">
          <div className="flex items-center gap-2 border-b border-abyss-800 px-3 py-2">
            <Icon name="check" size={12} className="text-emerald-400" />
            <span className="text-xs text-parchment-200">Current version</span>
            <span className="ml-auto text-[10px] text-parchment-600">just now</span>
          </div>
          <p className="px-3 py-3 text-[11px] text-parchment-600">
            Earlier versions appear here as you keep working.
          </p>
        </div>
      </div>
    );
  }

  if (kind === "comments") {
    return (
      <div className="space-y-3">
        <p className={text}>No comments on this score yet.</p>
        <textarea
          rows={3}
          placeholder="Leave a note for your collaborators…"
          className="w-full rounded border border-abyss-600 bg-abyss-950 p-2 text-xs text-parchment-200"
        />
      </div>
    );
  }

  return <p className={text}>Nothing here yet.</p>;
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded border border-abyss-600 bg-abyss-950 px-3 py-2 text-xs text-parchment-200 hover:bg-abyss-800"
    >
      {label}
    </button>
  );
}

function MidiStatus() {
  const [state, setState] = useState<string>("checking");
  useEffect(() => {
    const nav = navigator as Navigator & { requestMIDIAccess?: () => Promise<MIDIAccess> };
    if (!nav.requestMIDIAccess) {
      setState("This browser does not offer MIDI access.");
      return;
    }
    nav
      .requestMIDIAccess()
      .then((access) => {
        const names = Array.from(access.inputs.values()).map((i) => i.name);
        setState(names.length ? `Connected: ${names.join(", ")}` : "No MIDI devices found.");
      })
      .catch(() => setState("MIDI access was refused."));
  }, []);
  return <p className="rounded bg-abyss-950 px-2 py-1.5 text-[11px] text-parchment-400">{state}</p>;
}

/* -------------------------------------------------------------------------- */
/* Export helpers                                                              */
/* -------------------------------------------------------------------------- */

function download(name: string, mime: string, data: BlobPart) {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(score: StudioScore, scoreId: string) {
  download(`${score.info.title || scoreId}.json`, "application/json", JSON.stringify(score, null, 2));
}

function downloadMusicXml(score: StudioScore) {
  download(
    `${score.info.title || "score"}.musicxml`,
    "application/vnd.recordare.musicxml+xml",
    scoreToMusicXml(score)
  );
}

function downloadMidi(score: StudioScore) {
  download(`${score.info.title || "score"}.mid`, "audio/midi", scoreToMidi(score));
}
