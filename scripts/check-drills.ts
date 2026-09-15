/**
 * Drill integrity check.
 *
 * A drill that teaches the wrong answer is worse than no drill, and a drill
 * whose right answer is missing from its own choices is unwinnable — neither
 * shows up as an error, and neither is findable by reading, because the
 * questions are generated. So this generates thousands of them and checks each
 * one against music theory derived here independently of src/lib/drills.ts.
 *
 *   npx tsx scripts/check-drills.ts
 */
import {
  DRILL_KEYS, DRILLS, generateQuestion, pointsFor, rhythmMatches, xpForRound,
  INTERVAL_NAMES, type DrillKey,
} from "../src/lib/drills";
import { SKILL_KEYS } from "../src/lib/enums";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);
const seen = (k: string, s: Set<string>) => s.add(k);

// Independent derivations. Deliberately written out by hand rather than
// imported, so agreement means something.
const SEMI_TO_INTERVAL: Record<number, string> = {
  1: "Minor 2nd", 2: "Major 2nd", 3: "Minor 3rd", 4: "Major 3rd", 5: "Perfect 4th",
  6: "Tritone", 7: "Perfect 5th", 8: "Minor 6th", 9: "Major 6th", 10: "Minor 7th",
  11: "Major 7th", 12: "Octave",
};
const CHORD_BY_SHAPE: Record<string, string> = {
  "4,7": "Major", "3,7": "Minor", "3,6": "Diminished", "4,8": "Augmented",
  "4,7,10": "Dominant 7th", "4,7,11": "Major 7th", "3,7,10": "Minor 7th",
  "3,6,10": "Half-diminished 7th", "3,6,9": "Diminished 7th",
};
const MODE_BY_STEPS: Record<string, string> = {
  "2,2,1,2,2,2,1": "Ionian (major)",
  "2,1,2,2,2,1,2": "Dorian",
  "1,2,2,2,1,2,2": "Phrygian",
  "2,2,2,1,2,2,1": "Lydian",
  "2,2,1,2,2,1,2": "Mixolydian",
  "2,1,2,2,1,2,2": "Aeolian (natural minor)",
  "1,2,2,1,2,2,2": "Locrian",
  "2,1,2,2,1,3,1": "Harmonic minor",
};
// Sharps count -> major key, written from the circle of fifths by hand.
const MAJOR_BY_COUNT: Record<number, string> = {
  0: "C major", 1: "G major", 2: "D major", 3: "A major", 4: "E major",
  5: "B major", 6: "F♯ major", 7: "C♯ major", [-1]: "F major", [-2]: "B♭ major",
  [-3]: "E♭ major", [-4]: "A♭ major", [-5]: "D♭ major", [-6]: "G♭ major", [-7]: "C♭ major",
};
const MINOR_BY_COUNT: Record<number, string> = {
  0: "A minor", 1: "E minor", 2: "B minor", 3: "F♯ minor", 4: "C♯ minor",
  5: "G♯ minor", 6: "D♯ minor", 7: "A♯ minor", [-1]: "D minor", [-2]: "G minor",
  [-3]: "C minor", [-4]: "F minor", [-5]: "B♭ minor", [-6]: "E♭ minor", [-7]: "A♭ minor",
};
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];

const coverage = new Map<DrillKey, Set<string>>();
for (const k of DRILL_KEYS) coverage.set(k, new Set());

