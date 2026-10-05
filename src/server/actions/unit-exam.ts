"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { ALL_UNITS } from "@/lib/curriculum";
import { previousUnit, unitOpen } from "@/lib/unit-gate";
import { awardProgress, syncAchievements } from "@/lib/progression";

/**
 * Sitting a unit exam.
 *
 * Two things shape every decision here. The first is that the answers must
 * never reach the browser before the paper is marked — a gate whose key is in
 * the page source is not a gate. So the sitting is served with choices
 * shuffled and no answer index, the client sends back the *text* it chose, and
 * the server compares that against the stored answer.
 *
 * The second is that failing has to be useful. Being told "62%, try again"
 * teaches nothing; the result names the sections that were missed, by lesson,
 * so somebody who fell short knows exactly which four paragraphs to go and
 * read.
 */

export interface ExamSittingQuestion {
  id: string;
  prompt: string;
  /** Shuffled per sitting. The answer is not here, and cannot be derived. */
  choices: string[];
}

export interface ExamSitting {
  unit: string;
  title: string;
  blurb: string;
  passMark: number;
  questions: ExamSittingQuestion[];
  /** Best score so far, for context before starting. */
  best: number | null;
  passed: boolean;
}

/**
 * The choices of one question, or null if the row cannot be read.
 *
 * Choices live in a text column, and a row that has been through an
 * interrupted upgrade can hold something this parser was not written for. A
 * throw here would take down the whole exam rather than one question, so a
 * bad row is dropped and the rest of the paper still stands.
 */
function readChoices(raw: string): string[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const choices = parsed.filter((c): c is string => typeof c === "string");
    return choices.length >= 2 ? choices : null;
  } catch {
    return null;
  }
}

/** Fisher-Yates, so the order is genuinely uniform rather than sort-ish. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Hands out a paper.
 *
 * Available whether or not the unit's lessons have been read — that is the
 * whole point of being able to skip ahead — but the unit itself still has to
 * be reachable: you cannot sit the Level 5 exams before clearing Level 1, or
 * the roadmap would not be a roadmap.
 */
export async function startUnitExam(unit: string): Promise<{
  ok: boolean;
  error?: string;
  sitting?: ExamSitting;
}> {
  const userId = await requireUserId();
  const exam = await db.unitExam.findUnique({
    where: { unit },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!exam) return { ok: false, error: "No exam for that unit" };

  const passedRows = await db.unitExamAttempt.findMany({
    where: { userId, passed: true },
    select: { unit: true },
  });
  const passed = new Set(passedRows.map((r) => r.unit));

  if (!unitOpen(unit, passed)) {
    const before = previousUnit(unit);
    return {
      ok: false,
      error: before
        ? `Unit ${before} has to be passed before this one opens.`
        : "That unit is not open yet.",
    };
  }

  const attempts = await db.unitExamAttempt.findMany({
    where: { userId, unit },
    orderBy: { score: "desc" },
    take: 1,
  });

  // Drop any question whose choices will not parse before deciding how many
  // to ask, so a damaged row shortens the paper rather than breaking it.
  const usable = exam.questions.filter((q) => readChoices(q.choices) !== null);
  if (usable.length === 0) {
    return { ok: false, error: "This exam could not be read. Reinstall or update to repair it." };
  }
  const ask = Math.min(exam.askCount || usable.length, usable.length);
  const chosen = shuffle(usable).slice(0, ask);

  return {
    ok: true,
    sitting: {
      unit: exam.unit,
      title: exam.title,
      blurb: exam.blurb,
      passMark: exam.passMark,
      best: attempts[0]?.score ?? null,
      passed: passed.has(unit),
      questions: chosen.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        choices: shuffle(readChoices(q.choices) ?? []),
      })),
    },
  };
}

export interface ExamResult {
  ok: boolean;
  error?: string;
  score?: number;
  correct?: number;
  total?: number;
  passed?: boolean;
  passMark?: number;
  /** What to go and read, named by lesson and section. */
  missed?: { slug: string; heading: string; prompt: string; why: string }[];
  unlocked?: string | null;
  xp?: number;
}

