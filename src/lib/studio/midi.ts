/**
 * Standard MIDI file export, format 1: one tempo track then one track a part.
 *
 * Moved out of the editor component so the bytes can be parsed back and
 * checked, which is the only honest way to test a binary format.
 *
 * What it was missing, all of which the model already held and the app's own
 * playback already honoured:
 *
 * - No time signature and no key signature, so a DAW opened every export in
 *   4/4 with no sharps and the bars did not line up with the music.
 * - Tied notes went out as two separate notes, so every tie retriggered —
 *   audibly wrong, and the one loss a listener notices immediately.
 * - Printed dynamics were ignored. scheduleScore in audio.ts maps them to
 *   loudness for playback, so the app sounded one way and its export another.
 * - Per-part volume and pan were dropped, so the mix did not survive.
 */
import { gmProgram, instrumentById, isDrumKit } from "@/lib/studio/instruments";
import {
  type Dynamic,
  type Part,
  type StudioNote,
  type StudioScore,
  keyAt,
  measureOffsets,
  meterAt,
  transposeOf,
} from "@/lib/studio/model";
import { keySignatureCount } from "@/lib/score";
import { clampPitch } from "@/lib/studio/range";

/** Pulses per quarter note. One score tick is a sixteenth of a whole note. */
export const PPQ = 480;
const ticksToMidi = (t: number) => Math.round((t / 4) * PPQ);

/**
 * How loud each printed dynamic plays, as a MIDI velocity.
 *
 * These are the gains audio.ts uses for playback, scaled to 1..127. Keeping
 * one table in two places is how the app and its export drift apart, but
 * audio.ts holds its copy privately and exporting it from a module that
 * constructs an AudioContext would drag the Web Audio API into a Node script.
 * check-midi.ts holds the two to each other instead.
 */
const DYNAMIC_VELOCITY: Record<Dynamic, number> = {
  ppp: 15, pp: 25, p: 41, mp: 57, mf: 76, f: 95, ff: 114, fff: 127,
  sfz: 127, fp: 95,
};

/* -------------------------------------------------------------------------- */
/* Byte plumbing                                                              */
/* -------------------------------------------------------------------------- */

function varLen(n: number): number[] {
  const out = [n & 0x7f];
  let v = n >> 7;
  while (v > 0) {
    out.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return out;
}

/**
 * Meta text is bytes, so anything outside ASCII — the flat sign in "Clarinet
 * in B♭", a title someone typed — is folded down rather than truncated into a
 * byte that no longer means the same character.
 */
function metaText(text: string): number[] {
  const ascii = text
    .replace(/♭/g, "b")
    .replace(/♯/g, "#")
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "");
  return Array.from(ascii.slice(0, 127), (c) => c.charCodeAt(0));
}

interface Event {
  at: number;
  data: number[];
}

function buildTrack(events: Event[]): number[] {
  // At a shared tick a note-off must precede a note-on, or repeating the same
  // pitch silences the note that just began. Sorting on time alone left that
  // to whatever order the notes happened to be stored in.
  const rank = (d: number[]) => ((d[0] & 0xf0) === 0x80 ? 0 : (d[0] & 0xf0) === 0x90 ? 2 : 1);
  const ordered = [...events].sort((a, b) => a.at - b.at || rank(a.data) - rank(b.data));
  const out: number[] = [];
  let last = 0;
  for (const e of ordered) {
    out.push(...varLen(e.at - last), ...e.data);
    last = e.at;
  }
  out.push(...varLen(0), 0xff, 0x2f, 0x00);
  return out;
}

/* -------------------------------------------------------------------------- */
/* Ties, dynamics                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Collapse a tie chain into one note.
 *
 * A tie means "hold", not "play again", so A-tied-to-A has to leave as a
 * single note of the combined length. Exporting the two notes separately
 * retriggers the pitch, which is the one export loss anybody hears without
 * looking at a score.
 *
 * Chains of any length fold, because a note can be tied to a note that is
 * itself tied onward.
 */
export function mergeTies(notes: StudioNote[]): { pitch: number; start: number; duration: number; velocity?: number }[] {
  const byStart = [...notes].sort((a, b) => a.start - b.start || a.pitch - b.pitch);
  const consumed = new Set<string>();
  const out: { pitch: number; start: number; duration: number; velocity?: number }[] = [];

  for (const n of byStart) {
    if (consumed.has(n.id)) continue;
    let end = n.start + n.duration;
    let cur = n;
    // Follow the chain while this note ties into one that starts where it ends.
    while (cur.tie) {
      const next = byStart.find(
        (o) =>
          !consumed.has(o.id) &&
          o.id !== cur.id &&
          o.pitch === cur.pitch &&
          Math.abs(o.start - end) < 1e-9
      );
      if (!next) break;
      consumed.add(next.id);
      end = next.start + next.duration;
      cur = next;
    }
    out.push({ pitch: n.pitch, start: n.start, duration: end - n.start, velocity: n.velocity });
  }
  return out;
}

/** The dynamic in force at a tick on this staff, if any. */
function dynamicAt(marks: { start: number; value: Dynamic }[], tick: number): Dynamic | null {
  let found: Dynamic | null = null;
  let bestStart = -Infinity;
  for (const m of marks) {
    if (m.start <= tick && m.start >= bestStart) {
      bestStart = m.start;
      found = m.value;
    }
  }
  return found;
}