const ROUNDS = 4000;
for (const drill of DRILL_KEYS) {
  const cover = coverage.get(drill)!;
  for (let i = 0; i < ROUNDS; i++) {
    const streak = i % 20;
    const q = generateQuestion(drill, streak);

    // Universal invariants.
    if (q.drill !== drill) fail(`${drill}: question reports drill "${q.drill}"`);
    if (!q.answer) fail(`${drill}: question has no answer`);
    if (!q.note) fail(`${drill}: question has no explanation`);
    if (drill !== "RHYTHM_ECHO") {
      if (q.choices.length < 3) fail(`${drill}: only ${q.choices.length} choices`);
      if (!q.choices.includes(q.answer))
        fail(`${drill}: the answer "${q.answer}" is not among its own choices — unwinnable`);
      if (new Set(q.choices).size !== q.choices.length)
        fail(`${drill}: choices repeat (${q.choices.join(", ")})`);
    }
    seen(q.answer, cover);

    // Per-drill: does the answer match the thing actually presented?
    if (drill === "INTERVAL_EAR") {
      const ps = q.audio!.notes.map((n) => n.pitch);
      const semis = Math.abs(ps[1] - ps[0]);
      if (SEMI_TO_INTERVAL[semis] !== q.answer)
        fail(`INTERVAL_EAR: played ${semis} semitones but answers "${q.answer}"`);
      if (ps.some((p) => p < 21 || p > 108)) fail(`INTERVAL_EAR: pitch outside the piano (${ps})`);
    }
    if (drill === "CHORD_QUALITY") {
      const ps = q.audio!.notes.map((n) => n.pitch).sort((a, b) => a - b);
      const shape = ps.slice(1).map((p) => p - ps[0]).join(",");
      if (CHORD_BY_SHAPE[shape] !== q.answer)
        fail(`CHORD_QUALITY: shape [${shape}] is ${CHORD_BY_SHAPE[shape] ?? "unknown"}, answered "${q.answer}"`);
      if (q.audio!.notes.some((n) => n.at !== 0)) fail("CHORD_QUALITY: notes must sound together");
    }
    if (drill === "SCALE_MODE") {
      const ps = q.audio!.notes.map((n) => n.pitch);
      const steps = ps.slice(1).map((p, j) => p - ps[j]).join(",");
      if (MODE_BY_STEPS[steps] !== q.answer)
        fail(`SCALE_MODE: steps [${steps}] are ${MODE_BY_STEPS[steps] ?? "unknown"}, answered "${q.answer}"`);
      if (ps[ps.length - 1] - ps[0] !== 12) fail("SCALE_MODE: scale does not span an octave");
      for (let j = 1; j < ps.length; j++)
        if (q.audio!.notes[j].at <= q.audio!.notes[j - 1].at) fail("SCALE_MODE: notes not in order");
    }
    if (drill === "STAFF_READ") {
      const { clef, step } = q.staff!;
      const bottom = clef === "treble" ? "E" : "G";
      const expected = LETTERS[(((LETTERS.indexOf(bottom) + step) % 7) + 7) % 7];
      if (expected !== q.answer)
        fail(`STAFF_READ: ${clef} step ${step} is ${expected}, answered "${q.answer}"`);
      if (step < -6 || step > 14) fail(`STAFF_READ: step ${step} is far off the staff`);
    }
    if (drill === "KEY_SIGNATURE") {
      const c = q.signature!.count;
      if (Math.abs(c) > 7) fail(`KEY_SIGNATURE: ${c} accidentals is more than a signature holds`);
      const isMinor = q.answer.includes("minor");
      const expected = isMinor ? MINOR_BY_COUNT[c] : MAJOR_BY_COUNT[c];
      if (expected !== q.answer)
        fail(`KEY_SIGNATURE: ${c} accidentals is ${expected}, answered "${q.answer}"`);
      // Every choice must be the same mode, or the question is ambiguous.
      const modes = new Set(q.choices.map((ch) => (ch.includes("minor") ? "minor" : "major")));
      if (modes.size !== 1) fail(`KEY_SIGNATURE: choices mix major and minor — ambiguous`);
    }
    if (drill === "RHYTHM_ECHO") {
      const r = q.rhythm!;
      if (r[0] !== 0) fail("RHYTHM_ECHO: does not start on beat 1");
      if (r.length < 2) fail("RHYTHM_ECHO: fewer than two strikes");
      for (let j = 1; j < r.length; j++)
        if (r[j] <= r[j - 1]) fail(`RHYTHM_ECHO: onsets out of order (${r.join(",")})`);
      if (r.some((x) => x < 0 || x >= 4)) fail(`RHYTHM_ECHO: onset outside the bar (${r.join(",")})`);
      if (q.audio!.notes.length !== r.length) fail("RHYTHM_ECHO: audio does not match the rhythm");
      // The tolerance must accept an exact echo and reject a wrong count.
      if (!rhythmMatches(r, r)) fail("RHYTHM_ECHO: an exact echo is judged wrong");
      if (rhythmMatches(r, r.slice(1))) fail("RHYTHM_ECHO: a short echo is judged right");
    }
  }
}

// Every answer a drill can give should actually turn up, or part of the drill
// is unreachable and a player can never be tested on it.
const EXPECTED_COVERAGE: Record<DrillKey, number> = {
  INTERVAL_EAR: 12, CHORD_QUALITY: 9, SCALE_MODE: 8,
  STAFF_READ: 7, KEY_SIGNATURE: 30, RHYTHM_ECHO: 2,
};
for (const [drill, set] of Array.from(coverage.entries())) {
  const want = EXPECTED_COVERAGE[drill];
  if (drill === "RHYTHM_ECHO") {
    if (set.size < 8) fail(`RHYTHM_ECHO: only ${set.size} distinct rhythms in ${ROUNDS} draws`);
    continue;
  }
  if (set.size < want) fail(`${drill}: only ${set.size} of ${want} possible answers ever came up`);
}

// A drill that trains a skill the game does not have awards its XP into
// nothing, and shows the raw key where a label should be.
for (const key of DRILL_KEYS) {
  const d = DRILLS[key];
  if (!(SKILL_KEYS as readonly string[]).includes(d.skill))
    fail(`${key}: trains "${d.skill}", which is not one of the game's skills`);
  if (d.seconds < 20 || d.seconds > 300) fail(`${key}: a ${d.seconds}s round`);
  if (!d.name || !d.blurb || !d.prompt) fail(`${key}: missing name, blurb or prompt`);
}

// Scoring.
if (pointsFor(0) !== 10) fail(`pointsFor(0) = ${pointsFor(0)}, expected 10`);
if (pointsFor(100) !== 50) fail(`the combo multiplier does not cap at 5x (got ${pointsFor(100) / 10}x)`);
for (let c = 0; c < 60; c++) {
  if (pointsFor(c) < pointsFor(Math.max(0, c - 1))) fail(`points fall as the combo rises, at ${c}`);
  if (!Number.isFinite(pointsFor(c))) fail(`pointsFor(${c}) is not a number`);
}
if (xpForRound({ score: 0, correct: 0, total: 0, bestCombo: 0 }) !== 0)
  fail("an empty round awards XP");
const good = xpForRound({ score: 500, correct: 40, total: 40, bestCombo: 40 });
const poor = xpForRound({ score: 100, correct: 10, total: 40, bestCombo: 3 });
if (!(good > poor)) fail(`a strong round (${good}) does not out-earn a weak one (${poor})`);

const total = DRILL_KEYS.length * ROUNDS;
console.log(`drills: ${total.toLocaleString()} generated questions checked across ${DRILL_KEYS.length} drills`);
for (const [drill, set] of Array.from(coverage.entries())) console.log(`  ${drill.padEnd(14)} ${set.size} distinct answers seen`);
if (problems.length === 0) console.log("OK - every question has exactly one correct answer");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  Array.from(new Set(problems)).slice(0, 20).forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
