/**
 * Does flattening a full score preserve what the checks need to read?
 *
 * The dungeon's deep trials are written in the Studio and graded by an engine
 * built for a single line with a harmony lane. Everything rests on the
 * flattener: if transpositions are applied the wrong way the harmony is a tone
 * out, and if the chord inference is guessing then "every bar is harmonised"
 * means nothing. So this builds scores whose harmony is known by construction
 * and checks the flattener reads it back.
 */

import { emptyStudioScore, type StudioScore, type Part } from "../src/lib/studio/model";
import { instrumentById } from "../src/lib/studio/instruments";
import { flattenStudioScore, soundingNotes, voiceCount } from "../src/lib/studio/flatten";
import { romanNumeral, ticksPerBar, triadFor, type ScoreMeter } from "../src/lib/score";
import { parseKey } from "../src/lib/challenge-brief";
import { challengeComponents } from "../prisma/seed-data/world";

let failures = 0;
const fail = (m: string) => {
  console.log(`  ${m}`);
  failures++;
};

let id = 0;
const uid = () => `t${++id}`;

/** A part holding one voice of written notes on the given instrument. */
function partWith(instrumentId: string, notes: { start: number; duration: number; pitch: number }[]): Part {
  const inst = instrumentById(instrumentId);
  return {
    id: uid(),
    instrumentId,
    staves: [
      {
        id: uid(),
        clef: inst.clefs[0],
        lines: 5,
        voices: [{ id: uid(), notes: notes.map((n) => ({ id: uid(), ...n })), rests: [] }],
        octaveLines: [],
        dynamics: [],
        hairpins: [],
        texts: [],
      },
    ],
    visible: true,
    muted: false,
    solo: false,
    volume: 0.8,
    pan: 0,
  };
}

function scoreWith(parts: Part[], meter: ScoreMeter): StudioScore {
  return { ...emptyStudioScore({ meter }), parts, groups: [] };
}

/* --- 1. The catalogue agrees with what Level 6 teaches --------------------- */
{
  // Sounding minus written, written out independently from the lesson text.
  // If these ever disagree, either the app plays transposing instruments at
  // the wrong pitch or the lesson is teaching something the app contradicts.
  const EXPECTED: Record<string, number> = {
    "clarinet-bb": -2,
    "trumpet": -2,
    "english-horn": -7,
    "horn": -7,
    "alto-sax": -9,
    "tenor-sax": -14,
    "bass-clarinet": -14,
    "piccolo": 12,
    "double-bass": -12,
    "contrabassoon": -12,
    "celesta": 12,
    "glockenspiel": 24,
  };
  for (const [id, want] of Object.entries(EXPECTED)) {
    const inst = instrumentById(id);
    if (inst.id !== id) {
      fail(`the catalogue has no instrument "${id}" — instrumentById fell back to "${inst.id}"`);
      continue;
    }
    if (inst.transpose !== want) {
      fail(`${inst.name} transposes by ${inst.transpose} in the catalogue; it should be ${want}`);
    }
  }
}

/* --- 2. Transposition is applied in the right direction ------------------- */
{
  // A B-flat clarinet reading a written D sounds a concert C (MIDI 60).
  const studio = scoreWith([partWith("clarinet-bb", [{ start: 0, duration: 4, pitch: 62 }])], { beats: 4, unit: 4 });
  const sounding = soundingNotes(studio);
  if (sounding[0]?.pitch !== 60) {
    fail(`a written D on B-flat clarinet flattened to MIDI ${sounding[0]?.pitch}; a concert C is 60`);
  }
  // And the classic error: wrong by twice the interval, in the other direction.
  if (sounding[0]?.pitch === 64) {
    fail("the transposition was added instead of subtracted");
  }
}

/* --- 3. A known progression is read back correctly ------------------------ */
{
  const meter: ScoreMeter = { beats: 4, unit: 4 };
  const barTicks = ticksPerBar(meter);
  const key = "C";
  const mode = "major" as const;
  const wanted = [1, 4, 5, 1];

  // One bar per chord, spelled out as a sustained triad on a non-transposing
  // instrument, so the only thing under test is the inference.
  const notes: { start: number; duration: number; pitch: number }[] = [];
  wanted.forEach((degree, bar) => {
    for (const pitch of triadFor(degree, key, mode).pitches) {
      notes.push({ start: bar * barTicks, duration: barTicks, pitch });
    }
  });

  const flat = flattenStudioScore(scoreWith([partWith("piano", notes)], meter), {
    key,
    mode,
    meter,
    bars: wanted.length,
  });

  if (flat.chords.length !== wanted.length) {
    fail(`a four-bar progression flattened to ${flat.chords.length} chord(s)`);
  } else {
    const got = flat.chords.map((c) => c.degree);
    if (got.join(",") !== wanted.join(",")) {
      fail(
        `read the progression as ${flat.chords.map((c) => romanNumeral(c.degree, c.quality)).join("–")}, wrote I–IV–V–I`
      );
    }
  }
}

