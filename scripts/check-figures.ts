/**
 * Figure integrity check.
 *
 * A lesson figure is a claim about music made in data: these notes are a major
 * triad, this span is a whole step, this bar is the dominant. Prose can be
 * vague and get away with it; a figure cannot, because someone will read the
 * notes off the page and play them. Nothing else in the build would notice a
 * figure that says "V" over a chord that is not the dominant, or labels a
 * minor third "W" — it would simply teach the wrong thing, forever, to the
 * people least able to catch it.
 *
 * So this derives the music from first principles and compares. It also
 * catches the silent failure mode of keying figures by section heading: a
 * heading typo drops the figure with no error anywhere.
 *
 *   npx tsx scripts/check-figures.ts
 */

import { beginnerLessons } from "../prisma/seed-data/lessons-beginner";
import { advancedLessons } from "../prisma/seed-data/lessons-advanced";
import { curriculumLessons } from "../prisma/seed-data/lessons-curriculum";
import { orchestralLessons } from "../prisma/seed-data/lessons-orchestral";
import { lessonDetail } from "../prisma/seed-data/lesson-detail";
import { argumentFigures, coreFigures, lessonFigures } from "../prisma/seed-data/lesson-figures";
import { placeNotes, readFigure, type LessonFigure } from "../src/lib/lesson-figure";
import {
  keyPitchClass,
  keySignatureCount,
  scaleSteps,
  ticksPerBar,
  triadFor,
} from "../src/lib/score";
import { noteValue, stepForPitch } from "../src/lib/studio/staff";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);

const lessons = [
  ...beginnerLessons,
  ...advancedLessons,
  ...curriculumLessons,
  ...orchestralLessons,
];

/** Every heading a lesson actually has, including the detail file's extras. */
const headingsBySlug = new Map<string, Set<string>>();
for (const lesson of lessons) {
  const extra = lessonDetail[lesson.slug]?.extraSections ?? [];
  headingsBySlug.set(
    lesson.slug,
    new Set([...lesson.content, ...extra].map((s) => s.heading))
  );
}

/* -------------------------------------------------------------------------- */
/* Keys                                                                        */
/* -------------------------------------------------------------------------- */

const CIRCLE_MAJOR = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
const CIRCLE_MINOR = ["a", "e", "b", "f#", "c#", "g#", "d#", "bb", "f", "c", "g", "d"];


/* -------------------------------------------------------------------------- */
/* Counterpoint                                                                */
/* -------------------------------------------------------------------------- */

/** Consonant interval classes: unison, minor/major third, fifth, minor/major sixth. */
const CONSONANT = new Set([0, 3, 4, 7, 8, 9]);
/** Perfect intervals, which is what "parallel" is about. */
const PERFECT = new Set([0, 7]);

/**
 * Checks a figure against what its caption says.
 *
 * Deliberately exact rather than clever. Every claim here is only made about
 * a two-voice texture, because that is where "contrary motion" and "parallel
 * fifths" have one unambiguous meaning; applied to four parts the same words
 * need voice assignment, and a checker that guesses at voices would report
 * things that are not true. Asserting one of these on a thicker texture is
 * reported as a mistake in the assertion rather than silently approximated.
 */
