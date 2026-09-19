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
import { briefForChallenge } from "../src/lib/challenge-brief";
import { beginnerLessons } from "../prisma/seed-data/lessons-beginner";
import { advancedLessons } from "../prisma/seed-data/lessons-advanced";
import { curriculumLessons } from "../prisma/seed-data/lessons-curriculum";
import { PrismaClient } from "@prisma/client";
import { challengeComponents } from "../prisma/seed-data/world";

/* --- a tiny seeded RNG, so a failure reported here reproduces exactly ------ */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Rhythms for one bar, as (offset, duration) pairs. Several leave a gap so
 * "leaves space for breath" can pass, and the mix of lengths covers
 * "at least N different note lengths".
 */
function barRhythms(barTicks: number, beat: number): number[][][] {
  const q = beat;
  const e = Math.max(1, Math.floor(beat / 2));
  const out: number[][][] = [];

  // All quarters, full bar.
  const even: number[][] = [];
  for (let t = 0; t + q <= barTicks; t += q) even.push([t, q]);
  if (even.length) out.push(even);

  // Quarters with the last beat shortened, leaving a rest at the bar's end.
  if (even.length > 1) {
    const breathing = even.map(([t, d], i) => (i === even.length - 1 ? [t, e] : [t, d]));
    out.push(breathing);
  }

  // Long note first, then movement — gives a third distinct duration.
  if (barTicks >= q * 2) {
    const longFirst: number[][] = [[0, q * 2]];
    for (let t = q * 2; t + q <= barTicks; t += q) longFirst.push([t, q]);
    out.push(longFirst);
  }

  // Quarters broken into eighths in the second half.
  if (even.length >= 2) {
    const mixed: number[][] = [];
    const half = Math.floor(even.length / 2);
    even.forEach(([t, d], i) => {
      if (i < half) mixed.push([t, d]);
      else {
        mixed.push([t, e]);
        if (t + e + e <= barTicks) mixed.push([t + e, e]);
      }
    });
    out.push(mixed);
  }
  return out.filter((r) => r.length > 0);
}

/** One attempt at a composition that meets the brief. */
function attempt(setup: Score, checks: Check[], seed: number): Score | null {
  const rand = rng(seed);
  const pick = <T,>(xs: T[]): T => xs[Math.floor(rand() * xs.length) % xs.length];

  const barTicks = ticksPerBar(setup.meter);
  const beat = ticksPerBeat(setup.meter);
  const rhythms = barRhythms(barTicks, beat);
  if (!rhythms.length) return null;

  // The diatonic ladder the melody walks, centred near the middle of the staff.
  const tonicPc = ((keyPitchClass(setup.key) % 12) + 12) % 12;
  const ladder = scalePitches(setup.key, setup.mode, 55, 84);
  const startIdx = ladder.findIndex((p) => p >= 60 && p % 12 === tonicPc);
  if (startIdx < 0) return null;

  // Harmony: tonic throughout, with a V–I close. This satisfies both
  // "every bar is harmonised" and "ends with a V–I cadence".
  const chords: ScoreChord[] = [];
  for (let b = 0; b < setup.bars; b++) {
    const degree = setup.bars >= 2 && b === setup.bars - 2 ? 5 : 1;
    chords.push({ start: b * barTicks, duration: barTicks, degree, quality: triadFor(degree, setup.key, setup.mode).quality });
  }

  const chordToneIdx = (b: number) => {
    const degree = chords[b].degree;
    const tones = triadFor(degree, setup.key, setup.mode).pitches.map((p) => ((p % 12) + 12) % 12);
    return (i: number) => tones.includes(((ladder[i] % 12) + 12) % 12);
  };

  // Walk the ladder bar by bar, stepping by one or two rungs and steering
  // strong beats onto chord tones.
  const melody: ScoreNote[] = [];
  let idx = startIdx;
  const motifBar = rhythms.indexOf(rhythms[0]);
  let firstBarShape: number[] | null = null;

  for (let b = 0; b < setup.bars; b++) {
    const rhythm = b === 1 && firstBarShape ? rhythms[motifBar] : pick(rhythms);
    const isChordTone = chordToneIdx(b);
    const shape: number[] = [];

    for (let i = 0; i < rhythm.length; i++) {
      const [off] = rhythm[i];
      const abs = b * barTicks + off;
      const strong = abs % (beat * 2) === 0;

      if (b === 1 && firstBarShape && i < firstBarShape.length) {
        // Bring the opening figure back, so "a recognisable idea comes back"
        // has something to find.
        idx = firstBarShape[i];
      } else {
        const candidates: number[] = [];
        for (const d of [-2, -1, 1, 2, 0]) {
          const j = idx + d;
          if (j < 0 || j >= ladder.length) continue;
          if (d === 0 && melody.length) continue;
          if (strong && !isChordTone(j)) continue;
          candidates.push(j);
        }
        if (!candidates.length) {
          const relaxed = [-2, -1, 1, 2].map((d) => idx + d).filter((j) => j >= 0 && j < ladder.length);
          if (!relaxed.length) return null;
          idx = pick(relaxed);
        } else {
          idx = pick(candidates);
        }
      }
      shape.push(idx);
      melody.push({ start: abs, duration: rhythm[i][1], pitch: ladder[idx] });
    }
    if (b === 0) firstBarShape = shape;
  }

  // Land the final note on the tonic — the ending is not negotiable.
  const last = melody[melody.length - 1];
  let tonicIdx = -1;
  for (let j = 0; j < ladder.length; j++) {
    if (((ladder[j] % 12) + 12) % 12 === tonicPc) {
      if (tonicIdx < 0 || Math.abs(ladder[j] - last.pitch) < Math.abs(ladder[tonicIdx] - last.pitch)) tonicIdx = j;
    }
  }
  if (tonicIdx < 0) return null;
  last.pitch = ladder[tonicIdx];

  const score: Score = { ...setup, melody, chords };

  // "One clear high point": if the peak is struck more than once, pull the
  // later copies down a step. A composer would do the same by ear.
  const a = analyze(score);
  if (a.highest !== null) {
    let seenPeak = false;
    for (const n of melody) {
      if (n.pitch !== a.highest) continue;
      if (!seenPeak) { seenPeak = true; continue; }
      const below = ladder.filter((p) => p < n.pitch).pop();
      if (below !== undefined && n !== last) n.pitch = below;
    }
  }
  return score;
}

