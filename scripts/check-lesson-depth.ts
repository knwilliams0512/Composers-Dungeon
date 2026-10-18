/**
 * Every lesson gets the same depth around it.
 *
 *   npx tsx scripts/check-lesson-depth.ts
 *
 * An audit of the Academy found two populations. Twenty-five lessons had a
 * detail layer — a summary, a time estimate, key terms, the mistakes everyone
 * makes, recordings, a short routine — and around sixty-five words of body.
 * The other twenty-one had two or three hundred words of body and no detail
 * layer at all.
 *
 * The lesson page renders each of those sections only when it is present, so
 * nothing looked broken. What a learner walking the roadmap in order actually
 * got was: nothing on lesson one, everything on lesson two, nothing on lesson
 * five. Including on the first lesson in the whole Academy, and on every
 * orchestration lesson.
 *
 * That is invisible to every other check in this repo: the data was valid, the
 * figures were complete, the questions were sound. It was only visible by
 * counting. So this counts.
 */
import { beginnerLessons } from "../prisma/seed-data/lessons-beginner";
import { advancedLessons } from "../prisma/seed-data/lessons-advanced";
import { curriculumLessons } from "../prisma/seed-data/lessons-curriculum";
import { orchestralLessons } from "../prisma/seed-data/lessons-orchestral";
import { lessonDetail } from "../prisma/seed-data/lesson-detail";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);

const lessons = [...beginnerLessons, ...advancedLessons, ...curriculumLessons, ...orchestralLessons];
const slugs = new Set(lessons.map((l) => l.slug));

/* -------------------------------------------------------------------------- */
/* Every lesson, and every field                                              */
/* -------------------------------------------------------------------------- */

/** What a lesson has to carry. The numbers are the floor, not the target. */
const FLOOR = {
  keyTerms: 3,
  commonMistakes: 2,
  listening: 1,
  practiceRoutine: 3,
};

