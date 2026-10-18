/**
 * MusicXML export, in the partwise flavour every notation program reads.
 *
 * This moved out of the editor component so it can be tested directly, and
 * because what it was dropping could not be seen from the editor: the model
 * stores articulations, ornaments, slurs, tuplets, lyrics, dynamics,
 * hairpins, octave lines, barlines, repeats, rehearsal marks and mid-score
 * key and meter changes, and the exporter wrote none of them. A score left
 * the app as pitches and durations — correct, and stripped of everything that
 * made it a piece of music rather than a list of notes.
 *
 * The one deliberate omission is beams. MusicXML can carry them, but every
 * program re-beams on import by default, so writing them buys nothing and
 * getting them wrong looks like a bug in the export.
 */
import { keySignatureCount, pitchName } from "@/lib/score";
import { type Clef, instrumentById } from "@/lib/studio/instruments";
import {
  type Articulation,
  type Dynamic,
  type Fermata,
  type Measure,
  type Ornament,
  type RepeatDirective,
  type StudioNote,
  type StudioScore,
  chordSymbolsOf,
  keyAt,
  measureOffsets,
  meterAt,
  pedalsOf,
  voltaRun,
} from "@/lib/studio/model";
import { CHORD_QUALITIES } from "@/lib/studio/chords";

/* -------------------------------------------------------------------------- */
/* Small pieces                                                               */
/* -------------------------------------------------------------------------- */

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** One tick is a sixteenth of a whole note; four divisions a tick keeps 64ths whole. */
const DIVISIONS = 16;
const div = (ticks: number) => Math.max(1, Math.round(ticks * 4));

export function xmlType(ticks: number): string {
  if (ticks >= 16) return "whole";
  if (ticks >= 8) return "half";
  if (ticks >= 4) return "quarter";
  if (ticks >= 2) return "eighth";
  if (ticks >= 1) return "16th";
  if (ticks >= 0.5) return "32nd";
  return "64th";
}

function clefXml(clef: Clef, staffNo: number): string {
  const n = staffNo ? ` number="${staffNo}"` : "";
  if (clef === "percussion") return `<clef${n}><sign>percussion</sign></clef>`;
  if (clef === "tab") return `<clef${n}><sign>TAB</sign><line>5</line></clef>`;
  const sign = clef === "bass" ? "F" : clef === "alto" || clef === "tenor" ? "C" : "G";
  const line = clef === "bass" ? 4 : clef === "alto" ? 3 : clef === "tenor" ? 4 : 2;
  return `<clef${n}><sign>${sign}</sign><line>${line}</line></clef>`;
}

/** MusicXML spells these out as elements, so the names must match the spec. */
const ARTICULATION_EL: Record<Articulation, string> = {
  staccato: "staccato",
  staccatissimo: "staccatissimo",
  tenuto: "tenuto",
  accent: "accent",
  marcato: "strong-accent",
  portato: "detached-legato",
};

/**
 * Ornaments split across three different MusicXML parents: <ornaments>,
 * <articulations> and <technical>, and a few are not ornaments at all but
 * separate elements beside the note. Grouping them here keeps that mess in
 * one place rather than spread through the note writer.
 */
const ORNAMENT_EL: Partial<Record<Ornament, string>> = {
  trill: "trill-mark",
  "trill-sharp": "trill-mark",
  "trill-flat": "trill-mark",
  mordent: "mordent",
  "inverted-mordent": "inverted-mordent",
  turn: "turn",
  "inverted-turn": "inverted-turn",
};
const TREMOLO_MARKS: Partial<Record<Ornament, number>> = {
  "tremolo-1": 1,
  "tremolo-2": 2,
  "tremolo-3": 3,
};
/** These print beside the note rather than inside <ornaments>. */
const SLIDE_EL: Partial<Record<Ornament, string>> = {
  glissando: "glissando",
  portamento: "slide",
};
const JAZZ_EL: Partial<Record<Ornament, string>> = {
  bend: "bend",
  fall: "falloff",
  doit: "doit",
};