function solve(setup: Score, checks: Check[]): { score: Score; tries: number } | null {
  for (let seed = 1; seed <= 6000; seed++) {
    const s = attempt(setup, checks, seed);
    if (!s) continue;
    if (runChecks(s, checks).passed) return { score: s, tries: seed };
  }
  return null;
}

async function main() {
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
  if (solve(impossible, contradiction)) {
    console.log("FAIL - the negative control was 'solved'; this checker cannot detect an impossible brief");
    process.exit(1);
  }
  console.log("briefs: negative control rejected as expected");
}

const lessons = [...beginnerLessons, ...curriculumLessons, ...advancedLessons];
let failures = 0;
let hardest = { slug: "", tries: 0 };

console.log(`briefs: checking ${lessons.length} lesson composition exercises`);
for (const l of lessons) {
  const brief = briefForLesson({ slug: l.slug, difficulty: l.difficulty, category: l.category });
  const found = solve(brief.setup, brief.checks);
  if (!found) {
    failures++;
    console.log(`  IMPOSSIBLE  ${l.slug}`);
    console.log(`              ${brief.checks.map((c) => c.id + (c.value !== undefined ? `=${c.value}` : "")).join(", ")}`);
    const probe = attempt(brief.setup, brief.checks, 1);
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
  const found = solve(brief.setup, brief.checks);
  if (!found) {
    failures++;
    console.log(`  IMPOSSIBLE  trial "${c.title}" (${c.type}, difficulty ${c.difficulty}, ${c.keySig ?? "no key"}, ${c.meter ?? "no meter"}, ${c.lengthBars ?? "?"} bars)`);
    console.log(`              ${brief.checks.map((k) => k.id + (k.value !== undefined ? `=${k.value}` : "")).join(", ")}`);
    const probe = attempt(brief.setup, brief.checks, 1);
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
          const found = solve(brief.setup, brief.checks);
          if (!found) {
            failures++;
            console.log(`  IMPOSSIBLE  generated trial: difficulty ${difficulty}, ${k.value}, ${m.value}, ${l.value} bars, skill ${skillKey ?? "none"}`);
            console.log(`              ${brief.checks.map((x) => x.id + (x.value !== undefined ? `=${x.value}` : "")).join(", ")}`);
            const probe = attempt(brief.setup, brief.checks, 1);
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
await db.$disconnect();

if (failures) {
  console.log(`\nFAIL - ${failures} brief(s) could not be satisfied by any composition`);
  process.exit(1);
}
console.log(`briefs: hardest to satisfy was ${hardest.slug} (${hardest.tries} attempts)`);
console.log("OK - every composition exercise is completable");
}

main();
