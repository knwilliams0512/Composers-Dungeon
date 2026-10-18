/**
 * Parses the MIDI export back out of its own bytes and checks what it says.
 *
 *   npx tsx scripts/check-midi.ts
 *
 * A binary format cannot be tested by looking at the writer. Everything here
 * reads the file the way a DAW would — chunk headers, variable-length deltas,
 * running status — and then asks whether the music survived.
 *
 * The losses this was written to pin down:
 *
 * - No time signature and no key signature at all, so every export opened in
 *   4/4 with no sharps and the bars did not line up with the music.
 * - Tied notes left as two notes, which retriggers the pitch. The one export
 *   loss a listener notices without reading a score.
 * - Printed dynamics ignored, while the app's own playback honours them, so
 *   the export sounded different from the thing that made it.
 * - Per-part volume and pan dropped, so the mix did not travel.
 */
import { scoreToMidi, mergeTies, DYNAMIC_VELOCITY, PPQ } from "../src/lib/studio/midi";
import {
  DEFAULT_LAYOUT,
  type Dynamic,
  type Measure,
  type Part,
  type StudioNote,
  type StudioScore,
  STUDIO_VERSION,
} from "../src/lib/studio/model";
import { DYNAMIC_GAIN, DYNAMIC_LADDER } from "../src/lib/studio/timing";
import { readFileSync } from "node:fs";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);

/* -------------------------------------------------------------------------- */
/* A reader that behaves like something that actually plays MIDI              */
/* -------------------------------------------------------------------------- */

interface MidiEvent {
  track: number;
  at: number;
  status: number;
  data: number[];
  meta?: number;
}

function parseMidi(bytes: Uint8Array): { format: number; tracks: number; ppq: number; events: MidiEvent[] } {
  let p = 0;
  const str = (n: number) => {
    let s = "";
    for (let i = 0; i < n; i++) s += String.fromCharCode(bytes[p++]);
    return s;
  };
  const u32 = () => ((bytes[p++] << 24) | (bytes[p++] << 16) | (bytes[p++] << 8) | bytes[p++]) >>> 0;
  const u16 = () => (bytes[p++] << 8) | bytes[p++];

  if (str(4) !== "MThd") throw new Error("no MThd header");
  const headerLen = u32();
  if (headerLen !== 6) throw new Error(`header length ${headerLen}, expected 6`);
  const format = u16();
  const tracks = u16();
  const ppq = u16();

  const events: MidiEvent[] = [];
  for (let t = 0; t < tracks; t++) {
    if (str(4) !== "MTrk") throw new Error(`track ${t} has no MTrk`);
    const len = u32();
    const end = p + len;
    let at = 0;
    let running = 0;
    while (p < end) {
      // Variable-length delta.
      let delta = 0;
      for (;;) {
        const b = bytes[p++];
        delta = (delta << 7) | (b & 0x7f);
        if (!(b & 0x80)) break;
      }
      at += delta;

      let status = bytes[p];
      if (status & 0x80) p++;
      else status = running; // running status: the byte is data, not a status
      if (status < 0xf0) running = status;

      if (status === 0xff) {
        const meta = bytes[p++];
        let mlen = 0;
        for (;;) {
          const b = bytes[p++];
          mlen = (mlen << 7) | (b & 0x7f);
          if (!(b & 0x80)) break;
        }
        const data = Array.from(bytes.slice(p, p + mlen));
        p += mlen;
        events.push({ track: t, at, status, data, meta });
      } else if (status === 0xf0 || status === 0xf7) {
        let mlen = 0;
        for (;;) {
          const b = bytes[p++];
          mlen = (mlen << 7) | (b & 0x7f);
          if (!(b & 0x80)) break;
        }
        p += mlen;
      } else {
        const type = status & 0xf0;
        const n = type === 0xc0 || type === 0xd0 ? 1 : 2;
        const data = Array.from(bytes.slice(p, p + n));
        p += n;
        events.push({ track: t, at, status, data });
      }
    }
    if (p !== end) throw new Error(`track ${t} overran its declared length`);
  }
  if (p !== bytes.length) throw new Error("trailing bytes after the last track");
  return { format, tracks, ppq, events };
}

