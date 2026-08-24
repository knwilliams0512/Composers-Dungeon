"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * The top application bar: what the document is, how it sounds, and where it
 * goes. Three zones — document on the left, transport in the middle, sharing
 * on the right — kept to one slim row so the music keeps the screen.
 */

export type SaveState = "saved" | "saving" | "dirty" | "error";

export interface TransportState {
  playing: boolean;
  loop: boolean;
  metronome: boolean;
  countIn: boolean;
  tempo: number;
  /** Measure the playhead is in, 1-based, or null when stopped. */
  position: number | null;
  totalMeasures: number;
}

export function TopBar({
  title,
  saveState,
  lastSavedAt,
  transport,
  canUndo,
  canRedo,
  onTitle,
  onUndo,
  onRedo,
  onPlay,
  onStop,
  onRestart,
  onPrevMeasure,
  onNextMeasure,
  onToggleLoop,
  onToggleMetronome,
  onToggleCountIn,
  onTempo,
  onToggleMixer,
  onMidiSettings,
  onHistory,
  onComments,
  onShare,
  onImport,
  onExport,
  onPrint,
  onHelp,
}: {
  title: string;
  saveState: SaveState;
  lastSavedAt: Date | null;
  transport: TransportState;
  canUndo: boolean;
  canRedo: boolean;
  onTitle: (t: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onPlay: () => void;
  onStop: () => void;
  onRestart: () => void;
  onPrevMeasure: () => void;
  onNextMeasure: () => void;
  onToggleLoop: () => void;
  onToggleMetronome: () => void;
  onToggleCountIn: () => void;
  onTempo: (t: number) => void;
  onToggleMixer: () => void;
  onMidiSettings: () => void;
  onHistory: () => void;
  onComments: () => void;
  onShare: () => void;
  onImport: () => void;
  onExport: () => void;
  onPrint: () => void;
  onHelp: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-abyss-700 bg-abyss-900 px-2">
      {/* ---- Document -------------------------------------------------- */}
      <Link
        href="/studio"
        title="Back to the library"
        className="rounded px-1.5 py-1 text-parchment-400 hover:bg-abyss-700 hover:text-parchment-100"
      >
        <Icon name="arrow" size={15} className="rotate-180" />
      </Link>
      <Icon name="scroll" size={15} className="shrink-0 text-gold-500" />

      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
          className="w-48 rounded border border-gold-600 bg-abyss-950 px-1.5 py-0.5 text-sm text-parchment-100 outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          title="Rename this score"
          className="max-w-[14rem] truncate rounded px-1.5 py-0.5 text-sm text-parchment-100 hover:bg-abyss-800"
        >
          {title || "Untitled Score"}
        </button>
      )}

      <SaveBadge state={saveState} at={lastSavedAt} />

      <div className="flex items-center rounded border border-abyss-700 bg-abyss-950/50 p-0.5">
        <Bar onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <Icon name="undo" size={13} />
        </Bar>
        <Bar onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
          <Icon name="redo" size={13} />
        </Bar>
      </div>

      {/* ---- Transport --------------------------------------------------- */}
      <div className="mx-auto flex items-center gap-1">
        <div className="flex items-center rounded border border-abyss-700 bg-abyss-950/50 p-0.5">
          <Bar onClick={onRestart} title="Back to the beginning">
            <Icon name="skipBack" size={13} />
          </Bar>
          <Bar onClick={onPrevMeasure} title="Previous measure">
            <Icon name="rewind" size={13} />
          </Bar>
          <Bar onClick={onPlay} title={transport.playing ? "Pause (Space)" : "Play (Space)"} accent>
            <Icon name={transport.playing ? "pause" : "play"} size={14} />
          </Bar>
          <Bar onClick={onStop} title="Stop">
            <Icon name="stop" size={13} />
          </Bar>
          <Bar onClick={onNextMeasure} title="Next measure">
            <Icon name="skipForward" size={13} />
          </Bar>
        </div>

        <div className="flex items-center rounded border border-abyss-700 bg-abyss-950/50 p-0.5">
          <Bar onClick={onToggleLoop} active={transport.loop} title="Loop playback">
            <Icon name="loop" size={13} />
          </Bar>
          <Bar onClick={onToggleMetronome} active={transport.metronome} title="Metronome">
            <Icon name="metronome" size={13} />
          </Bar>
          <Bar onClick={onToggleCountIn} active={transport.countIn} title="Count in one bar first">
            <span className="text-[10px] font-bold">1·2</span>
          </Bar>
        </div>

        <label className="flex items-center gap-1 rounded border border-abyss-700 bg-abyss-950/50 px-1.5 py-1" title="Tempo">
          <Icon name="clock" size={12} className="text-parchment-500" />
          <input
            type="number"
            min={20}
            max={300}
            value={transport.tempo}
            onChange={(e) => onTempo(Number(e.target.value))}
            className="w-10 bg-transparent text-center text-xs text-parchment-200 outline-none"
          />
          <span className="text-[9px] text-parchment-600">bpm</span>
        </label>

        <span className="min-w-[4.5rem] rounded border border-abyss-700 bg-abyss-950/50 px-2 py-1 text-center font-mono text-[11px] text-parchment-300">
          {transport.position !== null ? `m. ${transport.position}` : "m. —"}
          <span className="text-parchment-600"> / {transport.totalMeasures}</span>
        </span>
      </div>

      {/* ---- Document actions -------------------------------------------- */}
      <div className="flex items-center gap-0.5">
        <Bar onClick={onToggleMixer} title="Mixer">
          <Icon name="sliders" size={14} />
        </Bar>
        <Bar onClick={onMidiSettings} title="MIDI input">
          <Icon name="midi" size={14} />
        </Bar>
        <Bar onClick={onHistory} title="Version history">
          <Icon name="history" size={14} />
        </Bar>
        <Bar onClick={onComments} title="Comments">
          <Icon name="comment" size={14} />
        </Bar>
        <Bar onClick={onShare} title="Share and publish">
          <Icon name="share" size={14} />
        </Bar>
        <Bar onClick={onImport} title="Import">
          <Icon name="upload" size={14} />
        </Bar>
        <Bar onClick={onExport} title="Export">
          <Icon name="download" size={14} />
        </Bar>
        <Bar onClick={onPrint} title="Print">
          <Icon name="print" size={14} />
        </Bar>
        <Bar onClick={onHelp} title="Help and shortcuts">
          <Icon name="info" size={14} />
        </Bar>
        <Link
          href="/profile"
          title="Profile and settings"
          className="rounded px-1.5 py-1 text-parchment-400 hover:bg-abyss-700 hover:text-parchment-100"
        >
          <Icon name="settings" size={14} />
        </Link>
      </div>
    </header>
  );
}

