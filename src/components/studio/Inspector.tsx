"use client";

import { pitchName } from "@/lib/score";
import { FAMILY_LABELS, INSTRUMENTS, instrumentById } from "@/lib/studio/instruments";
import {
  PAGE_SIZES,
  keyAt,
  measureAtTick,
  partName,
  transposeOf,
  type Layout,
  type Part,
  type PageSize,
  type ScoreInfo,
  type StudioNote,
  type StudioScore,
} from "@/lib/studio/model";
import { noteValue } from "@/lib/studio/staff";
import type { Selection } from "./ScoreCanvas";

/**
 * The right panel: what is selected, and everything about it that can be
 * changed. With nothing selected it falls back to the score as a whole, so the
 * panel is never empty and never has to be hunted for.
 */

export function Inspector({
  score,
  selection,
  selectedNote,
  onUpdateInfo,
  onUpdateLayout,
  onUpdatePart,
  onUpdateNote,
  onUpdateScore,
}: {
  score: StudioScore;
  selection: Selection;
  selectedNote: { note: StudioNote; partId: string; staffId: string } | null;
  onUpdateInfo: (patch: Partial<ScoreInfo>) => void;
  onUpdateLayout: (patch: Partial<Layout>) => void;
  onUpdatePart: (id: string, patch: Partial<Part>) => void;
  onUpdateNote: (patch: Partial<StudioNote>) => void;
  onUpdateScore: (patch: Partial<StudioScore>) => void;
}) {
  const part =
    selection.kind === "part" || selection.partId
      ? score.parts.find((p) => p.id === selection.partId) ?? null
      : null;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-abyss-900/40">
      <div className="border-b border-abyss-700 px-3 py-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-parchment-400">
          {selectedNote ? "Note" : part ? "Instrument" : "Score"}
        </h2>
      </div>

      {selectedNote && (
        <NoteInspector
          note={selectedNote.note}
          score={score}
          onUpdate={onUpdateNote}
        />
      )}

      {!selectedNote && part && (
        <PartInspector part={part} onUpdate={(patch) => onUpdatePart(part.id, patch)} />
      )}

      {!selectedNote && !part && (
        <ScoreInspector
          score={score}
          onUpdateInfo={onUpdateInfo}
          onUpdateLayout={onUpdateLayout}
          onUpdateScore={onUpdateScore}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function NoteInspector({
  note,
  score,
  onUpdate,
}: {
  note: StudioNote;
  score: StudioScore;
  onUpdate: (patch: Partial<StudioNote>) => void;
}) {
  const measureIndex = measureAtTick(score, note.start);
  const { key, mode } = keyAt(score, measureIndex);
  const value = noteValue(note.duration);
  const name = pitchName(note.pitch, key, mode);

  return (
    <div className="space-y-3 p-3">
      <Row label="Pitch">
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm text-gold-300">{name}</span>
          <button onClick={() => onUpdate({ pitch: note.pitch - 1 })} className={STEP_BTN} title="Down a semitone">−</button>
          <button onClick={() => onUpdate({ pitch: note.pitch + 1 })} className={STEP_BTN} title="Up a semitone">+</button>
        </div>
      </Row>
      <Row label="Octave">
        <div className="flex items-center gap-1">
          <span className="text-sm text-parchment-200">{Math.floor(note.pitch / 12) - 1}</span>
          <button onClick={() => onUpdate({ pitch: note.pitch - 12 })} className={STEP_BTN}>−</button>
          <button onClick={() => onUpdate({ pitch: note.pitch + 12 })} className={STEP_BTN}>+</button>
        </div>
      </Row>
      <Row label="Duration">
        <span className="text-sm text-parchment-200">
          {value.base >= 16 ? "Whole" : value.base === 8 ? "Half" : value.base === 4 ? "Quarter"
            : value.base === 2 ? "Eighth" : value.base === 1 ? "16th" : `${value.base}t`}
          {value.dots === 1 ? " ·" : value.dots === 2 ? " ··" : ""}
        </span>
      </Row>
      <Row label="Accidental">
        <select
          value={note.spell ?? ""}
          onChange={(e) =>
            onUpdate({ spell: e.target.value === "" ? undefined : (Number(e.target.value) as -1 | 0 | 1) })
          }
          className={SELECT}
        >
          <option value="">Follow key</option>
          <option value={-1}>Flat</option>
          <option value={0}>Natural</option>
          <option value={1}>Sharp</option>
        </select>
      </Row>
      <Row label="Velocity">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={127}
            value={note.velocity ?? 76}
            onChange={(e) => onUpdate({ velocity: Number(e.target.value) })}
            className="h-1 flex-1 accent-[#c9a84c]"
          />
          <span className="w-7 text-right text-[10px] text-parchment-400">
            {note.velocity ?? 76}
          </span>
        </div>
      </Row>
      <Row label="Stem">
        <select
          value={note.stem ?? "auto"}
          onChange={(e) => onUpdate({ stem: e.target.value as "auto" | "up" | "down" })}
          className={SELECT}
        >
          <option value="auto">Auto</option>
          <option value="up">Up</option>
          <option value="down">Down</option>
        </select>
      </Row>
      <Row label="Notehead">
        <select
          value={note.notehead ?? "normal"}
          onChange={(e) => onUpdate({ notehead: e.target.value as never })}
          className={SELECT}
        >
          {["normal", "cross", "diamond", "triangle", "slash"].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </Row>
      <Row label="Tie">
        <input
          type="checkbox"
          checked={!!note.tie}
          onChange={(e) => onUpdate({ tie: e.target.checked })}
          className="accent-[#c9a84c]"
        />
      </Row>
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-parchment-600">
          Articulations
        </p>
        <div className="flex flex-wrap gap-1">
          {(["staccato", "tenuto", "accent", "marcato", "staccatissimo", "portato"] as const).map((a) => {
            const on = (note.articulations ?? []).includes(a);
            return (
              <button
                key={a}
                onClick={() =>
                  onUpdate({
                    articulations: on
                      ? (note.articulations ?? []).filter((x) => x !== a)
                      : [...(note.articulations ?? []), a],
                  })
                }
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  on ? "bg-gold-600 text-abyss-950" : "bg-abyss-800 text-parchment-400 hover:bg-abyss-700"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function PartInspector({
  part,
  onUpdate,
}: {
  part: Part;
  onUpdate: (patch: Partial<Part>) => void;
}) {
  const inst = instrumentById(part.instrumentId);
  return (
    <div className="space-y-3 p-3">
      <Row label="Name">
        <input
          value={partName(part)}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className={INPUT}
        />
      </Row>
      <Row label="Sound">
        <select
          value={part.instrumentId}
          onChange={(e) => onUpdate({ instrumentId: e.target.value })}
          className={SELECT}
        >
          {INSTRUMENTS.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </Row>
      <Row label="Family">
        <span className="text-xs text-parchment-400">{FAMILY_LABELS[inst.family]}</span>
      </Row>
      <Row label="Transpose">
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={transposeOf(part)}
            onChange={(e) => onUpdate({ transpose: Number(e.target.value) })}
            className={`${INPUT} w-16`}
          />
          <span className="text-[10px] text-parchment-600">semitones</span>
        </div>
      </Row>
      <Row label="Volume">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(part.volume * 100)}
          onChange={(e) => onUpdate({ volume: Number(e.target.value) / 100 })}
          className="h-1 w-full accent-[#c9a84c]"
        />
      </Row>
      <Row label="Pan">
        <input
          type="range"
          min={-100}
          max={100}
          value={Math.round(part.pan * 100)}
          onChange={(e) => onUpdate({ pan: Number(e.target.value) / 100 })}
          className="h-1 w-full accent-[#c9a84c]"
        />
      </Row>
      <Row label="Staff size">
        <input
          type="range"
          min={60}
          max={140}
          value={Math.round((part.staffScale ?? 1) * 100)}
          onChange={(e) => onUpdate({ staffScale: Number(e.target.value) / 100 })}
          className="h-1 w-full accent-[#c9a84c]"
        />
      </Row>
      <Row label="Range">
        <span className="text-[10px] text-parchment-500">
          {pitchName(inst.range[0])} – {pitchName(inst.range[1])}
        </span>
      </Row>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ScoreInspector({
  score,
  onUpdateInfo,
  onUpdateLayout,
  onUpdateScore,
}: {
  score: StudioScore;
  onUpdateInfo: (patch: Partial<ScoreInfo>) => void;
  onUpdateLayout: (patch: Partial<Layout>) => void;
  onUpdateScore: (patch: Partial<StudioScore>) => void;
}) {
  const L = score.layout;
  return (
    <div className="space-y-4 p-3">
      <Section title="Score information">
        {(
          [
            ["title", "Title"],
            ["subtitle", "Subtitle"],
            ["composer", "Composer"],
            ["arranger", "Arranger"],
            ["lyricist", "Lyricist"],
            ["copyright", "Copyright"],
          ] as [keyof ScoreInfo, string][]
        ).map(([field, label]) => (
          <Row key={field} label={label}>
            <input
              value={score.info[field]}
              onChange={(e) => onUpdateInfo({ [field]: e.target.value })}
              className={INPUT}
            />
          </Row>
        ))}
      </Section>

      <Section title="Music">
        <Row label="Key">
          <select
            value={`${score.key}|${score.mode}`}
            onChange={(e) => {
              const [key, mode] = e.target.value.split("|");
              onUpdateScore({ key, mode: mode as "major" | "minor" });
            }}
            className={SELECT}
          >
            {["C", "G", "D", "A", "E", "B", "F#", "F", "Bb", "Eb", "Ab", "Db", "Gb"].map((k) => (
              <optgroup key={k} label={k}>
                <option value={`${k}|major`}>{k} major</option>
                <option value={`${k}|minor`}>{k} minor</option>
              </optgroup>
            ))}
          </select>
        </Row>
        <Row label="Time">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={32}
              value={score.meter.beats}
              onChange={(e) =>
                onUpdateScore({ meter: { ...score.meter, beats: Number(e.target.value) } })
              }
              className={`${INPUT} w-12`}
            />
            <span className="text-parchment-600">/</span>
            <select
              value={score.meter.unit}
              onChange={(e) =>
                onUpdateScore({ meter: { ...score.meter, unit: Number(e.target.value) } })
              }
              className={`${SELECT} w-14`}
            >
              {[2, 4, 8, 16].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </Row>
        <Row label="Tempo">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={30}
              max={240}
              value={score.tempo}
              onChange={(e) => onUpdateScore({ tempo: Number(e.target.value) })}
              className="h-1 flex-1 accent-[#c9a84c]"
            />
            <span className="w-7 text-right text-[10px] text-parchment-400">{score.tempo}</span>
          </div>
        </Row>
        <Row label="Concert pitch">
          <input
            type="checkbox"
            checked={L.concertPitch}
            onChange={(e) => onUpdateLayout({ concertPitch: e.target.checked })}
            className="accent-[#c9a84c]"
          />
        </Row>
      </Section>

      <Section title="Page layout">
        <Row label="Size">
          <select
            value={L.pageSize}
            onChange={(e) => onUpdateLayout({ pageSize: e.target.value as PageSize })}
            className={SELECT}
          >
            {Object.keys(PAGE_SIZES).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Row>
        <Row label="Orientation">
          <select
            value={L.orientation}
            onChange={(e) =>
              onUpdateLayout({ orientation: e.target.value as "portrait" | "landscape" })
            }
            className={SELECT}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </Row>
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <Row key={side} label={`Margin ${side}`}>
            <input
              type="number"
              min={5}
              max={50}
              value={L.margins[side]}
              onChange={(e) =>
                onUpdateLayout({ margins: { ...L.margins, [side]: Number(e.target.value) } })
              }
              className={`${INPUT} w-16`}
            />
          </Row>
        ))}
        <Row label="Page numbers">
          <input
            type="checkbox"
            checked={L.showPageNumbers}
            onChange={(e) => onUpdateLayout({ showPageNumbers: e.target.checked })}
            className="accent-[#c9a84c]"
          />
        </Row>
      </Section>

      <Section title="Music layout">
        <Slider label="Staff size" min={4} max={12} step={0.5} value={L.staffSize}
          onChange={(v) => onUpdateLayout({ staffSize: v })} />
        <Slider label="Staff spacing" min={1} max={4} step={0.1} value={L.staffSpacing}
          onChange={(v) => onUpdateLayout({ staffSpacing: v })} />
        <Slider label="System spacing" min={1} max={6} step={0.1} value={L.systemSpacing}
          onChange={(v) => onUpdateLayout({ systemSpacing: v })} />
        <Slider label="Group spacing" min={0} max={3} step={0.1} value={L.groupSpacing}
          onChange={(v) => onUpdateLayout({ groupSpacing: v })} />
        <Slider label="Measure spacing" min={0.5} max={2.5} step={0.05} value={L.measureSpacing}
          onChange={(v) => onUpdateLayout({ measureSpacing: v })} />
        <Row label="Per system">
          <select
            value={L.measuresPerSystem === "auto" ? "auto" : String(L.measuresPerSystem)}
            onChange={(e) =>
              onUpdateLayout({
                measuresPerSystem: e.target.value === "auto" ? "auto" : Number(e.target.value),
              })
            }
            className={SELECT}
          >
            <option value="auto">Automatic</option>
            {[1, 2, 3, 4, 5, 6, 8].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </Row>
        <Row label="Measure numbers">
          <select
            value={L.measureNumbers}
            onChange={(e) => onUpdateLayout({ measureNumbers: e.target.value as never })}
            className={SELECT}
          >
            <option value="none">None</option>
            <option value="system">Each system</option>
            <option value="every">Every measure</option>
          </select>
        </Row>
        <Row label="Hide empty staves">
          <input
            type="checkbox"
            checked={L.hideEmptyStaves}
            onChange={(e) => onUpdateLayout({ hideEmptyStaves: e.target.checked })}
            className="accent-[#c9a84c]"
          />
        </Row>
      </Section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const INPUT =
  "w-full rounded border border-abyss-600 bg-abyss-950 px-1.5 py-0.5 text-xs text-parchment-200 focus:border-gold-600 focus:outline-none";
const SELECT = INPUT;
const STEP_BTN =
  "rounded bg-abyss-800 px-1.5 text-xs text-parchment-300 hover:bg-abyss-700";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-parchment-600">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
      <span className="text-[11px] text-parchment-500">{label}</span>
      {children}
    </label>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Row label={label}>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 flex-1 accent-[#c9a84c]"
        />
        <span className="w-8 text-right text-[10px] text-parchment-400">{value}</span>
      </div>
    </Row>
  );
}
