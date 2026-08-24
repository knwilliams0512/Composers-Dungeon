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
  onTab,
}: {
  state: ToolbarState;
  actions: ToolbarActions;
  onTab: (t: ToolTab) => void;
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

      {/* ---- Category tabs ------------------------------------------------ */}
      <div className="flex gap-0.5 overflow-x-auto border-t border-abyss-800 px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            className={`shrink-0 border-b-2 px-2.5 py-1 text-[11px] font-medium transition-colors ${
              state.tab === t.id
                ? "border-gold-500 text-gold-300"
                : "border-transparent text-parchment-500 hover:text-parchment-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---- The active category ------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-abyss-800 px-3 py-1.5">
        <TabContent state={state} actions={actions} />
      </div>
    </div>
  );
}

function TabContent({ state, actions }: { state: ToolbarState; actions: ToolbarActions }) {
  const sel = state.hasSelection;

  switch (state.tab) {
    case "notes":
      return (
        <>
          <Label>Tuplets</Label>
          <Group>
            <Tool onClick={() => actions.onTuplet([3, 2])} title="Triplet" wide>3</Tool>
            <Tool onClick={() => actions.onTuplet([5, 4])} title="Quintuplet" wide>5</Tool>
            <Tool onClick={() => actions.onTuplet([6, 4])} title="Sextuplet" wide>6</Tool>
            <Tool onClick={() => actions.onTuplet([7, 4])} title="Septuplet" wide>7</Tool>
          </Group>
          <Label>Tie</Label>
          <Tool onClick={actions.onTie} disabled={!sel} title="Tie to the next note">⌣</Tool>
          <Label>Enharmonic</Label>
          <Tool onClick={actions.onEnharmonic} disabled={!sel} title="Respell this note" wide>
            ♯/♭
          </Tool>
        </>
      );

    case "articulation":
      return (
        <>
          {(
            [
              ["staccato", "·", "Staccato"],
              ["staccatissimo", "▾", "Staccatissimo"],
              ["tenuto", "—", "Tenuto"],
              ["accent", ">", "Accent"],
              ["marcato", "^", "Marcato"],
              ["portato", "‗", "Portato"],
            ] as [Articulation, string, string][]
          ).map(([a, glyph, title]) => (
            <Tool key={a} onClick={() => actions.onArticulation(a)} disabled={!sel} title={title} wide>
              {glyph}
            </Tool>
          ))}
          {!sel && <Hint>Select a note to add articulations.</Hint>}
        </>
      );

    case "ornament":
      return (
        <>
          {(
            [
              ["trill", "tr", "Trill"],
              ["mordent", "𝆜", "Mordent"],
              ["turn", "∾", "Turn"],
              ["tremolo", "≡", "Tremolo"],
              ["arpeggio", "❙", "Arpeggio"],
              ["grace", "♪", "Grace note"],
            ] as [Ornament, string, string][]
          ).map(([o, glyph, title]) => (
            <Tool key={o} onClick={() => actions.onOrnament(o)} disabled={!sel} title={title} wide>
              {glyph}
            </Tool>
          ))}
          {!sel && <Hint>Select a note to add an ornament.</Hint>}
        </>
      );

    case "dynamics":
      return (
        <>
          {(["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff", "sfz", "fp"] as Dynamic[]).map((d) => (
            <Tool key={d} onClick={() => actions.onDynamic(d)} title={`Dynamic ${d}`} wide>
              <span className="font-serif italic">{d}</span>
            </Tool>
          ))}
          <Label>Hairpins</Label>
          <Tool onClick={() => actions.onHairpin("crescendo")} title="Crescendo" wide>&lt;</Tool>
          <Tool onClick={() => actions.onHairpin("diminuendo")} title="Diminuendo" wide>&gt;</Tool>
        </>
      );

    case "expression":
      return (
        <>
          <Tool onClick={actions.onSlur} disabled={!sel} title="Slur" wide>⌒</Tool>
          <Tool onClick={() => actions.onArticulation("tenuto")} disabled={!sel} title="Phrase mark" wide>‿</Tool>
          <Tool onClick={() => actions.onText("expression")} title="Expression text" wide>
            <span className="font-serif italic">espr.</span>
          </Tool>
          <Tool onClick={() => actions.onText("technique")} title="Technique text" wide>tech.</Tool>
          <Label>Fingering</Label>
          {[1, 2, 3, 4, 5].map((f) => (
            <Tool key={f} onClick={() => actions.onText("staff")} disabled={!sel} title={`Finger ${f}`}>
              {f}
            </Tool>
          ))}
        </>
      );

    case "measure":
      return (
        <>
          <Tool onClick={() => actions.onAddMeasure("before")} title="Insert measure before" wide>+◀</Tool>
          <Tool onClick={() => actions.onAddMeasure("after")} title="Insert measure after" wide>+▶</Tool>
          <Tool onClick={() => actions.onAddMeasure("end")} title="Append measure at the end" wide>+⏭</Tool>
          <Tool onClick={actions.onDeleteMeasure} disabled={!sel} title="Delete this measure" wide>−</Tool>
          <Label>Barlines</Label>
          {(
            [
              ["single", "|"],
              ["double", "‖"],
              ["final", "𝄂"],
              ["repeat-start", "𝄆"],
              ["repeat-end", "𝄇"],
              ["dashed", "┆"],
            ] as [BarlineStyle, string][]
          ).map(([b, glyph]) => (
            <Tool key={b} onClick={() => actions.onBarline(b)} disabled={!sel} title={b} wide>
              {glyph}
            </Tool>
          ))}
          <Label>Marks</Label>
          <Tool onClick={actions.onRehearsal} disabled={!sel} title="Rehearsal mark" wide>A</Tool>
          <Tool onClick={actions.onKeyChange} disabled={!sel} title="Key signature change" wide>♯♭</Tool>
          <Tool onClick={actions.onMeterChange} disabled={!sel} title="Time signature change" wide>4/4</Tool>
        </>
      );

    case "text":
      return (
        <>
          <Tool onClick={() => actions.onText("tempo")} title="Tempo text" wide>Tempo</Tool>
          <Tool onClick={() => actions.onText("technique")} title="Technique text" wide>Tech</Tool>
          <Tool onClick={() => actions.onText("expression")} title="Expression text" wide>Expr</Tool>
          <Tool onClick={() => actions.onText("lyric")} title="Lyrics" wide>Lyric</Tool>
          <Tool onClick={() => actions.onText("staff")} title="Staff text" wide>Staff</Tool>
          <Tool onClick={() => actions.onText("system")} title="System text" wide>System</Tool>
        </>
      );

    case "advanced":
      return (
        <>
          <Label>Clef</Label>
          {(["treble", "bass", "alto", "tenor", "percussion"] as Clef[]).map((c) => (
            <Tool key={c} onClick={() => actions.onClefChange(c)} title={`Change to ${c} clef`} wide>
              {c.slice(0, 4)}
            </Tool>
          ))}
          <Label>Octave</Label>
          <Tool onClick={() => actions.onOctaveLine(1)} title="8va" wide>8va</Tool>
          <Tool onClick={() => actions.onOctaveLine(-1)} title="8vb" wide>8vb</Tool>
          <Label>Notehead</Label>
          {(["normal", "cross", "diamond", "triangle", "slash"] as NoteheadStyle[]).map((n) => (
            <Tool key={n} onClick={() => actions.onNotehead(n)} disabled={!sel} title={n} wide>
              {n === "normal" ? "●" : n === "cross" ? "✕" : n === "diamond" ? "◆" : n === "triangle" ? "▲" : "/"}
            </Tool>
          ))}
          <Label>Stem</Label>
          {(["auto", "up", "down"] as StemDirection[]).map((s) => (
            <Tool key={s} onClick={() => actions.onStem(s)} disabled={!sel} title={`Stem ${s}`} wide>
              {s === "auto" ? "auto" : s === "up" ? "↑" : "↓"}
            </Tool>
          ))}
        </>
      );
  }
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
