/**
 * The arithmetic behind how a note sounds.
 *
 *   npx tsx scripts/check-voice.ts
 *
 * Playback used to be a fixed stack of oscillators per instrument family, so
 * every note had one spectrum for its whole life and velocity was a volume
 * control. Neither is true of any acoustic instrument: the spectrum is widest
 * at the attack and narrows as the energy leaves, and playing harder produces
 * more harmonics rather than simply more amplitude.
 *
 * So there is a filter now, and its cutoff is derived from the pitch, the
 * velocity and the recipe. Deriving it introduces a failure that the old fixed
 * stack could not have: a low-pass at or below the fundamental does not dull a
 * note, it removes it. A piccolo at pianissimo is exactly where that arithmetic
 * would go wrong, and it would be silent rather than obviously broken.
 *
 * None of this can be heard from a script. All of it can be checked.
 */
import {
  MAX_CUTOFF,
  MIN_CUTOFF,
  RECIPES,
  voiceParams,
  type Recipe,
} from "../src/lib/studio/audio";
import type { Timbre } from "../src/lib/studio/instruments";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);

const TIMBRES = Object.keys(RECIPES) as Timbre[];
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/* -------------------------------------------------------------------------- */
/* Every note the app can play, at every dynamic                              */
/* -------------------------------------------------------------------------- */

