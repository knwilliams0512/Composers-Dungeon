"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { Freedom } from "@/lib/composer-freedom";
import {
  analyze,
  isDiatonic,
  keyPitchClass,
  pitchName,
  romanNumeral,
  runChecks,
  scaleDegree,
  scalePitches,
  ticksPerBar,
  ticksPerBeat,
  TICKS_PER_WHOLE,
  totalTicks,
  triadFor,
  type Check,
  type Score,
  type ScoreNote,
} from "@/lib/score";

/* -------------------------------------------------------------------------- */
/* Audio                                                                       */
/* -------------------------------------------------------------------------- */

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

interface Timbre {
  wave: OscillatorType;
  /** Second oscillator, detuned in cents, for width and warmth. */
  wave2?: OscillatorType;
  detune?: number;
  /** Lowpass cutoff as a multiple of the fundamental. */
  brightness: number;
  attack: number;
  decay: number;
  gain: number;
}

/**
 * Each instrument is a two-oscillator patch through its own filter — small,
 * but the difference between "a beep" and "a voice". The piano's second
 * triangle a few cents flat gives the slow beat of real strings under one
 * hammer; the flute is a bare sine with breathy attack; the organ's square
 * pair locks dead in tune the way pipes do.
 */
const TIMBRES: Record<string, Timbre> = {
  PIANO: { wave: "triangle", wave2: "triangle", detune: 4, brightness: 6, attack: 0.005, decay: 1.4, gain: 0.2 },
  STRINGS: { wave: "sawtooth", wave2: "sawtooth", detune: 9, brightness: 3.5, attack: 0.09, decay: 0.6, gain: 0.1 },
  FLUTE: { wave: "sine", wave2: "triangle", detune: 3, brightness: 2.5, attack: 0.04, decay: 0.45, gain: 0.24 },
  HARP: { wave: "triangle", wave2: "sine", detune: 5, brightness: 8, attack: 0.003, decay: 2.0, gain: 0.19 },
  ORGAN: { wave: "square", wave2: "square", detune: 0, brightness: 3, attack: 0.02, decay: 0.15, gain: 0.08 },
};

function timbreFor(instrument: string): Timbre {
  const key = Object.keys(TIMBRES).find((k) => instrument.toUpperCase().includes(k));
  return TIMBRES[key ?? "PIANO"];
}

/** Tiny Web Audio player. No libraries — an artifact of the app being offline-first. */
class Player {
  private ctx: AudioContext | null = null;
  private stopAt = 0;
  private nodes: OscillatorNode[] = [];

  private context(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
    }
    return this.ctx;
  }

  note(pitch: number, at: number, seconds: number, instrument: string, velocity = 1) {
    const ctx = this.context();
    const t = timbreFor(instrument);
    const hz = midiToHz(pitch);
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = Math.min(12000, hz * t.brightness);
    filter.Q.value = 0.4;

    const peak = t.gain * velocity;
    const release = Math.max(0.08, Math.min(seconds + t.decay, seconds * 1.6 + 0.3));
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + t.attack);
    // A touch of early decay before the release keeps long notes alive
    // instead of organ-flat.
    gain.gain.exponentialRampToValueAtTime(peak * 0.72, at + t.attack + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + release);
    gain.connect(filter).connect(ctx.destination);

    const voices: [OscillatorType, number][] = [[t.wave, 0]];
    if (t.wave2) voices.push([t.wave2, t.detune ?? 0]);
    for (const [wave, detune] of voices) {
      const osc = ctx.createOscillator();
      osc.type = wave;
      osc.frequency.value = hz;
      osc.detune.value = detune;
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + release + 0.05);
      this.nodes.push(osc);
    }
    this.stopAt = Math.max(this.stopAt, at + release);
  }

  /** Metronome tick: a filtered click, brighter on the downbeat. */
  tick(at: number, accent: boolean) {
    const ctx = this.context();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = accent ? 1660 : 1150;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.12 : 0.07, at + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.055);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.08);
    this.nodes.push(osc);
  }

  now(): number {
    return this.context().currentTime;
  }

  async resume() {
    const ctx = this.context();
    if (ctx.state === "suspended") await ctx.resume();
  }

  stop() {
    for (const n of this.nodes) {
      try {
        n.stop();
      } catch {
        /* already stopped */
      }
    }
    this.nodes = [];
  }
}

