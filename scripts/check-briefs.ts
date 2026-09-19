/**
 * Is every composition exercise in the game actually completable?
 *
 * A brief's checks are written by hand, lesson by lesson, and nothing until now
 * proved the set was jointly satisfiable. A single impossible combination —
 * "one clear high point" plus "a recognisable idea comes back", say, where the
 * motif carries the peak — would leave a player unable to finish that lesson at
 * all, with no error to read and no way to tell it was the exercise's fault and
 * not theirs.
 *
 * So rather than assert anything about the checks, this searches for a real
 * composition that satisfies them: diatonic, stepwise-leaning, cadenced. If the
 * search finds one, a player can too. If it cannot, the brief is the suspect.
 */

import {
  analyze,
  emptyScore,
  isDiatonic,
  keyPitchClass,
  runChecks,
  scaleDegree,
  scalePitches,
  ticksPerBar,
  ticksPerBeat,
  triadFor,
  type Check,
  type Score,
  type ScoreChord,
  type ScoreNote,
} from "../src/lib/score";
import { briefForLesson } from "../src/lib/lesson-brief";
import { freedomTier, type Freedom } from "../src/lib/composer-freedom";
import { briefForChallenge } from "../src/lib/challenge-brief";
import { beginnerLessons } from "../prisma/seed-data/lessons-beginner";
import { advancedLessons } from "../prisma/seed-data/lessons-advanced";
import { curriculumLessons } from "../prisma/seed-data/lessons-curriculum";
import { orchestralLessons } from "../prisma/seed-data/lessons-orchestral";
import { PrismaClient } from "@prisma/client";
import { challengeComponents, bosses } from "../prisma/seed-data/world";
import { expansionBosses } from "../prisma/seed-data/world-expansion";
import { orchestralBosses } from "../prisma/seed-data/world-orchestral";
import { briefForBoss, BOSS_BRIEF_KEYS } from "../src/lib/boss-brief";

/* --- a tiny seeded RNG, so a failure reported here reproduces exactly ------ */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Rhythms for one bar, as (offset, duration) pairs, using only the note lengths
 * this exercise actually offers and only the grid columns it can be placed on.
 * An Apprentice has quarter and half notes on a quarter-note grid; asking that
 * player for three distinct lengths would be asking for something the editor
 * cannot express, however satisfiable the check looks on paper.
 */
const rhythmCache = new Map<string, number[][][]>();
function barRhythms(barTicks: number, durations: number[], gridStep: number): number[][][] {
  // Enumerating these is the expensive part, and it depends only on the bar
  // and the toolbar — not on the seed. Without this it was recomputed for
  // every one of up to six thousand attempts per brief.
  const cacheKey = `${barTicks}|${durations.join(",")}|${gridStep}`;
  const cached = rhythmCache.get(cacheKey);
  if (cached) return cached;
  const computed = buildBarRhythms(barTicks, durations, gridStep);
  rhythmCache.set(cacheKey, computed);
  return computed;
}

function buildBarRhythms(barTicks: number, durations: number[], gridStep: number): number[][][] {
  const usable = durations.filter((d) => d % gridStep === 0 && d <= barTicks).sort((a, b) => a - b);
  if (!usable.length) return [];
  const out: number[][][] = [];

  // Every rhythm the offered lengths can tile a bar with, shortest-first and
  // capped so a sixteenth-note tier does not explode combinatorially.
  const build = (prefix: number[][], at: number, depth: number) => {
    if (out.length >= 64 || depth > 16) return;
    if (at === barTicks) { out.push(prefix); return; }
    // A bar may also stop short, leaving a rest — "space for breath".
    if (at > 0 && at < barTicks && prefix.length >= 1) out.push(prefix);
    for (const d of usable) {
      if (at + d > barTicks) continue;
      build([...prefix, [at, d]], at + d, depth + 1);
    }
  };
  build([], 0, 0);
  return out.filter((r) => r.length > 0);
}