/* -------------------------------------------------------------------------- */
/* Fixture                                                                    */
/* -------------------------------------------------------------------------- */

let n = 0;
const id = () => `m${++n}`;
const note = (o: Partial<StudioNote> & { start: number; pitch: number }): StudioNote => ({
  id: id(),
  duration: 4,
  ...o,
});

function fixture(): StudioScore {
  const piano: Part = {
    id: "p1",
    instrumentId: "piano",
    name: "Piano",
    visible: true,
    muted: false,
    solo: false,
    volume: 0.5,
    pan: -1,
    staves: [
      {
        id: "s1",
        clef: "treble",
        lines: 5,
        voices: [
          {
            id: "v1",
            notes: [
              // A tie chain of three: 0..4 tied to 4..8 tied to 8..12.
              note({ start: 0, pitch: 60, duration: 4, tie: true }),
              note({ start: 4, pitch: 60, duration: 4, tie: true }),
              note({ start: 8, pitch: 60, duration: 4 }),
              // An untied note after it, so the merge cannot swallow everything.
              note({ start: 12, pitch: 62, duration: 4 }),
              // In measure 2, under a different dynamic.
              note({ start: 16, pitch: 64, duration: 4 }),
              // An explicit velocity must beat the dynamic.
              note({ start: 20, pitch: 65, duration: 4, velocity: 100 }),
            ],
            rests: [],
          },
        ],
        dynamics: [
          { id: id(), start: 0, value: "pp" },
          { id: id(), start: 16, value: "ff" },
        ],
        hairpins: [],
        texts: [],
        octaveLines: [],
      },
    ],
  };

  const measures: Measure[] = [
    { id: "m1" },
    { id: "m2", meter: { beats: 3, unit: 4 }, key: "D", mode: "minor" },
  ];

  return {
    version: STUDIO_VERSION,
    info: { title: "MIDI Fixture ♭", subtitle: "", composer: "C", arranger: "", lyricist: "", copyright: "", description: "" },
    key: "C",
    mode: "major",
    meter: { beats: 4, unit: 4 },
    tempo: 120,
    parts: [piano],
    groups: [],
    measures,
    layout: DEFAULT_LAYOUT,
    masterVolume: 1,
  };
}

const score = fixture();
const bytes = scoreToMidi(score);

let parsed;
try {
  parsed = parseMidi(bytes);
} catch (e) {
  fail(`the export is not a readable MIDI file: ${(e as Error).message}`);
}

