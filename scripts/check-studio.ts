/**
 * Studio invariants that are cheap to state and were expensive to miss.
 *
 *   npx tsx scripts/check-studio.ts
 *
 * The first one here is not hypothetical. The on-screen keyboard showed three
 * octaves and let its window start as high as C7, which put the top key at
 * MIDI 131. Those keys played — an oscillator takes any frequency — so nothing
 * looked wrong, while every consumer that treats a pitch as a byte was being
 * handed something that is not one.
 */
import {
  DEFAULT_SPAN,
  MAX_SPAN,
  MIDI_MAX,
  MIDI_MIN,
  MIN_SPAN,
  PIANO_HIGHEST,
  PIANO_LOWEST,
  clampPitch,
  maxBaseOctave,
  pitchLabel,
  windowRange,
} from "../src/lib/studio/range";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);

// --- No reachable keyboard window can leave MIDI ---------------------------
// Every span, every base octave that span allows. If any combination can name
// a pitch outside 0..127, the clamp is decorative.
for (let span = MIN_SPAN; span <= MAX_SPAN; span++) {
  const top = maxBaseOctave(span);
  if (top < 0) {
    fail(`a span of ${span} octaves has no valid base octave at all`);
    continue;
  }
  for (let base = 0; base <= top; base++) {
    const { lowest, highest } = windowRange(base, span);
    if (lowest < MIDI_MIN) fail(`span ${span} at base ${base} reaches down to ${lowest}, below MIDI ${MIDI_MIN}`);
    if (highest > MIDI_MAX) fail(`span ${span} at base ${base} reaches up to ${highest}, above MIDI ${MIDI_MAX}`);
    if (highest <= lowest) fail(`span ${span} at base ${base} covers nothing (${lowest}..${highest})`);
  }
  // And one past the end must be refused rather than quietly allowed.
  const beyond = windowRange(top + 1, span);
  if (beyond.highest > MIDI_MAX)
    fail(`span ${span} is not clamped: base ${top + 1} still reaches ${beyond.highest}`);
}

// --- Enough octaves AT ONCE ----------------------------------------------
// The complaint was "not enough octaves", and the first version of this check
// got it wrong: it asked whether A0 and C8 were reachable by scrolling, which
// was true even with the three-octave keyboard that prompted the complaint. It
// passed with MAX_SPAN cut back to 3, which made it worthless.
//
// What matters is how much is on screen without touching anything, and how
// much can be if you ask. So both are stated as numbers.
const WANT_DEFAULT_SPAN = 4; // more than a toy
const WANT_MAX_SPAN = 6; // wider than any common controller
if (DEFAULT_SPAN < WANT_DEFAULT_SPAN)
  fail(`the keyboard opens at ${DEFAULT_SPAN} octaves; at least ${WANT_DEFAULT_SPAN} should be visible before anyone touches a control`);
if (MAX_SPAN < WANT_MAX_SPAN)
  fail(`the keyboard can show at most ${MAX_SPAN} octaves; at least ${WANT_MAX_SPAN} should be available`);
if (DEFAULT_SPAN > MAX_SPAN)
  fail(`the default span (${DEFAULT_SPAN}) is wider than the maximum (${MAX_SPAN})`);

// Every note of a real piano still has to be reachable somehow, since no whole
// number of C-to-B octaves can hold A0..C8 in one window.
const covered = new Set<number>();
for (let span = MIN_SPAN; span <= MAX_SPAN; span++) {
  for (let base = 0; base <= maxBaseOctave(span); base++) {
    const { lowest, highest } = windowRange(base, span);
    for (let p = lowest; p <= highest; p++) covered.add(p);
  }
}
for (const p of [PIANO_LOWEST, PIANO_HIGHEST, 60]) {
  if (!covered.has(p)) fail(`no keyboard window can reach MIDI ${p} (${pitchLabel(p)})`);
}

// --- clampPitch has to cope with what callers really pass -----------------
for (const [input, want] of [
  [131, MIDI_MAX],
  [1000, MIDI_MAX],
  [-5, MIDI_MIN],
  [60.4, 60],
  [60.6, 61],
  [Number.NaN, MIDI_MIN],
  [Number.POSITIVE_INFINITY, MIDI_MIN],
] as [number, number][]) {
  const got = clampPitch(input);
  if (got !== want) fail(`clampPitch(${input}) gave ${got}, expected ${want}`);
}

// --- Labels must agree with scientific pitch -----------------------------
// Middle C is C4 and the A above it is A4 at 440Hz. Getting this off by an
// octave is the classic MIDI mistake and it would mislabel every key.
for (const [pitch, want] of [
  [60, "C4"],
  [69, "A4"],
  [21, "A0"],
  [108, "C8"],
  [0, "C-1"],
  [127, "G9"],
] as [number, string][]) {
  const got = pitchLabel(pitch);
  if (got !== want) fail(`pitchLabel(${pitch}) gave "${got}", expected "${want}"`);
}

const spans = MAX_SPAN - MIN_SPAN + 1;
console.log(
  `studio: ${spans} keyboard spans checked across every base octave; ` +
    `the piano (A0-C8) is reachable and nothing can leave MIDI 0-127`
);
if (problems.length === 0) console.log("OK - no studio range problems");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
