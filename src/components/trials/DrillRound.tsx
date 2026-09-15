"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StudioPlayer } from "@/lib/studio/audio";
import {
  DRILLS, generateQuestion, pointsFor, rhythmMatches,
  type DrillKey, type DrillQuestion,
} from "@/lib/drills";
import { submitDrillRound } from "@/server/actions/trials";
import { Icon } from "@/components/ui/Icon";
import { StaffFigure } from "@/components/trials/StaffFigure";

type Phase = "READY" | "PLAYING" | "OVER";

interface Answer {
  correct: boolean;
}

/**
 * One run at a drill: sixty-odd seconds, one question at a time, a combo that
 * builds while you are right and resets when you are not.
 *
 * Nothing here decides what a round was worth. The server replays the sequence
 * of right and wrong answers under its own rules — see submitDrillRound.
 */
export function DrillRound({ drill, best }: { drill: DrillKey; best: number }) {
  const info = DRILLS[drill];
  const [phase, setPhase] = useState<Phase>("READY");
  const [question, setQuestion] = useState<DrillQuestion | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(info.seconds);
  const [verdict, setVerdict] = useState<{ right: boolean; note: string } | null>(null);
  const [taps, setTaps] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; best: number; isBest: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const player = useRef<StudioPlayer | null>(null);
  const tapStart = useRef<number>(0);
  const streak = useRef(0);

  const ensurePlayer = useCallback(() => {
    if (!player.current) player.current = new StudioPlayer();
    return player.current;
  }, []);

  const playCue = useCallback(
    (q: DrillQuestion) => {
      if (!q.audio) return;
      const p = ensurePlayer();
      void p.resume().then(() => {
        p.stopAll();
        const at = p.now() + 0.12;
        // "struck" is the piano-ish recipe; the rhythm drill wants a drum, so
        // its strikes read as hits rather than pitches.
        const timbre = q.drill === "RHYTHM_ECHO" ? "drum" : "struck";
        for (const n of q.audio!.notes) {
          p.voice(
            {
              pitch: n.pitch,
              at: n.at,
              seconds: n.seconds,
              timbre,
              gain: 0.9,
              pan: 0,
              noise: q.drill === "RHYTHM_ECHO",
            },
            at
          );
        }
      });
    },
    [ensurePlayer]
  );

  const nextQuestion = useCallback(() => {
    const q = generateQuestion(drill, streak.current);
    setQuestion(q);
    setVerdict(null);
    setTaps([]);
    playCue(q);
  }, [drill, playCue]);

  const start = useCallback(() => {
    streak.current = 0;
    setAnswers([]);
    setCombo(0);
    setScore(0);
    setLeft(info.seconds);
    setResult(null);
    setPhase("PLAYING");
    const q = generateQuestion(drill, 0);
    setQuestion(q);
    setVerdict(null);
    setTaps([]);
    playCue(q);
  }, [drill, info.seconds, playCue]);

  // The clock.
  useEffect(() => {
    if (phase !== "PLAYING") return;
    const id = setInterval(() => {
      setLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setPhase("OVER");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // File the round once, when the clock runs out.
  const filed = useRef(false);
  useEffect(() => {
    if (phase !== "OVER" || filed.current) return;
    filed.current = true;
    player.current?.stopAll();
    if (answers.length === 0) return;
    setSaving(true);
    submitDrillRound({ drill, answers })
      .then((r) => {
        if (r.ok) setResult({ score: r.score ?? 0, best: r.best ?? 0, isBest: !!r.isBest });
      })
      .finally(() => setSaving(false));
  }, [phase, answers, drill]);
  useEffect(() => {
    if (phase === "PLAYING") filed.current = false;
  }, [phase]);

  const record = useCallback(
    (right: boolean, note: string) => {
      setAnswers((a) => [...a, { correct: right }]);
      if (right) {
        setScore((s) => s + pointsFor(combo));
        setCombo((c) => c + 1);
        streak.current += 1;
      } else {
        setCombo(0);
        streak.current = 0;
      }
      setVerdict({ right, note });
      setTimeout(() => {
        setVerdict((v) => (v === null ? v : null));
        nextQuestion();
      }, right ? 620 : 1500);
    },
    [combo, nextQuestion]
  );

  const answer = (choice: string) => {
    if (!question || verdict) return;
    record(choice === question.answer, question.note);
  };

  // --- Rhythm tapping -------------------------------------------------------
  const tap = () => {
    if (!question?.rhythm || verdict) return;
    const now = performance.now();
    if (taps.length === 0) {
      tapStart.current = now;
      setTaps([0]);
      return;
    }
    // Half a second per beat, matching the cue.
    setTaps((t) => [...t, (now - tapStart.current) / 500]);
  };

  const submitTaps = () => {
    if (!question?.rhythm || verdict) return;
    record(rhythmMatches(question.rhythm, taps), question.note);
  };

  // Space bar taps, so the rhythm drill is played rather than clicked.
  useEffect(() => {
    if (phase !== "PLAYING" || info.mode !== "TAP") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      tap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, info.mode, question, taps, verdict]);

  const accuracy = answers.length
    ? Math.round((answers.filter((a) => a.correct).length / answers.length) * 100)
    : 0;
  const multiplier = Math.min(5, 1 + Math.floor(combo / 3));
  const tint = info.accent;

  const timerPct = useMemo(() => (left / info.seconds) * 100, [left, info.seconds]);

  /* ---------------------------------------------------------------------- */

  if (phase === "READY") {
    return (
      <div className="card p-8 text-center" style={{ borderColor: `color-mix(in srgb, ${tint} 40%, transparent)` }}>
        <Icon name={info.icon as never} size={34} solid style={{ color: tint }} className="mx-auto" />
        <h2 className="heading-display mt-3 text-2xl">{info.name}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-parchment-400">{info.blurb}</p>
        <p className="mt-4 text-xs uppercase tracking-wider text-parchment-500">
          {info.seconds} seconds · best {best}
        </p>
        {info.mode === "TAP" && (
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-parchment-500">
            Listen, then tap the rhythm back with the button or the space bar, and send it.
          </p>
        )}
        <button onClick={start} className="btn-primary mt-6">
          Begin
        </button>
      </div>
    );
  }

  if (phase === "OVER") {
    return (
      <div className="card p-8 text-center" style={{ borderColor: `color-mix(in srgb, ${tint} 40%, transparent)` }}>
        <Icon name={info.icon as never} size={30} solid style={{ color: tint }} className="mx-auto" />
        <h2 className="heading-display mt-3 text-2xl">Time</h2>
        <p className="mt-1 text-sm text-parchment-400">{info.name}</p>
        <div className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-3">
          {[
            { n: result?.score ?? score, label: "Score" },
            { n: `${accuracy}%`, label: "Accuracy" },
            { n: answers.length, label: "Questions" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-abyss-900/70 px-3 py-3">
              <p className="text-2xl font-semibold" style={{ color: tint }}>{s.n}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-parchment-500">{s.label}</p>
            </div>
          ))}
        </div>
        {saving && <p className="mt-4 text-xs text-parchment-500">Filing your run…</p>}
        {result?.isBest && (
          <p className="mt-4 text-sm font-semibold" style={{ color: tint }}>
            A new personal best.
          </p>
        )}
        {result && !result.isBest && (
          <p className="mt-4 text-sm text-parchment-400">Your best here is {result.best}.</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={start} className="btn-primary">Again</button>
          <a href="/trials" className="btn-secondary">Back to the Grounds</a>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0" style={{ borderColor: `color-mix(in srgb, ${tint} 40%, transparent)` }}>
      {/* Clock */}
      <div className="h-1.5 w-full bg-abyss-900">
        <div
          className="h-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${timerPct}%`, background: tint }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-abyss-700/60 px-5 py-3 text-sm">
        <span className="font-semibold" style={{ color: tint }}>{left}s</span>
        <span className="text-parchment-400">
          Score <span className="font-semibold text-parchment-200">{score}</span>
        </span>
        <span className="text-parchment-400">
          Combo{" "}
          <span className="font-semibold" style={{ color: multiplier > 1 ? tint : undefined }}>
            {combo} {multiplier > 1 && <>· {multiplier}×</>}
          </span>
        </span>
      </div>

      <div className="px-5 py-7 text-center">
        <p className="text-xs uppercase tracking-wider text-parchment-500">{info.prompt}</p>

        {question?.staff && (
          <div className="mt-4 text-parchment-300">
            <StaffFigure clef={question.staff.clef} step={question.staff.step} accent={tint} />
          </div>
        )}
        {question?.signature && (
          <div className="mt-4 text-parchment-300">
            <StaffFigure clef="treble" signature={question.signature.count} accent={tint} />
          </div>
        )}
        {question?.audio && !question.staff && !question.signature && (
          <button
            onClick={() => question && playCue(question)}
            className="btn-secondary mt-4"
            aria-label="Play it again"
          >
            <Icon name="waveform" size={16} solid /> Hear it again
          </button>
        )}

        {/* Multiple choice */}
        {info.mode === "CHOICE" && question && (
          <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-3">
            {question.choices.map((c) => {
              const isAnswer = verdict && c === question.answer;
              const isWrongPick = verdict && !verdict.right && c !== question.answer;
              return (
                <button
                  key={c}
                  onClick={() => answer(c)}
                  disabled={!!verdict}
                  className="rounded-lg border px-3 py-3 text-sm transition disabled:cursor-default"
                  style={{
                    borderColor: isAnswer
                      ? "color-mix(in srgb, #6fe9b4 70%, transparent)"
                      : "color-mix(in srgb, var(--abyss-600, #2a2740) 90%, transparent)",
                    background: isAnswer
                      ? "color-mix(in srgb, #6fe9b4 18%, #0b0916)"
                      : isWrongPick
                        ? "transparent"
                        : "color-mix(in srgb, #0b0916 85%, transparent)",
                    opacity: isWrongPick ? 0.45 : 1,
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {/* Rhythm tapping */}
        {info.mode === "TAP" && question && (
          <div className="mt-6">
            <div className="mx-auto flex h-14 max-w-md items-center justify-center gap-1.5 rounded-lg bg-abyss-900/70 px-3">
              {taps.length === 0 ? (
                <span className="text-xs text-parchment-500">Nothing tapped yet</span>
              ) : (
                taps.map((t, i) => (
                  <span
                    key={i}
                    className="inline-block h-6 w-1.5 rounded-full"
                    style={{ background: tint, opacity: 0.4 + Math.min(0.6, i * 0.1) }}
                    title={`beat ${(t + 1).toFixed(2)}`}
                  />
                ))
              )}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button onClick={tap} disabled={!!verdict} className="btn-primary px-10">
                Tap
              </button>
              <button onClick={submitTaps} disabled={!!verdict || taps.length === 0} className="btn-secondary">
                Send it
              </button>
              <button onClick={() => setTaps([])} disabled={!!verdict} className="btn-secondary">
                Clear
              </button>
            </div>
          </div>
        )}

        {/* What it was */}
        <div className="mt-5 min-h-[2.5rem]">
          {verdict && (
            <p
              className="text-sm"
              style={{ color: verdict.right ? "#6fe9b4" : "#f2a0a0" }}
            >
              <span className="font-semibold">{verdict.right ? "Right." : `No — ${question?.answer}.`}</span>{" "}
              <span className="text-parchment-400">{verdict.note}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
