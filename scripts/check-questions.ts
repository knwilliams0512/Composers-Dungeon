/**
 * Structural checks on every question the Academy asks.
 *
 *   npx tsx scripts/check-questions.ts
 *
 * This does not try to mark the music — no script can tell you that a minor
 * third is three semitones. All 159 lesson questions and all 304 exam
 * questions were read and checked by hand against theory, and they were sound.
 * What a script CAN hold is the shape of them, which is where the two real
 * defects that audit found actually lived:
 *
 * 1. The transposing-instruments lesson asked, word for word, a question the
 *    transposition lesson already asks — and labelled it difficulty 9 against
 *    the original's 5. Nothing noticed, because nothing compared them.
 *
 * 2. Every one of the 304 exam questions stores its correct answer at index 0.
 *    That is not currently exploitable: unit-exam.ts shuffles the choices per
 *    sitting and never sends the answer to the browser, so the sitting is
 *    honest. But the data has no entropy of its own, so the shuffle is the only
 *    thing standing between a learner and an exam where the first option is
 *    always right. That makes the shuffle load-bearing, and load-bearing things
 *    should be asserted rather than assumed.
 */
import { readFileSync } from "node:fs";
import { beginnerLessons } from "../prisma/seed-data/lessons-beginner";
import { advancedLessons } from "../prisma/seed-data/lessons-advanced";
import { curriculumLessons } from "../prisma/seed-data/lessons-curriculum";
import { orchestralLessons } from "../prisma/seed-data/lessons-orchestral";
import { unitExams } from "../prisma/seed-data/unit-exams";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);

const lessons = [...beginnerLessons, ...advancedLessons, ...curriculumLessons, ...orchestralLessons];

/** Questions differing only in spacing or case are the same question. */
const normalise = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/* -------------------------------------------------------------------------- */
/* No question asked twice                                                    */
/* -------------------------------------------------------------------------- */

const seen = new Map<string, string>();
for (const l of lessons) {
  for (const q of l.quiz ?? []) {
    const key = normalise(q.prompt);
    const already = seen.get(key);
    if (already && already !== l.slug) {
      fail(`lessons "${already}" and "${l.slug}" ask the same question: "${q.prompt}"`);
    } else if (already === l.slug) {
      fail(`lesson "${l.slug}" asks the same question twice: "${q.prompt}"`);
    } else {
      seen.set(key, l.slug);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Every question has to be answerable                                        */
/* -------------------------------------------------------------------------- */

for (const l of lessons) {
  for (const q of l.quiz ?? []) {
    const where = `${l.slug}: "${q.prompt.slice(0, 50)}…"`;
    if (!Array.isArray(q.choices) || q.choices.length < 2) fail(`${where} has fewer than two choices`);
    if (q.answerIndex < 0 || q.answerIndex >= (q.choices?.length ?? 0))
      fail(`${where} has answerIndex ${q.answerIndex}, outside its ${q.choices?.length ?? 0} choices`);
    if (new Set((q.choices ?? []).map(normalise)).size !== (q.choices ?? []).length)
      fail(`${where} repeats a choice, so two options are both right or both wrong`);
    if (!q.explanation || q.explanation.trim().length < 10)
      fail(`${where} has no real explanation, so a wrong answer teaches nothing`);
    // An explanation that just says "correct" is the thing the exam types
    // explicitly forbid; worth holding the lesson quizzes to it too.
    if (/^(correct|right|yes)\b/i.test(q.explanation.trim()))
      fail(`${where} explains itself with "${q.explanation.trim().slice(0, 20)}…" rather than why`);
  }
}

for (const e of unitExams) {
  for (const q of e.questions) {
    const where = `unit ${e.unit}: "${q.prompt.slice(0, 50)}…"`;
    if (q.choices.length < 2) fail(`${where} has fewer than two choices`);
    if (q.answer < 0 || q.answer >= q.choices.length)
      fail(`${where} has answer ${q.answer}, outside its ${q.choices.length} choices`);
    if (new Set(q.choices.map(normalise)).size !== q.choices.length)
      fail(`${where} repeats a choice`);
    if (!q.why || q.why.trim().length < 10) fail(`${where} has no real explanation`);
  }
}

/* -------------------------------------------------------------------------- */
/* The exam shuffle is load-bearing, so prove it is still there               */
/* -------------------------------------------------------------------------- */

{
  const everyAnswerFirst = unitExams.every((e) => e.questions.every((q) => q.answer === 0));
  const src = readFileSync("src/server/actions/unit-exam.ts", "utf8");
  // The sitting must shuffle the choices it serves.
  const shuffles = /choices:\s*shuffle\(/.test(src);
  // And it must not hand the answer to the browser.
  const leaksAnswer = /\banswer\s*:/.test(
    // only look at the object the action returns for a sitting
    /interface\s+SittingQuestion[\s\S]*?\}/.exec(src)?.[0] ?? ""
  );

  if (!shuffles) {
    fail(
      "unit-exam.ts no longer shuffles the choices it serves" +
        (everyAnswerFirst
          ? " — and every stored exam answer is at index 0, so the first option would always be correct"
          : "")
    );
  }
  if (leaksAnswer) fail("the exam sitting type carries an `answer`, which puts the key in the page source");

  // If the data ever gains entropy of its own, this note stops being true and
  // the check above stops being the only thing protecting the exam.
  if (!everyAnswerFirst) {
    const spread = new Set<number>();
    for (const e of unitExams) for (const q of e.questions) spread.add(q.answer);
    if (spread.size < 2)
      fail("exam answers are not all at index 0 yet still occupy a single position");
  }
}

const lessonQs = lessons.reduce((n, l) => n + (l.quiz?.length ?? 0), 0);
const examQs = unitExams.reduce((n, e) => n + e.questions.length, 0);
console.log(
  `questions: ${lessonQs} lesson and ${examQs} exam questions checked for duplicates, ` +
    `answerable choices and real explanations; the exam shuffle is in place`
);
if (problems.length === 0) console.log("OK - no question problems");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