/**
 * Marks a paper.
 *
 * Answers arrive as the text of the chosen option, because the client only
 * ever saw shuffled text. Matching on text is safe here: check-exams.ts
 * refuses any question whose choices are not unique, so a chosen string
 * identifies exactly one option.
 */
export async function submitUnitExam(input: {
  unit: string;
  answers: { questionId: string; chosen: string }[];
}): Promise<ExamResult> {
  const userId = await requireUserId();
  const exam = await db.unitExam.findUnique({
    where: { unit: input.unit },
    include: { questions: true },
  });
  if (!exam) return { ok: false, error: "No exam for that unit" };

  // The gate is checked here as well as when the paper is handed out, and
  // that is not belt-and-braces. Refusing to *serve* a locked exam only hides
  // the questions; the pass is recorded here, so a submission posted straight
  // at this action would otherwise clear any unit in the roadmap from a
  // standing start. Found by doing exactly that.
  const passedRows = await db.unitExamAttempt.findMany({
    where: { userId, passed: true },
    select: { unit: true },
  });
  const passedUnits = new Set(passedRows.map((r) => r.unit));
  if (!unitOpen(input.unit, passedUnits)) {
    const before = previousUnit(input.unit);
    return {
      ok: false,
      error: before
        ? `Unit ${before} has to be passed before this one opens.`
        : "That unit is not open yet.",
    };
  }

  const byId = new Map(exam.questions.map((q) => [q.id, q]));

  // One answer per question, and the first one given stands. Without this a
  // submission could repeat a single correct answer twenty times and score
  // twenty out of twenty — which passed a unit from one known question.
  const seen = new Set<string>();
  const answered = input.answers.filter((a) => {
    if (!byId.has(a.questionId) || seen.has(a.questionId)) return false;
    seen.add(a.questionId);
    return true;
  });
  if (answered.length === 0) return { ok: false, error: "Nothing was answered" };

  const missed: ExamResult["missed"] = [];
  let correct = 0;
  for (const answer of answered) {
    const question = byId.get(answer.questionId)!;
    const choices = readChoices(question.choices);
    // A question that cannot be read is not counted against the candidate.
    if (!choices) continue;
    const right = choices[question.answerIndex];
    if (answer.chosen === right) {
      correct++;
    } else {
      missed.push({
        slug: question.slug,
        heading: question.heading,
        prompt: question.prompt,
        why: question.explanation,
      });
    }
  }

  // Marked out of the length of the paper, not the length of the answer
  // sheet. Scoring only what was attempted would let a candidate answer the
  // one question they were sure of and score full marks on it.
  const readable = exam.questions.filter((q) => readChoices(q.choices) !== null).length;
  const paperLength = Math.min(exam.askCount || readable, readable);
  const attempted = correct + missed.length;
  if (attempted === 0) return { ok: false, error: "None of those questions could be read" };
  const total = Math.max(paperLength, attempted);
  const score = Math.round((correct / total) * 100);
  const passed = score >= exam.passMark;

  // Only count a pass once. Sitting an exam you have already passed — to see
  // the questions again, or to beat your score — should not pay out twice.
  const alreadyPassed = passedUnits.has(input.unit);

  await db.unitExamAttempt.create({
    data: {
      userId,
      unit: input.unit,
      score,
      correct,
      total,
      passed,
      missed: JSON.stringify(missed.map((m) => `${m.slug}::${m.heading}`)),
    },
  });

  let xp = 0;
  if (passed && !alreadyPassed) {
    // Worth roughly a lesson, scaled by how far up the roadmap the unit sits.
    // Passing 6.6 should not pay the same as passing 1.1.
    const level = Number(input.unit.split(".")[0]) || 1;
    xp = 60 + level * 20;
    await awardProgress({ userId, xp, skillXp: { TECHNIQUE: 15 } });
    await syncAchievements(userId);
  }

  const order = ALL_UNITS.map((u) => u.unit);
  const next = order[order.indexOf(input.unit) + 1] ?? null;

  revalidatePath("/academy");
  revalidatePath(`/academy/exam/${input.unit}`);
  return {
    ok: true,
    score,
    correct,
    total,
    passed,
    passMark: exam.passMark,
    missed,
    unlocked: passed ? next : null,
    xp,
  };
}
