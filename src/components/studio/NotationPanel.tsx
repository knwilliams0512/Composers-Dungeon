"use client";

import { useState } from "react";
import type {
  Articulation,
  BarlineStyle,
  Dynamic,
  NoteheadStyle,
  Ornament,
  StemDirection,
} from "@/lib/studio/model";
import type { Clef } from "@/lib/studio/instruments";
import type { ToolbarActions, ToolTab } from "./NotationToolbar";
import { Icon } from "@/components/ui/Icon";

/**
 * The notation palette, down the side rather than crushed into a strip.
 *
 * Eight categories across the top of a narrow editor gave each one a couple of
 * words and no room to say what its symbols do. Standing the palette up
 * changes that: the categories become a readable list, and every tool gets its
 * glyph and its name side by side, which is the difference between recognising
 * a marking and guessing at it.
 */

const CATEGORIES: { id: ToolTab; label: string; icon: string; blurb: string }[] = [
  { id: "notes", label: "Notes", icon: "note", blurb: "Tuplets, ties, respelling" },
  { id: "articulation", label: "Articulation", icon: "feather", blurb: "How each note is struck" },
  { id: "ornament", label: "Ornaments", icon: "sparkle", blurb: "Trills, turns, slides" },
  { id: "dynamics", label: "Dynamics", icon: "bolt", blurb: "Loudness and hairpins" },
  { id: "expression", label: "Expression", icon: "quill", blurb: "Slurs, phrasing, text" },
  { id: "measure", label: "Measures", icon: "column", blurb: "Bars, repeats, signatures" },
  { id: "text", label: "Text", icon: "scroll", blurb: "Tempo, lyrics, notes to players" },
  { id: "advanced", label: "Advanced", icon: "layers", blurb: "Clefs, octaves, noteheads" },
];

/** One tool: a drawn or typed symbol, its name, and what it is for. */
interface Tool {
  glyph: string;
  label: string;
  hint?: string;
  run: () => void;
  needsSelection?: boolean;
}