function checkAssertions(
  where: string,
  figure: Extract<LessonFigure, { kind: "staff" }>,
  placed: ReturnType<typeof placeNotes>
) {
  const want = figure.assert;
  if (!want) return;
  const sounding = placed.filter((n) => !n.rest);
  const onsets = Array.from(new Set(sounding.map((n) => n.start))).sort((a, b) => a - b);

  /** Everything audible at a moment, including notes still being held. */
  const at = (t: number) =>
    sounding
      .filter((n) => n.start <= t && n.start + n.duration > t)
      .map((n) => n.pitch)
      .sort((a, b) => a - b);

  const moments = onsets.map((t) => ({ t, pitches: at(t) }));

  if (want.consonant) {
    for (const moment of moments) {
      for (let i = 0; i < moment.pitches.length - 1; i++) {
        for (let j = i + 1; j < moment.pitches.length; j++) {
          const semis = moment.pitches[j] - moment.pitches[i];
          if (!CONSONANT.has(semis % 12)) {
            fail(
              `${where}: claims every interval is consonant, but at tick ${moment.t} ` +
                `${moment.pitches[i]} against ${moment.pitches[j]} is ${semis} semitones`
            );
          }
        }
      }
    }
  }

  const twoVoice = moments.every((m) => m.pitches.length === 2);
  const needsTwo = want.contraryMotion || want.noParallels || want.hasParallels;
  if (needsTwo && !twoVoice) {
    fail(
      `${where}: motion and parallels are asserted, but this figure is not two voices throughout — ` +
        `the claim cannot be derived without guessing which note belongs to which line`
    );
    return;
  }

  if (want.contraryMotion) {
    for (let i = 1; i < moments.length; i++) {
      const [lowA, highA] = moments[i - 1].pitches;
      const [lowB, highB] = moments[i].pitches;
      const lower = Math.sign(lowB - lowA);
      const upper = Math.sign(highB - highA);
      if (lower === 0 || upper === 0) continue; // oblique: one voice holds
      if (lower === upper) {
        fail(
          `${where}: claims contrary motion, but into tick ${moments[i].t} both voices move ` +
            (lower > 0 ? "up" : "down")
        );
      }
    }
  }

  if (want.noParallels || want.hasParallels) {
    let found = 0;
    for (let i = 1; i < moments.length; i++) {
      const [lowA, highA] = moments[i - 1].pitches;
      const [lowB, highB] = moments[i].pitches;
      if (lowA === lowB || highA === highB) continue;
      const before = (highA - lowA) % 12;
      const after = (highB - lowB) % 12;
      if (before !== after || !PERFECT.has(before)) continue;
      if (Math.sign(lowB - lowA) !== Math.sign(highB - highA)) continue;
      found += 1;
      if (want.noParallels) {
        fail(
          `${where}: claims no parallels, but the voices move in ${
            before === 0 ? "parallel octaves" : "parallel fifths"
          } into tick ${moments[i].t}`
        );
      }
    }
    if (want.hasParallels && found === 0) {
      fail(`${where}: exists to show parallel perfects, and there are none in it`);
    }
  }

  if (want.dissonancesPassing) {
    // Which position counts as strong has to be exact, or the check reports
    // things that are not errors. Calling every other beat strong failed a
    // correct second-species figure, because with a whole-note cantus the
    // weak half of the bar lands on beat three. The one position that is
    // unarguably strong in any metre is the downbeat, so that is the claim:
    // no dissonance on a bar line, and every dissonance stepped into and out
    // of. Nothing weaker, nothing guessed.
    const bar = ticksPerBar(figure.meter ?? { beats: 4, unit: 4 });
    const line = sounding.filter((n) => n.at === undefined);
    for (const moment of moments) {
      let dissonant = false;
      for (let i = 0; i < moment.pitches.length - 1; i++) {
        for (let j = i + 1; j < moment.pitches.length; j++) {
          if (!CONSONANT.has((moment.pitches[j] - moment.pitches[i]) % 12)) dissonant = true;
        }
      }
      if (!dissonant) continue;
      if (moment.t % bar === 0) {
        fail(
          `${where}: claims dissonances only pass through, but tick ${moment.t} is a downbeat and is dissonant`
        );
        continue;
      }
      const idx = line.findIndex((n) => n.start === moment.t);
      const before = line[idx - 1];
      const after = line[idx + 1];
      if (!before || !after) {
        fail(`${where}: the dissonance at tick ${moment.t} is not passed into and out of`);
        continue;
      }
      const stepIn = Math.abs(line[idx].pitch - before.pitch);
      const stepOut = Math.abs(after.pitch - line[idx].pitch);
      if (stepIn > 2 || stepOut > 2) {
        fail(
          `${where}: the dissonance at tick ${moment.t} is reached by ${stepIn} and left by ${stepOut} semitones — a passing tone moves by step`
        );
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Checks                                                                      */
/* -------------------------------------------------------------------------- */

let figureCount = 0;
let staffNotes = 0;
let harmonyClaims = 0;
let stepClaims = 0;

function checkStaff(where: string, figure: Extract<LessonFigure, { kind: "staff" }>) {
  const key = figure.key ?? "C";
  const mode = figure.mode ?? "major";
  if (keySignatureCount(key, mode) === 0 && key !== "C" && key !== "A") {
    // Not an error by itself, but an unrecognised key name silently becomes C.
    if (!CIRCLE_MAJOR.includes(key) && !CIRCLE_MAJOR.includes(key.toUpperCase())) {
      fail(`${where}: "${key}" is not a key this app knows, so it would be drawn in C`);
    }
  }

  const placed = placeNotes(figure.notes);
  staffNotes += placed.length;

  for (const note of placed) {
    if (note.rest) continue;
    if (note.pitch < 21 || note.pitch > 108) {
      fail(`${where}: pitch ${note.pitch} is off a piano keyboard`);
    }
    if (note.duration <= 0) fail(`${where}: a note of ${note.duration} ticks cannot be drawn`);
    const value = noteValue(note.duration);
    const written = value.base * (value.dots === 1 ? 1.5 : value.dots === 2 ? 1.75 : 1);
    if (Math.abs(written - note.duration) > 0.01) {
      fail(
        `${where}: ${note.duration} ticks is not a note value — it would be drawn as ${written}`
      );
    }
  }

  // Two notes cannot share a pitch at the same instant: on a staff that is one
  // notehead drawn twice, and it is always a copy-paste slip.
  const seen = new Map<string, number>();
  for (const note of placed) {
    if (note.rest) continue;
    const at = `${note.start}:${note.pitch}`;
    seen.set(at, (seen.get(at) ?? 0) + 1);
  }
  for (const [at, n] of Array.from(seen)) {
    if (n > 1) fail(`${where}: two notes at the same place (${at})`);
  }

  // A note far outside the staff is legal and unreadable. Five ledger lines is
  // where a figure stops teaching and starts being decoded, and the fix is
  // always available: use the other clef, or a grand staff.
  for (const note of placed) {
    if (note.rest) continue;
    const staffClef = figure.grandStaff
      ? note.staff === 1
        ? "bass"
        : "treble"
      : figure.clef ?? "treble";
    const step = stepForPitch(note.pitch, staffClef, key, mode, note.spell);
    const beyond = step > 8 ? step - 8 : step < 0 ? -step : 0;
    const ledgers = Math.ceil(beyond / 2);
    if (ledgers > 3) {
      fail(
        `${where}: ${note.pitch} needs ${ledgers} ledger lines${
          figure.grandStaff ? "" : " — the other clef, or a grand staff, would carry it"
        }`
      );
    }
  }

  for (const bracket of figure.brackets ?? []) {
    if (!figure.notes[bracket.from] || !figure.notes[bracket.to]) {
      fail(`${where}: bracket "${bracket.text}" points at a note that is not there`);
    } else if (bracket.from > bracket.to) {
      fail(`${where}: bracket "${bracket.text}" runs backwards`);
    }
  }

  /* ---- The claims ------------------------------------------------------- */

  // A "W" or "H" label says the distance to the NEXT note. Derive it.
  const voices = placed.filter((n) => !n.rest && n.at === undefined && !n.stack);
  voices.forEach((note, i) => {
    const label = (note.label ?? "").trim();
    if (label !== "W" && label !== "H") return;
    stepClaims += 1;
    const next = voices[i + 1];
    if (!next) {
      fail(`${where}: "${label}" is on the last note, with nothing to measure to`);
      return;
    }
    const semitones = Math.abs(next.pitch - note.pitch);
    const want = label === "W" ? 2 : 1;
    if (semitones !== want) {
      fail(
        `${where}: labelled "${label}" but the step is ${semitones} semitone(s) — ${note.pitch} to ${next.pitch}`
      );
    }
  });

  // An interval label on a note says the distance to the next one. "m3" three
  // times in a row is the entire argument of the diminished-seventh figure, so
  // it had better be three minor thirds.
  const INTERVAL_SEMITONES: Record<string, number> = {
    m2: 1, M2: 2, m3: 3, M3: 4, P4: 5, TT: 6, P5: 7,
    m6: 8, M6: 9, m7: 10, M7: 11, P8: 12,
  };
  const sequence = placed.filter((n) => !n.rest);
  sequence.forEach((note, i) => {
    const want = INTERVAL_SEMITONES[(note.label ?? "").trim()];
    if (want === undefined) return;
    stepClaims += 1;
    const next = sequence[i + 1];
    if (!next) {
      fail(`${where}: "${note.label}" is on the last note, with nothing to measure to`);
      return;
    }
    const semitones = Math.abs(next.pitch - note.pitch);
    if (semitones !== want) {
      fail(
        `${where}: labelled "${note.label}" but ${note.pitch} to ${next.pitch} is ${semitones} semitone(s)`
      );
    }
  });

  // A roman numeral under a chord has to be that chord. Degrees are read off
  // the key, and the triad built the way the app builds it everywhere else.
  const ROMAN_DEGREE: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7,
  };
  for (const claim of figure.harmony ?? []) {
    const anchor = placed[claim.at];
    if (!anchor) {
      fail(`${where}: harmony "${claim.text}" points at a note that is not there`);
      continue;
    }
    const plain = claim.text.replace(/[°ø♭#+\d/]/g, "").trim();
    const degree = ROMAN_DEGREE[plain.toUpperCase()];
    // Chord symbols ("C major", "Cmaj7") and altered numerals are prose, not a
    // derivable claim; only plain numerals are checked.
    if (!degree || claim.text.includes("/") || claim.text.includes("♭")) continue;
    harmonyClaims += 1;

    const sounding = placed.filter((n) => !n.rest && n.start === anchor.start);
    const heard = new Set(sounding.map((n) => ((n.pitch % 12) + 12) % 12));
    const triad = triadFor(degree, key, mode);
    const want = new Set(triad.pitches.map((p: number) => ((p % 12) + 12) % 12));
    // A numeral with a 7 is the triad plus the seventh the key gives it, two
    // scale degrees above the fifth. Without this the checker calls every
    // correctly-written V7 a mistake, which is worse than not checking.
    if (/7/.test(claim.text)) {
      const tonic = keyPitchClass(key);
      const steps = scaleSteps(mode);
      const seventhDegree = ((degree - 1 + 6) % 7);
      want.add((tonic + steps[seventhDegree]) % 12);
    }
    // What a chord may leave out and what it may not. Omitting the fifth is
    // ordinary four-part writing, so demanding it would make the checker
    // reject correct figures — which is worse than useless, because the next
    // person weakens the check rather than the figure. The root and third are
    // the chord's identity, and an extra pitch class is never explained away.
    const root = ((triad.pitches[0] % 12) + 12) % 12;
    const third = ((triad.pitches[1] % 12) + 12) % 12;
    const extra = Array.from(heard).filter((pc) => !want.has(pc));
    const absent: string[] = [];
    if (!heard.has(root)) absent.push("its root");
    if (!heard.has(third)) absent.push("its third");
    if (extra.length || absent.length) {
      fail(
        `${where}: "${claim.text}" in ${key} ${mode} is {${Array.from(want).sort((a, b) => a - b)}}` +
          ` but the figure sounds {${Array.from(heard).sort((a, b) => a - b)}}` +
          (absent.length ? ` — missing ${absent.join(" and ")}` : "") +
          (extra.length ? ` — ${extra.join(", ")} does not belong` : "")
      );
    }
    // The case the numeral itself asserts: lower case is minor, upper major.
    const isLower = plain === plain.toLowerCase();
    const quality = triad.quality;
    if (isLower && quality === "maj") {
      fail(`${where}: "${claim.text}" is written lower case but degree ${degree} of ${key} ${mode} is major`);
    }
    if (!isLower && quality !== "maj") {
      fail(`${where}: "${claim.text}" is written upper case but degree ${degree} of ${key} ${mode} is ${quality}`);
    }
  }

  /* ---- The caption's own claims ----------------------------------------- */
  if (figure.assert) checkAssertions(where, figure, placed);

  // A scale figure should be a scale: if a figure's notes run stepwise through
  // seven degrees, every pitch must belong to the key it claims.
  const line = placed.filter((n) => !n.rest && !n.stack && n.at === undefined);
  if (line.length >= 8 && figure.hideBarlines) {
    const tonic = keyPitchClass(key);
    const inKey = new Set(scaleSteps(mode).map((s) => (tonic + s) % 12));
    const stepwise = line.every(
      (n, i) => i === 0 || Math.abs(n.pitch - line[i - 1].pitch) <= 2
    );
    if (stepwise) {
      for (const note of line) {
        if (!inKey.has(((note.pitch % 12) + 12) % 12)) {
          fail(`${where}: ${note.pitch} is not in ${key} ${mode}, but the figure runs as a scale`);
        }
      }
    }
  }
}

function checkFigure(where: string, raw: LessonFigure) {
  const figure = readFigure(raw);
  if (!figure) {
    fail(`${where}: not a figure this app can draw`);
    return;
  }
  figureCount += 1;

  switch (figure.kind) {
    case "staff":
      checkStaff(where, figure);
      break;

    case "keyboard": {
      const from = figure.from ?? 60;
      const to = figure.to ?? 72;
      if (to <= from) fail(`${where}: the keyboard ends before it starts`);
      if (to - from > 48) fail(`${where}: ${to - from} semitones is too wide to read`);
      for (const mark of figure.marks ?? []) {
        if (mark.pitch < from || mark.pitch > to) {
          fail(`${where}: ${mark.pitch} is marked but the keyboard only draws ${from}–${to}`);
        }
      }
      // Labels have to fit on a key. Three octaves of keys is 26px each at the
      // drawn size, and a four-digit frequency does not go in it.
      const widest = Math.max(0, ...(figure.marks ?? []).map((m) => (m.label ?? "").length));
      if (to - from > 24 && widest > 2) {
        fail(
          `${where}: ${to - from} semitones wide with ${widest}-character labels — the keys are too narrow to hold them`
        );
      }
      for (const bracket of figure.brackets ?? []) {
        if (bracket.from < from || bracket.to > to) {
          fail(`${where}: bracket "${bracket.text}" reaches past the keys drawn`);
        }
        if (bracket.from > bracket.to) fail(`${where}: bracket "${bracket.text}" runs backwards`);
      }
      break;
    }

    case "rhythm": {
      const bar = ticksPerBar(figure.meter);
      if (bar <= 0) fail(`${where}: ${figure.meter.beats}/${figure.meter.unit} is not a metre`);
      const total = figure.row.reduce((t, c) => t + c.duration, 0);
      if (total % bar !== 0) {
        fail(
          `${where}: the row is ${total} ticks, which does not fill whole bars of ` +
            `${figure.meter.beats}/${figure.meter.unit} (${bar} ticks)`
        );
      }
      for (const cell of figure.row) {
        if (cell.duration <= 0) fail(`${where}: a cell of ${cell.duration} ticks`);
      }
      break;
    }

    case "circle": {
      const known = new Set([...CIRCLE_MAJOR, ...CIRCLE_MINOR]);
      for (const key of figure.highlight ?? []) {
        if (!known.has(key)) fail(`${where}: "${key}" is not on the circle of fifths`);
      }
      if (figure.arrow) {
        for (const end of [figure.arrow.from, figure.arrow.to]) {
          if (!CIRCLE_MAJOR.includes(end)) {
            fail(`${where}: the arrow points at "${end}", which is not a major key on the circle`);
          }
        }
      }
      break;
    }

    case "form":
      for (const section of figure.sections) {
        if (!section.label.trim()) fail(`${where}: a section with no label`);
        if (section.bars !== undefined && section.bars <= 0) {
          fail(`${where}: "${section.label}" is ${section.bars} bars long`);
        }
      }
      break;

    case "wave": {
      if (figure.traces.some((t) => !(t.multiple > 0))) {
        fail(`${where}: a trace at ${figure.traces.find((t) => !(t.multiple > 0))?.multiple}× has no frequency`);
      }
      if ((figure.cycles ?? 2) <= 0) fail(`${where}: ${figure.cycles} cycles cannot be drawn`);
      break;
    }

    case "spectrum": {
      const sets = [figure.partials, ...(figure.compare ? [figure.compare.partials] : [])];
      for (const partials of sets) {
        const seenHarmonics = new Set<number>();
        for (const partial of partials) {
          if (!Number.isInteger(partial.harmonic) || partial.harmonic < 1) {
            fail(`${where}: harmonic ${partial.harmonic} is not a harmonic`);
          }
          if (partial.level < 0 || partial.level > 1) {
            fail(`${where}: level ${partial.level} is outside 0–1, so the bar would run off the axis`);
          }
          if (seenHarmonics.has(partial.harmonic)) {
            fail(`${where}: harmonic ${partial.harmonic} is given twice`);
          }
          seenHarmonics.add(partial.harmonic);
        }
        // The fundamental is what the others are overtones of; a spectrum
        // without it is a different sound, not a quieter one.
        if (!partials.some((partial) => partial.harmonic === 1)) {
          fail(`${where}: no fundamental, so the bars are overtones of nothing`);
        }
      }
      break;
    }

    case "scoreOrder": {
      const count = figure.groups.reduce((n, g) => n + g.staves.length, 0);
      for (const i of figure.highlight ?? []) {
        if (i < 0 || i >= count) fail(`${where}: highlight ${i} is outside the ${count} staves`);
      }
      // Score order is the one thing every player checks first; an empty group
      // means a brace drawn around nothing.
      for (const group of figure.groups) {
        if (group.staves.length === 0) fail(`${where}: the ${group.name} group has no staves`);
      }
      break;
    }
  }
}

/* -------------------------------------------------------------------------- */

// A heading written in both blocks would be an overwrite with no error — the
// second one silently wins and the first is never seen again.
for (const [slug, byHeading] of Object.entries(argumentFigures)) {
  for (const heading of Object.keys(byHeading)) {
    if (coreFigures[slug]?.[heading]) {
      fail(`${slug} / ${heading}: a figure for this section is written twice, and one of them is lost`);
    }
  }
}

for (const [slug, byHeading] of Object.entries(lessonFigures)) {
  const headings = headingsBySlug.get(slug);
  if (!headings) {
    fail(`lesson-figures has "${slug}", which is not a lesson`);
    continue;
  }
  for (const [heading, figure] of Object.entries(byHeading)) {
    if (!headings.has(heading)) {
      fail(
        `${slug}: no section called "${heading}" — the figure would be dropped without a word`
      );
      continue;
    }
    checkFigure(`${slug} / ${heading}`, figure);
  }
}

// Figures written inline on a lesson section are checked the same way.
for (const lesson of lessons) {
  const extra = lessonDetail[lesson.slug]?.extraSections ?? [];
  for (const section of [...lesson.content, ...extra]) {
    if (section.figure) checkFigure(`${lesson.slug} / ${section.heading}`, section.figure);
  }
}

/* ---- Coverage -------------------------------------------------------------
 *
 * Counted by section, not by lesson. A lesson with a figure on its first
 * heading and nothing on the other four reads as covered if you only count
 * lessons, and that is exactly how most of the Academy stayed bare while the
 * summary line said otherwise.
 */
let sections = 0;
const bare: string[] = [];
const withFigures = new Set<string>();
for (const lesson of lessons) {
  const extra = lessonDetail[lesson.slug]?.extraSections ?? [];
  for (const section of [...lesson.content, ...extra]) {
    sections += 1;
    const has = Boolean(section.figure) || Boolean(lessonFigures[lesson.slug]?.[section.heading]);
    if (has) withFigures.add(lesson.slug);
    else bare.push(`${lesson.slug} / ${section.heading}`);
  }
}
const covered = sections - bare.length;

console.log(
  `figures: ${figureCount} on ${covered} of ${sections} sections across ${withFigures.size} of ${lessons.length} lessons ` +
    `(${staffNotes} engraved notes, ${harmonyClaims} harmony claims and ${stepClaims} step labels derived)`
);
if (bare.length > 0) {
  console.log(`  ${bare.length} section(s) with no figure:`);
  bare.forEach((b) => console.log(`    - ${b}`));
}
if (problems.length === 0) {
  console.log("OK - every figure draws what it says it draws");
} else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
