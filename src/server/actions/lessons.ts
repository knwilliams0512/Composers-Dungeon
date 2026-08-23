"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { quizSubmissionSchema, compositionSchema, scoreSchema } from "@/lib/validation";
import { briefForLesson } from "@/lib/lesson-brief";
import { runChecks, type CheckResult, type Score } from "@/lib/score";
import { awardProgress, checkSpecializations, type AwardResult } from "@/lib/progression";
import type { SkillKey } from "@/lib/enums";

export interface QuizGradeResult {
  ok: boolean;
  error?: string;
  score?: number;
  passed?: boolean;
  results?: { questionId: string; correct: boolean; explanation: string; correctIndex: number }[];
}

export async function submitLessonQuiz(input: {
  lessonSlug: string;
  answers: { questionId: string; choiceIndex: number }[];
}): Promise<QuizGradeResult> {
  const userId = await requireUserId();
  const parsed = quizSubmissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid submission" };

  const lesson = await db.lesson.findUnique({
    where: { slug: parsed.data.lessonSlug },
    include: { quiz: { include: { questions: true } } },
  });
  if (!lesson?.quiz) return { ok: false, error: "Lesson or quiz not found" };

  const byId = new Map(lesson.quiz.questions.map((q) => [q.id, q]));
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

  const totalQuestions = lesson.quiz.questions.length;
  if (results.length !== totalQuestions) {
    return { ok: false, error: "Answer every question before submitting" };
  }
  const score = Math.round((correct / totalQuestions) * 100);
  const passed = score >= lesson.quiz.passScore;

  await db.quizAttempt.create({
    data: { userId, quizId: lesson.quiz.id, score, correct, total: totalQuestions },
  });

  const progress = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
    create: {
      userId,
      lessonId: lesson.id,
      quizPassed: passed,
      bestQuizScore: score,
    },
    update: {},
  });
  await db.lessonProgress.update({
    where: { id: progress.id },
    data: {
      quizPassed: progress.quizPassed || passed,
      bestQuizScore: Math.max(progress.bestQuizScore, score),
    },
  });

  if (passed && !progress.quizPassed) {
    // Small XP for the quiz itself; the big award comes at lesson completion.
    await awardProgress({ userId, xp: Math.round(lesson.xpReward * 0.3) });
  }

  revalidatePath(`/academy/${lesson.slug}`);
  return { ok: true, score, passed, results };
}

export async function completePracticeExercise(
  lessonSlug: string
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const lesson = await db.lesson.findUnique({ where: { slug: lessonSlug } });
  if (!lesson) return { ok: false, error: "Lesson not found" };

  const progress = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
    create: { userId, lessonId: lesson.id, practiceDone: true },
    update: { practiceDone: true },
  });
  if (!progress.practiceDone) {
    await awardProgress({ userId, xp: Math.round(lesson.xpReward * 0.2) });
  }
  revalidatePath(`/academy/${lessonSlug}`);
  return { ok: true };
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

  revalidatePath("/academy");
  revalidatePath("/hall");
  return { ok: true, award, newSpecializations };
}