/* --- 4. A passing note does not outvote the chord under it ---------------- */
{
  const meter: ScoreMeter = { beats: 4, unit: 4 };
  const barTicks = ticksPerBar(meter);
  const notes: { start: number; duration: number; pitch: number }[] = [];
  // A sustained C major triad, with one short D passing through it.
  for (const pitch of triadFor(1, "C", "major").pitches) {
    notes.push({ start: 0, duration: barTicks, pitch });
  }
  notes.push({ start: 4, duration: 1, pitch: 74 });

  const flat = flattenStudioScore(scoreWith([partWith("piano", notes)], meter), {
    key: "C",
    mode: "major",
    meter,
    bars: 1,
  });
  if (flat.chords[0]?.degree !== 1) {
    fail(`a tonic bar with one passing note was read as degree ${flat.chords[0]?.degree ?? "none"}`);
  }
}

/* --- 5. An empty bar is reported as unharmonised, not guessed ------------- */
{
  const meter: ScoreMeter = { beats: 4, unit: 4 };
  const barTicks = ticksPerBar(meter);
  const notes = triadFor(1, "C", "major").pitches.map((pitch) => ({ start: 0, duration: barTicks, pitch }));
  const flat = flattenStudioScore(scoreWith([partWith("piano", notes)], meter), {
    key: "C",
    mode: "major",
    meter,
    bars: 3,
  });
  if (flat.chords.length !== 1) {
    fail(`two empty bars produced ${flat.chords.length - 1} invented chord(s)`);
  }
}

/* --- 6. Muted parts are silent; solo wins ---------------------------------- */
{
  const meter: ScoreMeter = { beats: 4, unit: 4 };
  const heard = partWith("piano", [{ start: 0, duration: 4, pitch: 60 }]);
  const silent = partWith("piano", [{ start: 0, duration: 4, pitch: 61 }]);
  silent.muted = true;
  const studio = scoreWith([heard, silent], meter);
  const pitches = soundingNotes(studio).map((n) => n.pitch);
  if (pitches.includes(61)) fail("a muted part was still counted in the flattened score");
  if (!pitches.includes(60)) fail("an audible part was dropped from the flattened score");
  if (voiceCount(studio) !== 1) fail(`voiceCount saw ${voiceCount(studio)} sounding parts; one is audible`);
}

/* --- 7. Parts really do stack, rather than replacing one another ----------- */
{
  const meter: ScoreMeter = { beats: 4, unit: 4 };
  const studio = scoreWith(
    [
      partWith("violin", [{ start: 0, duration: 4, pitch: 72 }]),
      partWith("cello", [{ start: 0, duration: 4, pitch: 48 }]),
    ],
    meter
  );
  const flat = flattenStudioScore(studio, { key: "C", mode: "major", meter, bars: 1 });
  if (flat.melody.length !== 2) {
    fail(`two parts each with one note flattened to ${flat.melody.length} note(s)`);
  }
}

/* --- 8. Every key the generator can name is read back correctly ----------- */
{
  // The generator's key list is written for a human to read — "B-flat major",
  // "F-sharp minor". A parser that only understood "#" and "b" turned five of
  // the twelve into the wrong key, so a trial named one key and was set in
  // another. These are spelled out again here rather than derived, so the
  // check would survive someone "simplifying" the parser.
  const EXPECTED: Record<string, string> = {
    "C major": "C major",
    "G major": "G major",
    "F major": "F major",
    "A minor": "A minor",
    "D major": "D major",
    "E minor": "E minor",
    "B-flat major": "Bb major",
    "D minor": "D minor",
    "E-flat major": "Eb major",
    "F-sharp minor": "F# minor",
    "C-sharp major": "C# major",
    "B minor": "B minor",
    // Forms the app writes elsewhere, which must keep working.
    "Bb major": "Bb major",
    "F# minor": "F# minor",
    "E♭ major": "Eb major",
    "C♯ minor": "C# minor",
  };
  for (const [raw, want] of Object.entries(EXPECTED)) {
    const got = parseKey(raw);
    const asText = `${got.key} ${got.mode}`;
    if (asText !== want) fail(`"${raw}" parses as ${asText}; it is ${want}`);
  }

  // And the component table the generator actually draws from.
  for (const c of challengeComponents.filter((x) => x.type === "KEY")) {
    const got = parseKey(c.value);
    const wantsSharp = /#|♯|sharp/i.test(c.value);
    const wantsFlat = /♭|flat|(?<=[A-G])b\b/i.test(c.value);
    if (wantsSharp && !got.key.includes("#")) fail(`key component "${c.value}" lost its sharp`);
    if (wantsFlat && !got.key.includes("b")) fail(`key component "${c.value}" lost its flat`);
    if (/minor/i.test(c.value) && got.mode !== "minor") fail(`key component "${c.value}" lost its mode`);
  }
}

if (failures) {
  console.log(`\nFAIL - ${failures} problem(s) flattening a full score`);
  process.exit(1);
}
console.log("flatten: transposition, harmony inference, mutes, stacking and key spellings all check out");
console.log("OK - a full score flattens to something the checks can read");
