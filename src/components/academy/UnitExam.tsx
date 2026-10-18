"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { AwardBanner } from "@/components/ui/AwardBanner";
import {
  startUnitExam,
  submitUnitExam,
  type ExamResult,
  type ExamSitting,
} from "@/server/actions/unit-exam";

/**
 * Sitting a unit exam.
 *
 * One question at a time rather than a long scrolling list. A list invites
 * skimming for the answers you know and guessing the rest; one at a time keeps
 * the thing an exam. You can go back, and nothing is marked until the paper is
 * handed in.
 *
 * Nothing in this component ever holds a correct answer. The sitting arrives
 * with shuffled choices and no key, and marking happens on the server — so
 * reading the page source tells a determined person the questions, which they
 * could have got by sitting the exam anyway, and not the answers.
 */
export function UnitExam({
  unit,
  title,
  blurb,
  lessonCount,
  alreadyPassed,
  best,
  questionCount,
  passMark,
}: {
  unit: string;
  title: string;
  blurb: string;
  lessonCount: number;
  alreadyPassed: boolean;
  best: number | null;
  questionCount: number;
  passMark: number;
}) {
  // State the requirement the way it is actually enforced. "75%" on an
  // eight-question paper is six right, and a candidate who reads the
  // percentage and does the arithmetic in their head gets a different number
  // than the server uses.
  const needed = Math.ceil((passMark / 100) * questionCount);
  const router = useRouter();
  const [sitting, setSitting] = useState<ExamSitting | null>(null);
  const [at, setAt] = useState(0);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ExamResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function begin() {
    setBusy(true);
    setError(null);
    const res = await startUnitExam(unit);
    setBusy(false);
    if (!res.ok || !res.sitting) {
      setError(res.error ?? "That exam would not open");
      return;
    }
    setSitting(res.sitting);
    setChosen({});
    setAt(0);
    setResult(null);
  }

  async function hand_in() {
    if (!sitting) return;
    setBusy(true);
    setError(null);
    const res = await submitUnitExam({
      unit,
      answers: sitting.questions.map((q) => ({
        questionId: q.id,
        chosen: chosen[q.id] ?? "",
      })),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "That did not submit");
      return;
    }
    setResult(res);
    setSitting(null);
    router.refresh();
  }

  /* ---------------------------------------------------------------- result */
  if (result) {
    const good = result.passed;
    return (
      <div className={`card p-6 ${good ? "border-emerald2-500/40" : "border-crimson-600/40"}`}>
        <p className="text-5xl" aria-hidden>{good ? "🎓" : "📖"}</p>
        <h2 className="heading-display mt-3 text-2xl">
          {good ? `Unit ${unit} passed` : "Not yet"}
        </h2>
        <p className="mt-1 text-sm text-parchment-300">
          {result.correct} of {result.total} right
          {typeof result.passMark === "number" &&
            typeof result.total === "number" &&
            ` — ${Math.ceil((result.passMark / 100) * result.total)} were needed`}
        </p>

        {good ? (
          <>
            <p className="mt-4 text-sm leading-relaxed text-parchment-300">
              {result.unlocked
                ? `Unit ${result.unlocked} is open. The lessons of this unit stay available if you ever want them — you simply do not have to do them.`
                : "That was the last unit of the roadmap. Every lesson in the Academy is now open."}
            </p>
            {/*
              Passing a unit is the biggest single moment on the roadmap, and
              for a long time it said so in one grey line of "+180 XP" — while
              the level-up, the skill level and any achievement it unlocked
              happened invisibly, because the server dropped the award. The
              banner is the same one a lesson ends on, which is the point: the
              larger moment should not be the quieter one.
            */}
            {result.award ? (
              <div className="mt-3">
                <AwardBanner award={result.award} />
              </div>
            ) : result.xp ? (
              <p className="mt-2 text-xs text-gold-300">+{result.xp} XP</p>
            ) : (
              <p className="mt-2 text-xs text-parchment-500">
                You had already passed this one, so no XP this time.
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-parchment-300">
            The next unit stays shut until this is passed. Nothing is lost — the exam can be
            retaken as many times as you like, and the questions are shuffled each sitting.
          </p>
        )}

        {result.missed && result.missed.length > 0 && (
          <section className="mt-5">
            <h3 className="heading-display text-base">
              {good ? "Worth a second look" : "What to read first"}
            </h3>
            <ul className="mt-3 space-y-3">
              {result.missed.map((m, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 p-3"
                >
                  <p className="text-sm text-parchment-200">{m.prompt}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-parchment-400">{m.why}</p>
                  <Link
                    href={`/academy/${m.slug}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-gold-400 hover:underline"
                  >
                    <Icon name="book" size={12} />
                    {m.heading}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={begin} disabled={busy} className="btn-secondary">
            <Icon name="refresh" size={14} /> Sit it again
          </button>
          <Link href="/academy" className="btn-ghost">
            Back to the Academy
          </Link>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------- sitting */
  if (sitting) {
    const question = sitting.questions[at];
    const answeredCount = sitting.questions.filter((q) => chosen[q.id]).length;
    const last = at === sitting.questions.length - 1;
    return (
      <div className="card p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-parchment-500">
            Unit {unit} · question {at + 1} of {sitting.questions.length}
          </p>
          <p className="text-xs text-parchment-500">
            {answeredCount} answered
          </p>
        </header>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-abyss-900">
          <div
            className="h-full rounded-full bg-gold-500/70 transition-[width]"
            style={{ width: `${((at + 1) / sitting.questions.length) * 100}%` }}
          />
        </div>

        <p className="text-lg leading-relaxed text-parchment-100">{question.prompt}</p>

        <ul className="mt-4 space-y-2">
          {question.choices.map((choice) => {
            const picked = chosen[question.id] === choice;
            return (
              <li key={choice}>
                <button
                  type="button"
                  onClick={() =>
                    setChosen((c) => ({ ...c, [question.id]: choice }))
                  }
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    picked
                      ? "border-gold-500/60 bg-gold-500/10 text-gold-100"
                      : "border-abyss-600/60 bg-abyss-900/40 text-parchment-300 hover:border-parchment-100/30"
                  }`}
                >
                  {choice}
                </button>
              </li>
            );
          })}
        </ul>

        {error && <p className="mt-3 text-sm text-crimson-400">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAt((n) => Math.max(0, n - 1))}
            disabled={at === 0}
            className="btn-ghost text-xs disabled:opacity-40"
          >
            Back
          </button>
          {last ? (
            <button
              type="button"
              onClick={hand_in}
              disabled={busy || answeredCount < sitting.questions.length}
              className="btn-primary disabled:opacity-40"
              title={
                answeredCount < sitting.questions.length
                  ? "Every question needs an answer"
                  : "Hand the paper in"
              }
            >
              {busy ? "Marking…" : "Hand it in"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAt((n) => n + 1)}
              className="btn-primary"
            >
              Next
            </button>
          )}
          <span className="text-xs text-parchment-600">
            Nothing is marked until you hand it in.
          </span>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------------- front */
  return (
    <div className="card p-6">
      <p className="eyebrow">
        <Icon name="target" size={12} /> Unit {unit} exam
      </p>
      <h2 className="heading-display mt-2 text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-parchment-400">{blurb}</p>

      <div className="mt-5 space-y-2 text-sm leading-relaxed text-parchment-300">
        <p>
          <strong className="text-parchment-100">You do not have to read the lessons
          first.</strong>{" "}
          This exam is here so that somebody who already knows the material can prove it and
          move on. Pass it and the unit&rsquo;s {lessonCount} lesson
          {lessonCount === 1 ? "" : "s"} become optional.
        </p>
        <p>
          It is also the only way forward. Finishing every lesson in the unit does not open
          the next one — passing this does.
        </p>
        <p className="text-parchment-400">
          {questionCount} questions covering every part of the unit, in a different order
          each time. {needed} right to pass, so {questionCount - needed} may be wrong.
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 py-2.5">
          <dd className="font-display text-base text-parchment-100">
            {needed}/{questionCount}
          </dd>
          <dt className="text-parchment-500">To pass</dt>
        </div>
        <div className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 py-2.5">
          <dd className="font-display text-base text-parchment-100">∞</dd>
          <dt className="text-parchment-500">Retakes</dt>
        </div>
        <div className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 py-2.5">
          <dd className="font-display text-base text-parchment-100">
            {best === null ? "—" : `${best}%`}
          </dd>
          <dt className="text-parchment-500">Your best</dt>
        </div>
      </dl>

      {alreadyPassed && (
        <p className="mt-4 flex items-center gap-2 text-sm text-emerald2-300">
          <Icon name="check" size={14} /> You have already passed this unit.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-crimson-400">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={begin} disabled={busy} className="btn-primary">
          <Icon name="quill" size={15} />
          {busy ? "Opening…" : alreadyPassed ? "Sit it again" : "Begin the exam"}
        </button>
        <Link href="/academy" className="btn-ghost">
          Back to the Academy
        </Link>
      </div>
    </div>
  );
}