const NOTEHEAD_EL: Record<string, string> = {
  cross: "x",
  diamond: "diamond",
  triangle: "triangle",
  slash: "slash",
};

/* -------------------------------------------------------------------------- */
/* Notes                                                                      */
/* -------------------------------------------------------------------------- */

/** How a note is spelled, as step/alter/octave. */
function spelling(
  n: StudioNote,
  key: string,
  mode: "major" | "minor"
): { step: string; alter: number; octave: number } {
  const NATURAL: Record<number, string> = { 0: "C", 2: "D", 4: "E", 5: "F", 7: "G", 9: "A", 11: "B" };
  if (n.spell !== undefined && NATURAL[(((n.pitch - n.spell) % 12) + 12) % 12]) {
    const natural = n.pitch - n.spell;
    return {
      step: NATURAL[((natural % 12) + 12) % 12],
      alter: n.spell,
      octave: Math.floor(natural / 12) - 1,
    };
  }
  const name = pitchName(n.pitch, key, mode);
  return {
    step: name[0],
    alter: name.includes("#") ? 1 : name.includes("b") ? -1 : 0,
    octave: parseInt(name.replace(/[^-\d]/g, ""), 10),
  };
}

/**
 * Everything that hangs off one note.
 *
 * `tieStop` cannot be read from the note itself: a note is tied FORWARD by its
 * own `tie` flag, and tied INTO by the previous note at the same pitch. Both
 * halves have to be written or the tie renders as a slur-less pair of notes,
 * which is what the old exporter produced — it emitted `<tie type="start"/>`
 * with no stop, and no `<tied>` element at all, so even the start was sound
 * without notation.
 */
/**
 * The <fermata> shape for each of the model's four holds.
 *
 * MusicXML keeps the shape in the element's text and which way up it is in the
 * `type` attribute, so a fermata above the staff is `type="upright"` with the
 * shape as content. "normal" is the default shape and is written as an empty
 * element, which is what every reader expects to see.
 */
const FERMATA_SHAPE: Record<Fermata, string> = {
  normal: "",
  angled: "angled",
  square: "square",
  "very-long": "double-angled",
};

function notationsXml(
  n: StudioNote,
  opts: { tieStop: boolean; tupletStart: boolean; tupletStop: boolean }
): string {
  const notations: string[] = [];

  if (opts.tieStop) notations.push(`<tied type="stop"/>`);
  if (n.tie) notations.push(`<tied type="start"/>`);
  if (n.slur === "begin") notations.push(`<slur type="start" number="1"/>`);
  if (n.slur === "end") notations.push(`<slur type="stop" number="1"/>`);

  if (n.tuplet && (opts.tupletStart || opts.tupletStop)) {
    if (opts.tupletStart) notations.push(`<tuplet type="start" bracket="yes"/>`);
    if (opts.tupletStop) notations.push(`<tuplet type="stop"/>`);
  }

  const arts = (n.articulations ?? []).map((a) => `<${ARTICULATION_EL[a]}/>`).join("");
  if (arts) notations.push(`<articulations>${arts}</articulations>`);
  // The note's own field, now that it has one. This used to be sniffed out of
  // a technique text reading the word "fermata", because the model had nowhere
  // to put one — see the comment that used to sit at the bottom of this file.
  if (n.fermata) {
    const shape = FERMATA_SHAPE[n.fermata];
    notations.push(`<fermata type="upright">${shape}</fermata>`);
  }

  const orns: string[] = [];
  for (const o of n.ornaments ?? []) {
    const el = ORNAMENT_EL[o];
    if (el) {
      // The sharp and flat trills carry their accidental as a child.
      if (o === "trill-sharp") orns.push(`<trill-mark/><accidental-mark>sharp</accidental-mark>`);
      else if (o === "trill-flat") orns.push(`<trill-mark/><accidental-mark>flat</accidental-mark>`);
      else orns.push(`<${el}/>`);
    }
    const marks = TREMOLO_MARKS[o];
    if (marks) orns.push(`<tremolo type="single">${marks}</tremolo>`);
  }
  if (orns.length) notations.push(`<ornaments>${orns.join("")}</ornaments>`);

  for (const o of n.ornaments ?? []) {
    const slide = SLIDE_EL[o];
    if (slide) notations.push(`<${slide} type="start" number="1"/>`);
    const jazz = JAZZ_EL[o];
    if (jazz) notations.push(`<articulations><${jazz}/></articulations>`);
  }

  // Arpeggio is a notation in its own right, not an ornament element.
  for (const o of n.ornaments ?? []) {
    if (o === "arpeggio") notations.push(`<arpeggiate/>`);
    if (o === "arpeggio-up") notations.push(`<arpeggiate direction="up"/>`);
    if (o === "arpeggio-down") notations.push(`<arpeggiate direction="down"/>`);
  }

  // Fingering and tablature are both <technical>, and a note can carry both:
  // a guitarist's fretting hand is a fingering on a string at a fret.
  const technical: string[] = [];
  if (n.fingering) technical.push(`<fingering>${escapeXml(n.fingering)}</fingering>`);
  if (n.tab) technical.push(`<string>${n.tab.string}</string><fret>${n.tab.fret}</fret>`);
  if (technical.length) notations.push(`<technical>${technical.join("")}</technical>`);

  if (!notations.length) return "";
  return `<notations>${notations.join("")}</notations>`;
}

