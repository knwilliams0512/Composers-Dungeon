/**
 * Holds every chord symbol the Studio offers to an independently written
 * spelling of the same chord.
 *
 *   npx tsx scripts/check-chords.ts
 *
 * CHORD_QUALITIES states each chord three ways — a printed suffix, a list of
 * semitones, and a MusicXML <kind> — and nothing in the type system makes those
 * three agree. A suffix of "m7" sitting on the intervals of a major seventh
 * would compile, print correctly, sound wrong, and export as the wrong harmony.
 *
 * So the table below spells all 28 qualities out again, on C, in note names,
 * written from the chord's name rather than copied from the implementation.
 * Two independent statements of the same fact: if they disagree, one of them is
 * wrong and it is worth knowing which.
 */
import {
  CHORD_QUALITIES,
  CHORD_QUALITY_KEYS,
  chordPitchClasses,
  chordSymbolText,
  chordVoicing,
  rootSemitone,
} from "../src/lib/studio/chords";
import type { ChordQuality, ChordSymbol } from "../src/lib/studio/model";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);

const PC: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, Fb: 4, "E#": 5, F: 5,
  "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11, Cb: 11,
};

/** What each quality is, spelled on C from the chord's name. */
const ON_C: Record<ChordQuality, string[]> = {
  maj: ["C", "E", "G"],
  min: ["C", "Eb", "G"],
  dim: ["C", "Eb", "Gb"],
  aug: ["C", "E", "G#"],
  sus2: ["C", "D", "G"],
  sus4: ["C", "F", "G"],
  five: ["C", "G"],
  maj7: ["C", "E", "G", "B"],
  min7: ["C", "Eb", "G", "Bb"],
  dom7: ["C", "E", "G", "Bb"],
  "min-maj7": ["C", "Eb", "G", "B"],
  // The seventh of a fully diminished chord is a diminished seventh above the
  // root: B double-flat, which sounds as A.
  dim7: ["C", "Eb", "Gb", "A"],
  "half-dim7": ["C", "Eb", "Gb", "Bb"],
  aug7: ["C", "E", "G#", "Bb"],
  dom7sus4: ["C", "F", "G", "Bb"],
  maj6: ["C", "E", "G", "A"],
  min6: ["C", "Eb", "G", "A"],
  maj9: ["C", "E", "G", "B", "D"],
  min9: ["C", "Eb", "G", "Bb", "D"],
  dom9: ["C", "E", "G", "Bb", "D"],
  dom11: ["C", "E", "G", "Bb", "D", "F"],
  dom13: ["C", "E", "G", "Bb", "D", "F", "A"],
  add9: ["C", "E", "G", "D"],
  dom7b5: ["C", "E", "Gb", "Bb"],
  dom7sharp5: ["C", "E", "G#", "Bb"],
  dom7b9: ["C", "E", "G", "Bb", "Db"],
  dom7sharp9: ["C", "E", "G", "Bb", "D#"],
  dom7sharp11: ["C", "E", "G", "Bb", "F#"],
  dom7b13: ["C", "E", "G", "Bb", "Ab"],
};

/** MusicXML 4.0's complete <kind> vocabulary. Anything else is not readable. */
const MUSICXML_KINDS = new Set([
  "major", "minor", "augmented", "diminished", "dominant", "major-seventh",
  "minor-seventh", "diminished-seventh", "augmented-seventh", "half-diminished",
  "major-minor", "major-sixth", "minor-sixth", "dominant-ninth", "major-ninth",
  "minor-ninth", "dominant-11th", "major-11th", "minor-11th", "dominant-13th",
  "major-13th", "minor-13th", "suspended-second", "suspended-fourth",
  "Neapolitan", "Italian", "French", "German", "pedal", "power", "Tristan",
  "other", "none",
]);

/* -------------------------------------------------------------------------- */
/* Every quality is spelled the same way twice                                */
/* -------------------------------------------------------------------------- */