export function NotationPanel({
  tab,
  onTab,
  actions,
  hasSelection,
}: {
  tab: ToolTab;
  onTab: (t: ToolTab) => void;
  actions: ToolbarActions;
  hasSelection: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const active = CATEGORIES.find((c) => c.id === tab) ?? CATEGORIES[0];

  if (collapsed) {
    return (
      <div className="flex h-full w-11 flex-col items-center gap-1 border-l border-abyss-700 bg-abyss-900/40 py-2">
        <button
          onClick={() => setCollapsed(false)}
          title="Show the notation palette"
          className="rounded p-1.5 text-parchment-400 hover:bg-abyss-700"
        >
          <Icon name="chevron" size={14} className="rotate-180" />
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              onTab(c.id);
              setCollapsed(false);
            }}
            title={c.label}
            className={`rounded p-1.5 transition-colors ${
              tab === c.id ? "bg-gold-600 text-abyss-950" : "text-parchment-400 hover:bg-abyss-700"
            }`}
          >
            <Icon name={c.icon as never} size={14} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-l border-abyss-700 bg-abyss-900/40">
      <div className="flex items-center gap-2 border-b border-abyss-700 px-3 py-2">
        <Icon name="staff" size={13} className="text-gold-500" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-parchment-300">
          Notation
        </h2>
        <button
          onClick={() => setCollapsed(true)}
          title="Collapse the palette"
          className="ml-auto rounded p-0.5 text-parchment-500 hover:bg-abyss-700"
        >
          <Icon name="chevron" size={13} />
        </button>
      </div>

      {/* ---- The categories, as a list that can actually be read ---------- */}
      <div className="grid grid-cols-2 gap-1 border-b border-abyss-800 p-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => onTab(c.id)}
            title={c.blurb}
            className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-left text-[11px] font-medium transition-colors ${
              tab === c.id
                ? "bg-gold-600 text-abyss-950"
                : "bg-abyss-950/50 text-parchment-300 hover:bg-abyss-700"
            }`}
          >
            <Icon name={c.icon as never} size={12} className="shrink-0" />
            <span className="truncate">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="border-b border-abyss-800 px-3 py-2">
        <p className="text-xs font-semibold text-gold-300">{active.label}</p>
        <p className="text-[10px] text-parchment-500">{active.blurb}</p>
      </div>

      {!hasSelection && NEEDS_SELECTION.has(tab) && (
        <p className="mx-2 mt-2 rounded border border-gold-800/50 bg-gold-950/30 px-2 py-1.5 text-[10px] leading-snug text-gold-200/90">
          Click a note on the score first — these mark the note you choose.
        </p>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        <ToolList tab={tab} actions={actions} hasSelection={hasSelection} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ToolList({
  tab,
  actions,
  hasSelection,
}: {
  tab: ToolTab;
  actions: ToolbarActions;
  hasSelection: boolean;
}) {
  const groups = toolsFor(tab, actions);
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-1 px-1 text-[9px] uppercase tracking-[0.2em] text-parchment-600">
            {g.title}
          </p>
          <div className="space-y-0.5">
            {g.tools.map((t) => {
              const disabled = t.needsSelection && !hasSelection;
              return (
                <button
                  key={t.label}
                  onClick={t.run}
                  disabled={disabled}
                  title={t.hint ?? t.label}
                  className={`flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left transition-colors ${
                    disabled
                      ? "opacity-55 hover:bg-transparent"
                      : "hover:bg-abyss-700"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-abyss-700 bg-abyss-950/80 text-sm leading-none text-gold-300">
                    {t.glyph}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] text-parchment-200">{t.label}</span>
                    {t.hint && (
                      <span className="block truncate text-[9px] text-parchment-600">{t.hint}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {groups.length === 0 && (
        <p className="px-1 text-[11px] italic text-parchment-600">Nothing here yet.</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function toolsFor(tab: ToolTab, a: ToolbarActions): { title: string; tools: Tool[] }[] {
  switch (tab) {
    case "notes":
      return [
        {
          title: "Tuplets",
          tools: [
            { glyph: "3", label: "Triplet", hint: "Three in the time of two", run: () => a.onTuplet([3, 2]) },
            { glyph: "5", label: "Quintuplet", hint: "Five in the time of four", run: () => a.onTuplet([5, 4]) },
            { glyph: "6", label: "Sextuplet", hint: "Six in the time of four", run: () => a.onTuplet([6, 4]) },
            { glyph: "7", label: "Septuplet", hint: "Seven in the time of four", run: () => a.onTuplet([7, 4]) },
          ],
        },
        {
          title: "Joining and spelling",
          tools: [
            { glyph: "⌣", label: "Tie", hint: "Hold into the next note", run: a.onTie, needsSelection: true },
            { glyph: "♯♭", label: "Respell", hint: "Swap sharp for flat", run: a.onEnharmonic, needsSelection: true },
          ],
        },
      ];

    case "articulation":
      return [
        {
          title: "Length and attack",
          tools: (
            [
              ["staccato", "·", "Staccato", "Short and detached"],
              ["staccatissimo", "▾", "Staccatissimo", "Shorter still"],
              ["tenuto", "—", "Tenuto", "Held for its full value"],
              ["portato", "‗", "Portato", "Between slurred and detached"],
              ["accent", ">", "Accent", "Stressed"],
              ["marcato", "^", "Marcato", "Heavily stressed"],
            ] as [Articulation, string, string, string][]
          ).map(([k, glyph, label, hint]) => ({
            glyph, label, hint, needsSelection: true, run: () => a.onArticulation(k),
          })),
        },
      ];

    case "ornament":
      return [
        {
          title: "Shakes",
          tools: (
            [
              ["trill", "tr", "Trill", "Alternate rapidly with the note above"],
              ["trill-sharp", "tr♯", "Trill (sharp)", "Trill to a raised upper note"],
              ["trill-flat", "tr♭", "Trill (flat)", "Trill to a lowered upper note"],
              ["mordent", "𝆛", "Mordent", "Dip to the note below and back"],
              ["inverted-mordent", "𝆚", "Upper mordent", "Flick to the note above and back"],
            ] as [Ornament, string, string, string][]
          ).map(([k, glyph, label, hint]) => ({
            glyph, label, hint, needsSelection: true, run: () => a.onOrnament(k),
          })),
        },
        {
          title: "Turns",
          tools: (
            [
              ["turn", "∾", "Turn", "Above, the note, below, back"],
              ["inverted-turn", "∾", "Inverted turn", "Below, the note, above, back"],
            ] as [Ornament, string, string, string][]
          ).map(([k, glyph, label, hint]) => ({
            glyph, label, hint, needsSelection: true, run: () => a.onOrnament(k),
          })),
        },
        {
          title: "Tremolo",
          tools: (
            [
              ["tremolo-1", "≀", "Tremolo (1)", "Divide into eighths"],
              ["tremolo-2", "≁", "Tremolo (2)", "Divide into sixteenths"],
              ["tremolo-3", "≋", "Tremolo (3)", "Divide into thirty-seconds"],
            ] as [Ornament, string, string, string][]
          ).map(([k, glyph, label, hint]) => ({
            glyph, label, hint, needsSelection: true, run: () => a.onOrnament(k),
          })),
        },
        {
          title: "Rolled chords",
          tools: (
            [
              ["arpeggio", "❙", "Arpeggio", "Spread the chord"],
              ["arpeggio-up", "↑", "Arpeggio up", "Roll upward"],
              ["arpeggio-down", "↓", "Arpeggio down", "Roll downward"],
            ] as [Ornament, string, string, string][]
          ).map(([k, glyph, label, hint]) => ({
            glyph, label, hint, needsSelection: true, run: () => a.onOrnament(k),
          })),
        },
        {
          title: "Small notes",
          tools: (
            [
              ["grace", "♪", "Grace note", "Crushed in before the beat"],
              ["appoggiatura", "♩", "Appoggiatura", "Leans on the beat, then resolves"],
            ] as [Ornament, string, string, string][]
          ).map(([k, glyph, label, hint]) => ({
            glyph, label, hint, needsSelection: true, run: () => a.onOrnament(k),
          })),
        },
        {
          title: "Slides",
          tools: (
            [
              ["glissando", "⌇", "Glissando", "Slide through every pitch between"],
              ["portamento", "／", "Portamento", "Slide smoothly to the next note"],
              ["bend", "⌐", "Bend", "Push the pitch up and back"],
              ["fall", "↘", "Fall", "Let the pitch drop away"],
              ["doit", "↗", "Doit", "Flick the pitch upward"],
            ] as [Ornament, string, string, string][]
          ).map(([k, glyph, label, hint]) => ({
            glyph, label, hint, needsSelection: true, run: () => a.onOrnament(k),
          })),
        },
      ];

    case "dynamics":
      return [
        {
          title: "Levels",
          tools: (["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"] as Dynamic[]).map((d) => ({
            glyph: d.length > 2 ? d.slice(0, 2) : d,
            label: d,
            hint: DYNAMIC_MEANING[d],
            run: () => a.onDynamic(d),
          })),
        },
        {
          title: "Accents",
          tools: (["sfz", "fp"] as Dynamic[]).map((d) => ({
            glyph: d.slice(0, 2),
            label: d,
            hint: DYNAMIC_MEANING[d],
            run: () => a.onDynamic(d),
          })),
        },
        {
          title: "Gradual change",
          tools: [
            { glyph: "<", label: "Crescendo", hint: "Grow louder", run: () => a.onHairpin("crescendo") },
            { glyph: ">", label: "Diminuendo", hint: "Grow quieter", run: () => a.onHairpin("diminuendo") },
          ],
        },
      ];

    case "expression":
      return [
        {
          title: "Phrasing",
          tools: [
            { glyph: "⌒", label: "Slur", hint: "Play as one gesture", run: a.onSlur, needsSelection: true },
          ],
        },
        {
          title: "Words to the player",
          tools: [
            { glyph: "e", label: "Expression text", hint: "dolce, cantabile…", run: () => a.onText("expression") },
            { glyph: "t", label: "Technique text", hint: "pizz., arco, mute…", run: () => a.onText("technique") },
          ],
        },
      ];

    case "measure":
      return [
        {
          title: "Add and remove",
          tools: [
            { glyph: "+", label: "Insert before", run: () => a.onAddMeasure("before") },
            { glyph: "+", label: "Insert after", run: () => a.onAddMeasure("after") },
            { glyph: "+", label: "Append at the end", run: () => a.onAddMeasure("end") },
            { glyph: "−", label: "Delete this measure", run: a.onDeleteMeasure, needsSelection: true },
          ],
        },
        {
          title: "Barlines",
          tools: (
            [
              ["single", "|", "Single"],
              ["double", "‖", "Double"],
              ["final", "𝄂", "Final"],
              ["repeat-start", "𝄆", "Repeat start"],
              ["repeat-end", "𝄇", "Repeat end"],
              ["dashed", "┆", "Dashed"],
            ] as [BarlineStyle, string, string][]
          ).map(([k, glyph, label]) => ({
            glyph, label, needsSelection: true, run: () => a.onBarline(k),
          })),
        },
        {
          title: "Signatures and marks",
          tools: [
            { glyph: "A", label: "Rehearsal mark", run: a.onRehearsal, needsSelection: true },
            { glyph: "♯♭", label: "Key change", run: a.onKeyChange, needsSelection: true },
            { glyph: "𝄴", label: "Time change", run: a.onMeterChange, needsSelection: true },
          ],
        },
      ];

    case "text":
      return [
        {
          title: "Text",
          tools: (
            [
              ["tempo", "M", "Tempo", "Allegro, Andante, ♩ = 120"],
              ["technique", "T", "Technique", "How to play it"],
              ["expression", "E", "Expression", "The character to aim for"],
              ["lyric", "L", "Lyrics", "Words under the notes"],
              ["staff", "S", "Staff text", "A note to this player"],
              ["system", "Y", "System text", "A note to everyone"],
            ] as ["tempo" | "technique" | "expression" | "lyric" | "staff" | "system", string, string, string][]
          ).map(([k, glyph, label, hint]) => ({
            glyph, label, hint, run: () => a.onText(k),
          })),
        },
      ];

    case "advanced":
      return [
        {
          title: "Clef",
          tools: (
            [
              ["treble", "𝄞", "Treble"],
              ["bass", "𝄢", "Bass"],
              ["alto", "𝄡", "Alto"],
              ["tenor", "𝄡", "Tenor"],
              ["percussion", "𝄥", "Percussion"],
            ] as [Clef, string, string][]
          ).map(([k, glyph, label]) => ({ glyph, label, run: () => a.onClefChange(k) })),
        },
        {
          title: "Octave lines",
          tools: [
            { glyph: "8", label: "8va", hint: "Play an octave higher", run: () => a.onOctaveLine(1) },
            { glyph: "8", label: "8vb", hint: "Play an octave lower", run: () => a.onOctaveLine(-1) },
          ],
        },
        {
          title: "Noteheads",
          tools: (
            [
              ["normal", "●", "Normal"],
              ["cross", "✕", "Cross", "Unpitched or spoken"],
              ["diamond", "◆", "Diamond", "Harmonics"],
              ["triangle", "▲", "Triangle"],
              ["slash", "/", "Slash", "Rhythm only"],
            ] as [NoteheadStyle, string, string, string?][]
          ).map(([k, glyph, label, hint]) => ({
            glyph, label, hint, needsSelection: true, run: () => a.onNotehead(k),
          })),
        },
        {
          title: "Stems",
          tools: (
            [
              ["auto", "◦", "Automatic"],
              ["up", "↑", "Force up"],
              ["down", "↓", "Force down"],
            ] as [StemDirection, string, string][]
          ).map(([k, glyph, label]) => ({
            glyph, label, needsSelection: true, run: () => a.onStem(k),
          })),
        },
      ];
  }
}

/** Categories whose tools all act on a selected note. */
const NEEDS_SELECTION = new Set<ToolTab>(["articulation", "ornament"]);

const DYNAMIC_MEANING: Record<string, string> = {
  ppp: "As quietly as possible",
  pp: "Very quiet",
  p: "Quiet",
  mp: "Moderately quiet",
  mf: "Moderately loud",
  f: "Loud",
  ff: "Very loud",
  fff: "As loudly as possible",
  sfz: "Sudden hard accent",
  fp: "Loud, then immediately quiet",
};
