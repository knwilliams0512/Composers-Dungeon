"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  submitLessonQuiz,
  completePracticeExercise,
  submitLessonComposition,
  type LessonCompletionResult,
} from "@/server/actions/lessons";
import { AwardBanner } from "@/components/ui/AwardBanner";
import { ScoreEditor } from "@/components/composer/ScoreEditor";
import { Icon } from "@/components/ui/Icon";
import type { Check, CheckResult, Score } from "@/lib/score";
import type { Freedom } from "@/lib/composer-freedom";

interface QuizQuestionDto {
  id: string;
  prompt: string;
  choices: string[];
}

export function LessonFlow({
  lessonSlug,
  quizQuestions,
  practiceExercises,
  compositionExercise,
  brief,
  freedom,
  initialState,
  nextLesson,
}: {
  lessonSlug: string;
  quizQuestions: QuizQuestionDto[];
  practiceExercises: { title: string; prompt: string; hint: string }[];
  compositionExercise: { title: string; prompt: string; hint: string } | null;
  brief: { setup: Score; checks: Check[]; freedomCap: number };
  freedom: Freedom;
  initialState: {
    quizPassed: boolean;
    practiceDone: boolean;
    completed: boolean;
    bestQuizScore: number;
  };
  nextLesson: { slug: string; title: string } | null;
}) {
  const router = useRouter();
  const [quizPassed, setQuizPassed] = useState(initialState.quizPassed);
  const [practiceDone, setPracticeDone] = useState(initialState.practiceDone);
  const [completed, setCompleted] = useState(initialState.completed);
  const [busy, setBusy] = useState(false);

  // Quiz state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    results: { questionId: string; correct: boolean; explanation: string; correctIndex: number }[];
  } | null>(null);

  // Composition state
  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [scoreLink, setScoreLink] = useState("");
  const [score, setScore] = useState<Score>(brief.setup);
  const [failed, setFailed] = useState<CheckResult[] | null>(null);
  const [visibility, setVisibility] = useState("PRIVATE");
  const [error, setError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<LessonCompletionResult | null>(null);

  async function handleQuizSubmit() {
    if (Object.keys(answers).length < quizQuestions.length) {
      setError("Answer every question first.");
      return;
    }
    setError(null);
    setBusy(true);
    const result = await submitLessonQuiz({
      lessonSlug,
      answers: quizQuestions.map((q) => ({
        questionId: q.id,
        choiceIndex: answers[q.id],
      })),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Submission failed");
      return;
    }
    setQuizResult({
      score: result.score!,
      passed: result.passed!,
      results: result.results!,
    });
    if (result.passed) setQuizPassed(true);
  }

  async function handlePractice() {
    setBusy(true);
    await completePracticeExercise(lessonSlug);
    setPracticeDone(true);
    setBusy(false);
  }

  async function handleComposition(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    setFailed(null);
    const result = await submitLessonComposition({
      lessonSlug,
      title,
      reflection,
      scoreLink,
      visibility,
      score,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Submission failed");
      setFailed(result.results?.filter((r) => !r.passed) ?? null);
      return;
    }
    setCompletion(result);
    setCompleted(true);
    router.refresh();
  }

  const resultFor = (id: string) => quizResult?.results.find((r) => r.questionId === id);

  return (
    <div className="mt-6 space-y-6">
      {/* Step: quiz */}
      <section className="card p-5">
        <h2 className="heading-display mb-1 text-lg">
          {quizPassed ? "✓ " : ""}Quick Quiz
        </h2>
        <p className="mb-4 text-sm text-parchment-500">
          Score 70% or higher to unlock the composition exercise.
          {initialState.bestQuizScore > 0 && ` Best so far: ${initialState.bestQuizScore}%.`}
        </p>
        <div className="space-y-5">
          {quizQuestions.map((q, qi) => {
            const r = resultFor(q.id);
            return (
              <div key={q.id}>
                <p className="mb-2 text-parchment-100">
                  {qi + 1}. {q.prompt}
                </p>
                <div className="space-y-1.5">
                  {q.choices.map((choice, ci) => {
                    const chosen = answers[q.id] === ci;
                    let style = chosen
                      ? "border-gold-500 bg-abyss-700/70 text-gold-300"
                      : "border-abyss-600 bg-abyss-800/50 text-parchment-300 hover:border-gold-700/50";
                    if (r) {
                      if (ci === r.correctIndex)
                        style = "border-emerald-600 bg-emerald-900/20 text-emerald-300";
                      else if (chosen && !r.correct)
                        style = "border-crimson-600 bg-crimson-700/20 text-crimson-400";
                      else style = "border-abyss-600 bg-abyss-800/40 text-parchment-500";
                    }
                    return (
                      <button
                        key={ci}
                        disabled={!!r || busy}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: ci }))}
                        className={`block w-full rounded-md border p-2.5 text-left text-sm transition-colors ${style}`}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
                {r && !r.correct && (
                  <p className="mt-1.5 text-xs text-parchment-400">💡 {r.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
        {!quizResult ? (
          <button onClick={handleQuizSubmit} disabled={busy} className="btn-primary mt-5">
            Submit Answers
          </button>
        ) : (
          <div className="mt-5 space-y-3">
            <p
              className={`rounded-md border p-3 text-sm ${
                quizResult.passed
                  ? "border-emerald-600/50 bg-emerald-900/20 text-emerald-300"
                  : "border-crimson-600/50 bg-crimson-700/20 text-parchment-200"
              }`}
            >
              {quizResult.passed
                ? `✦ ${quizResult.score}% — the Academy nods in approval.`
                : `${quizResult.score}% — review the lesson and try again.`}
            </p>
            {!quizResult.passed && (
              <button
                onClick={() => {
                  setQuizResult(null);
                  setAnswers({});
                }}
                className="btn-secondary"
              >
                Retake Quiz
              </button>
            )}
          </div>
        )}
      </section>

      {/* Step: practice */}
      {practiceExercises.map((p) => (
        <section key={p.title} className="card p-5">
          <h2 className="heading-display mb-1 text-lg">
            {practiceDone ? "✓ " : ""}Practice · {p.title}
          </h2>
          <p className="text-parchment-200">{p.prompt}</p>
          {p.hint && <p className="mt-2 text-sm text-parchment-500">💡 {p.hint}</p>}
          {!practiceDone && (
            <button onClick={handlePractice} disabled={busy} className="btn-secondary mt-4">
              I Have Practiced This
            </button>
          )}
        </section>
      ))}

      {/* Step: composition */}
      {compositionExercise && (
        <section className={`card p-5 ${!quizPassed ? "opacity-60" : ""}`}>
          <h2 className="heading-display mb-1 text-lg">
            {completed ? "✓ " : ""}Composition · {compositionExercise.title}
          </h2>
          <p className="text-parchment-200">{compositionExercise.prompt}</p>
          {compositionExercise.hint && (
            <p className="mt-2 text-sm text-parchment-500">💡 {compositionExercise.hint}</p>
          )}
          {!quizPassed && !completed && (
            <p className="mt-3 text-sm text-crimson-400">
              🔒 Pass the quiz to unlock this exercise.
            </p>
          )}
          {quizPassed && !completed && (
            <div className="mt-5 space-y-5">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="heading-display text-base">Write It Here</h3>
                  <span className="pill-arcane">
                    <Icon name="quill" size={11} /> {freedom.name} tools
                  </span>
                </div>
                <p className="mb-3 text-sm text-parchment-500">
                  The key, meter and length are set to suit this lesson. Place the notes, press
                  play, and adjust until every standard on the right turns green.
                </p>
                <ScoreEditor
                  score={score}
                  onChange={setScore}
                  freedom={freedom}
                  checks={brief.checks}
                />
              </div>

              <form onSubmit={handleComposition} className="space-y-3">
                <div>
                  <label className="label">Composition Title</label>
                  <input
                    className="input"
                    required
                    maxLength={120}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Name your creation"
                  />
                </div>
                <div>
                  <label className="label">Reflection (what did you try?)</label>
                  <textarea
                    className="input min-h-20"
                    maxLength={2000}
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Visibility</label>
                  <select
                    className="input"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                  >
                    <option value="PRIVATE">Private — only you</option>
                    <option value="PUBLIC">Public — visible in the Guild</option>
                  </select>
                </div>
                {error && (
                  <div className="rounded-lg border border-crimson-600/50 bg-abyss-900/60 p-3">
                    <p className="flex items-center gap-2 text-sm text-crimson-400">
                      <Icon name="warning" size={15} /> {error}
                    </p>
                    {failed && failed.length > 0 && (
                      <ul className="mt-2 space-y-1.5 text-[13px] text-parchment-400">
                        {failed.map((r) => (
                          <li key={r.id} className="flex gap-2">
                            <Icon
                              name="target"
                              size={13}
                              className="mt-0.5 shrink-0 text-crimson-400"
                            />
                            <span>
                              {r.label} — <span className="text-parchment-500">{r.detail}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                <button type="submit" disabled={busy} className="btn-primary">
                  <Icon name="book" size={15} />
                  {busy ? "Submitting…" : "Complete the Lesson"}
                </button>
              </form>
            </div>
          )}
        </section>
      )}

      {completion?.award && (
        <AwardBanner
          award={completion.award}
          newSpecializations={completion.newSpecializations}
        />
      )}

      {completed && nextLesson && (
        <Link href={`/academy/${nextLesson.slug}`} className="btn-primary w-full py-3">
          Next Lesson: {nextLesson.title} →
        </Link>
      )}
    </div>
  );
}
