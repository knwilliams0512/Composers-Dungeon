/**
 * Holds the lesson→drill mapping to the two rules that make it safe.
 *
 *   npx tsx scripts/check-practice.ts
 *
 * The point of sending a lesson to a drill is that the Academy never asks you
 * to recognise anything by ear, and the Proving Grounds — which does — is
 * somewhere a learner has no reason to visit at the right moment.
 *
 * The danger is the opposite failure. These drills do not start easy: at
 * streak 0, INTERVAL_EAR already offers "Tritone" and "Major 7th" among its
 * choices, and SCALE_MODE asks Dorian against Phrygian. Offering that to
 * someone four lessons in would make their first taste of ear training a
 * failure, which is a worse outcome than a dull worksheet. So the gate is
 * checked here rather than trusted.
 */
import { DRILL_KEYS, DRILLS, generateQuestion, type DrillKey } from "../src/lib/drills";
import { DRILL_INTRODUCED_BY, LESSON_PRACTICE } from "../src/lib/lesson-practice";
import { CRAFT_SLUGS, curriculumSlugs } from "../src/lib/curriculum";
import { beginnerLessons } from "../prisma/seed-data/lessons-beginner";
import { advancedLessons } from "../prisma/seed-data/lessons-advanced";
import { curriculumLessons } from "../prisma/seed-data/lessons-curriculum";
import { orchestralLessons } from "../prisma/seed-data/lessons-orchestral";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);

const lessons = [...beginnerLessons, ...advancedLessons, ...curriculumLessons, ...orchestralLessons];
const slugs = lessons.map((l) => l.slug);

/* -------------------------------------------------------------------------- */
/* Rule 2: every lesson is accounted for                                      */
/* -------------------------------------------------------------------------- */

for (const slug of slugs) {
  const entry = LESSON_PRACTICE[slug];
  if (!entry) {
    fail(`lesson "${slug}" is missing from LESSON_PRACTICE — every lesson must be decided, even if the decision is none`);
    continue;
  }
  if (entry.drills.length === 0 && !entry.noDrill) {
    fail(`lesson "${slug}" offers no drill and gives no reason; an empty list must be a stated judgement, not a gap`);
  }
  if (entry.drills.length > 0 && entry.noDrill) {
    fail(`lesson "${slug}" both offers drills and explains why it offers none`);
  }
  for (const d of entry.drills) {
    if (!DRILL_KEYS.includes(d)) fail(`lesson "${slug}" names drill "${d}", which does not exist`);
  }
  if (new Set(entry.drills).size !== entry.drills.length)
    fail(`lesson "${slug}" lists the same drill twice`);
}

// And nothing in the table that is not a lesson, which would be a typo that
// silently does nothing.
for (const slug of Object.keys(LESSON_PRACTICE)) {
  if (!slugs.includes(slug)) fail(`LESSON_PRACTICE has an entry for "${slug}", which is not a lesson`);
}

/* -------------------------------------------------------------------------- */
/* Rule 1: no lesson offers a drill it has not taught                         */
/* -------------------------------------------------------------------------- */

// Teaching order, which is the roadmap's order rather than any file's order.
const order = curriculumSlugs();
const position = new Map<string, number>();
order.forEach((s, i) => position.set(s, i));

// Four lessons sit outside the roadmap on purpose: CRAFT_SLUGS are taught
// alongside the theory rather than at a fixed point in it. They cannot be given
// a position, so they are treated as sitting after the whole roadmap — which is
// safe, since a craft lesson assumes the fundamentals rather than preceding
// them. The assumption is only safe while that set is exactly the unpositioned
// lessons, so any OTHER lesson missing from the roadmap still fails here.
for (const slug of slugs) {
  if (position.has(slug)) continue;
  if ((CRAFT_SLUGS as readonly string[]).includes(slug)) {
    position.set(slug, order.length); // after everything
    continue;
  }
  if ((LESSON_PRACTICE[slug]?.drills.length ?? 0) > 0) {
    fail(
      `lesson "${slug}" offers drills but is neither in the roadmap nor a craft lesson, ` +
        `so there is no way to tell whether its drills are premature`
    );
  }
}

for (const [drill, introducedBy] of Object.entries(DRILL_INTRODUCED_BY) as [DrillKey, string | null][]) {
  if (introducedBy === null) continue;
  if (!position.has(introducedBy)) {
    fail(`drill ${drill} says it is introduced by "${introducedBy}", which is not in the roadmap`);
    continue;
  }
  const gate = position.get(introducedBy)!;
  for (const slug of slugs) {
    const entry = LESSON_PRACTICE[slug];
    if (!entry?.drills.includes(drill)) continue;
    const at = position.get(slug);
    if (at === undefined) continue; // already reported above
    if (at < gate) {
      fail(
        `lesson "${slug}" offers ${drill}, but that vocabulary is not taught until "${introducedBy}" ` +
          `(${at} vs ${gate} in teaching order) — a learner would be guessing`
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/* The drills themselves must be answerable                                   */
/* -------------------------------------------------------------------------- */
// Cheap to check and the whole feature rests on it: a drill that generates a
// question with no correct choice, or two identical choices, turns a lesson's
// practice step into a coin toss.
{
  let seed = 20261018;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const offered = new Set<DrillKey>();
  for (const entry of Object.values(LESSON_PRACTICE)) for (const d of entry.drills) offered.add(d);

  for (const drill of Array.from(offered)) {
    for (const streak of [0, 3, 8, 15]) {
      for (let i = 0; i < 40; i++) {
        const q = generateQuestion(drill, streak, rnd);
        if (DRILLS[drill].mode === "TAP") {
          if (!q.rhythm || q.rhythm.length < 2)
            fail(`${drill} generated a tap question with no rhythm to echo`);
          continue;
        }
        if (q.choices.length < 2) fail(`${drill} generated a question with fewer than two choices`);
        if (!q.choices.includes(q.answer))
          fail(`${drill} generated a question whose answer "${q.answer}" is not among its choices`);
        if (new Set(q.choices).size !== q.choices.length)
          fail(`${drill} generated a question with a repeated choice: [${q.choices.join(" | ")}]`);
        if (!q.note || q.note.trim().length === 0)
          fail(`${drill} generated a question with no explanation, so the drill teaches nothing`);
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Enough lessons actually get one                                            */
/* -------------------------------------------------------------------------- */
// Without this the table could honestly explain its way to offering nothing
// anywhere, which would pass every rule above and change nothing for anyone.
const withDrills = slugs.filter((s) => (LESSON_PRACTICE[s]?.drills.length ?? 0) > 0);
const WANT_AT_LEAST = 20;
if (withDrills.length < WANT_AT_LEAST)
  fail(
    `only ${withDrills.length} of ${slugs.length} lessons offer a drill; at least ${WANT_AT_LEAST} should, ` +
      `or this feature is a table nobody meets`
  );

// Every drill should be reachable from some lesson, or it stays orphaned in
// the Proving Grounds, which is the problem this set out to fix.
for (const d of DRILL_KEYS) {
  if (!withDrills.some((s) => LESSON_PRACTICE[s].drills.includes(d)))
    fail(`drill ${d} is offered by no lesson, so nothing in the Academy leads to it`);
}

console.log(
  `practice: ${slugs.length} lessons mapped, ${withDrills.length} offering a drill, ` +
    `${DRILL_KEYS.length} drills all reachable and gated behind the lesson that teaches them`
);
if (problems.length === 0) console.log("OK - no lesson sends a learner to a drill it has not taught");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
