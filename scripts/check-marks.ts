/**
 * The editing rules behind the notation a composer reaches for.
 *
 *   npx tsx scripts/check-marks.ts
 *
 * Fermatas, fingerings, pedal lines, chord symbols and the segno/coda
 * machinery all went in at once, and each carries a rule that is a fact about
 * the notation rather than a preference:
 *
 *   - a piano has one sustain pedal. Two overlapping sustain lines are not a
 *     richer marking, they are a contradiction, so they merge.
 *   - two segni make "D.S." meaningless, because there is no way to say which
 *     one it means. So there is at most one.
 *   - two chord symbols on one beat is an unreadable page, the same reason two
 *     dynamics on one beat already replace each other.
 *   - a volta bracket has to be the same length wherever it is read from, or
 *     the page and the exported file disagree about where the repeat ends.
 *
 * None of that is in the types, and all of it is easy to break by accident
 * while editing something nearby.
 */
import {
  addChordSymbol,
  addPedal,
  removeChordSymbol,
  removePedal,
  setFingering,
  setRepeatDirective,
  setRepeatSign,
  setRepeatTimes,
  setVolta,
  toggleFermata,
  togglePedalRetake,
  toggleRestFermata,
  updateChordSymbol,
} from "../src/lib/studio/edit";
import {
  DEFAULT_LAYOUT,
  STUDIO_VERSION,
  chordSymbolsOf,
  emptyStudioScore,
  pedalsOf,
  voltaRun,
  type Measure,
  type StudioScore,
} from "../src/lib/studio/model";
import { CHORD_QUALITIES, CHORD_QUALITY_KEYS } from "../src/lib/studio/chords";
import { DIRECTIVE_TEXT } from "../src/components/studio/glyphs";
import { readFileSync } from "node:fs";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);

/** A two-bar piano score with four notes and a rest in it. */
function base(): StudioScore {
  const empty = emptyStudioScore({ layout: { ...DEFAULT_LAYOUT } });
  return {
    ...empty,
    version: STUDIO_VERSION,
    measures: [{ id: "m1" }, { id: "m2" }, { id: "m3" }, { id: "m4" }],
    parts: [
      {
        ...empty.parts[0],
        id: "p1",
        staves: [
          {
            ...empty.parts[0].staves[0],
            id: "s1",
            voices: [
              {
                id: "v1",
                notes: [
                  { id: "n1", start: 0, duration: 4, pitch: 60 },
                  { id: "n2", start: 4, duration: 4, pitch: 62 },
                  { id: "n3", start: 8, duration: 4, pitch: 64 },
                  { id: "n4", start: 12, duration: 4, pitch: 65 },
                ],
                rests: [{ id: "r1", start: 16, duration: 4 }],
              },
            ],
          },
        ],
      },
    ],
  };
}

const noteById = (s: StudioScore, id: string) =>
  s.parts[0].staves[0].voices[0].notes.find((n) => n.id === id);
const restById = (s: StudioScore, id: string) =>
  s.parts[0].staves[0].voices[0].rests.find((r) => r.id === id);
const staff = (s: StudioScore) => s.parts[0].staves[0];

/* -------------------------------------------------------------------------- */
/* Fermatas                                                                   */
/* -------------------------------------------------------------------------- */

{
  let s = toggleFermata(base(), "n1");
  if (noteById(s, "n1")?.fermata !== "normal") fail("a fermata did not go on");
  s = toggleFermata(s, "n1");
  if (noteById(s, "n1")?.fermata !== undefined) fail("clicking the same fermata twice did not clear it");

  // A different shape changes the shape rather than clearing and re-adding.
  s = toggleFermata(base(), "n1", "square");
  s = toggleFermata(s, "n1", "very-long");
  if (noteById(s, "n1")?.fermata !== "very-long")
    fail("choosing a different fermata shape did not change the shape");

  // And it does not touch the neighbours.
  if (noteById(s, "n2")?.fermata !== undefined) fail("a fermata leaked onto the next note");

  // An id that is not there changes nothing rather than throwing.
  const before = JSON.stringify(base());
  if (JSON.stringify(toggleFermata(base(), "nope")) !== before)
    fail("holding a note that does not exist changed the score");
}

