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
import { lessonFigures } from "../prisma/seed-data/lesson-figures";
import { placeNotes, readFigure, type LessonFigure } from "../src/lib/lesson-figure";
import {
  keyPitchClass,
  keySignatureCount,
  scaleSteps,
  ticksPerBar,
  triadFor,
} from "../src/lib/score";
import { noteValue } from "../src/lib/studio/staff";

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
    const missing = Array.from(want).filter((pc) => !heard.has(pc));
    const extra = Array.from(heard).filter((pc) => !want.has(pc));
    if (missing.length || extra.length) {
      fail(
        `${where}: "${claim.text}" in ${key} ${mode} should sound {${Array.from(want).sort((a, b) => a - b)}}` +
          ` but the figure sounds {${Array.from(heard).sort((a, b) => a - b)}}`
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

const withFigures = new Set(
  Object.entries(lessonFigures)
    .filter(([, byHeading]) => Object.keys(byHeading).length > 0)
    .map(([slug]) => slug)
);
const bare = lessons.filter((l) => !withFigures.has(l.slug));

console.log(
  `figures: ${figureCount} across ${withFigures.size} of ${lessons.length} lessons ` +
    `(${staffNotes} engraved notes, ${harmonyClaims} harmony claims and ${stepClaims} step labels derived)`
);
if (bare.length > 0) {
  console.log(`  ${bare.length} lesson(s) still have no figure: ${bare.map((l) => l.slug).join(", ")}`);
}
if (problems.length === 0) {
  console.log("OK - every figure draws what it says it draws");
} else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