/* -------------------------------------------------------------------------- */
/* The file                                                                   */
/* -------------------------------------------------------------------------- */

export function scoreToMidi(score: StudioScore): Uint8Array<ArrayBuffer> {
  const bytes: number[] = [];
  const push = (...b: number[]) => bytes.push(...b);
  const pushStr = (s: string) => {
    for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
  };
  const push32 = (n: number) => push((n >> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255);
  const push16 = (n: number) => push((n >> 8) & 255, n & 255);

  pushStr("MThd");
  push32(6);
  push16(1);
  push16(score.parts.length + 1);
  push16(PPQ);

  /* ---- Track 0: tempo, metre, key ------------------------------------- */
  const meta: Event[] = [];
  const usPerQuarter = Math.round(60000000 / score.tempo);
  meta.push({
    at: 0,
    data: [0xff, 0x51, 0x03, (usPerQuarter >> 16) & 255, (usPerQuarter >> 8) & 255, usPerQuarter & 255],
  });
  const titleBytes = metaText(score.info.title || "Untitled");
  meta.push({ at: 0, data: [0xff, 0x03, titleBytes.length, ...titleBytes] });

  // A time signature and key signature at every point they change, not just
  // at the top. Without these a DAW shows 4/4 and C major whatever the score
  // says, and nothing lines up with the bar ruler.
  const { starts } = measureOffsets(score);
  let lastBeats = -1;
  let lastUnit = -1;
  let lastFifths = Number.NaN;
  let lastMinor = -1;
  score.measures.forEach((_, mi) => {
    const at = ticksToMidi(starts[mi]);
    const m = meterAt(score, mi);
    if (m.beats !== lastBeats || m.unit !== lastUnit) {
      // MIDI stores the denominator as a power of two: 4 becomes 2, 8 becomes 3.
      const pow = Math.max(0, Math.round(Math.log2(m.unit)));
      meta.push({ at, data: [0xff, 0x58, 0x04, m.beats, pow, 24, 8] });
      lastBeats = m.beats;
      lastUnit = m.unit;
    }
    const k = keyAt(score, mi);
    const fifths = keySignatureCount(k.key, k.mode);
    const minor = k.mode === "minor" ? 1 : 0;
    if (fifths !== lastFifths || minor !== lastMinor) {
      // sf is signed; two's complement in one byte.
      meta.push({ at, data: [0xff, 0x59, 0x02, fifths & 0xff, minor] });
      lastFifths = fifths;
      lastMinor = minor;
    }
  });

  const tempoTrack = buildTrack(meta);
  pushStr("MTrk");
  push32(tempoTrack.length);
  push(...tempoTrack);

  /* ---- One track a part ------------------------------------------------ */
  // Channel 10 (index 9) is General MIDI's drum channel: a pitched part placed
  // there plays as percussion. Kits are sent to it deliberately; everything
  // else steps over it.
  let nextChannel = 0;
  const takeChannel = () => {
    if (nextChannel === 9) nextChannel++;
    const c = nextChannel % 16;
    nextChannel++;
    return c === 9 ? 10 : c;
  };

  score.parts.forEach((part: Part) => {
    const drums = isDrumKit(part.instrumentId);
    const channel = drums ? 9 : takeChannel();
    const shift = score.layout.concertPitch ? 0 : transposeOf(part);
    const events: Event[] = [];

    const name = part.name ?? instrumentById(part.instrumentId).name;
    const nameBytes = metaText(name);
    events.push({ at: 0, data: [0xff, 0x03, nameBytes.length, ...nameBytes] });
    // Without a program change every track opens as piano, whatever it says.
    if (!drums) events.push({ at: 0, data: [0xc0 | channel, gmProgram(part.instrumentId)] });
    // The mix, as controller 7 and controller 10, so it survives the trip.
    events.push({
      at: 0,
      data: [0xb0 | channel, 7, Math.max(0, Math.min(127, Math.round(part.volume * 127)))],
    });
    events.push({
      at: 0,
      data: [0xb0 | channel, 10, Math.max(0, Math.min(127, Math.round((part.pan + 1) * 63.5)))],
    });

    for (const staff of part.staves) {
      for (const v of staff.voices) {
        for (const note of mergeTies(v.notes)) {
          const pitch = clampPitch(note.pitch + shift);
          // An explicit velocity on the note wins; otherwise the printed
          // dynamic decides, and only if there is neither does the part's
          // volume stand in.
          const dyn = dynamicAt(staff.dynamics, note.start);
          const vel =
            note.velocity ??
            (dyn ? DYNAMIC_VELOCITY[dyn] : Math.round(part.volume * 100));
          const velocity = Math.max(1, Math.min(127, vel));
          events.push({ at: ticksToMidi(note.start), data: [0x90 | channel, pitch, velocity] });
          events.push({
            at: ticksToMidi(note.start + note.duration),
            data: [0x80 | channel, pitch, 0],
          });
        }
      }
    }

    const track = buildTrack(events);
    pushStr("MTrk");
    push32(track.length);
    push(...track);
  });

  // Backed by a plain ArrayBuffer rather than ArrayBufferLike, so this can be
  // handed straight to a Blob without a cast at the call site.
  const out = new Uint8Array(new ArrayBuffer(bytes.length));
  out.set(bytes);
  return out;
}

export { DYNAMIC_VELOCITY };
