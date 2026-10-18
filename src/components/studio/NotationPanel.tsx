"use client";

import { useState } from "react";
import type {
  Articulation,
  BarlineStyle,
  ChordQuality,
  Dynamic,
  Fermata,
  NoteheadStyle,
  Ornament,
  RepeatDirective,
  StemDirection,
} from "@/lib/studio/model";
import type { Clef } from "@/lib/studio/instruments";
import { CHORD_LETTERS, CHORD_QUALITIES, prettyRoot } from "@/lib/studio/chords";
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
  { id: "expression", label: "Expression", icon: "quill", blurb: "Slurs, phrasing, pedals, text" },
  { id: "harmony", label: "Harmony", icon: "chord", blurb: "Chord symbols over the staff" },
  { id: "measure", label: "Measures", icon: "column", blurb: "Bars, repeats, navigation" },
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
        {tab === "harmony" ? (
          <ChordPicker actions={actions} />
        ) : (
          <ToolList tab={tab} actions={actions} hasSelection={hasSelection} />
        )}
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

/**
 * Building a chord symbol: a root, a quality, and sometimes a bass.
 *
 * Not a tool list, because a chord is three choices rather than one. Twenty-nine
 * qualities across seven roots and twelve basses is over two thousand buttons;
 * three small pickers and a preview is the same vocabulary in a panel somebody
 * can actually read.
 *
 * The preview matters more than it looks. A writer choosing "half-diminished"
 * from a list has to know that it prints as "m7♭5"; seeing "Bm7♭5" appear as
 * they choose means they never have to.
 */
