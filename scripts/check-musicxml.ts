/**
 * Holds the MusicXML export to what the score model actually contains.
 *
 *   npx tsx scripts/check-musicxml.ts
 *
 * Written because the exporter was silently lossy. It emitted pitch, duration,
 * voice, type, dots and a tie-start, and dropped articulations, ornaments,
 * slurs, tuplets, lyrics, dynamics, hairpins, octave lines, barlines, repeats,
 * rehearsal marks and every key or meter change after the first measure. The
 * file opened cleanly in MuseScore, which is exactly why nobody noticed: a
 * score that loses half its markings still looks like a score.
 *
 * So each feature is put into a fixture and then looked for in the output. A
 * test that only checks the file parses would have passed the whole time.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scoreToMusicXml } from "../src/lib/studio/musicxml";
import {
  DEFAULT_LAYOUT,
  type Measure,
  type Part,
  type StudioNote,
  type StudioScore,
  STUDIO_VERSION,
} from "../src/lib/studio/model";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);

/* -------------------------------------------------------------------------- */
/* A fixture that uses everything                                             */
/* -------------------------------------------------------------------------- */

let n = 0;
const id = () => `x${++n}`;

const note = (over: Partial<StudioNote> & { start: number; pitch: number }): StudioNote => ({
  id: id(),
  duration: 4,
  ...over,
});

function fixture(): StudioScore {
  const part: Part = {
    id: "p1",
    instrumentId: "piano",
    name: "Piano",
    shortName: "Pno.",
    visible: true,
    muted: false,
    solo: false,
    volume: 0.8,
    pan: 0,
    staves: [
      {
        id: "s1",
        clef: "treble",
        clefChanges: [{ start: 16, clef: "bass" }],
        lines: 5,
        voices: [
          {
            id: "v1",
            notes: [
              // Measure 1 is 4/4, so sixteen ticks: 0..16. The first version of
              // this fixture put a tie-start at tick 4 and the note it was
              // supposed to land on at tick 16, which are not adjacent, and
              // then reported the exporter as broken for not joining them.
              note({ start: 0, pitch: 60, articulations: ["staccato"], slur: "begin" }),
              note({ start: 0, pitch: 64 }),
              note({ start: 0, pitch: 67, ornaments: ["trill"] }),
              note({ start: 4, pitch: 65, spell: 1, ornaments: ["arpeggio-up"] }),
              // A dotted eighth is three ticks, so this leaves a one-tick gap
              // before the next note — which the exporter has to fill with a
              // rest rather than let the measure run short.
              note({ start: 8, pitch: 69, duration: 2, dots: 1 }),
              // Tied across the barline: ends exactly where measure 2 begins.
              note({
                start: 12,
                pitch: 62,
                duration: 4,
                tie: true,
                slur: "end",
                notehead: "diamond",
                stem: "up",
              }),
              // Measure 2 opens with the note the tie lands on, same pitch.
              note({ start: 16, pitch: 62, duration: 4 }),
              // A triplet, all three members sharing one id.
              note({ start: 20, pitch: 60, duration: 4 / 3, tuplet: { id: "t1", ratio: [3, 2] } }),
              note({ start: 20 + 4 / 3, pitch: 62, duration: 4 / 3, tuplet: { id: "t1", ratio: [3, 2] } }),
              note({ start: 20 + 8 / 3, pitch: 64, duration: 4 / 3, tuplet: { id: "t1", ratio: [3, 2] } }),
              // A grace note, and a tremolo.
              note({ start: 24, pitch: 71, duration: 1, ornaments: ["grace"] }),
              note({ start: 25, pitch: 72, duration: 3, ornaments: ["tremolo-2"] }),
              note({ start: 28, pitch: 67, duration: 4, ornaments: ["glissando"] }),
            ],
            rests: [],
          },
        ],
        dynamics: [{ id: id(), start: 0, value: "pp" }],
        hairpins: [{ id: id(), start: 4, duration: 8, kind: "crescendo" }],
        texts: [
          { id: id(), start: 0, kind: "tempo", text: "Andante" },
          { id: id(), start: 0, kind: "lyric", text: "Sing", verse: 1 },
          { id: id(), start: 4, kind: "lyric", text: "low", verse: 1 },
          { id: id(), start: 12, kind: "technique", text: "fermata" },
          { id: id(), start: 8, kind: "expression", text: "dolce" },
        ],
        octaveLines: [{ id: id(), start: 24, duration: 8, shift: 1 }],
      },
    ],
  };

  const measures: Measure[] = [
    { id: "m1", barline: "repeat-start", rehearsal: "A" },
    // A meter AND key change at measure 2, which the old exporter lost.
    { id: "m2", meter: { beats: 3, unit: 4 }, key: "G", mode: "major", barline: "repeat-end" },
    { id: "m3", barline: "final" },
  ];

  return {
    version: STUDIO_VERSION,
    info: {
      title: "Fixture & <Friends>",
      subtitle: "",
      composer: "A. Composer",
      arranger: "An Arranger",
      lyricist: "",
      copyright: "",
      description: "",
    },
    key: "C",
    mode: "major",
    meter: { beats: 4, unit: 4 },
    tempo: 92,
    parts: [part],
    groups: [],
    measures,
    layout: DEFAULT_LAYOUT,
    masterVolume: 0.9,
  };
}

