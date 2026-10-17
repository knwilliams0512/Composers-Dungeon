/**
 * Pitch range arithmetic for every surface that writes notes.
 *
 * This lives in its own module so the invariant can be tested directly rather
 * than inferred from JSX. It exists because it was broken: the on-screen
 * keyboard showed three octaves and let the window start as high as C7, which
 * put its top key at MIDI 131. Those keys sounded — an oscillator takes any
 * frequency you give it — and then broke everything downstream that assumes a
 * pitch is a byte: MIDI export, instrument ranges, staff placement.
 *
 * A number typed in one component and a clamp written in another is how that
 * happens, so both now come from here.
 */

/** MIDI pitch is a 7-bit value. 0 is C-1, 127 is G9. */
export const MIDI_MIN = 0;
export const MIDI_MAX = 127;

/** The piano, for reference: A0 to C8. */
export const PIANO_LOWEST = 21;
export const PIANO_HIGHEST = 108;

/** How many octaves the on-screen keyboard may show at once. */
export const MIN_SPAN = 1;
export const MAX_SPAN = 7;
/**
 * What it shows before anyone touches the controls. Five octaves is a 61-key
 * controller, which is the size most people picture when they think "a
 * keyboard". It used to open at three, which is why the first thing said
 * about this editor was that it did not have enough octaves.
 */
export const DEFAULT_SPAN = 5;

/**
 * The highest base octave a window of `span` octaves may start at.
 *
 * The top key of a window is the B of its last octave, at
 * `(base + span) * 12 + 11`. Keeping that at or under MIDI_MAX is the whole
 * constraint; everything else follows from it.
 */
export function maxBaseOctave(span: number): number {
  const s = Math.max(MIN_SPAN, Math.min(MAX_SPAN, Math.round(span)));
  return Math.floor((MIDI_MAX - 11) / 12) - s;
}

/** Any pitch, forced into something MIDI can actually carry. */
export function clampPitch(pitch: number): number {
  if (!Number.isFinite(pitch)) return MIDI_MIN;
  return Math.max(MIDI_MIN, Math.min(MIDI_MAX, Math.round(pitch)));
}

/** The lowest and highest pitch a keyboard window covers. */
export function windowRange(base: number, span: number): { lowest: number; highest: number } {
  const s = Math.max(MIN_SPAN, Math.min(MAX_SPAN, Math.round(span)));
  const b = Math.max(0, Math.min(maxBaseOctave(s), Math.round(base)));
  return { lowest: (b + 1) * 12, highest: (b + s) * 12 + 11 };
}

const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

/** Scientific pitch notation: MIDI 60 is C4, so the octave is pitch/12 - 1. */
export function pitchLabel(pitch: number): string {
  const p = clampPitch(pitch);
  return `${NAMES[p % 12]}${Math.floor(p / 12) - 1}`;
}
