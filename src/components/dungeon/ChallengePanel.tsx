"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getOrStartRoomChallenge,
  rerollChallenge,
  completeChallenge,
  type ChallengeCompletionResult,
} from "@/server/actions/dungeon";
import { AwardBanner } from "@/components/ui/AwardBanner";

export interface ActiveChallengeDto {
  userChallengeId: string;
  title: string;
  description: string;
  difficulty: number;
  keySig: string | null;
  meter: string | null;
  lengthBars: number | null;
  instrument: string | null;
  style: string | null;
  requirement: string | null;
  restriction: string | null;
  xpReward: number;
  curated: boolean;
}

export function ChallengePanel({
  roomId,
  isCurse,
  activeChallenge,
  hasRerollArtifact,
  isDaily = false,
}: {
  roomId: string | null;
  isCurse: boolean;
  activeChallenge: ActiveChallengeDto | null;
  hasRerollArtifact: boolean;
  isDaily?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [scoreLink, setScoreLink] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");
  const [result, setResult] = useState<ChallengeCompletionResult | null>(null);

  const objectives = activeChallenge
    ? [activeChallenge.requirement, activeChallenge.restriction].filter(
        (o): o is string => !!o
      )
    : [];

  async function begin() {
    if (!roomId) return;
    setBusy(true);
    setError(null);
    const res = await getOrStartRoomChallenge(roomId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "The room resists you");
      return;
    }
    router.refresh();
  }

  async function reroll() {
    if (!activeChallenge) return;
    setBusy(true);
    setError(null);
    const res = await rerollChallenge(activeChallenge.userChallengeId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "The reroll failed");
      return;
    }
    setChecked([]);
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChallenge) return;
    setBusy(true);
    setError(null);
    const res = await completeChallenge({
      userChallengeId: activeChallenge.userChallengeId,
      objectivesDone: checked,
      composition: { title, reflection, scoreLink, visibility },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Submission failed");
      return;
    }
    setResult(res);
    router.refresh();
  }

  if (result?.award) {
    return (
      <div className="space-y-4">
        <div className="card p-6 text-center">
          <p className="text-4xl">{isCurse ? "🕯️" : "⚔️"}</p>
          <h2 className="heading-display mt-2 text-xl">
            {isCurse ? "The Curse Is Broken" : "Challenge Conquered"}
          </h2>
          <p className="mt-1 text-parchment-400">
            Your composition has been filed in the Library.
          </p>
        </div>
        <AwardBanner award={result.award} newSpecializations={result.newSpecializations} />
      </div>
    );
  }

  if (!activeChallenge) {
    return (
      <div className="card p-6 text-center">
        <p className="text-4xl">{isCurse ? "🕯️" : "⚔️"}</p>
        <p className="mx-auto mt-3 max-w-md text-parchment-400">
          {isCurse
            ? "A curse waits in the dark, ready to bind your writing with strange rules."
            : "The room shifts and reforms, preparing a trial matched to your skills."}
        </p>
        {error && <p className="mt-3 text-sm text-crimson-400">{error}</p>}
        <button onClick={begin} disabled={busy} className="btn-primary mt-4">
          {busy ? "The walls are moving…" : isCurse ? "Face the Curse" : "Begin the Trial"}
        </button>
      </div>
    );
  }

  const specs: { label: string; value: string }[] = [];
  if (activeChallenge.keySig) specs.push({ label: "Key", value: activeChallenge.keySig });
  if (activeChallenge.meter) specs.push({ label: "Meter", value: activeChallenge.meter });
  if (activeChallenge.lengthBars)
    specs.push({ label: "Length", value: `${activeChallenge.lengthBars} measures` });
  if (activeChallenge.instrument)
    specs.push({ label: "Instrument", value: activeChallenge.instrument });
  if (activeChallenge.style) specs.push({ label: "Style", value: activeChallenge.style });

  return (
    <div className="space-y-5">
      <section className={`card p-5 ${isCurse ? "border-crimson-600/40" : ""}`}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="heading-display text-xl">{activeChallenge.title}</h2>
          <span className="shrink-0 text-sm text-gold-400">
            ✦ {activeChallenge.xpReward} XP
          </span>
        </div>
        <p className="mt-1 text-xs text-parchment-500">
          Difficulty {activeChallenge.difficulty}/10
          {isDaily && " · Daily Challenge"}
        </p>
        <p className="mt-3 text-parchment-200">{activeChallenge.description}</p>
        {specs.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {specs.map((s) => (
              <div key={s.label} className="rounded border border-abyss-600 bg-abyss-900/60 p-2">
                <dt className="text-[10px] uppercase tracking-wider text-parchment-500">
                  {s.label}
                </dt>
                <dd className="text-sm text-parchment-100">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {!activeChallenge.curated && !isDaily && (
          <button
            onClick={reroll}
            disabled={busy || !hasRerollArtifact}
            title={hasRerollArtifact ? "Uses the Ancient Motif" : "Requires the Ancient Motif artifact"}
            className="btn-secondary mt-4 text-xs"
          >
            📜 Reroll this challenge {!hasRerollArtifact && "(requires Ancient Motif)"}
          </button>
        )}
      </section>

      <section className="card p-5">
        <h3 className="heading-display mb-1 text-lg">Claim Your Victory</h3>
        <p className="mb-4 text-sm text-parchment-500">
          Compose in your favorite notation software, then confirm each objective
          honestly — the Dungeon trusts a composer&apos;s word.
        </p>
        {objectives.length > 0 && (
          <div className="mb-4 space-y-2">
            {objectives.map((o) => (
              <label
                key={o}
                className="flex cursor-pointer items-start gap-3 rounded border border-abyss-600 p-3 text-sm text-parchment-200 hover:border-gold-700/50"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 accent-gold-500"
                  checked={checked.includes(o)}
                  onChange={(e) =>
                    setChecked((c) =>
                      e.target.checked ? [...c, o] : c.filter((x) => x !== o)
                    )
                  }
                />
                {o}
              </label>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Composition Title</label>
            <input
              className="input"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Reflection / Notes</label>
            <textarea
              className="input min-h-20"
              maxLength={2000}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="How did you satisfy the requirement? What fought back?"
            />
          </div>
          <div>
            <label className="label">Score Link (optional)</label>
            <input
              className="input"
              type="url"
              value={scoreLink}
              onChange={(e) => setScoreLink(e.target.value)}
              placeholder="https://musescore.com/… or flat.io, noteflight…"
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
              <option value="PUBLIC">Public — shareable in the Guild</option>
            </select>
          </div>
          {error && <p className="text-sm text-crimson-400">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Judging…" : isCurse ? "Break the Curse" : "Complete the Challenge"}
          </button>
        </form>
      </section>
    </div>
  );
}