const xml = scoreToMusicXml(fixture());

/* -------------------------------------------------------------------------- */
/* Well-formed first                                                          */
/* -------------------------------------------------------------------------- */

const dir = mkdtempSync(join(tmpdir(), "cd-musicxml-"));
const file = join(dir, "fixture.musicxml");
writeFileSync(file, xml, "utf8");
try {
  // --nonet so a missing DTD cannot turn this into a network fetch, and
  // --noout because we only want the diagnosis.
  execFileSync("xmllint", ["--nonet", "--noout", file], { stdio: "pipe" });
} catch (e) {
  const err = e as { stderr?: Buffer };
  fail(`the export is not well-formed XML: ${String(err.stderr ?? e).trim().split("\n")[0]}`);
}

/* -------------------------------------------------------------------------- */
/* Then: is each thing the model holds actually in there?                     */
/* -------------------------------------------------------------------------- */

const must: [string, string | RegExp][] = [
  // The things that were being dropped.
  ["a staccato articulation", "<articulations><staccato/></articulations>"],
  ["a trill ornament", "<ornaments><trill-mark/></ornaments>"],
  ["a tremolo", '<tremolo type="single">2</tremolo>'],
  ["an arpeggio", '<arpeggiate direction="up"/>'],
  ["a glissando", '<glissando type="start"'],
  ["a slur start", '<slur type="start"'],
  ["a slur stop", '<slur type="stop"'],
  ["a tie start as sound", '<tie type="start"/>'],
  ["a tie start as notation", '<tied type="start"/>'],
  ["a tie STOP as sound", '<tie type="stop"/>'],
  ["a tie STOP as notation", '<tied type="stop"/>'],
  ["a tuplet bracket start", '<tuplet type="start"'],
  ["a tuplet bracket stop", '<tuplet type="stop"/>'],
  ["the tuplet ratio", "<actual-notes>3</actual-notes><normal-notes>2</normal-notes>"],
  ["a grace note", "<grace"],
  ["a diamond notehead", "<notehead>diamond</notehead>"],
  ["an explicit stem", "<stem>up</stem>"],
  ["a dotted note", "<dot/>"],
  ["a dynamic", "<dynamics><pp/></dynamics>"],
  ["a hairpin start", '<wedge type="crescendo"/>'],
  ["a hairpin stop", '<wedge type="stop"/>'],
  ["an octave shift", "<octave-shift"],
  ["a tempo word", "Andante"],
  ["an expression word", "dolce"],
  ["a lyric", "<lyric number=\"1\"><syllabic>single</syllabic><text>Sing</text></lyric>"],
  ["a fermata", "<fermata"],
  ["a rehearsal mark", "<rehearsal>A</rehearsal>"],
  ["a forward repeat", '<repeat direction="forward"/>'],
  ["a backward repeat", '<repeat direction="backward"/>'],
  ["a final barline", "<bar-style>light-heavy</bar-style>"],
  ["a mid-score meter change", "<beats>3</beats><beat-type>4</beat-type>"],
  ["a mid-score key change", "<fifths>1</fifths>"],
  ["a mid-score clef change", "<sign>F</sign>"],
  ["the part abbreviation", "<part-abbreviation>Pno.</part-abbreviation>"],
  ["the arranger", '<creator type="arranger">An Arranger</creator>'],
  // And the things it always had, so a rewrite cannot quietly lose them.
  ["a chord", "<chord/>"],
  ["an accidental spelling", "<alter>1</alter>"],
  ["divisions", "<divisions>16</divisions>"],
  ["three measures", /<measure number="3"/],
];

for (const [what, needle] of must) {
  const found = typeof needle === "string" ? xml.includes(needle) : needle.test(xml);
  if (!found) fail(`the export is missing ${what}`);
}

// Titles and composer names contain characters XML cannot take raw.
if (!xml.includes("Fixture &amp; &lt;Friends&gt;"))
  fail("the title is not XML-escaped, so an ampersand in a title breaks the file");
// Read the title back out and look at it on its own. The first attempt at this
// used /<work-title>[^<]*[<&].../ which matched the "<" of the CLOSING tag and
// reported a failure on correctly escaped output -- a check that fails on good
// input is worse than no check.
const title = /<work-title>([\s\S]*?)<\/work-title>/.exec(xml)?.[1] ?? "";
if (title.includes("<")) fail(`the title contains a raw "<": ${title}`);
if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/.test(title))
  fail(`the title contains an ampersand that starts no entity: ${title}`);

const counted = must.length;
console.log(`musicxml: ${counted} notation features checked against a fixture that uses all of them`);
if (problems.length === 0) console.log("OK - the export carries what the model holds");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