function noteXml(
  n: StudioNote,
  key: string,
  mode: "major" | "minor",
  voice: number,
  staffNo: number,
  chord: boolean,
  opts: { tieStop: boolean; tupletStart: boolean; tupletStop: boolean; lyrics: string[] }
): string {
  const { step, alter, octave } = spelling(n, key, mode);
  const isGrace = (n.ornaments ?? []).some((o) => o === "grace" || o === "appoggiatura");
  const slashed = (n.ornaments ?? []).includes("grace");

  // A tuplet's printed duration is its played duration scaled by the ratio.
  const timeMod = n.tuplet
    ? `<time-modification><actual-notes>${n.tuplet.ratio[0]}</actual-notes>` +
      `<normal-notes>${n.tuplet.ratio[1]}</normal-notes></time-modification>`
    : "";

  return (
    `      <note>` +
    (isGrace ? `<grace${slashed ? ` slash="yes"` : ""}/>` : "") +
    (chord ? "<chord/>" : "") +
    `<pitch><step>${step}</step>` +
    (alter ? `<alter>${alter}</alter>` : "") +
    `<octave>${octave}</octave></pitch>` +
    // A grace note has no duration of its own in MusicXML.
    (isGrace ? "" : `<duration>${div(n.duration)}</duration>`) +
    // <tie> is the sound, <tied> inside <notations> is the notation. Both.
    (opts.tieStop ? `<tie type="stop"/>` : "") +
    (n.tie ? `<tie type="start"/>` : "") +
    `<voice>${voice}</voice>` +
    `<type>${xmlType(n.duration)}</type>` +
    (n.dots ? "<dot/>".repeat(n.dots) : "") +
    (n.notehead && NOTEHEAD_EL[n.notehead]
      ? `<notehead>${NOTEHEAD_EL[n.notehead]}</notehead>`
      : "") +
    (n.stem && n.stem !== "auto" ? `<stem>${n.stem}</stem>` : "") +
    timeMod +
    (staffNo ? `<staff>${staffNo}</staff>` : "") +
    notationsXml(n, opts) +
    opts.lyrics
      .map(
        (text, i) =>
          `<lyric number="${i + 1}"><syllabic>single</syllabic><text>${escapeXml(text)}</text></lyric>`
      )
      .join("") +
    `</note>\n`
  );
}

