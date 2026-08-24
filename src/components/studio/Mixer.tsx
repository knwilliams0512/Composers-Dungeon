"use client";

import { INSTRUMENTS, instrumentById } from "@/lib/studio/instruments";
import { partName, type Part, type StudioScore } from "@/lib/studio/model";
import { Icon } from "@/components/ui/Icon";

/**
 * The mixer: one channel strip per instrument, plus a master. Everything here
 * feeds playback only — nothing it changes affects the printed page.
 */

export function Mixer({
  score,
  onUpdatePart,
  onMasterVolume,
  onClose,
}: {
  score: StudioScore;
  onUpdatePart: (id: string, patch: Partial<Part>) => void;
  onMasterVolume: (v: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="max-h-[60vh] w-full overflow-x-auto border-t border-abyss-600 bg-abyss-900 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center gap-2">
          <Icon name="sliders" size={14} className="text-gold-500" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-parchment-300">
            Mixer
          </h2>
          <button onClick={onClose} className="ml-auto rounded px-1 text-parchment-500 hover:bg-abyss-700">
            <Icon name="close" size={14} />
          </button>
        </div>

        <div className="flex gap-2">
          {score.parts.map((part) => (
            <Channel
              key={part.id}
              part={part}
              onUpdate={(patch) => onUpdatePart(part.id, patch)}
            />
          ))}

          <div className="w-28 shrink-0 rounded border border-gold-800 bg-abyss-950/60 p-2">
            <p className="truncate text-[11px] font-semibold text-gold-300">Master</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-parchment-600">output</p>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(score.masterVolume * 100)}
              onChange={(e) => onMasterVolume(Number(e.target.value) / 100)}
              className="mt-6 h-1 w-full accent-[#c9a84c]"
            />
            <p className="mt-1 text-center text-[10px] text-parchment-400">
              {Math.round(score.masterVolume * 100)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Channel({ part, onUpdate }: { part: Part; onUpdate: (p: Partial<Part>) => void }) {
  const inst = instrumentById(part.instrumentId);
  return (
    <div className="w-28 shrink-0 rounded border border-abyss-700 bg-abyss-950/60 p-2">
      <p className="truncate text-[11px] text-parchment-200" title={partName(part)}>
        {partName(part)}
      </p>

      <select
        value={part.instrumentId}
        onChange={(e) => onUpdate({ instrumentId: e.target.value })}
        title="Playback sound"
        className="mt-1 w-full rounded border border-abyss-700 bg-abyss-900 px-1 py-0.5 text-[10px] text-parchment-400"
      >
        {INSTRUMENTS.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>

      <div className="mt-2 flex gap-1">
        <button
          onClick={() => onUpdate({ muted: !part.muted })}
          className={`flex-1 rounded py-0.5 text-[10px] font-bold ${
            part.muted ? "bg-crimson-600 text-white" : "bg-abyss-800 text-parchment-500 hover:bg-abyss-700"
          }`}
        >
          M
        </button>
        <button
          onClick={() => onUpdate({ solo: !part.solo })}
          className={`flex-1 rounded py-0.5 text-[10px] font-bold ${
            part.solo ? "bg-gold-500 text-abyss-950" : "bg-abyss-800 text-parchment-500 hover:bg-abyss-700"
          }`}
        >
          S
        </button>
      </div>

      <label className="mt-2 block text-[9px] uppercase tracking-wider text-parchment-600">
        Pan
        <input
          type="range"
          min={-100}
          max={100}
          value={Math.round(part.pan * 100)}
          onChange={(e) => onUpdate({ pan: Number(e.target.value) / 100 })}
          className="h-1 w-full accent-[#c9a84c]"
        />
      </label>

      <label className="mt-1 block text-[9px] uppercase tracking-wider text-parchment-600">
        Volume
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(part.volume * 100)}
          onChange={(e) => onUpdate({ volume: Number(e.target.value) / 100 })}
          className="h-1 w-full accent-[#c9a84c]"
        />
      </label>

      <p className="mt-0.5 text-center text-[9px] text-parchment-600">{inst.short}</p>
    </div>
  );
}
