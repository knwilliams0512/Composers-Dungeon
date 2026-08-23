"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeChallenge, rerollChallenge } from "@/server/actions/dungeon";
import { AwardBanner } from "@/components/ui/AwardBanner";
import { ScoreEditor } from "@/components/composer/ScoreEditor";
import { Icon } from "@/components/ui/Icon";
import type { AwardResult } from "@/lib/progression";
import type { Check, CheckResult, Score } from "@/lib/score";
import type { Freedom } from "@/lib/composer-freedom";

export interface ChallengeView {
  userChallengeId: string;
  title: string;
  description: string;
  keySig: string | null;
  meter: string | null;
  lengthBars: number | null;
  instrument: string | null;
  style: string | null;
  requirement: string | null;
  restriction: string | null;
  xpReward: number;
  difficulty: number;
  canReroll: boolean;
}

export function ChallengePanel({
  challenge,
  setup,
  checks,
  freedom,
}: {
  challenge: ChallengeView;
  setup: Score;
  checks: Check[];
  freedom: Freedom;
}) {
  const router = useRouter();
  const [score, setScore] = useState<Score>(setup);
  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<CheckResult[] | null>(null);
  const [award, setAward] = useState<AwardResult | null>(null);
  // Success is its own flag: an award can legitimately be absent (a repeat of
  // an already-rewarded trial), and the victory screen must still appear.
  const [conquered, setConquered] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFailed(null);
    const res = await completeChallenge({
      userChallengeId: challenge.userChallengeId,
      score,
      composition: { title, reflection, visibility },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong");
      setFailed(res.results?.filter((r) => !r.passed) ?? null);
      return;
    }
    // Deliberately no router.refresh() here: the room would re-render without
    // an active challenge and unmount this panel, snatching away the victory
    // screen the player just earned. They refresh by navigating.
    setAward(res.award ?? null);
    setConquered(true);
  }

  async function reroll() {
    setBusy(true);
    const res = await rerollChallenge(challenge.userChallengeId);
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error ?? "Reroll failed");
  }

  if (conquered) {
    return (
      <div className="space-y-4">
        <div className="card-gold lit-edge p-5 text-center">
          <Icon name="trophy" size={30} className="mx-auto text-gold-400" />
          <h2 className="heading-display mt-2 text-2xl">Challenge Conquered</h2>
          <p className="mt-1 text-sm text-parchment-400">
            Every standard met. The piece is yours, and it is in your Library.
          </p>
        </div>
        <AwardBanner award={award ?? undefined} />
        <button onClick={() => router.push("/dungeon")} className="btn-primary">
          <Icon name="candle" size={15} /> Back to the Dungeon
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- The brief ---------------------------------------------------- */}
      <section className="card-crimson lit-edge p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">
              <Icon name="sword" size={12} /> The Trial · difficulty {challenge.difficulty}/10
            </p>
            <h2 className="heading-display mt-1 text-2xl">{challenge.title}</h2>
          </div>
          <span className="pill-gold">
            <Icon name="sparkle" size={11} /> {challenge.xpReward} XP
          </span>
        </div>

        <p className="mt-3 leading-relaxed text-parchment-300">{challenge.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Key", value: challenge.keySig ?? "—", icon: "note" as const },
            { label: "Meter", value: challenge.meter ?? "—", icon: "drum" as const },
            {
              label: "Length",
              value: challenge.lengthBars ? `${challenge.lengthBars} bars` : "—",
              icon: "column" as const,
            },
            { label: "For", value: challenge.instrument ?? "—", icon: "harp" as const },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-lg border border-abyss-600/60 bg-abyss-900/50 px-3 py-2"
            >
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-parchment-500">
                <Icon name={f.icon} size={10} /> {f.label}
              </p>
              <p className="mt-0.5 truncate text-sm text-parchment-100">{f.value}</p>
            </div>
          ))}
        </div>

        {(challenge.requirement || challenge.restriction) && (
          <ul className="mt-4 space-y-2 text-sm">
            {challenge.requirement && (
              <li className="flex gap-2 text-parchment-300">
                <Icon name="target" size={15} className="mt-0.5 shrink-0 text-gold-500" />
                {challenge.requirement}
              </li>
            )}
            {challenge.restriction && (
              <li className="flex gap-2 text-crimson-400">
                <Icon name="lock" size={15} className="mt-0.5 shrink-0" />
                {challenge.restriction}
              </li>
            )}
          </ul>
        )}

        {challenge.canReroll && (
          <button onClick={reroll} disabled={busy} className="btn-ghost mt-4 text-xs">
            <Icon name="refresh" size={13} /> Reroll with the Ancient Motif
          </button>
        )}
      </section>

      {/* ---- The composer -------------------------------------------------- */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="heading-display text-lg">Write It Here</h3>
          <span className="pill-arcane">
            <Icon name="quill" size={11} /> {freedom.name} tools
          </span>
        </div>
        <p className="mb-3 text-sm text-parchment-500">
          The key, meter, length and instrument are already set for you. All that is missing is
          the music.
        </p>
        <ScoreEditor score={score} onChange={setScore} freedom={freedom} checks={checks} />
      </div>

      {/* ---- Submit --------------------------------------------------------- */}
      <form onSubmit={submit} className="card lit-edge space-y-4 p-5">
        <h3 className="heading-display text-lg">Claim Your Victory</h3>
        <div>
          <label className="label" htmlFor="comp-title">
            Name your piece
          </label>
          <input
            id="comp-title"
            className="input"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give it a title"
          />
        </div>
        <div>
          <label className="label" htmlFor="comp-reflection">
            What did you learn? (optional)
          </label>
          <textarea
            id="comp-reflection"
            className="input min-h-20"
            maxLength={2000}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="The hardest part was…"
          />
        </div>
        <div>
          <label className="label" htmlFor="comp-visibility">
            Visibility
          </label>
          <select
            id="comp-visibility"
            className="input"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="PRIVATE">Private — only you</option>
            <option value="PUBLIC">Public — shareable in the Guild</option>
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
                    <Icon name="target" size={13} className="mt-0.5 shrink-0 text-crimson-400" />
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
          <Icon name="sword" size={15} />
          {busy ? "Submitting…" : "Submit for Judgement"}
        </button>
        <p className="text-xs text-parchment-500">
          The dungeon checks your piece against every standard above. Nothing is taken on trust.
        </p>
      </form>
    </div>
  );
}
