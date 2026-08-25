"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ticksPerBeat } from "@/lib/score";
import { StudioPlayer, metronomeTicks, scheduleScore } from "@/lib/studio/audio";
import { engrave } from "@/lib/studio/engrave";
import { instrumentById } from "@/lib/studio/instruments";
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
  type Part,
  type ScoreInfo,
  type StudioNote,
  type StudioScore,
} from "@/lib/studio/model";
import {
  addDynamic,
  addHairpin,
  addOctaveLine,
  addText,
  addVoice,
  applyEnsemble,
  addPart,
  deleteMeasure,
  findNote,
  insertMeasure,
  removeNote,
  removePart,
  reorderParts,
  respell,
  setBarline,
  setClef,
  toggleArticulation,
  toggleNote,
  toggleOrnament,
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
import { NotationToolbar, type ToolTab } from "./NotationToolbar";
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
}: {
  initialScore: StudioScore;
  scoreId: string;
  onSave?: (score: StudioScore) => Promise<{ ok: boolean }>;
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
        setZoom((z) => Math.min(z, (window.innerWidth - 24) / 210));
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
          { pitch: pitch + shift, at: 0, seconds: 0.45, timbre: inst.timbre, gain: 0.6, pan: part?.pan ?? 0 },
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
      const { notes, secondsPerTick } = scheduleScore(score, { from: start, to: total });
      const lengthSeconds = (total - start) * secondsPerTick;

      const countInSeconds = countIn
        ? ticksPerBeat(score.meter) * score.meter.beats * secondsPerTick
        : 0;

      let base = p.now() + 0.1;

      if (countIn) {
        const beat = ticksPerBeat(score.meter) * secondsPerTick;
        for (let i = 0; i < score.meter.beats; i++) p.tick(base + i * beat, i === 0);
        base += countInSeconds;
      }

      const schedule = (at: number) => {
        for (const n of notes) p.voice(n, at);
        if (metronome) {
          for (const t of metronomeTicks(score, start, total, secondsPerTick)) {
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
        setPlayhead(start + Math.max(0, (now - passStart) / secondsPerTick));
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
        const pitch = (baseOctave + 2) * 12 + semis;
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

  const forEachSelectedNote = useCallback(
    (fn: (s: StudioScore, id: string) => StudioScore) => {
      const ids = selection.noteIds ?? [];
      if (ids.length === 0) return;
      apply((s) => ids.reduce(fn, s));
    },
    [apply, selection.noteIds]
  );

  /* ---- Toolbar actions -------------------------------------------------- */

  const actions = useMemo(
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
      onDynamic: (d: Dynamic) =>
        apply((s) => addDynamic(s, target.part.id, target.staff.id, cursor?.tick ?? 0, d)),
      onHairpin: (k: "crescendo" | "diminuendo") =>
        apply((s) =>
          addHairpin(s, target.part.id, target.staff.id, cursor?.tick ?? 0, ticksPerBeat(score.meter) * 2, k)
        ),
      onSlur: () => forEachSelectedNote((s, id) => updateNote(s, id, { slur: "begin" })),
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
    [apply, cursor, forEachSelectedNote, score, selectedMeasure, selection, target]
  );

  /* ---- Render ----------------------------------------------------------- */

  const currentMeasure = playhead !== null ? measureAtTick(score, playhead) + 1 : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-abyss-950">
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
          onTab={setTab}
        />
      )}

      <div className="relative flex min-h-0 flex-1">
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
        <main className="relative min-w-0 flex-1 overflow-auto bg-[#3a3a3c]">
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

/** MusicXML, in the partwise flavour every notation program reads. */
function downloadMusicXml(score: StudioScore) {
  const { starts } = measureOffsets(score);
  const divisions = 4; // ticks per quarter note in this format

  const partList = score.parts
    .map(
      (p, i) =>
        `    <score-part id="P${i + 1}"><part-name>${escapeXml(
          p.name ?? instrumentById(p.instrumentId).name
        )}</part-name></score-part>`
    )
    .join("\n");

  const parts = score.parts
    .map((p, pi) => {
      const measures = score.measures
        .map((_, mi) => {
          const from = starts[mi];
          const meter = meterAt(score, mi);
          const to = from + (score.measures[mi].pickupTicks ?? (16 / meter.unit) * meter.beats);
          const { key, mode } = keyAt(score, mi);

          const notes = p.staves
            .flatMap((s) => s.voices.flatMap((v) => v.notes))
            .filter((n) => n.start >= from && n.start < to)
            .sort((a, b) => a.start - b.start);

          const attrs =
            mi === 0
              ? `      <attributes><divisions>${divisions}</divisions>` +
                `<key><fifths>${keyFifths(key, mode)}</fifths></key>` +
                `<time><beats>${meter.beats}</beats><beat-type>${meter.unit}</beat-type></time>` +
                `<clef><sign>${p.staves[0].clef === "bass" ? "F" : p.staves[0].clef === "alto" || p.staves[0].clef === "tenor" ? "C" : "G"}</sign>` +
                `<line>${p.staves[0].clef === "bass" ? 4 : p.staves[0].clef === "alto" ? 3 : p.staves[0].clef === "tenor" ? 4 : 2}</line></clef></attributes>\n`
              : "";

          const body = notes
            .map((n) => {
              const step = "CDEFGAB"[[0, 2, 4, 5, 7, 9, 11].indexOf(((n.pitch % 12) + 12) % 12)] ?? "C";
              const alter = n.spell ?? 0;
              const octave = Math.floor(n.pitch / 12) - 1;
              return (
                `      <note><pitch><step>${step}</step>` +
                (alter ? `<alter>${alter}</alter>` : "") +
                `<octave>${octave}</octave></pitch>` +
                `<duration>${Math.max(1, Math.round(n.duration))}</duration>` +
                `<type>${xmlType(n.duration)}</type></note>`
              );
            })
            .join("\n");

          return `    <measure number="${mi + 1}">\n${attrs}${body}\n    </measure>`;
        })
        .join("\n");

      return `  <part id="P${pi + 1}">\n${measures}\n  </part>`;
    })
    .join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n` +
    `<score-partwise version="4.0">\n` +
    `  <work><work-title>${escapeXml(score.info.title)}</work-title></work>\n` +
    `  <identification><creator type="composer">${escapeXml(score.info.composer)}</creator></identification>\n` +
    `  <part-list>\n${partList}\n  </part-list>\n${parts}\n</score-partwise>\n`;

  download(`${score.info.title || "score"}.musicxml`, "application/vnd.recordare.musicxml+xml", xml);
}

function xmlType(ticks: number): string {
  if (ticks >= 16) return "whole";
  if (ticks >= 8) return "half";
  if (ticks >= 4) return "quarter";
  if (ticks >= 2) return "eighth";
  if (ticks >= 1) return "16th";
  return "32nd";
}

function keyFifths(key: string, mode: "major" | "minor"): number {
  const major: Record<string, number> = {
    C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7,
    F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
  };
  const n = major[key] ?? 0;
  return mode === "minor" ? n - 3 : n;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c
  );
}

/** A type 1 MIDI file: one track per part, plus a tempo track. */
function downloadMidi(score: StudioScore) {
  const PPQ = 480;
  const ticksToMidi = (t: number) => Math.round((t / 4) * PPQ);

  const bytes: number[] = [];
  const push = (...b: number[]) => bytes.push(...b);
  const pushStr = (s: string) => { for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i)); };
  const push32 = (n: number) => push((n >> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255);
  const push16 = (n: number) => push((n >> 8) & 255, n & 255);

  const varLen = (n: number): number[] => {
    const out = [n & 0x7f];
    let v = n >> 7;
    while (v > 0) {
      out.unshift((v & 0x7f) | 0x80);
      v >>= 7;
    }
    return out;
  };

  const buildTrack = (events: { at: number; data: number[] }[]): number[] => {
    events.sort((a, b) => a.at - b.at);
    const out: number[] = [];
    let last = 0;
    for (const e of events) {
      out.push(...varLen(e.at - last), ...e.data);
      last = e.at;
    }
    out.push(...varLen(0), 0xff, 0x2f, 0x00);
    return out;
  };

  pushStr("MThd");
  push32(6);
  push16(1);
  push16(score.parts.length + 1);
  push16(PPQ);

  // Tempo track
  const usPerQuarter = Math.round(60000000 / score.tempo);
  const tempoTrack = buildTrack([
    { at: 0, data: [0xff, 0x51, 0x03, (usPerQuarter >> 16) & 255, (usPerQuarter >> 8) & 255, usPerQuarter & 255] },
  ]);
  pushStr("MTrk");
  push32(tempoTrack.length);
  push(...tempoTrack);

  score.parts.forEach((part, pi) => {
    const channel = pi % 16;
    const shift = score.layout.concertPitch ? 0 : transposeOf(part);
    const events: { at: number; data: number[] }[] = [];
    const name = part.name ?? instrumentById(part.instrumentId).name;
    events.push({ at: 0, data: [0xff, 0x03, name.length, ...Array.from(name, (c) => c.charCodeAt(0))] });

    for (const staff of part.staves) {
      for (const v of staff.voices) {
        for (const n of v.notes) {
          const pitch = Math.max(0, Math.min(127, n.pitch + shift));
          const vel = Math.max(1, Math.min(127, n.velocity ?? Math.round(part.volume * 100)));
          events.push({ at: ticksToMidi(n.start), data: [0x90 | channel, pitch, vel] });
          events.push({ at: ticksToMidi(n.start + n.duration), data: [0x80 | channel, pitch, 0] });
        }
      }
    }
    const track = buildTrack(events);
    pushStr("MTrk");
    push32(track.length);
    push(...track);
  });

  download(`${score.info.title || "score"}.mid`, "audio/midi", new Uint8Array(bytes));
}