/* -------------------------------------------------------------------------- */
/* Editor                                                                      */
/* -------------------------------------------------------------------------- */

const NOTE_NAMES: Record<number, string> = {
  1: "sixteenth",
  2: "eighth",
  3: "dotted eighth",
  4: "quarter",
  6: "dotted quarter",
  8: "half",
  12: "dotted half",
  16: "whole",
  24: "dotted whole",
  32: "double whole",
};

/**
 * Note lengths are labelled in beats rather than with musical glyphs. Half and
 * sixteenth-note characters have patchy font coverage, and "1 beat" is a thing
 * a beginner can act on without having read the rhythm lesson yet.
 */
function beatLabel(ticks: number, perBeat: number): string {
  const beats = ticks / perBeat;
  if (beats === 0.25) return "¼";
  if (beats === 0.5) return "½";
  if (beats === 0.75) return "¾";
  if (beats === 1.5) return "1½";
  if (beats === 3) return "3";
  if (Number.isInteger(beats)) return String(beats);
  return beats.toFixed(2).replace(/0+$/, "");
}

export function ScoreEditor({
  score,
  onChange,
  freedom,
  checks,
  readOnly = false,
}: {
  score: Score;
  onChange: (score: Score) => void;
  freedom: Freedom;
  checks: Check[];
  readOnly?: boolean;
}) {
  // Default to one beat, not the shortest length available: a grid full of
  // sixteenths is the wrong first impression, and a beat is the unit a
  // beginner already feels.
  const [duration, setDuration] = useState(() => {
    const beat = TICKS_PER_WHOLE / (score.meter.unit || 4);
    return freedom.durations.includes(beat) ? beat : (freedom.durations[0] ?? 4);
  });
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [metronome, setMetronome] = useState(false);
  const [loop, setLoop] = useState(false);
  const playerRef = useRef<Player | null>(null);
  const rafRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const loopRef = useRef(false);
  loopRef.current = loop;

  // Undo/redo. The editor owns the history even though the score lives in the
  // parent: every mutation funnels through change() below.
  const undoStack = useRef<Score[]>([]);
  const redoStack = useRef<Score[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  const change = useCallback(
    (next: Score) => {
      undoStack.current.push(score);
      if (undoStack.current.length > 100) undoStack.current.shift();
      redoStack.current = [];
      setHistoryVersion((v) => v + 1);
      onChange(next);
    },
    [score, onChange]
  );

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(score);
    setHistoryVersion((v) => v + 1);
    onChange(prev);
  }, [score, onChange]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(score);
    setHistoryVersion((v) => v + 1);
    onChange(next);
  }, [score, onChange]);

  const barTicks = ticksPerBar(score.meter);
  const beatTicks = ticksPerBeat(score.meter);
  const total = totalTicks(score);
  const columns = Math.ceil(total / freedom.gridStep);

  /* ---- Pitch rows ------------------------------------------------------- */
  const rows = useMemo(() => {
    const tonic = 60 + ((keyPitchClass(score.key) - 0 + 12) % 12); // tonic at or above middle C
    const low = tonic - 12;
    const high = tonic + 24;
    const pitches = freedom.chromatic
      ? Array.from({ length: high - low + 1 }, (_, i) => low + i)
      : scalePitches(score.key, score.mode, low, high);
    const startIdx = pitches.findIndex((p) => p >= tonic);
    return pitches.slice(startIdx, startIdx + freedom.rows).reverse(); // high at top
  }, [score.key, score.mode, freedom.chromatic, freedom.rows]);

  /* ---- Note editing ----------------------------------------------------- */
  const noteAt = useCallback(
    (pitch: number, tick: number): ScoreNote | undefined =>
      score.melody.find(
        (n) => n.pitch === pitch && n.start <= tick && n.start + n.duration > tick
      ),
    [score.melody]
  );

  const anyNoteAt = useCallback(
    (tick: number): ScoreNote | undefined =>
      score.melody.find((n) => n.start <= tick && n.start + n.duration > tick),
    [score.melody]
  );

  function preview(pitch: number) {
    if (!playerRef.current) playerRef.current = new Player();
    const p = playerRef.current;
    void p.resume().then(() => p.note(pitch, p.now() + 0.01, 0.25, score.instrument));
  }

  function toggle(pitch: number, tick: number) {
    if (readOnly) return;
    const existing = noteAt(pitch, tick);
    if (existing) {
      change({ ...score, melody: score.melody.filter((n) => n !== existing) });
      return;
    }
    const len = Math.min(duration, total - tick);
    if (len <= 0) return;
    // One line of melody: clear anything this note would sound over.
    const melody = score.melody.filter(
      (n) => n.start + n.duration <= tick || n.start >= tick + len
    );
    melody.push({ start: tick, duration: len, pitch });
    change({ ...score, melody: melody.sort((a, b) => a.start - b.start) });
    preview(pitch);
  }

  function setChord(barIndex: number, degree: number | null) {
    if (readOnly) return;
    const from = barIndex * barTicks;
    const chords = score.chords.filter((c) => c.start !== from);
    if (degree !== null) {
      const { quality } = triadFor(degree, score.key, score.mode);
      chords.push({ start: from, duration: barTicks, degree, quality });
      const { pitches } = triadFor(degree, score.key, score.mode);
      if (!playerRef.current) playerRef.current = new Player();
      const p = playerRef.current;
      void p.resume().then(() => {
        const now = p.now() + 0.01;
        pitches.forEach((pitch) => p.note(pitch, now, 0.5, score.instrument, 0.5));
      });
    }
    change({ ...score, chords: chords.sort((a, b) => a.start - b.start) });
  }

  /* ---- Playback --------------------------------------------------------- */
  const stop = useCallback(() => {
    playerRef.current?.stop();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlaying(false);
    setPlayhead(null);
  }, []);

  async function play() {
    if (playing) return stop();
    if (!playerRef.current) playerRef.current = new Player();
    const p = playerRef.current;
    await p.resume();

    const secondsPerTick = 60 / score.tempo / ticksPerBeat(score.meter);
    const t0 = p.now() + 0.08;

    const schedule = (from: number) => {
      for (const n of score.melody) {
        p.note(n.pitch, from + n.start * secondsPerTick, n.duration * secondsPerTick, score.instrument);
      }
      for (const c of score.chords) {
        const { pitches } = triadFor(c.degree, score.key, score.mode);
        pitches.forEach((pitch, i) =>
          p.note(
            pitch - 12,
            from + c.start * secondsPerTick + i * 0.012,
            c.duration * secondsPerTick,
            score.instrument,
            0.4
          )
        );
      }
      if (metronome) {
        const bt = ticksPerBeat(score.meter);
        for (let t = 0; t < total; t += bt) {
          p.tick(from + t * secondsPerTick, t % ticksPerBar(score.meter) === 0);
        }
      }
    };

    schedule(t0);
    setPlaying(true);
    let passStart = t0;
    const passLength = total * secondsPerTick;
    const frame = () => {
      const now = p.now();
      if (now >= passStart + passLength) {
        if (loopRef.current) {
          // Seamless: schedule the next pass exactly at the end of this one.
          passStart += passLength;
          schedule(passStart);
        } else {
          return stop();
        }
      }
      setPlayhead(Math.max(0, (now - passStart) / secondsPerTick));
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const inField = (e.target as HTMLElement)?.closest("input,textarea,select");
      if (e.code === "Space" && !inField) {
        e.preventDefault();
        void play();
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ" && !inField && !readOnly) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---- Live feedback ---------------------------------------------------- */
  const results = useMemo(() => runChecks(score, checks), [score, checks]);
  const stats = useMemo(() => analyze(score), [score]);

  const cellW = freedom.gridStep === 1 ? 18 : freedom.gridStep === 2 ? 26 : 34;
  const cellH = 22;

  return (
    <div className="space-y-4">
      {/* ---- Toolbar ------------------------------------------------------- */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <button
          type="button"
          onClick={play}
          className={playing ? "btn-danger" : "btn-primary"}
          aria-label={playing ? "Stop playback" : "Play the piece"}
        >
          <Icon name={playing ? "stop" : "play"} size={15} />
          {playing ? "Stop" : "Play"}
        </button>

        {!readOnly && (
          <div className="flex items-center gap-1 rounded-lg border border-abyss-600 bg-abyss-900/60 p-1">
            <span className="px-1.5 text-[10px] uppercase tracking-widest text-parchment-500">
              beats
            </span>
            {freedom.durations.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                title={`${NOTE_NAMES[d] ?? "custom"} note — ${beatLabel(d, beatTicks)} beat${
                  d / beatTicks === 1 ? "" : "s"
                }`}
                className={`min-w-[2.6rem] rounded px-2 py-1 text-sm font-semibold leading-none transition-colors ${
                  duration === d
                    ? "bg-gold-600 text-abyss-950"
                    : "text-parchment-300 hover:bg-abyss-700"
                }`}
              >
                {beatLabel(d, beatTicks)}
              </button>
            ))}
          </div>
        )}

        {!readOnly && (
          <div className="flex items-center rounded-lg border border-abyss-600 bg-abyss-900/60 p-1">
            <button
              type="button"
              onClick={undo}
              disabled={undoStack.current.length === 0}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
              className="rounded px-2 py-1 text-parchment-300 transition-colors hover:bg-abyss-700 disabled:opacity-30"
            >
              <Icon name="undo" size={14} />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={redoStack.current.length === 0}
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
              className="rounded px-2 py-1 text-parchment-300 transition-colors hover:bg-abyss-700 disabled:opacity-30"
            >
              <Icon name="redo" size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center rounded-lg border border-abyss-600 bg-abyss-900/60 p-1">
          <button
            type="button"
            onClick={() => setMetronome((m) => !m)}
            title="Metronome — a click on every beat during playback"
            aria-pressed={metronome}
            className={`rounded px-2 py-1 transition-colors ${
              metronome ? "bg-gold-600 text-abyss-950" : "text-parchment-300 hover:bg-abyss-700"
            }`}
          >
            <Icon name="metronome" size={14} />
          </button>
          <button
            type="button"
            onClick={() => setLoop((l) => !l)}
            title="Loop — play the piece round and round"
            aria-pressed={loop}
            className={`rounded px-2 py-1 transition-colors ${
              loop ? "bg-gold-600 text-abyss-950" : "text-parchment-300 hover:bg-abyss-700"
            }`}
          >
            <Icon name="loop" size={14} />
          </button>
        </div>

        <span className="pill">
          <Icon name="note" size={11} /> {score.key} {score.mode}
        </span>
        <span className="pill">
          <Icon name="drum" size={11} /> {score.meter.beats}/{score.meter.unit}
        </span>
        <span className="pill">
          <Icon name="column" size={11} /> {score.bars} bars
        </span>
        <span className="pill">
          <Icon name="harp" size={11} /> {score.instrument.toLowerCase()}
        </span>

        {freedom.canEditSetup && !readOnly && (
          <label className="flex items-center gap-2 text-xs text-parchment-400">
            <Icon name="clock" size={12} />
            <input
              type="range"
              min={50}
              max={180}
              value={score.tempo}
              onChange={(e) => onChange({ ...score, tempo: Number(e.target.value) })}
              className="w-24 accent-[#c9a84c]"
            />
            {score.tempo}
          </label>
        )}

        <div className="ml-auto flex items-center gap-2">
          {!readOnly && score.melody.length > 0 && (
            <button
              type="button"
              onClick={() => change({ ...score, melody: [], chords: [] })}
              className="btn-ghost text-xs"
            >
              <Icon name="refresh" size={13} /> Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="btn-ghost text-xs"
            aria-expanded={showHelp}
          >
            <Icon name="info" size={13} /> How
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="card space-y-2 p-4 text-sm text-parchment-300">
          <p className="flex gap-2">
            <Icon name="note" size={15} className="mt-0.5 shrink-0 text-gold-500" />
            Pick a note length, then click a square to place a note. Click it again to remove
            it. Every row is a note that belongs to this key, so you cannot play a wrong one.
          </p>
          {freedom.chords && (
            <p className="flex gap-2">
              <Icon name="chord" size={15} className="mt-0.5 shrink-0 text-gold-500" />
              The strip under the grid is harmony — one chord per bar. Roman numerals name the
              chord: <strong>I</strong> is home, <strong>V</strong> wants to go home.
            </p>
          )}
          <p className="flex gap-2">
            <Icon name="target" size={15} className="mt-0.5 shrink-0 text-gold-500" />
            The panel on the right lists what this trial demands. Every line has to turn green
            before you can submit — it updates as you write.
          </p>
          <p className="flex gap-2">
            <Icon name="clock" size={15} className="mt-0.5 shrink-0 text-gold-500" />
            <span>
              <kbd className="rounded bg-abyss-900 px-1.5 py-0.5 text-xs">Space</kbd> plays and
              stops. <kbd className="rounded bg-abyss-900 px-1.5 py-0.5 text-xs">Ctrl+Z</kbd>{" "}
              undoes; add <kbd className="rounded bg-abyss-900 px-1.5 py-0.5 text-xs">Shift</kbd>{" "}
              to redo. The metronome clicks every beat; the loop plays your piece round and
              round while you listen for what to change.
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_19rem]">
        {/* ---- Grid -------------------------------------------------------- */}
        <div className="card overflow-hidden">
          <div ref={gridRef} className="overflow-x-auto">
            <div className="inline-block min-w-full p-3">
              {/* Bar numbers */}
              <div className="flex" style={{ paddingLeft: 56 }}>
                {Array.from({ length: score.bars }).map((_, b) => (
                  <div
                    key={b}
                    className="border-l border-abyss-600/70 pl-1 text-[10px] uppercase tracking-widest text-parchment-500"
                    style={{ width: (barTicks / freedom.gridStep) * cellW }}
                  >
                    Bar {b + 1}
                  </div>
                ))}
              </div>

              {/* Pitch rows */}
              <div className="relative mt-1">
                {playhead !== null && (
                  <div
                    className="pointer-events-none absolute top-0 z-20 w-px bg-gold-400/80"
                    style={{
                      left: 56 + (playhead / freedom.gridStep) * cellW,
                      height: rows.length * cellH,
                      boxShadow: "0 0 8px rgba(227,194,109,0.9)",
                    }}
                  />
                )}

                {rows.map((pitch) => {
                  const degree = scaleDegree(pitch, score.key, score.mode);
                  const isTonic = degree === 1;
                  const inKey = isDiatonic(pitch, score.key, score.mode);
                  return (
                    <div key={pitch} className="flex" style={{ height: cellH }}>
                      <button
                        type="button"
                        onClick={() => preview(pitch)}
                        title={`Hear ${pitchName(pitch, score.key)}`}
                        className={`flex w-14 shrink-0 items-center justify-between border-b border-r border-abyss-700/60 px-1.5 text-[10px] transition-colors hover:bg-abyss-700 ${
                          isTonic
                            ? "bg-abyss-700/70 text-gold-300"
                            : inKey
                              ? "bg-abyss-800/60 text-parchment-400"
                              : "bg-abyss-900/70 text-parchment-500"
                        }`}
                      >
                        <span>{pitchName(pitch, score.key).replace(/\d/, "")}</span>
                        <span className={isTonic ? "text-gold-400" : "text-parchment-500/70"}>
                          {degree ?? "♯"}
                        </span>
                      </button>

                      {Array.from({ length: columns }).map((_, c) => {
                        const tick = c * freedom.gridStep;
                        const note = noteAt(pitch, tick);
                        const isHead = note?.start === tick;
                        const occupied = !note && anyNoteAt(tick);
                        const barLine = tick % barTicks === 0;
                        const beatLine = tick % beatTicks === 0;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggle(pitch, tick)}
                            disabled={readOnly}
                            aria-label={`${pitchName(pitch, score.key)} at bar ${
                              Math.floor(tick / barTicks) + 1
                            }`}
                            title={`${pitchName(pitch, score.key)} · bar ${
                              Math.floor(tick / barTicks) + 1
                            }, beat ${Math.floor((tick % barTicks) / beatTicks) + 1}`}
                            className={`relative border-b border-abyss-700/40 transition-colors ${
                              barLine
                                ? "border-l-2 border-l-abyss-600"
                                : beatLine
                                  ? "border-l border-l-abyss-700/70"
                                  : "border-l border-l-abyss-800/60"
                            } ${
                              note
                                ? isTonic
                                  ? "bg-gold-500"
                                  : "bg-gold-600"
                                : occupied
                                  ? "bg-abyss-800/40"
                                  : isTonic
                                    ? "bg-abyss-800/50 hover:bg-abyss-600"
                                    : "hover:bg-abyss-700/70"
                            }`}
                            style={{ width: cellW }}
                          >
                            {isHead && (
                              <span className="absolute inset-y-0.5 left-0.5 w-0.5 rounded bg-abyss-950/60" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Harmony lane */}
              {freedom.chords && (
                <div className="mt-3 flex" style={{ paddingLeft: 56 }}>
                  {Array.from({ length: score.bars }).map((_, b) => {
                    const chord = score.chords.find((c) => c.start === b * barTicks);
                    return (
                      <div
                        key={b}
                        className="border-l border-abyss-600/70 px-1"
                        style={{ width: (barTicks / freedom.gridStep) * cellW }}
                      >
                        <select
                          value={chord ? chord.degree : ""}
                          disabled={readOnly}
                          onChange={(e) =>
                            setChord(b, e.target.value === "" ? null : Number(e.target.value))
                          }
                          className="w-full rounded border border-abyss-600 bg-abyss-900 px-1 py-1 text-center text-xs text-gold-300 focus:border-gold-600 focus:outline-none"
                          aria-label={`Chord for bar ${b + 1}`}
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
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-abyss-700/50 px-4 py-2 text-[11px] text-parchment-500">
            <span>{stats.noteCount} notes</span>
            <span>
              range {stats.rangeSemitones} semitone{stats.rangeSemitones === 1 ? "" : "s"}
            </span>
            <span>
              {stats.intervals.filter((i) => i !== 0).length > 0
                ? `${Math.round(
                    (stats.stepCount / stats.intervals.filter((i) => i !== 0).length) * 100
                  )}% stepwise`
                : "no movement yet"}
            </span>
            <span>
              ~{Math.round((total * 60) / score.tempo / ticksPerBeat(score.meter))}s at {score.tempo} bpm
            </span>
            <span className="ml-auto">{freedom.name} tools</span>
          </div>
        </div>

        {/* ---- Requirements ------------------------------------------------- */}
        <aside className="card lit-edge h-fit p-4">
          <h3 className="heading-display flex items-center gap-2 text-base">
            <Icon name="target" size={16} className="text-gold-500" />
            The Standard
          </h3>
          <p className="mt-1 text-xs text-parchment-500">
            {results.passedCount} of {results.results.length} met
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-abyss-900">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${
                  results.results.length
                    ? (results.passedCount / results.results.length) * 100
                    : 0
                }%`,
                backgroundImage: results.passed
                  ? "linear-gradient(90deg,#1f6b52,#4dc79a)"
                  : "linear-gradient(90deg,#a8863a,#e3c26d)",
              }}
            />
          </div>

          {results.passed && results.results.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-emerald-700/60 bg-abyss-900/60 px-3.5 py-2.5 animate-rise">
              <Icon name="trophy" size={18} className="shrink-0 text-emerald-300" />
              <div>
                <p className="font-display text-sm text-emerald-300">The Standard Is Met</p>
                <p className="text-[11px] text-parchment-500">
                  Listen once more, name it, and claim your victory below.
                </p>
              </div>
            </div>
          )}

          <ul className="mt-4 space-y-3">
            {results.results.map((r) => (
              <li key={r.id} className="flex gap-2.5">
                <Icon
                  name={r.passed ? "check" : "target"}
                  size={15}
                  className={`mt-0.5 shrink-0 ${
                    r.passed ? "text-emerald-400" : "text-parchment-500"
                  }`}
                />
                <div className="min-w-0">
                  <p
                    className={`text-[13px] leading-snug ${
                      r.passed ? "text-parchment-300" : "text-parchment-100"
                    }`}
                  >
                    {r.label}
                  </p>
                  <p className="text-[11px] text-parchment-500">{r.detail}</p>
                  {!r.passed && r.hint && (
                    <p className="mt-1 text-[11px] leading-relaxed text-gold-600">{r.hint}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {results.results.length === 0 && (
            <p className="mt-3 text-sm text-parchment-500">
              No fixed standard here — write whatever you like.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