/** One attempt at a composition that meets the brief, within the given tools. */
function attempt(setup: Score, checks: Check[], freedom: Freedom, seed: number): Score | null {
  const rand = rng(seed);
  const pick = <T,>(xs: T[]): T => xs[Math.floor(rand() * xs.length) % xs.length];

  const barTicks = ticksPerBar(setup.meter);
  const beat = ticksPerBeat(setup.meter);
  const rhythms = barRhythms(barTicks, freedom.durations, freedom.gridStep);
  if (!rhythms.length) return null;

  // Exactly the pitches the editor puts on screen: the tonic at or above
  // middle C, then `rows` rungs upward. Nothing below the tonic is reachable.
  const tonicPc = ((keyPitchClass(setup.key) % 12) + 12) % 12;
  const tonic = 60 + tonicPc;
  const all = freedom.chromatic
    ? Array.from({ length: 37 }, (_, i) => tonic - 12 + i)
    : scalePitches(setup.key, setup.mode, tonic - 12, tonic + 24);
  const from = all.findIndex((p) => p >= tonic);
  const onScreen = all.slice(from, from + freedom.rows);
  // A chromatic tier shows every semitone, but "stays in the key" still means
  // the scale — a player picks the diatonic rows out of the ones on offer, so
  // the search does too.
  const ladder = onScreen.filter((p) => isDiatonic(p, setup.key, setup.mode));
  if (ladder.length < 2) return null;

  const wantsChords = checks.some(
    (c) => c.id === "chords-every-bar" || c.id === "authentic-cadence" || c.id === "melody-fits-chords"
  );
  const chords: ScoreChord[] = [];
  if (freedom.chords) {
    for (let b = 0; b < setup.bars; b++) {
      // The cadence needs V then I; everything before sits on the tonic.
      let degree = setup.bars >= 2 && b === setup.bars - 2 ? 5 : 1;
      if (!freedom.chordDegrees.includes(degree)) degree = freedom.chordDegrees[0] ?? 1;
      chords.push({
        start: b * barTicks,
        duration: barTicks,
        degree,
        quality: triadFor(degree, setup.key, setup.mode).quality,
      });
    }
  } else if (wantsChords) {
    // The exercise demands harmony the editor will not let this player write.
    return null;
  }

  const chordToneAt = (b: number) => {
    if (!chords[b]) return () => true;
    const tones = triadFor(chords[b].degree, setup.key, setup.mode).pitches.map((p) => ((p % 12) + 12) % 12);
    return (i: number) => tones.includes(((ladder[i] % 12) + 12) % 12);
  };

  // Compose to a note budget. "At least N notes" and "leave space for breath"
  // pull against each other, and picking rhythms blindly satisfies neither:
  // the search has to aim for bars full enough to reach N while still spending
  // one bar on a rest.
  const minNotes = checks.find((c) => c.id === "min-notes")?.value ?? 0;
  const needsRest = checks.some((c) => c.id === "uses-rests");
  const full = rhythms.filter((r) => r[r.length - 1][0] + r[r.length - 1][1] === barTicks);
  const gapped = rhythms.filter((r) => r[r.length - 1][0] + r[r.length - 1][1] < barTicks);
  const densest = [...(full.length ? full : rhythms)].sort((x, y) => y.length - x.length);
  // One bar carries the rest, chosen by seed so different attempts breathe in
  // different places.
  const restBar = needsRest && gapped.length ? Math.floor(rand() * setup.bars) % setup.bars : -1;

  const melody: ScoreNote[] = [];
  let idx = 0;
  let firstBarShape: number[] | null = null;
  let firstBarRhythm: number[][] | null = null;

  for (let b = 0; b < setup.bars; b++) {
    const barsLeft = setup.bars - b;
    const stillNeeded = minNotes - melody.length;
    const perBar = barsLeft > 0 ? Math.ceil(stillNeeded / barsLeft) : 0;
    const roomy = rhythms.filter((r) => r.length >= perBar);
    const pool = b === restBar
      ? gapped.filter((r) => r.length >= Math.min(perBar, Math.max(...gapped.map((g) => g.length))))
      : roomy.length
        ? roomy
        : densest;
    // Bar two restates bar one, so the motif check has something to find. It
    // reuses bar one's rhythm rather than the first enumerated one, which is
    // a single note followed by a rest and quietly spent the note budget.
    const rhythm: number[][] =
      b === 1 && firstBarRhythm ? firstBarRhythm : pick(pool.length ? pool : densest);
    const isChordTone = chordToneAt(b);
    const shape: number[] = [];

    for (let i = 0; i < rhythm.length; i++) {
      const [off] = rhythm[i];
      const abs = b * barTicks + off;
      const strong = abs % (beat * 2) === 0;

      if (b === 1 && firstBarShape && i < firstBarShape.length) {
        idx = firstBarShape[i];
      } else {
        const candidates: number[] = [];
        // The opening note has nowhere to step from: it should be allowed to
        // be the tonic itself, which is also what "starts on a chord tone"
        // most wants. Without this the search always stepped away first.
        for (const d of melody.length === 0 ? [0, 2, 4] : [-2, -1, 1, 2]) {
          const j = idx + d;
          if (j < 0 || j >= ladder.length) continue;
          if (strong && chords.length && !isChordTone(j)) continue;
          candidates.push(j);
        }
        const relaxed = (melody.length === 0 ? [0, 2, 4] : [-2, -1, 1, 2])
          .map((d) => idx + d)
          .filter((j) => j >= 0 && j < ladder.length);
        const from2 = candidates.length ? candidates : relaxed;
        if (!from2.length) return null;
        idx = pick(from2);
      }
      shape.push(idx);
      melody.push({ start: abs, duration: rhythm[i][1], pitch: ladder[idx] });
    }
    if (b === 0) {
      firstBarShape = shape;
      firstBarRhythm = rhythm;
    }
  }
  if (!melody.length) return null;

  // The ending is not negotiable: land on the tonic.
  const last = melody[melody.length - 1];
  let tonicIdx = -1;
  for (let j = 0; j < ladder.length; j++) {
    if (((ladder[j] % 12) + 12) % 12 === tonicPc) { tonicIdx = j; break; }
  }
  if (tonicIdx < 0) return null;
  last.pitch = ladder[tonicIdx];

  const score: Score = { ...setup, melody, chords };

  // "One clear high point": pull later copies of the peak down a rung, as a
  // composer would by ear.
  const a = analyze(score);
  if (a.highest !== null) {
    let seen = false;
    for (const n of melody) {
      if (n.pitch !== a.highest) continue;
      if (!seen) { seen = true; continue; }
      const below = ladder.filter((p) => p < n.pitch).pop();
      if (below !== undefined && n !== last) n.pitch = below;
    }
  }
  return score;
}