{
  let s = toggleRestFermata(base(), "p1", "s1", "r1");
  if (restById(s, "r1")?.fermata !== "normal") fail("a rest could not be held");
  s = toggleRestFermata(s, "p1", "s1", "r1");
  if (restById(s, "r1")?.fermata !== undefined) fail("a held rest could not be released");
}

/* -------------------------------------------------------------------------- */
/* Fingering                                                                  */
/* -------------------------------------------------------------------------- */

{
  let s = setFingering(base(), "n1", "3");
  if (noteById(s, "n1")?.fingering !== "3") fail("a fingering did not go on");

  s = setFingering(s, "n1", "   ");
  if (noteById(s, "n1")?.fingering !== undefined)
    fail("a blank fingering was stored rather than clearing, so it still reserves space");

  // Four characters is what fits; anything longer is an instruction, not a
  // fingering, and must not be allowed to push the staff around.
  s = setFingering(base(), "n1", "1-2-3-4-5");
  const f = noteById(s, "n1")?.fingering ?? "";
  if (f.length > 4) fail(`a fingering of ${f.length} characters was stored: "${f}"`);

  s = setFingering(base(), "n1", "  4 ");
  if (noteById(s, "n1")?.fingering !== "4") fail("a fingering was not trimmed");
}

/* -------------------------------------------------------------------------- */
/* Pedal lines                                                                */
/* -------------------------------------------------------------------------- */

{
  // Two overlapping sustain lines are one line.
  let s = addPedal(base(), "p1", "s1", 0, 8);
  s = addPedal(s, "p1", "s1", 4, 8);
  const peds = pedalsOf(staff(s));
  if (peds.length !== 1) fail(`two overlapping sustain lines stayed as ${peds.length} lines`);
  if (peds[0] && (peds[0].start !== 0 || peds[0].duration !== 12))
    fail(`merged sustain covers ${peds[0].start}..${peds[0].start + peds[0].duration}, expected 0..12`);

  // Touching end to end also merges: the pedal never came up.
  s = addPedal(base(), "p1", "s1", 0, 8);
  s = addPedal(s, "p1", "s1", 8, 8);
  if (pedalsOf(staff(s)).length !== 1) fail("two sustain lines meeting end to end did not merge");

  // Lines that do not touch stay apart.
  s = addPedal(base(), "p1", "s1", 0, 4);
  s = addPedal(s, "p1", "s1", 12, 4);
  if (pedalsOf(staff(s)).length !== 2) fail("two separate sustain lines were merged");

  // Different pedals overlap freely — sustain under sostenuto is ordinary.
  s = addPedal(base(), "p1", "s1", 0, 16, "sustain");
  s = addPedal(s, "p1", "s1", 0, 16, "sostenuto");
  s = addPedal(s, "p1", "s1", 0, 16, "una-corda");
  if (pedalsOf(staff(s)).length !== 3)
    fail("three different pedals held together collapsed into fewer lines");

  // A merge keeps the notches that were inside it.
  s = addPedal(base(), "p1", "s1", 0, 8);
  s = togglePedalRetake(s, "p1", "s1", pedalsOf(staff(s))[0].id, 4);
  if ((pedalsOf(staff(s))[0].retakes ?? []).length !== 1) fail("a retake did not go in");
  s = addPedal(s, "p1", "s1", 6, 8);
  const merged = pedalsOf(staff(s))[0];
  if (!(merged.retakes ?? []).includes(4))
    fail("merging two pedal lines lost the retake inside them");

  // Lines come back in time order, which is what the drawing code assumes.
  s = addPedal(base(), "p1", "s1", 24, 4);
  s = addPedal(s, "p1", "s1", 0, 4);
  s = addPedal(s, "p1", "s1", 12, 4);
  const starts = pedalsOf(staff(s)).map((x) => x.start);
  if (starts.join(",") !== "0,12,24") fail(`pedal lines came back as ${starts.join(",")}`);
}