function restXml(ticks: number, voice: number, staffNo: number, fermata?: Fermata): string {
  return (
    `      <note><rest/><duration>${div(ticks)}</duration>` +
    `<voice>${voice}</voice><type>${xmlType(ticks)}</type>` +
    (staffNo ? `<staff>${staffNo}</staff>` : "") +
    // A held silence. The arch goes over the rest exactly as it goes over a
    // note, and MusicXML spells it the same way.
    (fermata
      ? `<notations><fermata type="upright">${FERMATA_SHAPE[fermata]}</fermata></notations>`
      : "") +
    `</note>\n`
  );
}

/* -------------------------------------------------------------------------- */
/* Directions: the marks that sit above or below the staff                    */
/* -------------------------------------------------------------------------- */

const DYNAMIC_EL: Record<Dynamic, string> = {
  ppp: "ppp", pp: "pp", p: "p", mp: "mp", mf: "mf", f: "f", ff: "ff", fff: "fff",
  sfz: "sfz", fp: "fp",
};

function directionsXml(
  score: StudioScore,
  partIndex: number,
  staffIndex: number,
  from: number,
  to: number,
  staffNo: number
): string {
  const staff = score.parts[partIndex].staves[staffIndex];
  const out: string[] = [];
  const at = (x: { start: number }) => x.start >= from && x.start < to;
  const place = (inner: string, placement = "below") =>
    `      <direction placement="${placement}">${inner}` +
    (staffNo ? `<staff>${staffNo}</staff>` : "") +
    `</direction>\n`;

  for (const d of staff.dynamics.filter(at)) {
    out.push(place(`<direction-type><dynamics><${DYNAMIC_EL[d.value]}/></dynamics></direction-type>`));
  }
  for (const h of staff.hairpins.filter(at)) {
    const type = h.kind === "crescendo" ? "crescendo" : "diminuendo";
    out.push(place(`<direction-type><wedge type="${type}"/></direction-type>`));
    // The stop has to be emitted too, or the wedge runs to the end of the piece.
    if (h.start + h.duration >= from && h.start + h.duration < to) {
      out.push(place(`<direction-type><wedge type="stop"/></direction-type>`));
    }
  }
  for (const o of staff.octaveLines.filter(at)) {
    // MusicXML counts 8va as size 8 going "down" for the printed notes.
    const size = Math.abs(o.shift) === 2 ? 15 : 8;
    const type = o.shift > 0 ? "down" : "up";
    out.push(
      place(`<direction-type><octave-shift type="${type}" size="${size}"/></direction-type>`, "above")
    );
  }
  /*
   * Pedal lines.
   *
   * Three <pedal> elements per line, not one: start, a change at every retake,
   * and stop. MusicXML has no "duration" on a pedal — the line is defined by
   * where it starts and where it stops — so a line whose stop is never written
   * runs to the end of the part in every reader. `line="yes"` asks for the
   * modern bracket rather than the bare "Ped." word.
   *
   * Sostenuto is its own element. Una corda has none at all, so it goes out as
   * the words a pianist actually reads, which is what it looks like on paper.
   */
  for (const ped of pedalsOf(staff)) {
    const end = ped.start + ped.duration;
    if (ped.kind === "una-corda") {
      if (at(ped)) {
        out.push(place(`<direction-type><words>una corda</words></direction-type>`));
      }
      if (end >= from && end < to) {
        out.push(place(`<direction-type><words>tre corde</words></direction-type>`));
      }
      continue;
    }
    const el = ped.kind === "sostenuto" ? "sostenuto" : "pedal";
    if (at(ped)) {
      out.push(place(`<direction-type><${el} type="start" line="yes"/></direction-type>`));
    }
    for (const r of ped.retakes ?? []) {
      if (r > ped.start && r < end && r >= from && r < to) {
        out.push(place(`<direction-type><${el} type="change" line="yes"/></direction-type>`));
      }
    }
    if (end >= from && end < to) {
      out.push(place(`<direction-type><${el} type="stop" line="yes"/></direction-type>`));
    }
  }

  /*
   * Chord symbols, as <harmony> rather than as floating words.
   *
   * <harmony> is not a <direction>, so it is emitted at this level but without
   * the wrapper. The root is given as a step plus an alter, the quality as a
   * <kind> from MusicXML's fixed vocabulary — see lib/studio/chords.ts, which
   * is the one place that knows the mapping — and anything the vocabulary
   * cannot say comes out as <degree> elements after it. The `text` attribute
   * carries what we would print, so a reader that recognises the kind can
   * engrave it its own way and one that does not can still show the symbol.
   */
  for (const c of chordSymbolsOf(staff).filter(at)) {
    const spec = CHORD_QUALITIES[c.quality];
    if (!spec) continue;
    const degrees = (spec.degrees ?? [])
      .map(
        (d) =>
          `<degree><degree-value>${d.value}</degree-value>` +
          `<degree-alter>${d.alter}</degree-alter>` +
          `<degree-type>${d.type}</degree-type></degree>`
      )
      .join("");
    out.push(
      `      <harmony>` +
        rootXml("root", c.root) +
        `<kind text="${escapeXml(spec.suffix)}">${spec.kind}</kind>` +
        (c.bass ? rootXml("bass", c.bass) : "") +
        degrees +
        (staffNo ? `<staff>${staffNo}</staff>` : "") +
        `</harmony>\n`
    );
  }

  for (const t of staff.texts.filter(at)) {
    if (t.kind === "lyric") continue; // lyrics attach to notes, not directions
    if (t.kind === "tempo") {
      out.push(
        place(`<direction-type><words font-weight="bold">${escapeXml(t.text)}</words></direction-type>`, "above")
      );
    } else if (t.kind === "rehearsal") {
      out.push(place(`<direction-type><rehearsal>${escapeXml(t.text)}</rehearsal></direction-type>`, "above"));
    } else {
      const above = t.kind === "technique" || t.kind === "system";
      out.push(
        place(`<direction-type><words>${escapeXml(t.text)}</words></direction-type>`, above ? "above" : "below")
      );
    }
  }
  return out.join("");
}