function solve(setup: Score, checks: Check[], freedom: Freedom): { score: Score; tries: number } | null {
  for (let seed = 1; seed <= 6000; seed++) {
    const s = attempt(setup, checks, freedom, seed);
    if (!s) continue;
    if (runChecks(s, checks).passed) return { score: s, tries: seed };
  }
  return null;
}

async function main() {
  // A full sweep of the generated trial space takes minutes; CD_BRIEF_SCOPE
  // limits a run to the handwritten briefs for a quick check.
  const scope = process.env.CD_BRIEF_SCOPE ?? "all";

/* --- run it over every brief in the game ---------------------------------- */

// Negative control. A checker that can only ever print OK proves nothing, and
// this file has no way to tell "satisfiable" from "my search is too weak"
// except by being shown a brief that genuinely cannot be met. Ending on the
// tonic while never using a note of the key is a contradiction in terms, so if
// the search claims to solve THIS, every OK below is worthless.
{
  const impossible = emptyScore({ key: "C", mode: "major", bars: 4 });
  const contradiction: Check[] = [
    { id: "ends-on-tonic" },
    { id: "range-limit", value: 0 },
    { id: "min-notes", value: 8 },
    { id: "single-climax" },
  ];
  if (solve(impossible, contradiction, freedomTier(5))) {
    console.log("FAIL - the negative control was 'solved'; this checker cannot detect an impossible brief");
    process.exit(1);
  }
  console.log("briefs: negative control rejected as expected");
}

let failures = 0;
let hardest = { slug: "", tries: 0 };

// Boss final blows.
const allBosses = [...bosses, ...(expansionBosses as any[]), ...(orchestralBosses as any[])];
console.log(`briefs: checking ${allBosses.length} boss final blows`);
for (const b of allBosses) {
  const brief = briefForBoss({ key: b.key, difficulty: (b as any).difficulty });
  const found = solve(brief.setup, brief.checks, freedomTier(brief.freedomCap));
  if (!found) {
    failures++;
    console.log(`  IMPOSSIBLE  boss "${b.key}"`);
    console.log(`              ${brief.checks.map((c) => c.id + (c.value !== undefined ? `=${c.value}` : "")).join(", ")}`);
    const probe = attempt(brief.setup, brief.checks, freedomTier(brief.freedomCap), 1);
    if (probe) {
      for (const r of runChecks(probe, brief.checks).results) {
        if (!r.passed) console.log(`              unmet on a sample run: ${r.label} — ${r.detail}`);
      }
    }
  } else if (found.tries > hardest.tries) {
    hardest = { slug: `boss "${b.key}"`, tries: found.tries };
  }
}

// Every boss must be covered by a hand-written brief, or its climax quietly
// falls back to a generic eight bars that has nothing to do with the fight.
for (const b of allBosses) {
  if (!BOSS_BRIEF_KEYS.includes(b.key)) {
    failures++;
    console.log(`  NO BRIEF    boss "${b.key}" falls back to the generic default`);
  }
}

const lessons = [...beginnerLessons, ...curriculumLessons, ...advancedLessons, ...orchestralLessons];

console.log(`briefs: checking ${lessons.length} lesson composition exercises`);
for (const l of lessons) {
  const brief = briefForLesson({ slug: l.slug, difficulty: l.difficulty, category: l.category });
  const found = solve(brief.setup, brief.checks, freedomTier(brief.freedomCap));
  if (!found) {
    failures++;
    console.log(`  IMPOSSIBLE  ${l.slug}`);
    console.log(`              ${brief.checks.map((c) => c.id + (c.value !== undefined ? `=${c.value}` : "")).join(", ")}`);
    const probe = attempt(brief.setup, brief.checks, freedomTier(brief.freedomCap), 1);
    if (probe) {
      for (const r of runChecks(probe, brief.checks).results) {
        if (!r.passed) console.log(`              unmet on a sample run: ${r.label} — ${r.detail}`);
      }
    }
  } else if (found.tries > hardest.tries) {
    hardest = { slug: l.slug, tries: found.tries };
  }
}

// Dungeon trials live in the database once seeded, and the generator fills in
// key, meter and length there — reading them back is the only way to check the
// briefs players actually meet rather than the handwritten subset.
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? "file:/tmp/play.db" } } });
let trials: any[] = [];
try {
  trials = await db.challenge.findMany({
    select: { id: true, title: true, type: true, difficulty: true, keySig: true, meter: true, lengthBars: true, instrument: true, skillKey: true },
  });
} catch {
  console.log("briefs: no seeded database to read dungeon trials from — skipping");
}
console.log(`briefs: checking ${trials.length} dungeon trials`);
const seenShape = new Set<string>();
for (const c of trials) {
  // Briefs depend only on these fields, so one representative per distinct
  // shape proves the whole class without re-searching hundreds of duplicates.
  const shape = [c.difficulty, c.keySig, c.meter, c.lengthBars, c.instrument, c.skillKey].join("|");
  if (seenShape.has(shape)) continue;
  seenShape.add(shape);
  const brief = briefForChallenge(c);
  const found = solve(brief.setup, brief.checks, freedomTier(brief.freedomCap));
  if (!found) {
    failures++;
    console.log(`  IMPOSSIBLE  trial "${c.title}" (${c.type}, difficulty ${c.difficulty}, ${c.keySig ?? "no key"}, ${c.meter ?? "no meter"}, ${c.lengthBars ?? "?"} bars)`);
    console.log(`              ${brief.checks.map((k) => k.id + (k.value !== undefined ? `=${k.value}` : "")).join(", ")}`);
    const probe = attempt(brief.setup, brief.checks, freedomTier(brief.freedomCap), 1);
    if (probe) {
      for (const r of runChecks(probe, brief.checks).results) {
        if (!r.passed) console.log(`              unmet on a sample run: ${r.label} — ${r.detail}`);
      }
    }
  } else if (found.tries > hardest.tries) {
    hardest = { slug: `trial "${c.title}"`, tries: found.tries };
  }
}
console.log(`briefs: ${seenShape.size} distinct trial shapes among ${trials.length} trials`);

