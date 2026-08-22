"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EXPERIENCE_TIERS,
  TIER_INFO,
  GOALS,
  GOAL_LABELS,
  INTERESTS,
  INTEREST_LABELS,
  tierOrdinal,
  type ExperienceTier,
  type Goal,
  type MusicalInterest,
} from "@/lib/enums";
import {
  completeOnboarding,
  getPlacementQuestion,
  gradePlacementAnswer,
  submitPlacementTrial,
  acceptPlacementTier,
  type PlacementQuestionDto,
  type PlacementResult,
} from "@/server/actions/onboarding";

type Step = "tier" | "goals" | "placement-ask" | "placement-quiz" | "placement-result" | "interests";

const TRIAL_LENGTH = 8;

export function OnboardingWizard({ displayName }: { displayName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("tier");
  const [tier, setTier] = useState<ExperienceTier | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [interests, setInterests] = useState<MusicalInterest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Placement trial state
  const [question, setQuestion] = useState<PlacementQuestionDto | null>(null);
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<{ questionId: string; choiceIndex: number }[]>([]);
  const [currentDifficulty, setCurrentDifficulty] = useState(2);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [placementResult, setPlacementResult] = useState<PlacementResult | null>(null);

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  async function startTrial() {
    if (!tier) return;
    setBusy(true);
    const startDifficulty = Math.max(1, tierOrdinal(tier));
    setCurrentDifficulty(startDifficulty);
    const q = await getPlacementQuestion({ difficulty: startDifficulty, excludeIds: [] });
    setQuestion(q);
    setAskedIds(q ? [q.id] : []);
    setStep("placement-quiz");
    setBusy(false);
  }

  async function answerQuestion(choiceIndex: number) {
    if (!question || busy) return;
    setBusy(true);
    const graded = await gradePlacementAnswer({ questionId: question.id, choiceIndex });
    setFeedback(graded);
    setAnswers((a) => [...a, { questionId: question.id, choiceIndex }]);
    // Adapt: right answers raise difficulty, misses lower it.
    setCurrentDifficulty((d) =>
      graded.correct ? Math.min(9, d + 1) : Math.max(1, d - 1)
    );
    setBusy(false);
  }

  async function nextQuestion() {
    setBusy(true);
    setFeedback(null);
    if (answers.length >= TRIAL_LENGTH) {
      const result = await submitPlacementTrial({ answers });
      if (result.ok && result.result) {
        setPlacementResult(result.result);
        setStep("placement-result");
      } else {
        setError(result.error ?? "Trial failed to submit");
        setStep("interests");
      }
      setBusy(false);
      return;
    }
    const q = await getPlacementQuestion({
      difficulty: currentDifficulty,
      excludeIds: askedIds,
    });
    if (!q) {
      const result = await submitPlacementTrial({ answers });
      if (result.ok && result.result) {
        setPlacementResult(result.result);
        setStep("placement-result");
      } else {
        setStep("interests");
      }
      setBusy(false);
      return;
    }
    setQuestion(q);
    setAskedIds((ids) => [...ids, q.id]);
    setBusy(false);
  }

  async function finish(finalTier?: ExperienceTier) {
    if (!tier) return;
    setBusy(true);
    setError(null);
    const result = await completeOnboarding({
      experienceTier: finalTier ?? tier,
      goals,
      interests,
    });
    if (!result.ok) {
      setError(result.error ?? "Something went wrong");
      setBusy(false);
      return;
    }
    router.push("/hall");
    router.refresh();
  }

  return (
    <div className="card space-y-6 p-6 sm:p-8">
      {step === "tier" && (
        <section>
          <h2 className="heading-display mb-1 text-xl">Step 1 · Your Experience</h2>
          <p className="mb-4 text-sm text-parchment-400">
            {displayName}, what is your current experience level?
          </p>
          <div className="space-y-2">
            {EXPERIENCE_TIERS.map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`w-full rounded-md border p-3 text-left transition-colors ${
                  tier === t
                    ? "border-gold-500 bg-abyss-700/70 shadow-glow"
                    : "border-abyss-600 bg-abyss-800/60 hover:border-gold-700/60"
                }`}
              >
                <p className="font-display text-sm text-gold-300">{TIER_INFO[t].label}</p>
                <p className="text-sm text-parchment-400">{TIER_INFO[t].blurb}</p>
              </button>
            ))}
          </div>
          {tier === "VIRTUOSO_REPERTOIRE" && (
            <p className="mt-3 rounded border border-crimson-600/50 bg-crimson-700/20 p-3 text-sm text-parchment-300">
              ⚔️ Virtuoso Repertoire is both a high-difficulty starting tier and a
              specialized path — technically demanding writing that pushes performers.
            </p>
          )}
          <button
            className="btn-primary mt-6 w-full"
            disabled={!tier}
            onClick={() => setStep("goals")}
          >
            Continue
          </button>
        </section>
      )}

      {step === "goals" && (
        <section>
          <h2 className="heading-display mb-1 text-xl">Step 2 · Your Goals</h2>
          <p className="mb-4 text-sm text-parchment-400">
            What do you seek in these halls? Choose as many as you like.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => setGoals((prev) => toggle(prev, g))}
                className={`rounded-md border p-3 text-left text-sm transition-colors ${
                  goals.includes(g)
                    ? "border-gold-500 bg-abyss-700/70 text-gold-300"
                    : "border-abyss-600 bg-abyss-800/60 text-parchment-300 hover:border-gold-700/60"
                }`}
              >
                {GOAL_LABELS[g]}
              </button>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setStep("tier")}>
              Back
            </button>
            <button
              className="btn-primary flex-1"
              disabled={goals.length === 0}
              onClick={() => setStep("placement-ask")}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === "placement-ask" && (
        <section className="text-center">
          <h2 className="heading-display mb-1 text-xl">Step 3 · The Placement Trial</h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-parchment-400">
            Would you like to take the Placement Trial? A short adaptive test — it
            starts near your chosen level and follows your answers to recommend
            where to begin.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary flex-1" onClick={startTrial} disabled={busy}>
              ⚖️ Yes, Test Me
            </button>
            <button
              className="btn-secondary flex-1"
              onClick={() => setStep("interests")}
            >
              No, Start at My Selected Level
            </button>
          </div>
        </section>
      )}

      {step === "placement-quiz" && question && (
        <section>
          <div className="mb-4 flex items-center justify-between text-xs text-parchment-500">
            <span>
              Question {answers.length + (feedback ? 0 : 1)} of {TRIAL_LENGTH}
            </span>
            <span>Subject: {question.subject.replace(/_/g, " ").toLowerCase()}</span>
          </div>
          <p className="mb-4 text-lg text-parchment-100">{question.prompt}</p>
          {!feedback ? (
            <div className="space-y-2">
              {question.choices.map((choice, i) => (
                <button
                  key={i}
                  disabled={busy}
                  onClick={() => answerQuestion(i)}
                  className="w-full rounded-md border border-abyss-600 bg-abyss-800/60 p-3 text-left text-sm text-parchment-200 transition-colors hover:border-gold-700/60"
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p
                className={`rounded-md border p-3 text-sm ${
                  feedback.correct
                    ? "border-emerald-600/50 bg-emerald-900/20 text-emerald-300"
                    : "border-crimson-600/50 bg-crimson-700/20 text-parchment-200"
                }`}
              >
                {feedback.correct ? "✦ Correct." : "✕ Not quite."} {feedback.explanation}
              </p>
              <button className="btn-primary w-full" onClick={nextQuestion} disabled={busy}>
                {answers.length >= TRIAL_LENGTH ? "See My Result" : "Next Question"}
              </button>
            </div>
          )}
        </section>
      )}

      {step === "placement-result" && placementResult && (
        <section>
          <h2 className="heading-display mb-4 text-center text-xl">The Trial Speaks</h2>
          <div className="card-gold space-y-3 p-5 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-parchment-500">Result</p>
            <p className="font-display text-2xl text-gold-300">
              {placementResult.recommendedTierLabel}
            </p>
            <p className="text-sm text-parchment-400">
              {placementResult.correct} of {placementResult.total} answered correctly
            </p>
            <div className="grid grid-cols-1 gap-2 pt-2 text-sm sm:grid-cols-3">
              <div className="rounded bg-abyss-800/70 p-3">
                <p className="text-parchment-500">Strongest Skill</p>
                <p className="text-emerald-300">{placementResult.strongestSkill}</p>
              </div>
              <div className="rounded bg-abyss-800/70 p-3">
                <p className="text-parchment-500">Recommended Training</p>
                <p className="text-arcane-300">{placementResult.weakestSkill}</p>
              </div>
              <div className="rounded bg-abyss-800/70 p-3">
                <p className="text-parchment-500">Recommended Dungeon</p>
                <p className="text-gold-300">{placementResult.recommendedDungeonName}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="btn-primary flex-1"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await acceptPlacementTier();
                setTier(placementResult.recommendedTier as ExperienceTier);
                setStep("interests");
                setBusy(false);
              }}
            >
              Accept the Recommendation
            </button>
            <button
              className="btn-secondary flex-1"
              onClick={() => setStep("interests")}
            >
              Keep My Original Choice
            </button>
          </div>
        </section>
      )}

      {step === "interests" && (
        <section>
          <h2 className="heading-display mb-1 text-xl">Final Step · Musical Interests</h2>
          <p className="mb-4 text-sm text-parchment-400">
            Which musical worlds call to you? These shade your recommendations —
            they never lock you in.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {INTERESTS.map((i) => (
              <button
                key={i}
                onClick={() => setInterests((prev) => toggle(prev, i))}
                className={`rounded-md border p-3 text-sm transition-colors ${
                  interests.includes(i)
                    ? "border-gold-500 bg-abyss-700/70 text-gold-300"
                    : "border-abyss-600 bg-abyss-800/60 text-parchment-300 hover:border-gold-700/60"
                }`}
              >
                {INTEREST_LABELS[i]}
              </button>
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-crimson-400">{error}</p>}
          <button
            className="btn-primary mt-6 w-full"
            disabled={interests.length === 0 || busy}
            onClick={() => finish()}
          >
            {busy ? "Opening the gates…" : "🕯️ Descend into the Dungeon"}
          </button>
        </section>
      )}
    </div>
  );
}
