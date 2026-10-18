/**
 * Holds the time map and the loudness curve to what the notation means.
 *
 *   npx tsx scripts/check-timing.ts
 *
 * Playback used to be one multiplication — tick times a constant — which is
 * right for a score with one tempo and no holds and quietly wrong for
 * everything else. A fermata printed and did not hold; a crescendo printed and
 * did not grow. Both are now functions that bend, and a bending map brings its
 * own failure modes that a constant could not have:
 *
 *   - the inverse has to agree with the forward map, or the playhead walks away
 *     from the sound through every hold and never comes back;
 *   - a hold inside a hold must not compound, or two fermatas a beat apart stop
 *     the piece dead;
 *   - a hairpin has to arrive exactly at the dynamic printed at its end, not
 *     near it, or every phrase lands a step out.
 *
 * None of that is visible to the type checker, and all of it is arithmetic,
 * which is the one thing a script can check properly.
 */
import { ticksPerBeat } from "../src/lib/score";
import {
  DEFAULT_LAYOUT,
  STUDIO_VERSION,
  emptyStudioScore,
  type Dynamic,
  type Fermata,
  type StudioScore,
} from "../src/lib/studio/model";
import {
  DYNAMIC_GAIN,
  DYNAMIC_LADDER,
  FERMATA_HOLD,
  buildTimeMap,
  gainCurve,
} from "../src/lib/studio/timing";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);
const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) < tol;

