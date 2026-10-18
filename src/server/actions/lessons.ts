"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { quizSubmissionSchema, compositionSchema, scoreSchema } from "@/lib/validation";
import { briefForLesson } from "@/lib/lesson-brief";
import { runChecks, type CheckResult, type Score } from "@/lib/score";
import {
  awardProgress,
  checkSpecializations,
  syncAchievements,
  type AwardResult,
} from "@/lib/progression";
import type { SkillKey } from "@/lib/enums";
import { lessonOpen } from "@/lib/unit-gate";
import { unitForSlug } from "@/lib/curriculum";

/**
 * Is this lesson actually open to this composer?
 *
 * The lesson page checks before it renders, but the page is not the only way
 * in: these actions are endpoints, and one posted directly would otherwise
 * complete a lesson from a unit the roadmap has not reached and pay XP for
 * it. The same omission in the exam action let a standing-start account pass
 * unit 6.6, which is how this one came to be looked for.
 */
async function lessonIsOpen(userId: string, slug: string): Promise<string | null> {
  const passed = await db.unitExamAttempt.findMany({
    where: { userId, passed: true },
    select: { unit: true },
  });
  if (!lessonOpen(slug, new Set(passed.map((p) => p.unit)))) {
    return "That lesson's unit has not been opened yet.";
  }

  // The page applies a second rule the unit gate does not: inside a unit,
  // lessons still run in order. Checking only the unit here would let a
  // posted request finish the third lesson of a unit without the first,
  // which is the page's rule enforced in one place and not the other.
  const lesson = await db.lesson.findUnique({
    where: { slug },
    include: { prerequisite: { select: { slug: true } } },
  });
  if (!lesson?.prerequisiteId || !lesson.prerequisite) return null;

  const mine = unitForSlug(slug);
  const theirs = unitForSlug(lesson.prerequisite.slug);
  // Across a unit boundary the prerequisite is deliberately ignored: passing
  // a unit's exam excuses its lessons, and a chain reaching back into a
  // skipped unit would undo that.
  if (!mine || !theirs || mine.unit !== theirs.unit) return null;

  const done = await db.lessonProgress.findFirst({
    where: { userId, lessonId: lesson.prerequisiteId, status: "COMPLETED" },
    select: { id: true },
  });
  // Two different refusals, said differently. Telling somebody their unit is
  // shut when the unit is open and they have simply jumped ahead inside it
  // sends them to the wrong place.
  return done ? null : "Finish the earlier lessons of this unit first.";
}

export interface QuizGradeResult {
  ok: boolean;
  error?: string;
  score?: number;
  passed?: boolean;
  results?: { questionId: string; correct: boolean; explanation: string; correctIndex: number }[];
  /**
   * What passing the quiz earned, when it earned anything.
   *
   * Present only the first time the quiz is passed, because that is the only
   * time it awards. Undefined on a retake is not an omission.
   */
  award?: AwardResult;
}

export async function submitLessonQuiz(input: {
  lessonSlug: string;
  answers: { questionId: string; choiceIndex: number }[];
}): Promise<QuizGradeResult> {
  const userId = await requireUserId();
  const parsed = quizSubmissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid submission" };

  const shut = await lessonIsOpen(userId, parsed.data.lessonSlug);
  if (shut) return { ok: false, error: shut };

  const lesson = await db.lesson.findUnique({
    where: { slug: parsed.data.lessonSlug },
    include: { quiz: { include: { questions: true } } },
  });
  if (!lesson?.quiz) return { ok: false, error: "Lesson or quiz not found" };

  // Score against the questions that can actually be served. The lesson page
  // skips any whose choices column will not parse, so counting all of them
  // here would reject a complete answer set as incomplete and make the lesson
  // impossible to pass.
  const answerable = lesson.quiz.questions.filter((q) => {
    try {
      const choices = JSON.parse(q.choices);
      return Array.isArray(choices) && choices.length > 0;
    } catch {
      return false;
    }
  });
  const byId = new Map(answerable.map((q) => [q.id, q]));
  let correct = 0;
  const results = parsed.data.answers
    .filter((a) => byId.has(a.questionId))
    .map((a) => {
      const q = byId.get(a.questionId)!;
      const isRight = q.answerIndex === a.choiceIndex;
      if (isRight) correct++;
      return {
        questionId: q.id,
        correct: isRight,
        explanation: q.explanation,
        correctIndex: q.answerIndex,
      };
    });

  const totalQuestions = answerable.length;
  if (totalQuestions === 0) {
    return { ok: false, error: "This quiz has no readable questions. Please report this lesson." };
  }
  if (results.length !== totalQuestions) {
    return { ok: false, error: "Answer every question before submitting" };
  }
  const score = Math.round((correct / totalQuestions) * 100);
  const passed = score >= lesson.quiz.passScore;

  await db.quizAttempt.create({
    data: { userId, quizId: lesson.quiz.id, score, correct, total: totalQuestions },
  });

  // `progress` has to be the state BEFORE this attempt, because that is what
  // "have they passed this quiz before?" is asking. The create branch used to
  // write this attempt's own result, so a quiz passed first time came back
  // already passed and the award below never fired — while failing once and
  // then passing did pay, which is exactly backwards. Create the row empty
  // (the schema defaults are quizPassed false, bestQuizScore 0) and let the
  // update apply the result.
  const progress = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
    create: { userId, lessonId: lesson.id },
    update: {},
  });
  await db.lessonProgress.update({
    where: { id: progress.id },
    data: {
      quizPassed: progress.quizPassed || passed,
      bestQuizScore: Math.max(progress.bestQuizScore, score),
    },
  });

  // The award is returned, not swallowed. It used to be awaited and dropped,
  // so passing a quiz granted a third of the lesson's XP — and any level-up,
  // achievement or streak milestone that came with it — in total silence. The
  // only banner in a lesson was at the very end, which is why doing three
  // rewarded things inside one lesson felt like doing none.
  let award: AwardResult | undefined;
  if (passed && !progress.quizPassed) {
    // Small XP for the quiz itself; the big award comes at lesson completion.
    award = await awardProgress({ userId, xp: Math.round(lesson.xpReward * 0.3) });
  }

  revalidatePath(`/academy/${lesson.slug}`);
  return { ok: true, score, passed, results, award };
}