{
  // A notch outside the line would be invisible, so it is refused outright
  // rather than stored and quietly ignored at draw time.
  let s = addPedal(base(), "p1", "s1", 4, 8);
  const id = pedalsOf(staff(s))[0].id;
  for (const bad of [0, 4, 12, 20]) {
    s = togglePedalRetake(s, "p1", "s1", id, bad);
    if ((pedalsOf(staff(s))[0].retakes ?? []).length !== 0)
      fail(`a retake at ${bad} was accepted on a line covering 4..12`);
  }
  s = togglePedalRetake(s, "p1", "s1", id, 8);
  if ((pedalsOf(staff(s))[0].retakes ?? []).join(",") !== "8") fail("a valid retake was refused");
  // Clicking it again takes it out.
  s = togglePedalRetake(s, "p1", "s1", id, 8);
  if (pedalsOf(staff(s))[0].retakes !== undefined)
    fail("the last retake left an empty list behind rather than clearing");

  s = removePedal(s, "p1", "s1", id);
  if (pedalsOf(staff(s)).length !== 0) fail("a pedal line could not be removed");
}

/* -------------------------------------------------------------------------- */
/* Chord symbols                                                              */
/* -------------------------------------------------------------------------- */

{
  let s = addChordSymbol(base(), "p1", "s1", 0, "C", "maj7");
  s = addChordSymbol(s, "p1", "s1", 8, "A", "min7", "E");
  if (chordSymbolsOf(staff(s)).length !== 2) fail("two chord symbols did not both land");

  // One per beat: the second replaces the first, as a dynamic does.
  s = addChordSymbol(s, "p1", "s1", 0, "F", "maj");
  const at0 = chordSymbolsOf(staff(s)).filter((c) => c.start === 0);
  if (at0.length !== 1) fail(`${at0.length} chord symbols are sitting on beat one`);
  if (at0[0]?.root !== "F") fail("the newer chord symbol did not win");

  // In time order, which the drawing code assumes.
  s = addChordSymbol(s, "p1", "s1", 4, "G", "dom7");
  const order = chordSymbolsOf(staff(s)).map((c) => c.start);
  if (order.join(",") !== "0,4,8") fail(`chord symbols came back as ${order.join(",")}`);

  const id = chordSymbolsOf(staff(s))[0].id;
  s = updateChordSymbol(s, "p1", "s1", id, { quality: "dim7", bass: "Ab" });
  const edited = chordSymbolsOf(staff(s)).find((c) => c.id === id);
  if (edited?.quality !== "dim7" || edited?.bass !== "Ab") fail("a chord symbol could not be edited");

  s = removeChordSymbol(s, "p1", "s1", id);
  if (chordSymbolsOf(staff(s)).some((c) => c.id === id)) fail("a chord symbol could not be removed");
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

{
  // One segno in the score, because two make "D.S." ambiguous.
  let s = setRepeatSign(base(), 0, "segno");
  if (s.measures[0].sign !== "segno") fail("a segno did not go on");
  s = setRepeatSign(s, 2, "segno");
  const segni = s.measures.filter((m) => m.sign === "segno");
  if (segni.length !== 1) fail(`${segni.length} segni in one score`);
  if (s.measures[2].sign !== "segno") fail("the segno did not move to where it was asked for");

  // A coda is a separate sign and does not displace the segno.
  s = setRepeatSign(s, 3, "coda");
  if (s.measures[2].sign !== "segno") fail("adding a coda removed the segno");
  if (s.measures[3].sign !== "coda") fail("a coda did not go on");

  // Clicking the same one again takes it off.
  s = setRepeatSign(s, 3, "coda");
  if (s.measures[3].sign !== undefined) fail("a coda could not be cleared by clicking it again");
  s = setRepeatSign(s, 2, null);
  if (s.measures[2].sign !== undefined) fail("a sign could not be cleared explicitly");
}

{
  let s = setRepeatDirective(base(), 1, "d.s.-al-coda");
  if (s.measures[1].directive !== "d.s.-al-coda") fail("a directive did not go on");
  s = setRepeatDirective(s, 1, "d.s.-al-coda");
  if (s.measures[1].directive !== undefined) fail("a directive could not be cleared by repeating it");
  // Unlike signs, directives may appear more than once — a piece can have a
  // D.S. and a Fine, and a long one can have several of each.
  s = setRepeatDirective(base(), 1, "to-coda");
  s = setRepeatDirective(s, 3, "fine");
  if (s.measures[1].directive !== "to-coda" || s.measures[3].directive !== "fine")
    fail("two different directives cannot coexist");
}

{
  // Pass lists are cleaned up: deduplicated, sorted, nonsense dropped.
  let s = setVolta(base(), 0, [2, 1, 2, 3]);
  if ((s.measures[0].volta ?? []).join(",") !== "1,2,3")
    fail(`a volta of [2,1,2,3] was stored as ${(s.measures[0].volta ?? []).join(",")}`);
  s = setVolta(s, 0, [0, -1, 99, 1.5]);
  if (s.measures[0].volta !== undefined)
    fail(`nonsense passes were stored as ${JSON.stringify(s.measures[0].volta)}`);
  s = setVolta(base(), 0, []);
  if (s.measures[0].volta !== undefined) fail("an empty volta printed an empty bracket");
}

{
  // Repeat counts below 3 are the plain sign and store nothing.
  let s = setRepeatTimes(base(), 0, 3);
  if (s.measures[0].repeatTimes !== 3) fail("a repeat count of 3 did not store");
  for (const n of [2, 1, 0, -4, 99]) {
    s = setRepeatTimes(base(), 0, n);
    if (s.measures[0].repeatTimes !== undefined)
      fail(`a repeat count of ${n} was stored as ${s.measures[0].repeatTimes}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Volta runs are the same length however they are read                       */
/* -------------------------------------------------------------------------- */

{
  const ms: Measure[] = [
    { id: "a" },
    { id: "b", volta: [1] },
    { id: "c", volta: [1], barline: "repeat-end" },
    { id: "d", volta: [2] },
    { id: "e", volta: [2], barline: "final" },
  ];

  if (voltaRun(ms, 0) !== null) fail("a measure with no bracket reported one");

  const first = voltaRun(ms, 1);
  if (!first || first.from !== 1 || first.to !== 2)
    fail(`the first-time bracket runs ${first?.from}..${first?.to}, expected 1..2`);
  if (!first?.starts) fail("the first measure of a bracket does not know it starts it");
  if (first?.ends) fail("the first measure of a two-bar bracket thinks it ends it");
  if (first?.open) fail("a bracket closing on a repeat was reported as open");

  const middle = voltaRun(ms, 2);
  if (!middle?.ends) fail("the last measure of a bracket does not know it ends it");

  const second = voltaRun(ms, 3);
  if (!second || second.from !== 3 || second.to !== 4)
    fail(`the second-time bracket runs ${second?.from}..${second?.to}, expected 3..4`);
  if (!second?.open)
    fail("a second-time bracket ending on a final barline was reported as closed, which prints a leg telling a player to stop where the music does not");

  // Different pass lists are different brackets even when adjacent.
  const adjacent: Measure[] = [{ id: "a", volta: [1] }, { id: "b", volta: [2] }];
  if (voltaRun(adjacent, 0)?.to !== 0) fail("two adjacent brackets were read as one");
  if (voltaRun(adjacent, 1)?.from !== 1) fail("the second of two adjacent brackets starts too early");
}

/* -------------------------------------------------------------------------- */
/* Everything offered has somewhere to be printed                             */
/* -------------------------------------------------------------------------- */

for (const d of Object.keys(DIRECTIVE_TEXT) as (keyof typeof DIRECTIVE_TEXT)[]) {
  const text = DIRECTIVE_TEXT[d];
  if (!text || text.length < 2) fail(`directive "${d}" prints as "${text}"`);
}
if (new Set(Object.values(DIRECTIVE_TEXT)).size !== Object.keys(DIRECTIVE_TEXT).length)
  fail("two directives print identically, so a reader cannot tell them apart");

if (CHORD_QUALITY_KEYS.length < 20)
  fail(`only ${CHORD_QUALITY_KEYS.length} chord qualities, which is not a lead sheet's vocabulary`);
for (const q of CHORD_QUALITY_KEYS) {
  if (!CHORD_QUALITIES[q]) fail(`quality "${q}" is listed but has no definition`);
}

/* -------------------------------------------------------------------------- */
/* Nothing is written that nobody can reach                                   */
/* -------------------------------------------------------------------------- */

/*
 * The failure this catches is the one the Proving Grounds drills already had
 * once: a feature that exists, works, is tested, and has no way in.
 *
 * NotationToolbar declares the contract. NotationPanel is the palette a
 * composer actually clicks. StudioEditor turns a click into an edit. An action
 * declared in the first and missing from either of the others is a tool that
 * cannot be used, and nothing about it fails to compile — this file's own
 * NotationToolbar carried a dead eight-entry TABS list for exactly that reason.
 */
{
  const toolbar = readFileSync("src/components/studio/NotationToolbar.tsx", "utf8");
  const panel = readFileSync("src/components/studio/NotationPanel.tsx", "utf8");
  const editor = readFileSync("src/components/studio/StudioEditor.tsx", "utf8");

  const contract = /export interface ToolbarActions \{([\s\S]*?)\n\}/.exec(toolbar);
  if (!contract) {
    fail("could not find ToolbarActions in NotationToolbar.tsx");
  } else {
    const names = Array.from(contract[1].matchAll(/^\s{2}(on[A-Za-z]+)[?]?:/gm)).map((m) => m[1]);
    if (names.length < 25)
      fail(`only ${names.length} toolbar actions were found, so this check is reading the wrong thing`);

    for (const name of names) {
      /*
       * There are two surfaces, and an action only has to be on one of them.
       *
       * The palette reaches an action as `a.onThing` (tool lists) or
       * `actions.onThing` (the chord picker). The always-visible strip at the
       * top of the editor — note input, duration, dots, accidentals, voice,
       * delete — lives in NotationToolbar's own body and reaches them the same
       * way. Checking only the palette reported all seven of those as
       * unreachable, which they are not.
       *
       * Matching `actions.` rather than the bare name is what keeps the
       * toolbar's own interface declaration from counting as a use of itself.
       */
      const reach = new RegExp(`\\b(a|actions)\\.${name}\\b`);
      if (!reach.test(panel) && !reach.test(toolbar))
        fail(`${name} is declared but nothing offers it, so nobody can use it`);
      if (!new RegExp(`\\b${name}\\s*[:(]`).test(editor))
        fail(`${name} can be clicked but the editor does not implement it`);
    }
  }

  // And every category the palette lists has to be a real tab.
  const tabs = /export type ToolTab =([\s\S]*?);/.exec(toolbar)?.[1] ?? "";
  const declared = Array.from(tabs.matchAll(/"([a-z]+)"/g)).map((m) => m[1]);
  const listed = Array.from(panel.matchAll(/\{ id: "([a-z]+)", label:/g)).map((m) => m[1]);
  for (const t of declared)
    if (!listed.includes(t)) fail(`tab "${t}" exists but the palette never lists it`);
  for (const t of listed)
    if (!declared.includes(t)) fail(`the palette lists "${t}", which is not a tab`);
  if (declared.length < 9) fail(`only ${declared.length} tabs declared; the harmony tab is missing`);
}

console.log(
  `marks: fermatas, fingerings, ${CHORD_QUALITY_KEYS.length} chord qualities, three pedals and ` +
    `${Object.keys(DIRECTIVE_TEXT).length} navigation directives, each held to the rule the ` +
    `notation imposes on it`
);
if (problems.length === 0) console.log("OK - the new marks behave the way the notation does");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
