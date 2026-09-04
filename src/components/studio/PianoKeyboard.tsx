"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * The on-screen keyboard: a way in for anyone who thinks in keys rather than
 * staff lines. Clicking a key writes a note at the cursor with whatever
 * duration the toolbar is holding; holding shift stacks pitches into a chord.
 */

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const BLACK: Record<number, number> = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };
const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

export function PianoKeyboard({
  octaves = 3,
  baseOctave,
  onOctaveChange,
  onPlay,
  onClose,
  highlighted = [],
}: {
  octaves?: number;
  baseOctave: number;
  onOctaveChange: (o: number) => void;
  /** `chord` is true when the pitch should join the previous one. */
  onPlay: (pitch: number, chord: boolean) => void;
  onClose: () => void;
  highlighted?: number[];
}) {
  const [held, setHeld] = useState<number | null>(null);
  const lit = new Set(highlighted);

  const whiteCount = octaves * 7;
  const whiteW = 100 / whiteCount;

  const whites: { pitch: number; index: number }[] = [];
  const blacks: { pitch: number; left: number }[] = [];

  for (let o = 0; o < octaves; o++) {
    for (let i = 0; i < 7; i++) {
      const pitch = (baseOctave + o + 1) * 12 + WHITE[i];
      whites.push({ pitch, index: o * 7 + i });
    }
    for (const semi of Object.keys(BLACK).map(Number)) {
      const pitch = (baseOctave + o + 1) * 12 + semi;
      blacks.push({ pitch, left: (o * 7 + BLACK[semi] + 1) * whiteW });
    }
  }

  return (
    <div className="border-t border-abyss-700 bg-abyss-900">
      <div className="flex items-center gap-2 px-3 py-1">
        <Icon name="piano" size={13} className="text-parchment-500" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-parchment-500">Keyboard</span>
        <button
          onClick={() => onOctaveChange(Math.max(0, baseOctave - 1))}
          className="rounded px-1.5 text-parchment-400 hover:bg-abyss-700"
          title="Down an octave"
        >
          −
        </button>
        <span className="text-[10px] text-parchment-400">C{baseOctave}</span>
        <button
          onClick={() => onOctaveChange(Math.min(7, baseOctave + 1))}
          className="rounded px-1.5 text-parchment-400 hover:bg-abyss-700"
          title="Up an octave"
        >
          +
        </button>
        <span className="ml-2 text-[10px] italic text-parchment-600">
          Shift-click to build a chord
        </span>
        <button
          onClick={onClose}
          className="ml-auto rounded px-1 text-parchment-500 hover:bg-abyss-700"
          title="Hide the keyboard"
        >
          <Icon name="close" size={13} />
        </button>
      </div>

      <div className="relative mx-3 mb-2 h-24 select-none">
        {whites.map((k) => (
          <button
            key={k.pitch}
            onMouseDown={(e) => {
              setHeld(k.pitch);
              onPlay(k.pitch, e.shiftKey);
            }}
            onMouseUp={() => setHeld(null)}
            onMouseLeave={() => setHeld((h) => (h === k.pitch ? null : h))}
            title={`${NAMES[k.pitch % 12]}${Math.floor(k.pitch / 12) - 1}`}
            className={`absolute top-0 h-full rounded-b border border-abyss-600 transition-colors ${
              held === k.pitch
                ? "bg-gold-400"
                : lit.has(k.pitch)
                  ? "bg-gold-200"
                  : "bg-parchment-100 hover:bg-parchment-200"
            }`}
            style={{ left: `${k.index * whiteW}%`, width: `${whiteW}%` }}
          />
        ))}
        {blacks.map((k) => (
          <button
            key={k.pitch}
            onMouseDown={(e) => {
              setHeld(k.pitch);
              onPlay(k.pitch, e.shiftKey);
            }}
            onMouseUp={() => setHeld(null)}
            onMouseLeave={() => setHeld((h) => (h === k.pitch ? null : h))}
            title={`${NAMES[k.pitch % 12]}${Math.floor(k.pitch / 12) - 1}`}
            className={`absolute top-0 z-10 h-3/5 rounded-b border border-abyss-950 transition-colors ${
              held === k.pitch
                ? "bg-gold-500"
                : lit.has(k.pitch)
                  ? "bg-gold-700"
                  : "bg-abyss-950 hover:bg-abyss-800"
            }`}
            style={{ left: `calc(${k.left}% - ${whiteW * 0.29}%)`, width: `${whiteW * 0.58}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Standard tuning, low string first. */
const TUNING = [40, 45, 50, 55, 59, 64];

export function Fretboard({
  frets = 12,
  onPlay,
  onClose,
}: {
  frets?: number;
  onPlay: (pitch: number, chord: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div className="border-t border-abyss-700 bg-abyss-900 px-3 py-2">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-parchment-500">Fretboard</span>
        <button onClick={onClose} className="ml-auto rounded px-1 text-parchment-500 hover:bg-abyss-700">
          <Icon name="close" size={13} />
        </button>
      </div>
      <div className="space-y-0.5">
        {[...TUNING].reverse().map((open, si) => (
          <div key={si} className="flex items-center gap-0.5">
            <span className="w-6 shrink-0 text-right text-[9px] text-parchment-600">
              {6 - si}
            </span>
            {Array.from({ length: frets + 1 }).map((_, f) => (
              <button
                key={f}
                onMouseDown={(e) => onPlay(open + f, e.shiftKey)}
                title={`String ${6 - si}, fret ${f}`}
                className={`h-5 flex-1 rounded-sm border text-[9px] transition-colors ${
                  f === 0
                    ? "border-abyss-600 bg-abyss-800 text-parchment-500"
                    : "border-abyss-700 bg-abyss-950 text-parchment-700 hover:bg-abyss-700 hover:text-parchment-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const DRUM_PADS: { pitch: number; label: string }[] = [
  { pitch: 35, label: "Bass" },
  { pitch: 38, label: "Snare" },
  { pitch: 42, label: "HH cl." },
  { pitch: 46, label: "HH op." },
  { pitch: 45, label: "Tom lo" },
  { pitch: 48, label: "Tom hi" },
  { pitch: 49, label: "Crash" },
  { pitch: 51, label: "Ride" },
];

export function DrumPad({
  onPlay,
  onClose,
}: {
  onPlay: (pitch: number, chord: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div className="border-t border-abyss-700 bg-abyss-900 px-3 py-2">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-parchment-500">Drum pads</span>
        <button onClick={onClose} className="ml-auto rounded px-1 text-parchment-500 hover:bg-abyss-700">
          <Icon name="close" size={13} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {DRUM_PADS.map((p) => (
          <button
            key={p.pitch}
            onMouseDown={(e) => onPlay(p.pitch, e.shiftKey)}
            className="rounded border border-abyss-600 bg-abyss-800 py-3 text-[10px] text-parchment-300 transition-colors hover:bg-abyss-700 active:bg-gold-600 active:text-abyss-950"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