/**
 * A chord root or slash bass, as MusicXML spells one.
 *
 * The element names differ between the two ("root-step" against "bass-step")
 * but the shape is identical, so the caller passes which it wants. An alter of
 * zero is left out: writing `<root-alter>0</root-alter>` is legal but some
 * readers print a redundant natural beside the letter.
 */
function rootXml(which: "root" | "bass", note: string): string {
  const m = /^([A-G])(#{1,2}|b{1,2}|)$/.exec(note.trim());
  if (!m) return "";
  const alter = m[2].startsWith("#") ? m[2].length : m[2].startsWith("b") ? -m[2].length : 0;
  return (
    `<${which}><${which}-step>${m[1]}</${which}-step>` +
    (alter !== 0 ? `<${which}-alter>${alter}</${which}-alter>` : "") +
    `</${which}>`
  );
}

/* -------------------------------------------------------------------------- */
/* Navigation: segno, coda and the words that send you to them                */
/* -------------------------------------------------------------------------- */

/**
 * The words printed for each directive, and the playback attributes that make
 * them do something rather than merely say something.
 *
 * MusicXML splits a jump into two halves. The <words> or <segno>/<coda> element
 * is what gets *printed*; the attributes on <sound> are what a playing program
 * obeys. Emitting only the first gives a score that looks right and plays
 * straight through, which is the mistake this table exists to avoid.
 *
 * `dacapo`, `dalsegno`, `tocoda` and `fine` are the four attributes MusicXML
 * defines. "al Fine" is a `dalsegno`/`dacapo` jump plus a `fine` on the last
 * bar, so the directive itself carries only the jump — the Fine is its own
 * measure's directive, which is how it is printed too.
 */
const DIRECTIVE_XML: Record<RepeatDirective, { words: string; sound: string }> = {
  fine: { words: "Fine", sound: `fine="yes"` },
  "to-coda": { words: "To Coda", sound: `tocoda="coda"` },
  "d.c.": { words: "D.C.", sound: `dacapo="yes"` },
  "d.s.": { words: "D.S.", sound: `dalsegno="segno"` },
  "d.c.-al-fine": { words: "D.C. al Fine", sound: `dacapo="yes"` },
  "d.s.-al-fine": { words: "D.S. al Fine", sound: `dalsegno="segno"` },
  "d.c.-al-coda": { words: "D.C. al Coda", sound: `dacapo="yes"` },
  "d.s.-al-coda": { words: "D.S. al Coda", sound: `dalsegno="segno"` },
};

/** The sign at a measure's head, printed and obeyable. */
function signXml(measure: Measure): string {
  if (!measure.sign) return "";
  const el = measure.sign === "segno" ? "segno" : "coda";
  return (
    `      <direction placement="above">` +
    `<direction-type><${el}/></direction-type>` +
    `<sound ${el}="${el}"/>` +
    `</direction>\n`
  );
}

/** The instruction at a measure's end. */
function directiveXml(measure: Measure): string {
  if (!measure.directive) return "";
  const d = DIRECTIVE_XML[measure.directive];
  if (!d) return "";
  return (
    `      <direction placement="above">` +
    `<direction-type><words>${escapeXml(d.words)}</words></direction-type>` +
    `<sound ${d.sound}/>` +
    `</direction>\n`
  );
}

/* -------------------------------------------------------------------------- */
/* Barlines and repeats                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The barlines at a measure's two ends, including the volta bracket.
 *
 * MusicXML puts a volta inside the <barline> elements rather than anywhere
 * near the measure it covers: `<ending type="start" number="1">` on the left
 * barline, `type="stop"` or `"discontinue"` on the right. "stop" draws a
 * closing leg and "discontinue" leaves the bracket open, which is the
 * difference between a first-time bar and a second-time bar that runs on into
 * the rest of the piece — and getting it wrong prints a leg that tells a
 * player to stop where the music does not.
 *
 * `times` on a backward repeat is how "Play 3 times" is said. Without it every
 * repeat is taken exactly twice, whatever the words above the staff say.
 */
function barlineXml(
  measure: Measure,
  /** The bracket this measure is inside, from `voltaRun`. */
  volta: ReturnType<typeof voltaRun>
): { left: string; right: string } {
  const style = measure.barline;
  const times =
    measure.repeatTimes && measure.repeatTimes >= 3 ? ` times="${measure.repeatTimes}"` : "";

  const endingStart = volta?.starts
    ? `<ending type="start" number="${volta.passes.join(",")}"/>`
    : "";
  const endingStop = volta?.ends
    ? `<ending type="${volta.open ? "discontinue" : "stop"}" number="${volta.passes.join(",")}"/>`
    : "";

  const wrap = (location: "left" | "right", bar: string, extra: string) =>
    bar || extra
      ? `      <barline location="${location}">${bar}${extra}</barline>\n`
      : "";

  const bars = (() => {
    switch (style) {
      case "double":
        return { left: "", right: `<bar-style>light-light</bar-style>` };
      case "final":
        return { left: "", right: `<bar-style>light-heavy</bar-style>` };
      case "dashed":
        return { left: "", right: `<bar-style>dashed</bar-style>` };
      case "repeat-start":
        return {
          left: `<bar-style>heavy-light</bar-style><repeat direction="forward"/>`,
          right: "",
        };
      case "repeat-end":
        return {
          left: "",
          right: `<bar-style>light-heavy</bar-style><repeat direction="backward"${times}/>`,
        };
      case "repeat-both":
        return {
          left: `<bar-style>heavy-light</bar-style><repeat direction="forward"/>`,
          right: `<bar-style>light-heavy</bar-style><repeat direction="backward"${times}/>`,
        };
      default:
        return { left: "", right: "" };
    }
  })();

  // The bracket opens before the repeat sign and closes after it, which is the
  // order MusicXML requires inside a <barline>.
  return {
    left: wrap("left", bars.left, endingStart),
    right: wrap("right", bars.right, endingStop),
  };
}

/* -------------------------------------------------------------------------- */
/* The whole score                                                            */
/* -------------------------------------------------------------------------- */

export function scoreToMusicXml(score: StudioScore): string {
  const { starts } = measureOffsets(score);

  const partList = score.parts
    .map((p, i) => {
      const inst = instrumentById(p.instrumentId);
      return (
        `    <score-part id="P${i + 1}">` +
        `<part-name>${escapeXml(p.name ?? inst.name)}</part-name>` +
        (p.shortName ? `<part-abbreviation>${escapeXml(p.shortName)}</part-abbreviation>` : "") +
        `</score-part>`
      );
    })
    .join("\n");

  const parts = score.parts
    .map((p, pi) => {
      const measures = score.measures
        .map((measure, mi) => {
          const from = starts[mi];
          const meter = meterAt(score, mi);
          const barTicks = measure.pickupTicks ?? (16 / meter.unit) * meter.beats;
          const to = from + barTicks;
          const { key, mode } = keyAt(score, mi);

          // Attributes are written at the first measure and again wherever the
          // key or meter actually changes. Writing them only at measure one is
          // what made every later change vanish on export.
          const prevMeter = mi > 0 ? meterAt(score, mi - 1) : null;
          const prevKey = mi > 0 ? keyAt(score, mi - 1) : null;
          const meterChanged =
            !prevMeter || prevMeter.beats !== meter.beats || prevMeter.unit !== meter.unit;
          const keyChanged = !prevKey || prevKey.key !== key || prevKey.mode !== mode;

          const bits: string[] = [];
          if (mi === 0) bits.push(`<divisions>${DIVISIONS}</divisions>`);
          if (keyChanged) bits.push(`<key><fifths>${keySignatureCount(key, mode)}</fifths></key>`);
          if (meterChanged)
            bits.push(`<time><beats>${meter.beats}</beats><beat-type>${meter.unit}</beat-type></time>`);
          if (mi === 0) {
            if (p.staves.length > 1) bits.push(`<staves>${p.staves.length}</staves>`);
            bits.push(
              ...p.staves.map((st, si) => clefXml(st.clef, p.staves.length > 1 ? si + 1 : 0))
            );
          }
          // A clef change inside this measure belongs in its attributes too.
          p.staves.forEach((st, si) => {
            for (const ch of st.clefChanges ?? []) {
              if (ch.start >= from && ch.start < to && ch.start !== 0) {
                bits.push(clefXml(ch.clef, p.staves.length > 1 ? si + 1 : 0));
              }
            }
          });
          const attrs = bits.length ? `      <attributes>${bits.join("")}</attributes>\n` : "";

          const bars = barlineXml(measure, voltaRun(score.measures, mi));
          const rehearsal = measure.rehearsal
            ? `      <direction placement="above"><direction-type>` +
              `<rehearsal>${escapeXml(measure.rehearsal)}</rehearsal></direction-type></direction>\n`
            : "";

          const streams = p.staves.map((st, si) => {
            const staffNo = p.staves.length > 1 ? si + 1 : 0;
            let out = directionsXml(score, pi, si, from, to, staffNo);
            let used = 0;
            st.voices.forEach((v, vi) => {
              const voiceNo = si * 4 + vi + 1;
              if (used > 0) out += `      <backup><duration>${div(used)}</duration></backup>\n`;
              let cursor = from;
              const inBar = v.notes
                .filter((n) => n.start >= from && n.start < to)
                .sort((a, b) => a.start - b.start || a.pitch - b.pitch);
              const onsets: { at: number; notes: StudioNote[] }[] = [];
              for (const n of inBar) {
                const last = onsets[onsets.length - 1];
                if (last && last.at === n.start) last.notes.push(n);
                else onsets.push({ at: n.start, notes: [n] });
              }
              for (const group of onsets) {
                if (group.at > cursor) {
                  out += restXml(group.at - cursor, voiceNo, staffNo);
                  cursor = group.at;
                }
                const len = Math.max(...group.notes.map((n) => n.duration));
                group.notes.forEach((n, ni) => {
                  out += noteXml(n, key, mode, voiceNo, staffNo, ni > 0, {
                    tieStop: tiedInto(v.notes, n),
                    tupletStart: isTupletEdge(v.notes, n, "start"),
                    tupletStop: isTupletEdge(v.notes, n, "stop"),
                    lyrics: lyricsFor(st.texts, n),
                  });
                });
                cursor = group.at + len;
              }
              if (cursor < to) {
                // A rest the writer placed on this beat may be held; an implied
                // silence never is, so only a real StudioRest contributes one.
                const held = v.rests.find(
                  (r) => r.fermata && Math.abs(r.start - cursor) < 1e-9
                );
                out += restXml(to - cursor, voiceNo, staffNo, held?.fermata);
              }
              used = to - from;
            });
            if (used === 0) out += restXml(barTicks, si * 4 + 1, staffNo);
            return out;
          });

          return (
            `    <measure number="${mi + 1}">\n` +
            attrs +
            bars.left +
            rehearsal +
            // The sign is a place, so it is printed before the music of the bar
            // it marks; the directive is an instruction to leave, so it comes
            // after. Writing them the other way round would send a reader back
            // from the wrong bar.
            signXml(measure) +
            streams.join(`      <backup><duration>${div(barTicks)}</duration></backup>\n`) +
            directiveXml(measure) +
            bars.right +
            `    </measure>`
          );
        })
        .join("\n");

      return `  <part id="P${pi + 1}">\n${measures}\n  </part>`;
    })
    .join("\n");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n` +
    `<score-partwise version="4.0">\n` +
    `  <work><work-title>${escapeXml(score.info.title)}</work-title></work>\n` +
    `  <identification><creator type="composer">${escapeXml(score.info.composer)}</creator>` +
    (score.info.arranger
      ? `<creator type="arranger">${escapeXml(score.info.arranger)}</creator>`
      : "") +
    `<encoding><software>Composer's Dungeon</software></encoding>` +
    `</identification>\n` +
    `  <part-list>\n${partList}\n  </part-list>\n${parts}\n</score-partwise>\n`
  );
}

