"use client";

import { DURATION_PALETTE } from "@/lib/studio/staff";
import type {
  Articulation,
  BarlineStyle,
  Dynamic,
  NoteheadStyle,
  Ornament,
  StemDirection,
} from "@/lib/studio/model";
import type { Clef } from "@/lib/studio/instruments";
import { Icon } from "@/components/ui/Icon";

/**
 * The notation toolbar: everything a composer writes with, sorted into tabs so
 * that no single row ever holds more than it can explain.
 *
 * Tools that act on a selection stay live but grey out when nothing is
 * selected, so the toolbar's shape never shifts under the cursor.
 */

export type ToolTab =
  | "notes"
  | "articulation"
  | "ornament"
  | "dynamics"
  | "expression"
  | "measure"
  | "text"
  | "advanced";

const TABS: { id: ToolTab; label: string }[] = [
  { id: "notes", label: "Notes" },
  { id: "articulation", label: "Articulation" },
  { id: "ornament", label: "Ornament" },
  { id: "dynamics", label: "Dynamics" },
  { id: "expression", label: "Expression" },
  { id: "measure", label: "Measure" },
  { id: "text", label: "Text" },
  { id: "advanced", label: "Advanced" },
];

export interface ToolbarActions {
  onSetDuration: (base: number) => void;
  onSetDots: (dots: 0 | 1 | 2) => void;
  onSetAccidental: (a: -1 | 0 | 1 | null) => void;
  onToggleRest: () => void;
  onSetVoice: (v: number) => void;
  onSetNoteInput: (on: boolean) => void;
  onTuplet: (ratio: [number, number]) => void;
  onTie: () => void;
  onArticulation: (a: Articulation) => void;
  onOrnament: (o: Ornament) => void;
  onDynamic: (d: Dynamic) => void;
  onHairpin: (k: "crescendo" | "diminuendo") => void;
  onSlur: () => void;
  onAddMeasure: (where: "before" | "after" | "end") => void;
  onDeleteMeasure: () => void;
  onBarline: (b: BarlineStyle) => void;
  onRehearsal: () => void;
  onKeyChange: () => void;
  onMeterChange: () => void;
  onText: (kind: "tempo" | "technique" | "expression" | "lyric" | "staff" | "system") => void;
  onClefChange: (c: Clef) => void;
  onOctaveLine: (shift: 1 | -1) => void;
  onNotehead: (n: NoteheadStyle) => void;
  onStem: (s: StemDirection) => void;
  onEnharmonic: () => void;
  onDelete: () => void;
}

export interface ToolbarState {
  tab: ToolTab;
  duration: number;
  dots: 0 | 1 | 2;
  accidental: -1 | 0 | 1 | null;
  restMode: boolean;
  voice: number;
  noteInput: boolean;
  hasSelection: boolean;
  voiceCount: number;
}

export function NotationToolbar({
  state,
  actions,
}: {
  state: ToolbarState;
  actions: ToolbarActions;
}) {
  return (
    <div className="border-b border-abyss-700 bg-abyss-900/70">
      {/* ---- Mode and duration: always visible, whatever the tab ---------- */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5">
        <Group>
          <Tool
            active={state.noteInput}
            onClick={() => actions.onSetNoteInput(true)}
            title="Note input mode (N)"
          >
            <Icon name="pencil" size={13} />
          </Tool>
          <Tool
            active={!state.noteInput}
            onClick={() => actions.onSetNoteInput(false)}
            title="Select and edit mode (Esc)"
          >
            <Icon name="target" size={13} />
          </Tool>
        </Group>

        <Group>
          {DURATION_PALETTE.map((d) => (
            <Tool
              key={d.base}
              active={state.duration === d.base}
              onClick={() => actions.onSetDuration(d.base)}
              title={`${d.label} note`}
              wide
            >
              <span className="text-base leading-none">{d.symbol}</span>
            </Tool>
          ))}
        </Group>

        <Group>
          <Tool active={state.dots === 1} onClick={() => actions.onSetDots(state.dots === 1 ? 0 : 1)} title="Dotted">
            ♩.
          </Tool>
          <Tool active={state.dots === 2} onClick={() => actions.onSetDots(state.dots === 2 ? 0 : 2)} title="Double dotted">
            ♩..
          </Tool>
        </Group>

        <Group>
          <Tool active={state.restMode} onClick={actions.onToggleRest} title="Write rests (R)">
            𝄽
          </Tool>
        </Group>

        <Group>
          {([-1, 0, 1] as const).map((a) => (
            <Tool
              key={a}
              active={state.accidental === a}
              onClick={() => actions.onSetAccidental(state.accidental === a ? null : a)}
              title={a === -1 ? "Flat" : a === 1 ? "Sharp" : "Natural"}
            >
              {a === -1 ? "♭" : a === 1 ? "♯" : "♮"}
            </Tool>
          ))}
        </Group>

        <Group>
          {Array.from({ length: Math.max(2, state.voiceCount) }).map((_, i) => (
            <Tool
              key={i}
              active={state.voice === i}
              onClick={() => actions.onSetVoice(i)}
              title={`Voice ${i + 1}`}
            >
              {i + 1}
            </Tool>
          ))}
        </Group>

        <button
          type="button"
          onClick={actions.onDelete}
          disabled={!state.hasSelection}
          title="Delete selection (Del)"
          className="ml-auto rounded px-2 py-1 text-parchment-400 hover:bg-abyss-700 disabled:opacity-30"
        >
          <Icon name="trash" size={13} />
        </button>
      </div>

    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center rounded border border-abyss-700 bg-abyss-950/50 p-0.5">
      {children}
    </div>
  );
}

function Tool({
  children,
  onClick,
  active = false,
  disabled = false,
  title,
  wide = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={`rounded px-1.5 py-0.5 text-xs leading-none transition-colors disabled:opacity-25 ${
        wide ? "min-w-[2.1rem]" : "min-w-[1.6rem]"
      } ${active ? "bg-gold-600 text-abyss-950" : "text-parchment-300 hover:bg-abyss-700"}`}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1 text-[9px] uppercase tracking-[0.18em] text-parchment-600">
      {children}
    </span>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="ml-2 text-[10px] italic text-parchment-600">{children}</span>;
}