// Most trials a player meets are generated at the moment they enter the room,
// combining any legal key, meter, length and skill for that difficulty. The
// seeded rows are a sample of that space, not the whole of it, so walk the
// generator's own component table and check every combination it can produce.
if (scope === "all") {
const keys = challengeComponents.filter((c) => c.type === "KEY");
const meters = challengeComponents.filter((c) => c.type === "METER");
const lengths = challengeComponents.filter((c) => c.type === "LENGTH");
const skills: (string | null)[] = [null];
for (const c of challengeComponents) {
  if (c.skillKey && !skills.includes(c.skillKey)) skills.push(c.skillKey);
}
let combos = 0;
for (let difficulty = 1; difficulty <= 10; difficulty++) {
  const ok = <T extends { minDifficulty: number; maxDifficulty: number }>(c: T) =>
    difficulty >= c.minDifficulty && difficulty <= c.maxDifficulty;
  for (const k of keys.filter(ok)) {
    for (const m of meters.filter(ok)) {
      for (const l of lengths.filter(ok)) {
        for (const skillKey of skills) {
          combos++;
          const c = {
            difficulty,
            keySig: k.value,
            meter: m.value,
            lengthBars: Number(l.value),
            skillKey: skillKey as string | null,
          };
          const brief = briefForChallenge(c);
          const found = solve(brief.setup, brief.checks, freedomTier(brief.freedomCap));
          if (!found) {
            failures++;
            console.log(`  IMPOSSIBLE  generated trial: difficulty ${difficulty}, ${k.value}, ${m.value}, ${l.value} bars, skill ${skillKey ?? "none"}`);
            console.log(`              ${brief.checks.map((x) => x.id + (x.value !== undefined ? `=${x.value}` : "")).join(", ")}`);
            const probe = attempt(brief.setup, brief.checks, freedomTier(brief.freedomCap), 1);
            if (probe) {
              for (const r of runChecks(probe, brief.checks).results) {
                if (!r.passed) console.log(`              unmet on a sample run: ${r.label} — ${r.detail}`);
              }
            }
          } else if (found.tries > hardest.tries) {
            hardest = { slug: `generated d${difficulty} ${k.value} ${m.value} ${l.value}bar`, tries: found.tries };
          }
        }
      }
    }
  }
}
console.log(`briefs: checked ${combos} generated trial combinations`);
} else {
  console.log("briefs: generated trial sweep skipped (CD_BRIEF_SCOPE set)");
}
await db.$disconnect();

if (failures) {
  console.log(`\nFAIL - ${failures} brief(s) could not be satisfied by any composition`);
  process.exit(1);
}
console.log(`briefs: hardest to satisfy was ${hardest.slug} (${hardest.tries} attempts)`);
console.log("OK - every composition exercise is completable");
}

main();