function ChordPicker({ actions }: { actions: ToolbarActions }) {
  const [root, setRoot] = useState("C");
  const [accidental, setAccidental] = useState<"" | "#" | "b">("");
  const [quality, setQuality] = useState<ChordQuality>("maj");
  const [bass, setBass] = useState("");

  const fullRoot = root + accidental;
  const spec = CHORD_QUALITIES[quality];
  const preview = prettyRoot(fullRoot) + spec.suffix + (bass ? `/${prettyRoot(bass)}` : "");

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 px-1 text-[9px] uppercase tracking-[0.2em] text-parchment-600">Root</p>
        <div className="flex flex-wrap gap-1">
          {CHORD_LETTERS.map((l) => (
            <button
              key={l}
              onClick={() => setRoot(l)}
              className={`h-7 w-7 rounded border text-[11px] transition-colors ${
                root === l
                  ? "border-gold-500 bg-gold-600 text-abyss-950"
                  : "border-abyss-700 bg-abyss-950/70 text-parchment-200 hover:bg-abyss-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="mt-1 flex gap-1">
          {(["", "#", "b"] as const).map((acc) => (
            <button
              key={acc || "natural"}
              onClick={() => setAccidental(acc)}
              className={`h-6 w-9 rounded border text-[11px] transition-colors ${
                accidental === acc
                  ? "border-gold-500 bg-gold-600 text-abyss-950"
                  : "border-abyss-700 bg-abyss-950/70 text-parchment-300 hover:bg-abyss-700"
              }`}
            >
              {acc === "" ? "♮" : acc === "#" ? "♯" : "♭"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 px-1 text-[9px] uppercase tracking-[0.2em] text-parchment-600">
          Quality
        </p>
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value as ChordQuality)}
          className="w-full rounded border border-abyss-700 bg-abyss-950 px-2 py-1.5 text-[11px] text-parchment-200"
        >
          {(Object.keys(CHORD_QUALITIES) as ChordQuality[]).map((q) => (
            <option key={q} value={q}>
              {CHORD_QUALITIES[q].suffix || "(plain)"} — {CHORD_QUALITIES[q].label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-1 px-1 text-[9px] uppercase tracking-[0.2em] text-parchment-600">
          Bass, for a slash chord
        </p>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setBass("")}
            className={`h-7 rounded border px-2 text-[11px] transition-colors ${
              bass === ""
                ? "border-gold-500 bg-gold-600 text-abyss-950"
                : "border-abyss-700 bg-abyss-950/70 text-parchment-300 hover:bg-abyss-700"
            }`}
          >
            none
          </button>
          {CHORD_LETTERS.map((l) => (
            <button
              key={l}
              onClick={() => setBass(bass === l ? "" : l)}
              className={`h-7 w-7 rounded border text-[11px] transition-colors ${
                bass === l
                  ? "border-gold-500 bg-gold-600 text-abyss-950"
                  : "border-abyss-700 bg-abyss-950/70 text-parchment-300 hover:bg-abyss-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded border border-abyss-700 bg-abyss-950/70 px-3 py-2 text-center">
        <p className="font-display text-xl text-gold-300">{preview}</p>
        <p className="mt-0.5 text-[9px] text-parchment-600">
          {spec.intervals.length} notes · exports as {spec.kind}
        </p>
      </div>

      <button
        onClick={() => actions.onChordSymbol(fullRoot, quality, bass || undefined)}
        className="w-full rounded bg-gold-600 px-2 py-1.5 text-[11px] font-semibold text-abyss-950 transition-colors hover:bg-gold-500"
      >
        Write {preview} at the cursor
      </button>
      <button
        onClick={actions.onClearChordSymbol}
        className="w-full rounded border border-abyss-700 px-2 py-1 text-[10px] text-parchment-400 transition-colors hover:bg-abyss-700"
      >
        Clear the symbol at the cursor
      </button>
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
        {
          // A fermata is the performer's decision about how long to hold, and
          // the four shapes are four different sizes of that decision. They
          // sound different as well as printing differently — see
          // FERMATA_HOLD in lib/studio/timing.ts.
          title: "Holds",
          tools: (
            [
              ["normal", "𝄐", "Fermata", "Hold it — about twice its length"],
              ["angled", "⌃", "Short fermata", "A brief lean on the note"],
              ["square", "⌐", "Long fermata", "Held well past its value"],
              ["very-long", "⌒", "Very long fermata", "As long as the hall will take"],
            ] as [Fermata, string, string, string][]
          ).map(([k, glyph, label, hint]) => ({
            glyph, label, hint, needsSelection: true, run: () => a.onFermata(k),
          })),
        },
        {
          title: "Which finger",
          tools: [
            {
              glyph: "1",
              label: "Fingering",
              hint: "A number over the notehead",
              run: a.onFingering,
              needsSelection: true,
            },
          ],
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
          // Three pedals, and they do different things. Sostenuto holds only
          // what was already down, which is how a bass note survives a
          // passage played above it; una corda changes the colour, not the
          // length. Offering only "Ped." would hide two of the three.
          title: "Pedalling",
          tools: [
            {
              glyph: "𝆮",
              label: "Sustain pedal",
              hint: "Ped. — lifts the dampers off every string",
              run: () => a.onPedal("sustain"),
            },
            {
              glyph: "S",
              label: "Sostenuto pedal",
              hint: "Holds only the notes already down",
              run: () => a.onPedal("sostenuto"),
            },
            {
              glyph: "u",
              label: "Una corda",
              hint: "Softer colour, same length",
              run: () => a.onPedal("una-corda"),
            },
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
        {
          // A sign is a place you jump to; a directive is the instruction that
          // sends you there. Both are needed or neither does anything: a segno
          // with no D.S. is decoration, and a D.S. with no segno is a question
          // with no answer.
          title: "Jump to",
          tools: [
            {
              glyph: "𝄋",
              label: "Segno",
              hint: "The place a D.S. sends you back to",
              run: () => a.onRepeatSign("segno"),
              needsSelection: true,
            },
            {
              glyph: "𝄌",
              label: "Coda",
              hint: "Where the ending begins",
              run: () => a.onRepeatSign("coda"),
              needsSelection: true,
            },
          ],
        },
        {
          title: "Jump from",
          tools: (
            [
              ["d.c.", "D.C.", "Back to the very beginning"],
              ["d.s.", "D.S.", "Back to the segno"],
              ["d.c.-al-fine", "D.C. al Fine", "From the top, stop at Fine"],
              ["d.s.-al-fine", "D.S. al Fine", "From the segno, stop at Fine"],
              ["d.c.-al-coda", "D.C. al Coda", "From the top, then take the coda"],
              ["d.s.-al-coda", "D.S. al Coda", "From the segno, then take the coda"],
              ["to-coda", "To Coda", "Leave here for the coda"],
              ["fine", "Fine", "The piece ends here"],
            ] as [RepeatDirective, string, string][]
          ).map(([k, label, hint]) => ({
            glyph: label.length > 4 ? label.slice(0, 4) : label,
            label,
            hint,
            needsSelection: true,
            run: () => a.onRepeatDirective(k),
          })),
        },
        {
          title: "Repeat endings",
          tools: [
            {
              glyph: "1.",
              label: "First-time bar",
              hint: "Played only on the first pass",
              run: () => a.onVolta([1]),
              needsSelection: true,
            },
            {
              glyph: "2.",
              label: "Second-time bar",
              hint: "Played instead, on the way out",
              run: () => a.onVolta([2]),
              needsSelection: true,
            },
            {
              glyph: "3.",
              label: "Third-time bar",
              run: () => a.onVolta([3]),
              needsSelection: true,
            },
            {
              glyph: "—",
              label: "No bracket",
              hint: "Clear the volta on this measure",
              run: () => a.onVolta([]),
              needsSelection: true,
            },
            {
              glyph: "×n",
              label: "Play n times",
              hint: "More than the usual twice",
              run: a.onRepeatTimes,
              needsSelection: true,
            },
          ],
        },
      ];

    case "harmony":
      // Rendered as its own picker rather than a tool list — a chord is a root
      // and a quality and sometimes a bass, which is three choices, and
      // 29 qualities times 7 roots is not a grid anybody reads.
      return [];

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
