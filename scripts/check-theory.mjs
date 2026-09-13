/**
 * Music-theory verifier.
 *
 * Reading prose for wrong intervals does not work: the eye agrees with what it
 * expects. This computes the answers from first principles — letter names and
 * accidentals to semitones and back — and compares them against what the app
 * claims. Anything it can derive, it derives.
 *
 *   node scripts/check-theory.mjs
 */

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Semitone value of a spelled note, e.g. "Bbb" -> 9, "F#" -> 6. */
function pc(name) {
  const m = /^([A-G])(b*|#*|♭*|♯*)$/.exec(name.trim());
  if (!m) throw new Error(`unspellable: ${name}`);
  const acc = m[2].replace(/♭/g, "b").replace(/♯/g, "#");
  const delta = acc.startsWith("b") ? -acc.length : acc.length ? acc.length : 0;
  return (((BASE[m[1]] + delta) % 12) + 12) % 12;
}
function letterIndex(name) { return LETTERS.indexOf(name.trim()[0]); }

/** Interval between two spelled notes as {number, semitones, quality}. */
function interval(a, b) {
  const li = ((letterIndex(b) - letterIndex(a)) % 7 + 7) % 7;
  const number = li + 1;
  const semis = ((pc(b) - pc(a)) % 12 + 12) % 12;
  // Perfect-family sizes for unison, 4th, 5th; major sizes for the rest.
  const PERFECT = { 1: 0, 4: 5, 5: 7 };
  const MAJOR = { 2: 2, 3: 4, 6: 9, 7: 11 };
  let quality;
  if (PERFECT[number] !== undefined) {
    const d = ((semis - PERFECT[number] + 6) % 12) - 6;
    quality = d === 0 ? "P" : d === 1 ? "A" : d === -1 ? "d" : d > 0 ? `A${d}` : `d${-d}`;
  } else {
    const d = ((semis - MAJOR[number] + 6) % 12) - 6;
    quality = d === 0 ? "M" : d === -1 ? "m" : d === 1 ? "A" : d === -2 ? "d" : d > 0 ? `A${d}` : `d${-d}`;
  }
  return { number, semitones: semis, quality, name: `${quality}${number}` };
}

/** Spell a scale from a tonic using a semitone step pattern (7 steps). */
function spellScale(tonic, steps) {
  const out = [tonic];
  let li = letterIndex(tonic), acc = pc(tonic);
  for (const step of steps.slice(0, 6)) {
    li = (li + 1) % 7;
    acc = (acc + step) % 12;
    const natural = BASE[LETTERS[li]];
    let d = ((acc - natural + 6) % 12) - 6;
    out.push(LETTERS[li] + (d > 0 ? "#".repeat(d) : d < 0 ? "b".repeat(-d) : ""));
  }
  return out;
}

const W = 2, H = 1;
const MAJOR_STEPS = [W, W, H, W, W, W, H];
const NAT_MINOR = [W, H, W, W, H, W, W];
const HARM_MINOR = [W, H, W, W, H, 3, H];
const problems = [];
const ok = (cond, msg) => { if (!cond) problems.push(msg); };

// --- Claims the app makes, checked against computation --------------------

// 1. Major scale pattern produces the expected letters with no repeats.
for (const tonic of ["C","G","D","A","E","B","F#","C#","F","Bb","Eb","Ab","Db","Gb","Cb"]) {
  const sc = spellScale(tonic, MAJOR_STEPS);
  const letters = sc.map((n) => n[0]);
  ok(new Set(letters).size === 7, `${tonic} major reuses a letter: ${sc.join(" ")}`);
  ok(sc.length === 7, `${tonic} major has ${sc.length} notes`);
}

// 2. The app's own circle-of-fifths claims.
const SHARP_ORDER = ["F#","C#","G#","D#","A#","E#","B#"];
const FLAT_ORDER  = ["Bb","Eb","Ab","Db","Gb","Cb","Fb"];
for (let i = 0; i < 7; i++) {
  const a = SHARP_ORDER[i], b = SHARP_ORDER[(i + 1) % 7];
  if (i < 6) ok(interval(a, b).name === "P5", `sharp order ${a}->${b} is ${interval(a,b).name}, expected P5`);
  const c = FLAT_ORDER[i], d = FLAT_ORDER[(i + 1) % 7];
  if (i < 6) ok(interval(c, d).name === "P4", `flat order ${c}->${d} is ${interval(c,d).name}, expected P4`);
}
// The two orders reverse each other by *letter* — F C G D A E B against
// B E A D G C F. The accidentals obviously differ, so compare letters.
ok(SHARP_ORDER.map((n) => n[0]).reverse().join("") === FLAT_ORDER.map((n) => n[0]).join(""),
   `flat key order should reverse the sharp order's letters: got ${FLAT_ORDER.map((n)=>n[0]).join("")}`);

// 3. Relative minor is a minor 3rd below the major tonic.
for (const [maj, min] of [["C","A"],["G","E"],["D","B"],["F","D"],["Bb","G"],["Eb","C"],["A","F#"],["E","C#"]]) {
  ok(interval(min, maj).name === "m3", `relative minor of ${maj} should be ${min}: ${min}->${maj} is ${interval(min,maj).name}`);
}

// 4. Triad and seventh-chord spellings the lessons print.
const CHORDS = {
  "C major":      { notes: ["C","E","G"],            expect: ["M3","P5"] },
  "C minor":      { notes: ["C","Eb","G"],           expect: ["m3","P5"] },
  "C diminished": { notes: ["C","Eb","Gb"],          expect: ["m3","d5"] },
  "C augmented":  { notes: ["C","E","G#"],           expect: ["M3","A5"] },
  "Cmaj7":        { notes: ["C","E","G","B"],        expect: ["M3","P5","M7"] },
  "C7":           { notes: ["C","E","G","Bb"],       expect: ["M3","P5","m7"] },
  "Cm7":          { notes: ["C","Eb","G","Bb"],      expect: ["m3","P5","m7"] },
  "Cm7b5":        { notes: ["C","Eb","Gb","Bb"],     expect: ["m3","d5","m7"] },
  "Cdim7":        { notes: ["C","Eb","Gb","Bbb"],    expect: ["m3","d5","d7"] },
  "C9":           { notes: ["C","E","G","Bb","D"],   expect: ["M3","P5","m7","M2"] },
  "C13":          { notes: ["C","E","G","Bb","D","F","A"], expect: ["M3","P5","m7","M2","P4","M6"] },
  "Db7":          { notes: ["Db","F","Ab","Cb"],     expect: ["M3","P5","m7"] },
  "G7":           { notes: ["G","B","D","F"],        expect: ["M3","P5","m7"] },
};
for (const [name, { notes, expect }] of Object.entries(CHORDS)) {
  const got = notes.slice(1).map((n) => interval(notes[0], n).name);
  ok(got.join(" ") === expect.join(" "),
     `${name} spelled ${notes.join(" ")} gives ${got.join(" ")}, expected ${expect.join(" ")}`);
}

// 5. The tritone-substitution claim: G7 and Db7 share the same two pitches.
const g7tritone = [pc("B"), pc("F")].sort((a,b)=>a-b);
const db7tritone = [pc("F"), pc("Cb")].sort((a,b)=>a-b);
ok(g7tritone.join() === db7tritone.join(),
   `tritone sub: G7 has {${g7tritone}}, Db7 has {${db7tritone}} — should match`);
ok(interval("B","F").semitones === 6, `B->F should be 6 semitones, got ${interval("B","F").semitones}`);
ok(interval("G","Db").semitones === 6, `G->Db (the substitution distance) should be a tritone`);

// 6. Modes as rotations of the white keys, and the degree that characterises each.
const MODES = {
  Ionian: "C", Dorian: "D", Phrygian: "E", Lydian: "F",
  Mixolydian: "G", Aeolian: "A", Locrian: "B",
};
const CHARACTER = {
  Dorian: ["6", "M6"], Phrygian: ["2", "m2"], Lydian: ["4", "A4"],
  Mixolydian: ["7", "m7"], Locrian: ["5", "d5"],
};
for (const [mode, tonic] of Object.entries(MODES)) {
  const white = ["C","D","E","F","G","A","B"];
  const start = white.indexOf(tonic);
  const scale = Array.from({ length: 7 }, (_, i) => white[(start + i) % 7]);
  const c = CHARACTER[mode];
  if (!c) continue;
  const degree = Number(c[0]);
  const got = interval(tonic, scale[degree - 1]).name;
  ok(got === c[1], `${mode} degree ${degree} is ${got}, the app says ${c[1]}`);
}

// 7. Transposing instruments: written C sounds what, and by which interval.
const TRANSPOSE = [
  { inst: "Bb trumpet/clarinet", writtenC: "Bb", claim: "M2 below" },
  { inst: "Eb alto sax",         writtenC: "Eb", claim: "M6 below" },
  { inst: "F horn",              writtenC: "F",  claim: "P5 below" },
];
for (const t of TRANSPOSE) {
  // Descending interval from C down to the sounding pitch.
  const up = interval(t.writtenC, "C").name;           // sounding -> written
  const expect = t.claim.split(" ")[0];
  ok(up === expect, `${t.inst}: written C sounds ${t.writtenC}; that is ${up} below, app says ${expect} below`);
}
// And the lesson's worked example: Bb clarinet must play G to sound concert F.
ok(interval("F", "G").name === "M2", `write a M2 above the sounding pitch: F -> G is ${interval("F","G").name}`);

// 8. Cadence and scale-degree facts.
ok(interval("B", "C").semitones === 1, "leading tone to tonic should be a half step");
ok(spellScale("A", HARM_MINOR)[6] === "G#", `A harmonic minor 7th degree should be G#, got ${spellScale("A", HARM_MINOR)[6]}`);
ok(spellScale("A", NAT_MINOR).join(" ") === "A B C D E F G", `A natural minor should be A B C D E F G, got ${spellScale("A", NAT_MINOR).join(" ")}`);

// 9. Diatonic triad qualities in a major key.
function triadQualityOn(scale, degree) {
  const n = (i) => scale[(degree - 1 + i) % 7];
  const third = interval(n(0), n(2)).name, fifth = interval(n(0), n(4)).name;
  if (third === "M3" && fifth === "P5") return "major";
  if (third === "m3" && fifth === "P5") return "minor";
  if (third === "m3" && fifth === "d5") return "diminished";
  if (third === "M3" && fifth === "A5") return "augmented";
  return `${third}/${fifth}`;
}
const cmaj = spellScale("C", MAJOR_STEPS);
const EXPECTED_MAJOR = ["major","minor","minor","major","major","minor","diminished"];
for (let d = 1; d <= 7; d++) {
  const got = triadQualityOn(cmaj, d);
  ok(got === EXPECTED_MAJOR[d-1], `degree ${d} of a major key is ${got}, the app says ${EXPECTED_MAJOR[d-1]}`);
}
const amin = spellScale("A", NAT_MINOR);
const EXPECTED_MINOR = ["minor","diminished","major","minor","minor","major","major"];
for (let d = 1; d <= 7; d++) {
  const got = triadQualityOn(amin, d);
  ok(got === EXPECTED_MINOR[d-1], `degree ${d} of a natural minor key is ${got}, the app says ${EXPECTED_MINOR[d-1]}`);
}

// 10. Interval facts the lessons assert.
ok(interval("C","E").name === "M3", "C-E should be a major 3rd");
ok(interval("C","F").name === "P4", "C-F should be a perfect 4th");
ok(interval("C","F#").name === "A4", "C-F# should be an augmented 4th");
ok(interval("C","Gb").name === "d5", "C-Gb should be a diminished 5th");
ok(interval("C","F#").semitones === interval("C","Gb").semitones, "A4 and d5 should be the same size");
ok(interval("C","F#").semitones === 6, "the tritone splits the octave in half (6 of 12)");

console.log(problems.length === 0
  ? `OK - ${"all derived checks agree with the app"}`
  : `FAIL - ${problems.length} disagreements:`);
problems.forEach((p) => console.log("  -", p));
process.exit(problems.length ? 1 : 0);