export async function completePracticeExercise(
  lessonSlug: string
): Promise<{ ok: boolean; error?: string; award?: AwardResult }> {
  const userId = await requireUserId();
  const shut = await lessonIsOpen(userId, lessonSlug);
  if (shut) return { ok: false, error: shut };
  const lesson = await db.lesson.findUnique({ where: { slug: lessonSlug } });
  if (!lesson) return { ok: false, error: "Lesson not found" };

  // Read before writing: upsert returns the row as it is AFTER the write, so
  // asking it whether practice was already done returns the `true` this call
  // just set, every time — and the award below had never once fired.
  const before = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  });
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
    create: { userId, lessonId: lesson.id, practiceDone: true },
    update: { practiceDone: true },
  });
  let award: AwardResult | undefined;
  if (!before?.practiceDone) {
    award = await awardProgress({ userId, xp: Math.round(lesson.xpReward * 0.2) });
  }
  revalidatePath(`/academy/${lessonSlug}`);
  return { ok: true, award };
}

export interface LessonCompletionResult {
  ok: boolean;
  error?: string;
  award?: AwardResult;
  newSpecializations?: string[];
  /** Per-standard verdicts when the exercise falls short. */
  results?: CheckResult[];
}

/**
 * Submitting the composition exercise completes the lesson (quiz must be
 * passed first). Awards full lesson XP + skill rewards and files the
 * composition in the Library.
 */
export async function submitLessonComposition(input: {
  lessonSlug: string;
  title: string;
  description?: string;
  reflection?: string;
  scoreLink?: string;
  visibility?: string;
  score?: unknown;
}): Promise<LessonCompletionResult> {
  const userId = await requireUserId();
  const parsedComp = compositionSchema.safeParse({
    title: input.title,
    description: input.description ?? "",
    reflection: input.reflection ?? "",
    scoreLink: input.scoreLink ?? "",
    visibility: input.visibility ?? "PRIVATE",
  });
  if (!parsedComp.success) {
    return { ok: false, error: parsedComp.error.errors[0]?.message ?? "Invalid input" };
  }

  const shut = await lessonIsOpen(userId, input.lessonSlug);
  if (shut) return { ok: false, error: shut };

  const lesson = await db.lesson.findUnique({
    where: { slug: input.lessonSlug },
    include: { skillRewards: { include: { skill: true } } },
  });
  if (!lesson) return { ok: false, error: "Lesson not found" };

  // The exercise is written in the app, and the same engine the dungeon uses
  // decides whether it applied the lesson.
  const brief = briefForLesson(lesson);
  const parsedScore = scoreSchema.safeParse(input.score);
  if (!parsedScore.success) {
    return { ok: false, error: "Write the exercise in the composer before submitting." };
  }
  const score = parsedScore.data as Score;
  if (
    score.key !== brief.setup.key ||
    score.mode !== brief.setup.mode ||
    score.bars !== brief.setup.bars ||
    score.meter.beats !== brief.setup.meter.beats ||
    score.meter.unit !== brief.setup.meter.unit
  ) {
    return { ok: false, error: "This piece does not match the exercise's brief." };
  }
  const verdict = runChecks(score, brief.checks);
  if (!verdict.passed) {
    return {
      ok: false,
      error: `Not there yet — ${verdict.passedCount} of ${verdict.results.length} standards met.`,
      results: verdict.results,
    };
  }

  const progress = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  });
  if (!progress?.quizPassed) {
    return { ok: false, error: "Pass the lesson quiz before submitting the composition" };
  }
  if (progress.status === "COMPLETED") {
    return { ok: false, error: "Lesson already completed" };
  }

  await db.composition.create({
    data: {
      userId,
      title: parsedComp.data.title,
      score: JSON.stringify(score),
      description: parsedComp.data.description,
      reflection: parsedComp.data.reflection,
      scoreLink: parsedComp.data.scoreLink,
      visibility: parsedComp.data.visibility,
      source: "LESSON",
    },
  });

  await db.lessonProgress.update({
    where: { id: progress.id },
    data: { compositionDone: true, status: "COMPLETED", completedAt: new Date() },
  });

  const skillXp: Partial<Record<SkillKey, number>> = {};
  for (const reward of lesson.skillRewards) {
    skillXp[reward.skill.key as SkillKey] = reward.xp;
  }

  const award = await awardProgress({ userId, xp: lesson.xpReward, skillXp });
  const newSpecializations = await checkSpecializations(userId);
  if (newSpecializations.length) await syncAchievements(userId);

  revalidatePath("/academy");
  revalidatePath("/hall");
  return { ok: true, award, newSpecializations };
}