function Bar({
  children,
  onClick,
  title,
  active = false,
  disabled = false,
  accent = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded px-1.5 py-1 transition-colors disabled:opacity-25 ${
        active
          ? "bg-gold-600 text-abyss-950"
          : accent
            ? "text-gold-300 hover:bg-abyss-700"
            : "text-parchment-400 hover:bg-abyss-700 hover:text-parchment-100"
      }`}
    >
      {children}
    </button>
  );
}

function SaveBadge({ state, at }: { state: SaveState; at: Date | null }) {
  const text =
    state === "saving"
      ? "Saving…"
      : state === "dirty"
        ? "Unsaved"
        : state === "error"
          ? "Save failed"
          : at
            ? `Saved ${at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
            : "Saved";
  const tone =
    state === "error"
      ? "text-crimson-400"
      : state === "dirty"
        ? "text-parchment-500"
        : state === "saving"
          ? "text-gold-400"
          : "text-emerald-400";
  return (
    <span className={`flex shrink-0 items-center gap-1 text-[10px] ${tone}`} title="Autosave status">
      {state === "saving" ? (
        <Icon name="refresh" size={10} className="animate-spin" />
      ) : state === "error" ? (
        <Icon name="warning" size={10} />
      ) : state === "dirty" ? (
        <Icon name="save" size={10} />
      ) : (
        <Icon name="check" size={10} />
      )}
      {text}
    </span>
  );
}