/* -------------------------------------------------------------------------- */
/* The questions a single note cannot answer about itself                     */
/* -------------------------------------------------------------------------- */

/** Is some earlier note at this pitch tied into this one? */
function tiedInto(notes: StudioNote[], n: StudioNote): boolean {
  return notes.some(
    (o) => o.tie && o.pitch === n.pitch && Math.abs(o.start + o.duration - n.start) < 1e-9
  );
}

/** First or last member of its tuplet, which is where the bracket is drawn. */
function isTupletEdge(notes: StudioNote[], n: StudioNote, which: "start" | "stop"): boolean {
  if (!n.tuplet) return false;
  const members = notes
    .filter((o) => o.tuplet?.id === n.tuplet!.id)
    .sort((a, b) => a.start - b.start);
  if (!members.length) return false;
  return which === "start" ? members[0].id === n.id : members[members.length - 1].id === n.id;
}

/** Lyric syllables landing on this note, in verse order. */
function lyricsFor(
  texts: { start: number; kind: string; text: string; verse?: number }[],
  n: StudioNote
): string[] {
  return texts
    .filter((t) => t.kind === "lyric" && Math.abs(t.start - n.start) < 1e-9)
    .sort((a, b) => (a.verse ?? 1) - (b.verse ?? 1))
    .map((t) => t.text);
}
