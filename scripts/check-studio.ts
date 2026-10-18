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
import { readFileSync } from "node:fs";
import { scheduleScore } from "../src/lib/studio/audio";
import { addDynamic } from "../src/lib/studio/edit";
import {
  DEFAULT_LAYOUT,
  STUDIO_VERSION,
  type StudioScore,
} from "../src/lib/studio/model";
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

/* -------------------------------------------------------------------------- */
/* Dynamics have to reach the sound                                           */
/* -------------------------------------------------------------------------- */
// Reported as "dynamics don't actually change anything", and the engine turned
// out to be innocent: scheduleScore maps a printed dynamic to a gain correctly.
// What was broken was where the marks landed. The panel wrote every dynamic at
// the cursor, clicking one does not move the cursor, and addDynamic replaces
// whatever sits on that tick — rightly, two dynamics on one beat being
// nonsense — so clicking pp then ff left only ff. However many you clicked, the
// score held exactly one dynamic, nothing contrasted, and the fair conclusion
// was that dynamics did nothing.
//
// So the assertion is not "the table has entries" but "a quiet passage
// schedules quieter than a loud one".
{
  const note = (id: string, start: number, pitch: number) => ({ id, start, duration: 4, pitch });
  const base: StudioScore = {
    version: STUDIO_VERSION,
    info: { title: "d", subtitle: "", composer: "", arranger: "", lyricist: "", copyright: "", description: "" },
    key: "C",
    mode: "major",
    meter: { beats: 4, unit: 4 },
    tempo: 120,
    parts: [
      {
        id: "p1",
        instrumentId: "piano",
        visible: true,
        muted: false,
        solo: false,
        volume: 0.8,
        pan: 0,
        staves: [
          {
            id: "s1",
            clef: "treble",
            lines: 5,
            voices: [{ id: "v1", rests: [], notes: [note("a", 0, 60), note("b", 4, 62), note("c", 8, 64)] }],
            dynamics: [],
            hairpins: [],
            texts: [],
            octaveLines: [],
          },
        ],
      },
    ],
    groups: [],
    measures: [{ id: "m1" }],
    layout: DEFAULT_LAYOUT,
    masterVolume: 1,
  };

  let s = addDynamic(base, "p1", "s1", 0, "ppp");
  s = addDynamic(s, "p1", "s1", 4, "mf");
  s = addDynamic(s, "p1", "s1", 8, "fff");
  const gains = scheduleScore(s).notes.map((x) => x.gain);
  if (gains.length !== 3) fail(`expected 3 scheduled notes, got ${gains.length}`);
  else {
    if (!(gains[0] < gains[1] && gains[1] < gains[2]))
      fail(`ppp/mf/fff scheduled at ${gains.map((g) => g.toFixed(3)).join(", ")}; they must rise`);
    // And audibly apart, not merely different in the sixth decimal place.
    if (gains[2] / Math.max(gains[0], 1e-9) < 4)
      fail(`fff is only ${(gains[2] / gains[0]).toFixed(1)}x ppp, which nobody would call a dynamic range`);
  }

  // Every dynamic the panel offers must actually move the needle.
  const ALL = ["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"] as const;
  const seen = ALL.map((d) => {
    const one = addDynamic(base, "p1", "s1", 0, d);
    return scheduleScore(one).notes[0].gain;
  });
  for (let i = 1; i < ALL.length; i++) {
    if (!(seen[i] > seen[i - 1]))
      fail(`${ALL[i]} is not louder than ${ALL[i - 1]} (${seen[i].toFixed(3)} vs ${seen[i - 1].toFixed(3)})`);
  }

  // The trap that caused the report: two dynamics on one tick collapse to one.
  // That is correct, and it is why the editor must not put them all there.
  let stacked = base;
  for (const d of ["ppp", "mf", "fff"] as const) stacked = addDynamic(stacked, "p1", "s1", 0, d);
  if (stacked.parts[0].staves[0].dynamics.length !== 1)
    fail("two dynamics on one tick no longer replace each other; the editor relies on that");
  // And the editor must place them by selection, not at a cursor that never moves.
  const editor = readFileSync("src/components/studio/StudioEditor.tsx", "utf8");
  const onDyn = /onDynamic:[\s\S]{0,400}?\),\n/.exec(editor)?.[0] ?? "";
  if (!/selectionStart\(/.test(onDyn))
    fail("onDynamic does not consult the selection, so every dynamic lands on the same tick again");
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
