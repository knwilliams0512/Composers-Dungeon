/**
 * The unit exams have to be true, and they have to cover their unit.
 *
 * A unit exam is a gate: fail it and the next unit stays shut. That makes two
 * things non-negotiable, and neither can be verified by reading the file once
 * and feeling good about it.
 *
 * Coverage, because "the exam covers the whole unit" is a promise made to
 * somebody skipping ahead. If a section of a lesson is never asked about, a
 * person can pass without having met it and then arrive at the next unit
 * missing a piece nobody told them about. So every section heading of every
 * lesson in the unit must be the subject of at least one question.
 *
 * Structure, because a question whose answer index is out of range, or which
 * offers the same text twice, or which asks the same thing as the question
 * before it, is a question that fails somebody for the author's mistake.
 *
 *   npx tsx scripts/check-exams.ts
 */
import { PrismaClient } from "@prisma/client";
import { ALL_UNITS } from "../src/lib/curriculum";
import { unitExams } from "../prisma/seed-data/unit-exams";

const db = new PrismaClient();
const problems: string[] = [];
const fail = (m: string) => problems.push(m);

async function main() {
const lessons = await db.lesson.findMany({ select: { slug: true, content: true } });
const sectionsBySlug = new Map<string, string[]>();
for (const lesson of lessons) {
  try {
    const parsed = JSON.parse(lesson.content) as { heading?: string }[];
    sectionsBySlug.set(
      lesson.slug,
      Array.isArray(parsed) ? parsed.map((s) => s.heading ?? "") : []
    );
  } catch {
    fail(`lesson "${lesson.slug}": content will not parse`);
  }
}

const examByUnit = new Map(unitExams.map((e) => [e.unit, e]));

// --- Every unit has one, and nothing has an exam for a unit that is gone ----
for (const unit of ALL_UNITS) {
  if (!examByUnit.has(unit.unit)) {
    fail(`unit ${unit.unit} "${unit.title}" has no exam, so nothing can be unlocked past it`);
  }
}
for (const exam of unitExams) {
  if (!ALL_UNITS.some((u) => u.unit === exam.unit)) {
    fail(`exam for unit ${exam.unit} does not match any unit in the curriculum`);
  }
}

let totalQuestions = 0;
let totalSections = 0;

for (const unit of ALL_UNITS) {
  const exam = examByUnit.get(unit.unit);
  if (!exam) continue;
  totalQuestions += exam.questions.length;

  // --- Structure -----------------------------------------------------------
  const prompts = new Set<string>();
  exam.questions.forEach((q, i) => {
    const where = `${unit.unit} Q${i + 1}`;
    if (q.choices.length < 2) fail(`${where}: fewer than two choices`);
    if (new Set(q.choices.map((c) => c.trim().toLowerCase())).size !== q.choices.length) {
      fail(`${where}: two choices are the same, so more than one answer is right`);
    }
    if (q.answer < 0 || q.answer >= q.choices.length) {
      fail(`${where}: answer index ${q.answer} is outside its ${q.choices.length} choices`);
    }
    if (!q.why.trim()) fail(`${where}: no explanation`);
    const key = q.prompt.trim().toLowerCase();
    if (prompts.has(key)) fail(`${where}: asks the same thing as an earlier question`);
    prompts.add(key);

    // The slug and heading must name a section that exists, or coverage is
    // being claimed against a lesson that has moved on without the exam.
    const sections = sectionsBySlug.get(q.slug);
    if (!sections) {
      fail(`${where}: cites lesson "${q.slug}", which is not in this build`);
    } else if (!sections.includes(q.heading)) {
      fail(`${where}: cites section "${q.heading}", which "${q.slug}" does not have`);
    }
    if (!unit.slugs.includes(q.slug)) {
      fail(`${where}: cites "${q.slug}", which is not a lesson of unit ${unit.unit}`);
    }
  });

  if (exam.passMark !== undefined && (exam.passMark < 50 || exam.passMark > 100)) {
    fail(`${unit.unit}: pass mark ${exam.passMark}% is not a sensible gate`);
  }
  if (exam.questions.length < 6) {
    fail(`${unit.unit}: only ${exam.questions.length} questions — too few to gate a unit on`);
  }

  // --- Coverage ------------------------------------------------------------
  const asked = new Set(exam.questions.map((q) => `${q.slug}::${q.heading}`));
  for (const slug of unit.slugs) {
    const sections = sectionsBySlug.get(slug);
    if (!sections) {
      fail(`${unit.unit}: lesson "${slug}" is in the curriculum but not in this build`);
      continue;
    }
    totalSections += sections.length;
    for (const heading of sections) {
      if (!asked.has(`${slug}::${heading}`)) {
        fail(`${unit.unit}: nothing asks about "${heading}" (${slug})`);
      }
    }
  }

}

await db.$disconnect();

if (problems.length) {
  console.error(`exam problems (${problems.length}):\n  - ` + problems.join("\n  - "));
  process.exit(1);
}

console.log(
  `exams: ${unitExams.length} units, ${totalQuestions} questions, every one of ` +
    `${totalSections} lesson sections covered`
);
console.log("OK - no exam problems");
}

main();