for (const q of CHORD_QUALITY_KEYS) {
  const spec = CHORD_QUALITIES[q];
  const expected = ON_C[q];
  if (!expected) {
    fail(`quality "${q}" has no independent spelling in this script, so it is unchecked`);
    continue;
  }

  const want = expected.map((n) => {
    if (!(n in PC)) fail(`this script spells ${q} with "${n}", which is not a note`);
    return PC[n] ?? -1;
  });
  const got = spec.intervals.map((i) => ((i % 12) + 12) % 12);

  if (want.length !== got.length) {
    fail(
      `${q} ("${spec.suffix || "no suffix"}") has ${got.length} notes but ${spec.label} ` +
        `spells out as ${expected.length}: ${expected.join(" ")}`
    );
  } else {
    const same = want.every((pc, i) => pc === got[i]);
    if (!same) {
      const names = got.map((pc) => Object.keys(PC).find((k) => PC[k] === pc) ?? String(pc));
      fail(
        `${q} ("${spec.suffix || "no suffix"}", ${spec.label}) is built as ${names.join(" ")} ` +
          `but spells out as ${expected.join(" ")}`
      );
    }
  }

  // The intervals are an ascending stack measured from the root.
  if (spec.intervals[0] !== 0) fail(`${q} does not start on its own root`);
  for (let i = 1; i < spec.intervals.length; i++) {
    if (spec.intervals[i] <= spec.intervals[i - 1])
      fail(`${q} has intervals out of order: [${spec.intervals.join(", ")}]`);
  }
  if (spec.intervals.some((i) => i < 0 || i > 24))
    fail(`${q} reaches past two octaves, which no chord symbol means`);

  if (!MUSICXML_KINDS.has(spec.kind))
    fail(`${q} exports as kind "${spec.kind}", which is not in MusicXML's vocabulary`);

  if (!spec.label || spec.label.length < 3) fail(`${q} has no readable label`);

  for (const d of spec.degrees ?? []) {
    if (![3, 4, 5, 7, 9, 11, 13].includes(d.value))
      fail(`${q} alters degree ${d.value}, which is not a degree a symbol names`);
    if (![-1, 0, 1].includes(d.alter)) fail(`${q} alters degree ${d.value} by ${d.alter}`);
  }
}

// Nothing in the table that is not a quality.
for (const q of Object.keys(ON_C)) {
  if (!CHORD_QUALITY_KEYS.includes(q as ChordQuality))
    fail(`this script spells "${q}", which is not a quality`);
}

/* -------------------------------------------------------------------------- */
/* Suffixes have to be distinguishable on the page                            */
/* -------------------------------------------------------------------------- */

{
  const seen = new Map<string, ChordQuality>();
  for (const q of CHORD_QUALITY_KEYS) {
    const sfx = CHORD_QUALITIES[q].suffix;
    const already = seen.get(sfx);
    if (already)
      fail(
        `${q} and ${already} both print as "C${sfx}", so a reader cannot tell them apart`
      );
    else seen.set(sfx, q);
  }
  const labels = new Map<string, ChordQuality>();
  for (const q of CHORD_QUALITY_KEYS) {
    const l = CHORD_QUALITIES[q].label;
    const already = labels.get(l);
    if (already) fail(`${q} and ${already} are both called "${l}"`);
    else labels.set(l, q);
  }
}

/* -------------------------------------------------------------------------- */
/* Roots                                                                      */
/* -------------------------------------------------------------------------- */

for (const [root, pc] of [
  ["C", 0], ["C#", 1], ["Db", 1], ["D", 2], ["Eb", 3], ["E", 4], ["F", 5],
  ["F#", 6], ["Gb", 6], ["G", 7], ["Ab", 8], ["A", 9], ["Bb", 10], ["B", 11],
  // Double accidentals wrap, which is the whole reason to test them.
  ["Cb", 11], ["B#", 0], ["Dbb", 0], ["C##", 2], ["Fbb", 3], ["G##", 9],
] as [string, number][]) {
  const got = rootSemitone(root);
  if (got !== pc) fail(`rootSemitone("${root}") is ${got}, not ${pc}`);
}

