/**
 * The colours a page of music is drawn in, and how much room a clef takes.
 *
 * These live here rather than beside the glyphs because glyphs.tsx is a client
 * module, and in the App Router every export of a client module — including a
 * plain string or a plain function — becomes a reference stub when a server
 * component imports it. A server-rendered figure that asked glyphs.tsx for the
 * ink got an object where it wanted "#161616", and for the clef width it got
 * something it could not call at all. Values and maths belong on this side of
 * the line; only the components belong on the other.
 */

import type { Clef } from "@/lib/studio/instruments";

export const INK = "#161616"; // engraved black on a white page
export const INK_SOFT = "rgba(22,22,22,0.62)";
export const INK_FAINT = "rgba(22,22,22,0.26)";
export const SELECT = "#1a73e8";
export const PLAYING = "#e8710a";

/** How much horizontal room a clef needs before the key signature. */
export function clefWidth(clef: Clef, sp: number): number {
  if (clef === "treble") return sp * 4.4;
  if (clef === "bass") return sp * 4;
  if (clef === "alto" || clef === "tenor") return sp * 4;
  if (clef === "percussion") return sp * 3;
  return sp * 5;
}

/**
 * The same accent, dark enough to read on paper.
 *
 * A lesson's category colour is chosen to glow on a near-black page. Dropped
 * onto the cream a figure is engraved on, gold on cream is barely a colour at
 * all — and it is carrying the meaning: which note the paragraph is about,
 * which span the bracket measures. Mixing it toward the ink keeps the hue and
 * gets the contrast back.
 */
export function inkAccent(accent: string, toward = 0.45): string {
  const hex = accent.trim().replace("#", "");
  const full =
    hex.length === 3
      ? hex.split("").map((c) => c + c).join("")
      : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return "#7a4f14";
  const mix = (from: number, to: number) => Math.round(from + (to - from) * toward);
  const r = mix(parseInt(full.slice(0, 2), 16), 0x16);
  const g = mix(parseInt(full.slice(2, 4), 16), 0x16);
  const b = mix(parseInt(full.slice(4, 6), 16), 0x16);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