let checked = 0;
for (const timbre of TIMBRES) {
  const r = RECIPES[timbre];
  for (let pitch = 0; pitch <= 127; pitch++) {
    for (const velocity of [0, 0.05, 0.12, 0.3, 0.5, 0.75, 1]) {
      const p = voiceParams(pitch, velocity, r);
      checked++;
      const where = `${timbre} at pitch ${pitch}, velocity ${velocity}`;

      for (const [name, value] of Object.entries(p)) {
        if (!Number.isFinite(value)) fail(`${where}: ${name} is ${value}`);
      }

      // The one that silences a note rather than dulling it.
      if (p.cutoffStart <= p.fundamental)
        fail(
          `${where}: the filter opens at ${Math.round(p.cutoffStart)}Hz, at or below the ` +
            `fundamental of ${Math.round(p.fundamental)}Hz — the note would be inaudible`
        );
      if (p.cutoffEnd <= p.fundamental && p.fundamental < MAX_CUTOFF)
        fail(
          `${where}: the filter closes to ${Math.round(p.cutoffEnd)}Hz, at or below the ` +
            `fundamental of ${Math.round(p.fundamental)}Hz — the note would fade to nothing`
        );

      if (p.cutoffStart < MIN_CUTOFF || p.cutoffStart > MAX_CUTOFF)
        fail(`${where}: cutoff opens at ${Math.round(p.cutoffStart)}Hz, outside the usable range`);
      if (p.cutoffEnd < MIN_CUTOFF || p.cutoffEnd > MAX_CUTOFF)
        fail(`${where}: cutoff closes at ${Math.round(p.cutoffEnd)}Hz, outside the usable range`);

      // A note brightens at its attack and darkens after, never the reverse.
      if (p.cutoffEnd > p.cutoffStart + 1e-6)
        fail(`${where}: the note gets brighter as it decays`);

      // A decay this short is a click rather than a note, and it is reachable:
      // the pitch-decay curve runs under 20ms above about MIDI 120 for a
      // struck voice, which is where the floor in voiceParams earns its keep.
      // The first version of this script only sampled pitch 96, where the
      // curve is still at 128ms, so it never looked at the cases the floor
      // exists for and passed happily with the floor removed.
      if (!(p.decay >= 0.02)) fail(`${where}: a decay of ${p.decay}s, which is a click`);
      if (p.decay > 10) fail(`${where}: a decay of ${p.decay} seconds`);
      if (p.transientLevel < 0 || p.transientLevel > 1)
        fail(`${where}: a transient level of ${p.transientLevel}`);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Harder is brighter                                                         */
/* -------------------------------------------------------------------------- */
// The whole musical point. If this does not hold, dynamics are a volume knob
// again, which is the thing being fixed.

for (const timbre of TIMBRES) {
  const r = RECIPES[timbre];
  for (const pitch of [36, 48, 60, 72, 84]) {
    const soft = voiceParams(pitch, 0.15, r);
    const loud = voiceParams(pitch, 1, r);
    // Unless both have run into the ceiling or the floor, in which case there
    // is genuinely nowhere for the difference to go.
    const pinnedHigh = soft.cutoffStart >= MAX_CUTOFF - 1;
    const pinnedLow = loud.cutoffStart <= soft.fundamental * 1.6 + 1;
    if (!pinnedHigh && !pinnedLow && !(loud.cutoffStart > soft.cutoffStart))
      fail(
        `${timbre} at pitch ${pitch}: playing harder does not open the filter ` +
          `(${Math.round(soft.cutoffStart)}Hz against ${Math.round(loud.cutoffStart)}Hz)`
      );
  }
  // And it has to be monotonic, not merely different at the ends.
  const sweep = [0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => voiceParams(60, v, r).cutoffStart);
  for (let i = 1; i < sweep.length; i++) {
    if (sweep[i] < sweep[i - 1] - 1e-6)
      fail(`${timbre}: the filter closes between velocity ${(i - 1) / 5} and ${i / 5}`);
  }
}

/* -------------------------------------------------------------------------- */
/* High notes die faster, where that is what the instrument does              */
/* -------------------------------------------------------------------------- */

for (const timbre of TIMBRES) {
  const r = RECIPES[timbre];
  const low = voiceParams(36, 0.8, r).decay;
  const high = voiceParams(96, 0.8, r).decay;
  if (r.pitchDecay) {
    if (!(high < low))
      fail(`${timbre} has pitchDecay set but a high note does not decay faster (${high} against ${low})`);
    // A piano's top octave is quick, not instant.
    if (high < 0.02) fail(`${timbre}: a high note decays in ${high}s, which is a click`);
  } else if (Math.abs(high - low) > 1e-9) {
    fail(`${timbre} has no pitchDecay but its decay still varies with pitch`);
  }
}

/* -------------------------------------------------------------------------- */
/* The recipes themselves                                                     */
/* -------------------------------------------------------------------------- */

for (const timbre of TIMBRES) {
  const r: Recipe = RECIPES[timbre];
  if (r.partials.length === 0) fail(`${timbre} has no partials, so it makes no sound`);
  if (!r.partials.some((p) => p.ratio === 1))
    fail(`${timbre} has no partial at the fundamental, so it plays the wrong pitch`);
  for (const p of r.partials) {
    if (p.ratio <= 0) fail(`${timbre} has a partial at ratio ${p.ratio}`);
    if (p.gain <= 0 || p.gain > 1) fail(`${timbre} has a partial at gain ${p.gain}`);
  }
  if (!(r.brightness > 1)) fail(`${timbre} reaches only ${r.brightness}x its fundamental`);
  if (!(r.damping > 0) || r.damping > 1) fail(`${timbre} has a damping of ${r.damping}`);
  for (const [name, v] of [
    ["attack", r.attack],
    ["decay", r.decay],
    ["release", r.release],
  ] as [string, number][]) {
    if (!(v > 0)) fail(`${timbre} has ${name} of ${v}`);
    if (v > 3) fail(`${timbre} has ${name} of ${v} seconds`);
  }
  if (r.sustain < 0 || r.sustain > 1) fail(`${timbre} sustains at ${r.sustain}`);
  if (r.level <= 0 || r.level > 1) fail(`${timbre} is levelled at ${r.level}`);
  if (r.transient) {
    if (r.transient.level <= 0 || r.transient.level > 0.5)
      fail(`${timbre}'s transient is at ${r.transient.level}, which is not an onset`);
    // Long enough to hear, short enough to still be an attack rather than a note.
    if (r.transient.seconds <= 0 || r.transient.seconds > 0.12)
      fail(`${timbre}'s transient lasts ${r.transient.seconds}s, which is no longer a transient`);
  }
  if (r.detune !== undefined && (r.detune <= 0 || r.detune > 30))
    fail(`${timbre} detunes by ${r.detune} cents, which is out of tune rather than wide`);
  if (r.pitchDecay !== undefined && (r.pitchDecay <= 0 || r.pitchDecay > 1))
    fail(`${timbre} has a pitchDecay of ${r.pitchDecay}`);
}

// Every timbre the instrument catalogue can name has a recipe, or an
// instrument silently plays as something else.
{
  const named = new Set(TIMBRES);
  for (const t of ["bowed", "plucked", "reed", "flute", "brass", "struck", "voice", "electronic", "drum"]) {
    if (!named.has(t as Timbre)) fail(`no recipe for the "${t}" timbre`);
  }
}

/* -------------------------------------------------------------------------- */
/* The guard that nothing currently triggers                                  */
/* -------------------------------------------------------------------------- */
/*
 * voiceParams keeps the cutoff at least 1.6 times the fundamental. With
 * today's recipes nothing ever reaches that floor — the dullest voice is the
 * flute at brightness 6, which even at silence reaches 2.04 times the
 * fundamental — so deleting the floor would change no sound and pass every
 * check above. That is worth knowing rather than discovering later: the guard
 * is insurance against a future recipe, not something in use.
 *
 * Insurance still has to work. So it is exercised directly, against a recipe
 * dull enough to need it, which is the only honest way to test a branch that
 * production data does not reach.
 */
{
  const dull: Recipe = { ...RECIPES.flute, brightness: 0.4, damping: 0.1 };
  for (const pitch of [24, 48, 60, 84, 108]) {
    for (const velocity of [0, 0.5, 1]) {
      const p = voiceParams(pitch, velocity, dull);
      if (p.cutoffStart <= p.fundamental)
        fail(
          `a recipe at brightness 0.4 filters to ${Math.round(p.cutoffStart)}Hz at pitch ` +
            `${pitch}, below its fundamental of ${Math.round(p.fundamental)}Hz — the floor ` +
            `in voiceParams is not holding`
        );
      if (p.cutoffEnd <= p.fundamental && p.fundamental < MAX_CUTOFF)
        fail(`the same recipe closes below its fundamental at pitch ${pitch}`);
    }
  }
}

/*
 * The decay floor is the same kind of insurance, and the same trap.
 *
 * voiceParams will not let a decay fall under 20ms. With today's recipes the
 * curve only gets there above about MIDI 134, which does not exist — so that
 * floor is unreachable too, and a version of this script that only sampled
 * real recipes passed with it deleted. The upper clamp IS live: a struck note
 * at the bottom of the keyboard would otherwise ring for fourteen seconds.
 */
{
  const brittle: Recipe = { ...RECIPES.struck, decay: 0.05, pitchDecay: 1 };
  for (const pitch of [96, 108, 120, 127]) {
    const d = voiceParams(pitch, 0.8, brittle).decay;
    if (!(d >= 0.02))
      fail(
        `a recipe decaying in 50ms at middle C comes out at ${d.toFixed(4)}s at pitch ` +
          `${pitch}, which is a click — the decay floor in voiceParams is not holding`
      );
  }
  const booming: Recipe = { ...RECIPES.struck, decay: 2, pitchDecay: 1 };
  const low = voiceParams(12, 0.8, booming).decay;
  if (low > 2 * 4 + 1e-9)
    fail(`a low note rings for ${low.toFixed(2)}s — the upper decay clamp is not holding`);
}

// And a piccolo at its quietest, which is the real case nearest to that edge.
{
  const p = voiceParams(108, 0, RECIPES.flute);
  if (p.cutoffStart <= hz(108))
    fail("a piccolo at its quietest filters below its own fundamental");
}

console.log(
  `voice: ${checked} notes derived across ${TIMBRES.length} timbres and every MIDI pitch — ` +
    `the filter never falls to the fundamental, never brightens as it decays, and always ` +
    `opens further when the note is played harder`
);
if (problems.length === 0) console.log("OK - every note the app can play is audible");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.slice(0, 12).forEach((p) => console.log("  -", p));
  if (problems.length > 12) console.log(`  … and ${problems.length - 12} more`);
}
process.exit(problems.length ? 1 : 0);