for (const bad of ["H", "", "c", "Cbbb", "C###", "C#b", "Db#", "1", "C major", " "]) {
  if (rootSemitone(bad) !== null) fail(`rootSemitone accepted "${bad}" as a root`);
}

// Lower case is a real typing mistake rather than a hostile one, and silently
// accepting it would print "c" above the staff. Rejecting it is correct, but
// only if something trims whitespace, which this proves.
if (rootSemitone("  F#  ") !== 6) fail("a root with spaces around it is not read");

/* -------------------------------------------------------------------------- */
/* What comes out the other end                                               */
/* -------------------------------------------------------------------------- */

const sym = (root: string, quality: ChordQuality, bass?: string): ChordSymbol => ({
  id: "c1",
  start: 0,
  root,
  quality,
  bass,
});

for (const [c, want] of [
  [sym("C", "maj"), "C"],
  [sym("A", "min7"), "Am7"],
  [sym("G", "dom7"), "G7"],
  [sym("Bb", "maj7"), "B♭maj7"],
  [sym("F#", "half-dim7"), "F♯m7♭5"],
  [sym("C", "maj", "G"), "C/G"],
  [sym("Eb", "dom7b9", "Bb"), "E♭7♭9/B♭"],
  [sym("D", "five"), "D5"],
] as [ChordSymbol, string][]) {
  const got = chordSymbolText(c);
  if (got !== want) fail(`chordSymbolText printed "${got}" where "${want}" was meant`);
}

// A slash bass that is not in the chord must still be named.
{
  const pcs = chordPitchClasses(sym("C", "maj", "F#"));
  if (!pcs.includes(6)) fail("a slash bass outside the chord is dropped from its pitch classes");
  if (pcs[0] !== 6) fail("a slash bass is not the lowest thing in the chord");
}

// And a voicing has to be playable, in order, with the bass at the bottom.
for (const q of CHORD_QUALITY_KEYS) {
  for (const root of ["C", "F#", "Bb"]) {
    for (const bass of [undefined, "G", "E"]) {
      const v = chordVoicing(sym(root, q, bass), 48);
      if (v.length === 0) {
        fail(`${root}${CHORD_QUALITIES[q].suffix} voiced to nothing`);
        continue;
      }
      if (v.some((p) => p < 0 || p > 127))
        fail(`${root}${CHORD_QUALITIES[q].suffix}${bass ? "/" + bass : ""} voices outside MIDI`);
      for (let i = 1; i < v.length; i++)
        if (v[i] <= v[i - 1])
          fail(`${root}${CHORD_QUALITIES[q].suffix} voices out of order: [${v.join(", ")}]`);
      if (bass) {
        const bassPc = rootSemitone(bass)!;
        if (v[0] % 12 !== bassPc)
          fail(
            `${root}${CHORD_QUALITIES[q].suffix}/${bass} does not put ${bass} in the bass: ` +
              `[${v.join(", ")}]`
          );
      }
      // Every chord tone has to survive the voicing.
      const want = new Set(chordPitchClasses(sym(root, q, bass)));
      const got = new Set(v.map((p) => p % 12));
      for (const pc of Array.from(want))
        if (!got.has(pc)) fail(`${root}${CHORD_QUALITIES[q].suffix} voicing lost pitch class ${pc}`);
    }
  }
}

// An unknown quality must degrade rather than throw.
{
  const junk = { id: "x", start: 0, root: "C", quality: "nonsense" } as unknown as ChordSymbol;
  if (chordPitchClasses(junk).length !== 0) fail("an unknown quality produced pitches");
  if (chordVoicing(junk).length !== 0) fail("an unknown quality produced a voicing");
  const bad = sym("H" as string, "maj");
  if (chordPitchClasses(bad).length !== 0) fail("an unreadable root produced pitches");
}

console.log(
  `chords: ${CHORD_QUALITY_KEYS.length} qualities each spelled twice and agreeing, ` +
    `every kind in MusicXML's vocabulary, ${CHORD_QUALITY_KEYS.length * 9} voicings in order ` +
    `with the slash bass underneath`
);
if (problems.length === 0) console.log("OK - every chord symbol means what it prints");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