/** A one-part score with the given notes, in 4/4 at 120 unless told otherwise. */
function scoreWith(
  notes: { start: number; duration: number; pitch?: number; fermata?: Fermata }[],
  opts: {
    tempo?: number;
    meter?: { beats: number; unit: number };
    bars?: number;
    dynamics?: { start: number; value: Dynamic }[];
    hairpins?: { start: number; duration: number; kind: "crescendo" | "diminuendo" }[];
    rests?: { start: number; duration: number; fermata?: Fermata }[];
  } = {}
): StudioScore {
  const meter = opts.meter ?? { beats: 4, unit: 4 };
  const base = emptyStudioScore({
    tempo: opts.tempo ?? 120,
    meter,
    layout: { ...DEFAULT_LAYOUT },
  });
  const bars = opts.bars ?? 4;
  const measures = Array.from({ length: bars }, (_, i) => ({ id: `m${i}` }));
  return {
    ...base,
    version: STUDIO_VERSION,
    measures,
    parts: [
      {
        ...base.parts[0],
        staves: [
          {
            ...base.parts[0].staves[0],
            dynamics: (opts.dynamics ?? []).map((d, i) => ({ id: `d${i}`, ...d })),
            hairpins: (opts.hairpins ?? []).map((h, i) => ({ id: `h${i}`, ...h })),
            voices: [
              {
                id: "v1",
                notes: notes.map((n, i) => ({
                  id: `n${i}`,
                  start: n.start,
                  duration: n.duration,
                  pitch: n.pitch ?? 60,
                  ...(n.fermata ? { fermata: n.fermata } : {}),
                })),
                rests: (opts.rests ?? []).map((r, i) => ({
                  id: `r${i}`,
                  start: r.start,
                  duration: r.duration,
                  ...(r.fermata ? { fermata: r.fermata } : {}),
                })),
              },
            ],
          },
        ],
      },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* With no holds, the map must be exactly what it replaced                    */
/* -------------------------------------------------------------------------- */
// If this fails, every score anybody has already written now plays at a
// different speed, which would be a far worse bug than the one being fixed.

for (const [beats, unit] of [[4, 4], [3, 4], [6, 8], [2, 2], [12, 8], [5, 4]] as [number, number][]) {
  for (const tempo of [40, 60, 120, 208]) {
    const score = scoreWith([{ start: 0, duration: 4 }], { tempo, meter: { beats, unit } });
    const map = buildTimeMap(score);
    const expected = 60 / tempo / ticksPerBeat({ beats, unit });
    if (!near(map.baseSecondsPerTick, expected))
      fail(`${beats}/${unit} at ${tempo}: base rate ${map.baseSecondsPerTick}, expected ${expected}`);
    for (const tick of [0, 1, 4, 16, 64]) {
      if (!near(map.secondsAt(tick), tick * expected, 1e-9))
        fail(`${beats}/${unit} at ${tempo}: tick ${tick} lands at ${map.secondsAt(tick)}s`);
    }
    // One beat has to be one beat.
    const beat = ticksPerBeat({ beats, unit });
    if (!near(map.secondsAt(beat) - map.secondsAt(0), 60 / tempo))
      fail(`${beats}/${unit} at ${tempo}: a beat is not 60/${tempo} seconds long`);
  }
}

/* -------------------------------------------------------------------------- */
/* A fermata holds, and holds by the stated amount                            */
/* -------------------------------------------------------------------------- */

for (const shape of Object.keys(FERMATA_HOLD) as Fermata[]) {
  const factor = FERMATA_HOLD[shape];
  // A whole note held, then a whole note not held.
  const score = scoreWith([
    { start: 0, duration: 16, fermata: shape },
    { start: 16, duration: 16 },
  ]);
  const map = buildTimeMap(score);
  const rate = map.baseSecondsPerTick;

  const heldFor = map.secondsAt(16) - map.secondsAt(0);
  if (!near(heldFor, 16 * rate * factor))
    fail(`a ${shape} fermata held for ${heldFor}s, expected ${16 * rate * factor}s`);

  // The note after it is back at the written tempo.
  const after = map.secondsAt(32) - map.secondsAt(16);
  if (!near(after, 16 * rate))
    fail(`after a ${shape} fermata the piece did not resume: ${after}s for a whole note`);

  if (factor <= 1) fail(`a ${shape} fermata does not lengthen anything (factor ${factor})`);
}

// The holds have to be ordered the way the shapes are understood.
{
  const order: Fermata[] = ["angled", "normal", "square", "very-long"];
  for (let i = 1; i < order.length; i++) {
    if (!(FERMATA_HOLD[order[i]] > FERMATA_HOLD[order[i - 1]]))
      fail(`a ${order[i]} fermata is not longer than a ${order[i - 1]} one`);
  }
}

// A held rest holds too, or the silence before a final chord does not exist.
{
  const score = scoreWith([{ start: 8, duration: 8 }], {
    rests: [{ start: 0, duration: 8, fermata: "normal" }],
  });
  const map = buildTimeMap(score);
  const silence = map.secondsAt(8) - map.secondsAt(0);
  if (!near(silence, 8 * map.baseSecondsPerTick * FERMATA_HOLD.normal))
    fail(`a held rest did not hold: ${silence}s`);
}

/* -------------------------------------------------------------------------- */
/* Holds that overlap must not compound                                       */
/* -------------------------------------------------------------------------- */

{
  // The same chord held in three parts is one hold, not three.
  const base = scoreWith([{ start: 0, duration: 16, fermata: "normal" }]);
  const three: StudioScore = {
    ...base,
    parts: [base.parts[0], { ...base.parts[0], id: "p2" }, { ...base.parts[0], id: "p3" }],
  };
  const map = buildTimeMap(three);
  const held = map.secondsAt(16) - map.secondsAt(0);
  if (!near(held, 16 * map.baseSecondsPerTick * FERMATA_HOLD.normal))
    fail(`a chord held in three parts held ${held}s, which is not one hold`);
}

{
  // A longer hold at the same tick wins; it is one decision, not a sum.
  const base = scoreWith([{ start: 0, duration: 16, fermata: "angled" }]);
  const both: StudioScore = {
    ...base,
    parts: [
      base.parts[0],
      {
        ...base.parts[0],
        id: "p2",
        staves: [
          {
            ...base.parts[0].staves[0],
            id: "s2",
            voices: [
              {
                id: "v2",
                notes: [{ id: "x", start: 0, duration: 16, pitch: 67, fermata: "very-long" }],
                rests: [],
              },
            ],
          },
        ],
      },
    ],
  };
  const map = buildTimeMap(both);
  const held = map.secondsAt(16) - map.secondsAt(0);
  if (!near(held, 16 * map.baseSecondsPerTick * FERMATA_HOLD["very-long"]))
    fail(`two fermatas on one chord gave ${held}s rather than the longer of the two`);
}

{
  // A fermata inside another one's span is folded in rather than stacking.
  const score = scoreWith([
    { start: 0, duration: 16, fermata: "square" },
    { start: 4, duration: 4, fermata: "square" },
  ]);
  const map = buildTimeMap(score);
  const held = map.secondsAt(16) - map.secondsAt(0);
  const once = 16 * map.baseSecondsPerTick * FERMATA_HOLD.square;
  if (held > once + 1e-6)
    fail(`a fermata inside a fermata compounded: ${held}s against ${once}s for one hold`);
}

/* -------------------------------------------------------------------------- */
/* The inverse has to be a real inverse                                       */
/* -------------------------------------------------------------------------- */

for (const shapes of [[], ["normal"], ["very-long", "angled"]] as Fermata[][]) {
  const score = scoreWith(
    Array.from({ length: 8 }, (_, i) => ({
      start: i * 4,
      duration: 4,
      ...(shapes[i % Math.max(1, shapes.length)] && i % 3 === 0
        ? { fermata: shapes[i % shapes.length] }
        : {}),
    }))
  );
  const map = buildTimeMap(score);
  for (let tick = 0; tick <= map.totalTicks; tick += 0.5) {
    const back = map.tickAt(map.secondsAt(tick));
    if (!near(back, tick, 1e-6))
      fail(`tickAt(secondsAt(${tick})) came back as ${back} with holds [${shapes.join(",")}]`);
  }
  // And forwards from seconds, which is the direction the playhead runs.
  for (let sec = 0; sec <= map.totalSeconds; sec += 0.05) {
    const back = map.secondsAt(map.tickAt(sec));
    if (!near(back, sec, 1e-6))
      fail(`secondsAt(tickAt(${sec.toFixed(2)})) came back as ${back.toFixed(6)}`);
  }
  // Time only ever moves forward.
  let last = -1;
  for (let tick = 0; tick <= map.totalTicks; tick += 1) {
    const at = map.secondsAt(tick);
    if (at < last - 1e-9) fail(`time went backwards at tick ${tick}`);
    last = at;
  }
  // The spans have to tile the piece with no gap and no overlap.
  for (let i = 1; i < map.spans.length; i++) {
    if (!near(map.spans[i].from, map.spans[i - 1].to))
      fail(`span ${i} starts at ${map.spans[i].from} where the previous one ended at ${map.spans[i - 1].to}`);
    if (!near(map.spans[i].at, map.spans[i - 1].at + (map.spans[i - 1].to - map.spans[i - 1].from) * map.spans[i - 1].secondsPerTick))
      fail(`span ${i}'s stated start time does not follow from the span before it`);
  }
  if (map.spans.some((s) => s.to <= s.from)) fail("a span covers no ticks at all");
  if (map.spans.some((s) => !(s.secondsPerTick > 0))) fail("a span runs at a non-positive rate");
  if (!near(map.totalSeconds, map.secondsAt(map.totalTicks)))
    fail(`totalSeconds (${map.totalSeconds}) disagrees with secondsAt(end) (${map.secondsAt(map.totalTicks)})`);
}

// An empty score must still produce a usable map rather than dividing by zero.
{
  const map = buildTimeMap(scoreWith([], { bars: 1 }));
  if (!(map.spans.length > 0)) fail("an empty score produced no spans");
  if (!Number.isFinite(map.secondsAt(0)) || !Number.isFinite(map.tickAt(0)))
    fail("an empty score's map is not finite");
  if (!Number.isFinite(map.totalSeconds)) fail("an empty score has no total length");
}

// A tempo of zero would be a division by zero; the map clamps rather than
// producing Infinity and taking the whole player down with it.
{
  const broken = { ...scoreWith([{ start: 0, duration: 4 }]), tempo: 0 };
  const map = buildTimeMap(broken);
  if (!Number.isFinite(map.secondsAt(4))) fail("a tempo of zero produced a non-finite time");
}

/* -------------------------------------------------------------------------- */
/* Loudness                                                                   */
/* -------------------------------------------------------------------------- */

// A mark stays in force until the next one.
{
  const curve = gainCurve({
    dynamics: [
      { start: 0, value: "p" },
      { start: 16, value: "ff" },
    ],
    hairpins: [],
  });
  if (!near(curve(0), DYNAMIC_GAIN.p)) fail("a dynamic does not apply at its own tick");
  if (!near(curve(15), DYNAMIC_GAIN.p)) fail("a dynamic does not hold until the next one");
  if (!near(curve(16), DYNAMIC_GAIN.ff)) fail("the next dynamic does not take over at its tick");
  if (!near(curve(100), DYNAMIC_GAIN.ff)) fail("the last dynamic does not hold to the end");
}

// With nothing printed at all, mf — the level a score with no marks is played.
if (!near(gainCurve({ dynamics: [], hairpins: [] })(0), DYNAMIC_GAIN.mf))
  fail("an unmarked staff does not play at mf");

// A hairpin ramps from where it starts to the dynamic printed at its end.
{
  const curve = gainCurve({
    dynamics: [
      { start: 0, value: "pp" },
      { start: 16, value: "ff" },
    ],
    hairpins: [{ start: 0, duration: 16, kind: "crescendo" }],
  });
  if (!near(curve(0), DYNAMIC_GAIN.pp)) fail("a crescendo does not begin at the standing dynamic");
  const mid = curve(8);
  const want = (DYNAMIC_GAIN.pp + DYNAMIC_GAIN.ff) / 2;
  if (!near(mid, want)) fail(`halfway through a crescendo the gain is ${mid}, expected ${want}`);
  if (!near(curve(16), DYNAMIC_GAIN.ff)) fail("a crescendo does not arrive at its target");
  // Strictly growing, which is the one thing the word means.
  for (let t = 1; t < 16; t++) {
    if (!(curve(t) > curve(t - 1))) fail(`a crescendo did not grow between ticks ${t - 1} and ${t}`);
  }
}

{
  const curve = gainCurve({
    dynamics: [
      { start: 0, value: "f" },
      { start: 8, value: "p" },
    ],
    hairpins: [{ start: 0, duration: 8, kind: "diminuendo" }],
  });
  for (let t = 1; t < 8; t++) {
    if (!(curve(t) < curve(t - 1))) fail(`a diminuendo did not fall between ticks ${t - 1} and ${t}`);
  }
}

// A hairpin with nothing printed at its end moves one step along the ladder.
{
  for (const [from, dir, expected] of [
    ["mf", "crescendo", "f"],
    ["mf", "diminuendo", "mp"],
    // And it cannot fall off either end of the ladder.
    ["fff", "crescendo", "fff"],
    ["ppp", "diminuendo", "ppp"],
  ] as [Dynamic, "crescendo" | "diminuendo", Dynamic][]) {
    const curve = gainCurve({
      dynamics: [{ start: 0, value: from }],
      hairpins: [{ start: 0, duration: 8, kind: dir }],
    });
    if (!near(curve(8), DYNAMIC_GAIN[expected]))
      fail(
        `an unresolved ${dir} from ${from} ended at ${curve(8)}, expected ${expected} ` +
          `(${DYNAMIC_GAIN[expected]})`
      );
  }
}

/*
 * An unresolved hairpin latches.
 *
 * This is the bug this script found. The level a crescendo arrived at has to
 * stay in force afterwards; the first version of gainCurve dropped straight
 * back to the dynamic that had been standing before it, so a four-bar
 * crescendo ended by undoing itself on the next note.
 */
{
  const curve = gainCurve({
    dynamics: [{ start: 0, value: "p" }],
    hairpins: [{ start: 0, duration: 8, kind: "crescendo" }],
  });
  if (!near(curve(8), DYNAMIC_GAIN.mp))
    fail(`a crescendo from p arrived at ${curve(8)}, expected mp (${DYNAMIC_GAIN.mp})`);
  if (!near(curve(40), DYNAMIC_GAIN.mp))
    fail(`the level a crescendo reached did not stay in force: ${curve(40)} later on`);
}

// And a chain of them climbs, each starting where the last left off.
{
  const curve = gainCurve({
    dynamics: [{ start: 0, value: "pp" }],
    hairpins: [
      { start: 0, duration: 8, kind: "crescendo" },
      { start: 8, duration: 8, kind: "crescendo" },
      { start: 16, duration: 8, kind: "crescendo" },
    ],
  });
  for (const [tick, want] of [[8, "p"], [16, "mp"], [24, "mf"]] as [number, Dynamic][]) {
    if (!near(curve(tick), DYNAMIC_GAIN[want]))
      fail(
        `the ${tick / 8}th crescendo in a chain arrived at ${curve(tick)}, ` +
          `expected ${want} (${DYNAMIC_GAIN[want]})`
      );
  }
  // Monotonic the whole way, which is the point of writing three of them.
  for (let t = 1; t <= 24; t++)
    if (curve(t) < curve(t - 1) - 1e-9) fail(`a chain of crescendos fell back at tick ${t}`);
}

// A printed mark after an unresolved hairpin still wins over the latched level.
{
  const curve = gainCurve({
    dynamics: [
      { start: 0, value: "p" },
      { start: 20, value: "ppp" },
    ],
    hairpins: [{ start: 0, duration: 8, kind: "crescendo" }],
  });
  if (!near(curve(19), DYNAMIC_GAIN.mp)) fail("the latched level did not hold up to the next mark");
  if (!near(curve(20), DYNAMIC_GAIN.ppp)) fail("a printed mark did not override a latched level");
}

// A hairpin out of sfz has no ladder position to start from; it must still
// produce a real number rather than NaN.
{
  const curve = gainCurve({
    dynamics: [{ start: 0, value: "sfz" }],
    hairpins: [{ start: 0, duration: 8, kind: "crescendo" }],
  });
  for (let t = 0; t <= 8; t++)
    if (!Number.isFinite(curve(t))) fail(`a crescendo out of sfz gave ${curve(t)} at tick ${t}`);
}

// A zero-length hairpin is a mistake, not a division by zero.
{
  const curve = gainCurve({
    dynamics: [{ start: 0, value: "mf" }],
    hairpins: [{ start: 0, duration: 0, kind: "crescendo" }],
  });
  if (!near(curve(0), DYNAMIC_GAIN.mf)) fail("a zero-length hairpin changed the gain");
}

// Every gain is a usable level.
for (const [d, g] of Object.entries(DYNAMIC_GAIN)) {
  if (!(g > 0 && g <= 1)) fail(`${d} has a gain of ${g}, which is not a level`);
}
for (let i = 1; i < DYNAMIC_LADDER.length; i++) {
  if (!(DYNAMIC_GAIN[DYNAMIC_LADDER[i]] > DYNAMIC_GAIN[DYNAMIC_LADDER[i - 1]]))
    fail(`the ladder is not ascending at ${DYNAMIC_LADDER[i]}`);
}
if (DYNAMIC_LADDER.length < 8) fail("the dynamic ladder is missing rungs");

console.log(
  `timing: ${Object.keys(FERMATA_HOLD).length} fermata shapes holding by stated amounts, ` +
    `the map invertible to 1e-6 over every hold pattern, 24 unheld metre-and-tempo ` +
    `combinations unchanged, and hairpins arriving exactly on the printed dynamic`
);
if (problems.length === 0) console.log("OK - holds hold and crescendos grow");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