if (parsed) {
  const { format, tracks, ppq, events } = parsed;
  if (format !== 1) fail(`format is ${format}, expected 1 (one track a part)`);
  if (ppq !== PPQ) fail(`division is ${ppq}, expected ${PPQ}`);
  if (tracks !== score.parts.length + 1)
    fail(`${tracks} tracks for ${score.parts.length} parts; expected one more than the parts`);

  const meta = (m: number) => events.filter((e) => e.status === 0xff && e.meta === m);

  // --- Tempo, metre, key -------------------------------------------------
  const tempos = meta(0x51);
  if (tempos.length === 0) fail("no tempo event");
  else {
    const us = (tempos[0].data[0] << 16) | (tempos[0].data[1] << 8) | tempos[0].data[2];
    const bpm = Math.round(60000000 / us);
    if (bpm !== score.tempo) fail(`tempo reads ${bpm}bpm, expected ${score.tempo}`);
  }

  const timeSigs = meta(0x58);
  if (timeSigs.length < 2)
    fail(`${timeSigs.length} time signature(s); the fixture changes metre, so there should be 2`);
  else {
    const [a, b] = timeSigs;
    if (a.data[0] !== 4 || a.data[1] !== 2) fail(`first time signature is ${a.data[0]}/2^${a.data[1]}, expected 4/4`);
    if (b.data[0] !== 3 || b.data[1] !== 2) fail(`second time signature is ${b.data[0]}/2^${b.data[1]}, expected 3/4`);
    if (b.at !== (16 / 4) * PPQ) fail(`the metre change lands at tick ${b.at}, expected ${(16 / 4) * PPQ}`);
  }

  const keySigs = meta(0x59);
  if (keySigs.length < 2)
    fail(`${keySigs.length} key signature(s); the fixture changes key, so there should be 2`);
  else {
    const first = keySigs[0];
    const second = keySigs[1];
    if (first.data[0] !== 0 || first.data[1] !== 0) fail(`first key signature is sf=${first.data[0]} mi=${first.data[1]}, expected C major`);
    // D minor is one flat, which is -1 as a signed byte: 0xff.
    const sf = (second.data[0] << 24) >> 24;
    if (sf !== -1 || second.data[1] !== 1)
      fail(`second key signature is sf=${sf} mi=${second.data[1]}, expected one flat and minor`);
  }

  // --- Program change, volume, pan --------------------------------------
  if (!events.some((e) => (e.status & 0xf0) === 0xc0)) fail("no program change, so every track opens as piano");
  const cc = events.filter((e) => (e.status & 0xf0) === 0xb0);
  const vol = cc.find((e) => e.data[0] === 7);
  const pan = cc.find((e) => e.data[0] === 10);
  if (!vol) fail("no volume controller, so the part mix does not survive");
  else if (vol.data[1] !== Math.round(0.5 * 127))
    fail(`volume is ${vol.data[1]}, expected ${Math.round(0.5 * 127)} for a part at 0.5`);
  if (!pan) fail("no pan controller, so the stereo placement does not survive");
  else if (pan.data[1] !== 0) fail(`pan is ${pan.data[1]}, expected 0 for a part panned hard left`);

  // --- Ties merged ------------------------------------------------------
  const ons = events.filter((e) => (e.status & 0xf0) === 0x90 && e.data[1] > 0);
  const offs = events.filter((e) => (e.status & 0xf0) === 0x80 || ((e.status & 0xf0) === 0x90 && e.data[1] === 0));
  const c4ons = ons.filter((e) => e.data[0] === 60);
  if (c4ons.length !== 1)
    fail(`middle C sounds ${c4ons.length} times; the three tied notes should be one, so a tie holds rather than retriggers`);
  const c4off = offs.filter((e) => e.data[0] === 60);
  if (c4off.length === 1 && c4ons.length === 1) {
    const held = c4off[0].at - c4ons[0].at;
    const want = (12 / 4) * PPQ; // three quarters tied together
    if (held !== want) fail(`the tied middle C lasts ${held} ticks, expected ${want}`);
  }
  if (ons.length !== offs.length) fail(`${ons.length} note-ons against ${offs.length} note-offs`);

  // --- Dynamics reached the velocities ----------------------------------
  const e4 = ons.find((e) => e.data[0] === 64);
  const c4 = c4ons[0];
  if (c4 && c4.data[1] !== DYNAMIC_VELOCITY.pp)
    fail(`the note under pp has velocity ${c4.data[1]}, expected ${DYNAMIC_VELOCITY.pp}`);
  if (e4 && e4.data[1] !== DYNAMIC_VELOCITY.ff)
    fail(`the note under ff has velocity ${e4.data[1]}, expected ${DYNAMIC_VELOCITY.ff}`);
  if (c4 && e4 && c4.data[1] >= e4.data[1])
    fail("the pp note is not quieter than the ff note, so dynamics are not reaching the file");
  const f5 = ons.find((e) => e.data[0] === 65);
  if (f5 && f5.data[1] !== 100)
    fail(`an explicit velocity of 100 came out as ${f5.data[1]}; the note should beat the dynamic`);

  // --- Non-ASCII in a title must not corrupt the bytes ------------------
  const names = meta(0x03);
  if (!names.length) fail("no track name");
  else if (names.some((e) => e.data.some((b) => b < 0x20 || b > 0x7e)))
    fail("a track name carries a byte outside printable ASCII");
}

