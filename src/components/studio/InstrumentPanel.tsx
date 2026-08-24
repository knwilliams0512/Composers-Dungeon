"use client";

import { useMemo, useState } from "react";
import {
  ENSEMBLES,
  FAMILY_LABELS,
  instrumentById,
  instrumentsByFamily,
  searchInstruments,
  type Clef,
  type Instrument,
} from "@/lib/studio/instruments";
import { partName, type Part, type StudioScore } from "@/lib/studio/model";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * The left panel: every instrument in the score, in score order, with the
 * controls a composer reaches for while writing — visibility, mute, solo,
 * volume — and the browser for adding more.
 */

const CLEF_LABELS: Record<Clef, string> = {
  treble: "Treble",
  bass: "Bass",
  alto: "Alto",
  tenor: "Tenor",
  percussion: "Perc.",
  tab: "Tab",
};

export function InstrumentPanel({
  score,
  selectedPartId,
  onSelectPart,
  onUpdatePart,
  onAddInstrument,
  onRemovePart,
  onReorder,
  onApplyEnsemble,
}: {
  score: StudioScore;
  selectedPartId: string | null;
  onSelectPart: (id: string) => void;
  onUpdatePart: (id: string, patch: Partial<Part>) => void;
  onAddInstrument: (instrumentId: string) => void;
  onRemovePart: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onApplyEnsemble: (ensembleId: string) => void;
}) {
  const [browser, setBrowser] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const anySolo = score.parts.some((p) => p.solo);

  return (
    <div className="flex h-full flex-col bg-abyss-900/40">
      <div className="flex items-center justify-between border-b border-abyss-700 px-3 py-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-parchment-400">
          Instruments
        </h2>
        <button
          type="button"
          onClick={() => setBrowser(true)}
          title="Add an instrument"
          className="rounded px-1.5 py-0.5 text-parchment-300 hover:bg-abyss-700"
        >
          <Icon name="plus" size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <p className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-parchment-600">
          Full Score · {score.parts.length} part{score.parts.length === 1 ? "" : "s"}
        </p>

        {score.parts.map((part, index) => {
          const inst = instrumentById(part.instrumentId);
          const selected = part.id === selectedPartId;
          const dimmed = anySolo && !part.solo;
          return (
            <div
              key={part.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) onReorder(dragIndex, index);
                setDragIndex(null);
              }}
              onClick={() => onSelectPart(part.id)}
              className={`cursor-pointer border-l-2 px-3 py-2 transition-colors ${
                selected
                  ? "border-gold-500 bg-abyss-800/70"
                  : "border-transparent hover:bg-abyss-800/40"
              } ${dimmed ? "opacity-45" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="truncate text-sm text-parchment-200">{partName(part)}</span>
                <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider text-parchment-600">
                  {part.staves.map((s) => CLEF_LABELS[s.clef]).join(" / ")}
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-1">
                <IconToggle
                  active={part.visible}
                  onClick={() => onUpdatePart(part.id, { visible: !part.visible })}
                  title={part.visible ? "Hide this staff" : "Show this staff"}
                  icon={part.visible ? "eye" : "eyeOff"}
                />
                <MiniButton
                  active={part.muted}
                  onClick={() => onUpdatePart(part.id, { muted: !part.muted })}
                  title="Mute"
                  activeClass="bg-crimson-600 text-white"
                >
                  M
                </MiniButton>
                <MiniButton
                  active={part.solo}
                  onClick={() => onUpdatePart(part.id, { solo: !part.solo })}
                  title="Solo"
                  activeClass="bg-gold-500 text-abyss-950"
                >
                  S
                </MiniButton>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(part.volume * 100)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    onUpdatePart(part.id, { volume: Number(e.target.value) / 100 })
                  }
                  title={`Volume ${Math.round(part.volume * 100)}%`}
                  className="ml-1 h-1 w-full min-w-0 flex-1 accent-[#c9a84c]"
                />
                <button
                  type="button"
                  title="Remove this instrument"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePart(part.id);
                  }}
                  className="shrink-0 rounded px-1 text-parchment-600 hover:bg-crimson-900/40 hover:text-crimson-300"
                >
                  <Icon name="close" size={11} />
                </button>
              </div>
              <p className="mt-0.5 text-[10px] text-parchment-600">
                {FAMILY_LABELS[inst.family]}
                {inst.transpose !== 0 && " · transposing"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-abyss-700 p-2">
        <label className="text-[10px] uppercase tracking-[0.2em] text-parchment-600">
          Ensemble template
        </label>
        <select
          value=""
          onChange={(e) => e.target.value && onApplyEnsemble(e.target.value)}
          className="mt-1 w-full rounded border border-abyss-600 bg-abyss-900 px-2 py-1 text-xs text-parchment-200"
        >
          <option value="">Replace instrumentation…</option>
          {ENSEMBLES.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {browser && (
        <InstrumentBrowser
          onPick={(id) => {
            onAddInstrument(id);
            setBrowser(false);
          }}
          onClose={() => setBrowser(false)}
        />
      )}
    </div>
  );
}

function MiniButton({
  active,
  onClick,
  title,
  children,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  activeClass: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`h-5 w-5 shrink-0 rounded text-[10px] font-bold transition-colors ${
        active ? activeClass : "bg-abyss-800 text-parchment-500 hover:bg-abyss-700"
      }`}
    >
      {children}
    </button>
  );
}

function IconToggle({
  active,
  onClick,
  title,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: IconName;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`shrink-0 rounded px-1 py-0.5 transition-colors ${
        active ? "text-parchment-300" : "text-parchment-700"
      } hover:bg-abyss-700`}
    >
      <Icon name={icon} size={12} />
    </button>
  );
}

/* -------------------------------------------------------------------------- */

function InstrumentBrowser({
  onPick,
  onClose,
}: {
  onPick: (instrumentId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    if (query.trim()) {
      const hits = searchInstruments(query);
      return [{ family: "results" as const, items: hits }];
    }
    return instrumentsByFamily();
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={onClose}
    >
      <div
        className="flex h-[70vh] w-full max-w-2xl flex-col rounded-lg border border-abyss-600 bg-abyss-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-abyss-700 p-3">
          <Icon name="search" size={15} className="text-parchment-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search instruments…"
            className="flex-1 bg-transparent text-sm text-parchment-100 outline-none"
          />
          <button onClick={onClose} className="text-parchment-500 hover:text-parchment-200">
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {groups.map((g) => (
            <div key={g.family} className="mb-4">
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-parchment-600">
                {g.family === "results"
                  ? `${g.items.length} result${g.items.length === 1 ? "" : "s"}`
                  : FAMILY_LABELS[g.family]}
              </p>
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                {g.items.map((i: Instrument) => (
                  <button
                    key={i.id}
                    onClick={() => onPick(i.id)}
                    className="rounded px-2 py-1.5 text-left text-xs text-parchment-200 hover:bg-abyss-700"
                  >
                    {i.name}
                    {i.transpose !== 0 && (
                      <span className="ml-1 text-[9px] text-parchment-600">transp.</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