for (const l of lessons) {
  const d = lessonDetail[l.slug];
  if (!d) {
    fail(
      `lesson "${l.slug}" has no detail layer, so its page shows no summary, no time estimate, ` +
        `no key terms, no mistakes, no listening and no routine — while the lesson before it does`
    );
    continue;
  }

  /* ---- Summary --------------------------------------------------------- */
  if (!d.summary || d.summary.trim().length < 40) {
    fail(`${l.slug}: the summary is missing or too short to say anything`);
  } else if (!/^You will/.test(d.summary.trim())) {
    // The house convention, and it is load-bearing: a summary stating an
    // ability tells a learner why to read the lesson, while one restating the
    // title tells them nothing they did not get from the card they clicked.
    fail(`${l.slug}: the summary does not state an ability ("You will be able to…")`);
  }

  /* ---- Time ------------------------------------------------------------ */
  const mins = d.estimatedMinutes;
  if (!mins || !Number.isFinite(mins)) fail(`${l.slug}: no time estimate`);
  else if (mins < 5 || mins > 60) fail(`${l.slug}: claims ${mins} minutes, which is not a lesson`);

  /* ---- The four lists -------------------------------------------------- */
  for (const [field, floor] of Object.entries(FLOOR) as [keyof typeof FLOOR, number][]) {
    const list = d[field] ?? [];
    if (list.length < floor)
      fail(`${l.slug}: ${list.length} ${field} where at least ${floor} are expected`);
  }

  /* ---- Key terms ------------------------------------------------------- */
  const terms = d.keyTerms ?? [];
  const seenTerms = new Set<string>();
  for (const t of terms) {
    if (!t.term?.trim()) fail(`${l.slug}: a key term with no name`);
    if (!t.definition || t.definition.trim().length < 20)
      fail(`${l.slug}: "${t.term}" is defined in ${t.definition?.trim().length ?? 0} characters`);
    // A definition that is the term again teaches nothing: "Pitch: the pitch."
    if (t.definition && t.term && new RegExp(`^(the\\s+)?${t.term}\\b`, "i").test(t.definition.trim()))
      fail(`${l.slug}: "${t.term}" is defined by repeating itself`);
    const key = t.term?.trim().toLowerCase() ?? "";
    if (seenTerms.has(key)) fail(`${l.slug}: defines "${t.term}" twice`);
    seenTerms.add(key);
  }

  /* ---- Mistakes -------------------------------------------------------- */
  for (const m of d.commonMistakes ?? []) {
    if (!m.mistake || m.mistake.trim().length < 20)
      fail(`${l.slug}: a common mistake with no description`);
    if (!m.fix || m.fix.trim().length < 30)
      fail(`${l.slug}: the fix for "${m.mistake?.slice(0, 40)}…" is too short to be a fix`);
    // "Don't do that" is not a fix. A fix says what to do instead.
    if (m.fix && /^(don'?t|do not|avoid)\b/i.test(m.fix.trim()))
      fail(`${l.slug}: the fix for "${m.mistake?.slice(0, 40)}…" only says what not to do`);
  }

  /* ---- Listening ------------------------------------------------------- */
  for (const li of d.listening ?? []) {
    if (!li.piece?.trim()) fail(`${l.slug}: a listening entry with no piece`);
    if (!li.composer?.trim()) fail(`${l.slug}: "${li.piece}" has no composer`);
    if (!li.why || li.why.trim().length < 30)
      fail(`${l.slug}: "${li.piece}" is recommended without saying what to listen for`);
  }

  /* ---- Routine --------------------------------------------------------- */
  for (const step of d.practiceRoutine ?? []) {
    if (!step || step.trim().length < 25)
      fail(`${l.slug}: a routine step too short to be an instruction: "${step}"`);
    // A routine step is something to do, so it should read as an instruction
    // rather than as a description of the topic.
    if (/^(the|a|an|this)\b/i.test(step.trim()))
      fail(`${l.slug}: the routine step "${step.slice(0, 40)}…" describes rather than instructs`);
  }
}

/* -------------------------------------------------------------------------- */
/* And enough prose to be worth the time it claims                            */
/* -------------------------------------------------------------------------- */
// The other half of what the audit found. Twenty-one lessons had around
// sixty-five words of body across two sections, while claiming twelve to thirty
// minutes — and several of them never taught the thing they were named after.
// Basic Intervals explained how to count letters and never mentioned major,
// minor or perfect; Minor Scales covered natural minor and never harmonic or
// melodic, which the very next harmony lesson assumes you know.
{
  const MIN_WORDS = 100;
  const MIN_SECTIONS = 3;
  let total = 0;
  for (const l of lessons) {
    const sections = [...l.content, ...(lessonDetail[l.slug]?.extraSections ?? [])];
    const words = sections.reduce((n, c) => n + c.body.trim().split(/\s+/).length, 0);
    total += words;
    if (sections.length < MIN_SECTIONS)
      fail(`${l.slug}: ${sections.length} sections, where ${MIN_SECTIONS} is the floor`);
    if (words < MIN_WORDS)
      fail(
        `${l.slug}: ${words} words of body for a lesson claiming ` +
          `${lessonDetail[l.slug]?.estimatedMinutes ?? "?"} minutes`
      );
    // A section with nothing in it is worse than no section.
    for (const c of sections) {
      if (c.body.trim().split(/\s+/).length < 20)
        fail(`${l.slug} / ${c.heading}: a section of under twenty words`);
      if (!c.heading?.trim()) fail(`${l.slug}: a section with no heading`);
    }
    // Headings have to be distinct, because the figures are keyed by them —
    // two sections sharing a heading would silently share one figure.
    const headings = sections.map((c) => c.heading.trim().toLowerCase());
    if (new Set(headings).size !== headings.length)
      fail(`${l.slug}: two sections share a heading, so they would share a figure`);
  }
  const mean = Math.round(total / lessons.length);
  if (mean < 200)
    fail(`the Academy averages ${mean} words of body a lesson, which is a worksheet`);
}

// Nothing in the detail table that is not a lesson — a typo that silently
// does nothing, which is how a lesson ends up looking bare for no reason.
for (const slug of Object.keys(lessonDetail)) {
  if (!slugs.has(slug)) fail(`lessonDetail has an entry for "${slug}", which is not a lesson`);
}

/* -------------------------------------------------------------------------- */
/* The same recording twice has to be for two different reasons               */
/* -------------------------------------------------------------------------- */
// Tristan appears under seventh chords and again under advanced analysis, and
// should: it is the textbook case for both. What it must not do is appear twice
// saying the same thing, which means one of the two lessons was padded.
{
  const byPiece = new Map<string, { slug: string; why: string }[]>();
  for (const l of lessons) {
    for (const li of lessonDetail[l.slug]?.listening ?? []) {
      const key = `${li.piece?.trim().toLowerCase()}`;
      byPiece.set(key, [...(byPiece.get(key) ?? []), { slug: l.slug, why: li.why ?? "" }]);
    }
  }
  for (const [piece, uses] of Array.from(byPiece.entries())) {
    if (uses.length < 2) continue;
    const reasons = new Set(uses.map((u) => u.why.trim().toLowerCase()));
    if (reasons.size !== uses.length)
      fail(
        `"${piece}" is recommended in ${uses.map((u) => u.slug).join(" and ")} for the same reason, ` +
          `so one of them is padding`
      );
  }
}

/* -------------------------------------------------------------------------- */
/* Totals, so the floor cannot be met by meeting only the floor               */
/* -------------------------------------------------------------------------- */

const totals = lessons.reduce(
  (acc, l) => {
    const d = lessonDetail[l.slug];
    return {
      terms: acc.terms + (d?.keyTerms?.length ?? 0),
      mistakes: acc.mistakes + (d?.commonMistakes?.length ?? 0),
      listening: acc.listening + (d?.listening?.length ?? 0),
      steps: acc.steps + (d?.practiceRoutine?.length ?? 0),
      minutes: acc.minutes + (d?.estimatedMinutes ?? 0),
    };
  },
  { terms: 0, mistakes: 0, listening: 0, steps: 0, minutes: 0 }
);

if (totals.terms < lessons.length * 4)
  fail(`${totals.terms} key terms across ${lessons.length} lessons averages under four each`);

const bodyWords = lessons.reduce(
  (n, l) =>
    n +
    [...l.content, ...(lessonDetail[l.slug]?.extraSections ?? [])].reduce(
      (m, c) => m + c.body.trim().split(/\s+/).length,
      0
    ),
  0
);

console.log(
  `lesson depth: ${lessons.length} lessons, ${bodyWords} words of body ` +
    `(mean ${Math.round(bodyWords / lessons.length)}), every one carrying a summary, a time estimate and ` +
    `the four reference sections — ${totals.terms} key terms, ${totals.mistakes} mistakes with ` +
    `fixes, ${totals.listening} recordings with a reason, ${totals.steps} routine steps, ` +
    `${totals.minutes} minutes of stated study`
);
if (problems.length === 0) console.log("OK - no lesson is thinner than the one before it");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