/* -------------------------------------------------------------------------- */
/* mergeTies on its own                                                       */
/* -------------------------------------------------------------------------- */

{
  const chain = mergeTies([
    { id: "a", start: 0, pitch: 60, duration: 4, tie: true },
    { id: "b", start: 4, pitch: 60, duration: 4, tie: true },
    { id: "c", start: 8, pitch: 60, duration: 4 },
  ]);
  if (chain.length !== 1) fail(`a three-note tie chain merged to ${chain.length} notes, expected 1`);
  else if (chain[0].duration !== 12) fail(`the merged chain is ${chain[0].duration} ticks, expected 12`);

  // A tie flag with nothing to tie to must not swallow a later note.
  const dangling = mergeTies([
    { id: "a", start: 0, pitch: 60, duration: 4, tie: true },
    { id: "b", start: 8, pitch: 60, duration: 4 },
  ]);
  if (dangling.length !== 2)
    fail(`a tie with a gap after it merged anyway (${dangling.length} notes), which would swallow a rest`);

  // A tie must not reach across a different pitch.
  const wrongPitch = mergeTies([
    { id: "a", start: 0, pitch: 60, duration: 4, tie: true },
    { id: "b", start: 4, pitch: 62, duration: 4 },
  ]);
  if (wrongPitch.length !== 2) fail("a tie joined two different pitches");
}

/* -------------------------------------------------------------------------- */
/* Loudness: one table, and it has to stay one table                          */
/* -------------------------------------------------------------------------- */

/*
 * There used to be two tables of dynamics — gains in audio.ts for playback,
 * velocities here for export — and this block compared their rankings, because
 * the gains could not be imported into a Node script without dragging the Web
 * Audio API along. The gains now live in lib/studio/timing.ts, which has no
 * AudioContext in it, so the export derives its velocities from them and the
 * two cannot disagree.
 *
 * What is left to check is that it stays that way: that nothing re-introduces a
 * second table, and that the derivation is actually monotonic — a ladder whose
 * velocities repeat would make two different dynamics identical in the file.
 */
{
  const src = readFileSync("src/lib/studio/midi.ts", "utf8");
  if (/const DYNAMIC_VELOCITY[^=]*=\s*\{/.test(src))
    fail("midi.ts declares its own velocity table again instead of deriving it from the gains");
  if (!/DYNAMIC_GAIN/.test(src))
    fail("midi.ts no longer reads the playback gains, so the app and its export can drift again");

  for (const d of DYNAMIC_LADDER) {
    const v = DYNAMIC_VELOCITY[d];
    if (!Number.isInteger(v) || v < 1 || v > 127)
      fail(`${d} exports as velocity ${v}, which is not a MIDI velocity`);
  }
  for (let i = 1; i < DYNAMIC_LADDER.length; i++) {
    const lower = DYNAMIC_VELOCITY[DYNAMIC_LADDER[i - 1]];
    const higher = DYNAMIC_VELOCITY[DYNAMIC_LADDER[i]];
    if (!(higher > lower))
      fail(
        `${DYNAMIC_LADDER[i]} (${higher}) is not louder than ${DYNAMIC_LADDER[i - 1]} (${lower}), ` +
          `so a crescendo between them is silent in the file`
      );
    if (!(DYNAMIC_GAIN[DYNAMIC_LADDER[i]] > DYNAMIC_GAIN[DYNAMIC_LADDER[i - 1]]))
      fail(`${DYNAMIC_LADDER[i]} is not louder than ${DYNAMIC_LADDER[i - 1]} for playback either`);
  }
  // Every dynamic the model has must have a gain, or it falls back silently.
  for (const d of Object.keys(DYNAMIC_VELOCITY) as Dynamic[]) {
    if (DYNAMIC_GAIN[d] === undefined) fail(`"${d}" has a velocity but no playback gain`);
  }
}

console.log(
  `midi: ${bytes.length} bytes parsed back as format 1; metre, key, ties, dynamics, mix and names checked`
);
if (problems.length === 0) console.log("OK - the MIDI export carries the music");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
