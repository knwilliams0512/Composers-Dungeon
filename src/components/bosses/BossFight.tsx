"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startBossFight, completeBossObjective } from "@/server/actions/boss";
import { AwardBanner } from "@/components/ui/AwardBanner";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { AwardResult } from "@/lib/progression";

interface BossDto {
  key: string;
  name: string;
  title: string;
  description: string;
  artwork: string;
  totalHp: number;
  difficulty: number;
  xpReward: number;
  final: boolean;
  rewardArtifact: { name: string; icon: string } | null;
  phases: { order: number; name: string; description: string; hpThresholdPercent: number }[];
  objectives: {
    id: string;
    name: string;
    description: string;
    damage: number;
    bonus: boolean;
    finalBlow: boolean;
  }[];
}

export function BossFight({
  boss,
  initialProgress,
}: {
  boss: BossDto;
  initialProgress: {
    started: boolean;
    currentHp: number;
    defeated: boolean;
    completedObjectiveIds: string[];
  };
}) {
  const router = useRouter();
  const [started, setStarted] = useState(initialProgress.started);
  const [currentHp, setCurrentHp] = useState(initialProgress.currentHp);
  const [defeated, setDefeated] = useState(initialProgress.defeated);
  const [completedIds, setCompletedIds] = useState<string[]>(
    initialProgress.completedObjectiveIds
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [award, setAward] = useState<AwardResult | undefined>();
  const [rewardArtifactName, setRewardArtifactName] = useState<string | undefined>();
  const [newSpecs, setNewSpecs] = useState<string[] | undefined>();
  const [lastHit, setLastHit] = useState<number | null>(null);

  // Final blow composition form
  const [finalOpen, setFinalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [scoreLink, setScoreLink] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");

  const hpPercent = (currentHp / boss.totalHp) * 100;
  const activePhase =
    [...boss.phases]
      .sort((a, b) => a.hpThresholdPercent - b.hpThresholdPercent)
      .find((p) => hpPercent <= p.hpThresholdPercent) ??
    boss.phases[boss.phases.length - 1];

  const requiredDone = boss.objectives
    .filter((o) => !o.bonus && !o.finalBlow)
    .every((o) => completedIds.includes(o.id));

  async function begin() {
    setBusy(true);
    setError(null);
    const res = await startBossFight(boss.key);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "The encounter cannot begin");
      return;
    }
    setStarted(true);
    router.refresh();
  }

  async function strike(objectiveId: string, withComposition: boolean) {
    setBusy(true);
    setError(null);
    const res = await completeBossObjective({
      bossKey: boss.key,
      objectiveId,
      composition: withComposition
        ? { title, reflection, scoreLink, visibility }
        : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "The strike glances off");
      return;
    }
    setCompletedIds((ids) => [...ids, objectiveId]);
    setCurrentHp(res.currentHp ?? 0);
    setLastHit(res.damage ?? null);
    if (res.defeated) {
      setDefeated(true);
      setAward(res.award);
      setRewardArtifactName(res.rewardArtifact);
      setNewSpecs(res.newSpecializations);
    } else if (res.award) {
      setAward(res.award);
    }
    router.refresh();
  }

  return (
    <div className="mt-2 space-y-5">
      {/* Boss banner */}
      <section
        className={`card relative overflow-hidden p-6 text-center ${
          boss.final ? "border-crimson-600/60 shadow-crimson" : "border-abyss-600"
        }`}
      >
        <p className={`text-6xl ${defeated ? "grayscale" : "animate-flicker"}`}>
          {boss.artwork}
        </p>
        <h1 className="heading-display mt-3 text-3xl">{boss.name}</h1>
        <p className="text-sm italic text-parchment-500">{boss.title}</p>
        <p className="mx-auto mt-3 max-w-xl text-parchment-300">{boss.description}</p>
        <div className="mx-auto mt-5 max-w-xl">
          <ProgressBar
            percent={hpPercent}
            color="crimson"
            label={
              defeated
                ? "DEFEATED"
                : `${currentHp.toLocaleString()} / ${boss.totalHp.toLocaleString()} HP`
            }
          />
          {lastHit && !defeated && (
            <p className="mt-1 animate-rise text-sm text-crimson-400">
              ⚔️ {lastHit.toLocaleString()} damage!
            </p>
          )}
        </div>
      </section>

      {defeated && (
        <section className="card-gold p-6 text-center">
          <p className="text-4xl">🏆</p>
          <h2 className="heading-display mt-2 text-xl">{boss.name} Has Fallen</h2>
          {rewardArtifactName && (
            <p className="mt-2 text-gold-300">
              {boss.rewardArtifact?.icon} You claimed the{" "}
              <strong>{rewardArtifactName}</strong>
            </p>
          )}
        </section>
      )}

      {award && <AwardBanner award={award} newSpecializations={newSpecs} />}

      {!started && !defeated && (
        <div className="text-center">
          {error && <p className="mb-2 text-sm text-crimson-400">{error}</p>}
          <button onClick={begin} disabled={busy} className="btn-danger px-10 py-3 text-base">
            {busy ? "Steeling yourself…" : "⚔️ Begin the Encounter"}
          </button>
        </div>
      )}

      {started && !defeated && (
        <>
          {/* Phases */}
          <section className="card p-5">
            <h2 className="heading-display mb-3 text-lg">Phases of the Battle</h2>
            <ol className="space-y-2">
              {boss.phases.map((phase) => {
                const isActive = phase.order === activePhase?.order;
                const passed = hpPercent < phase.hpThresholdPercent && !isActive;
                return (
                  <li
                    key={phase.order}
                    className={`rounded border p-3 text-sm ${
                      isActive
                        ? "border-crimson-600/60 bg-crimson-700/15"
                        : passed
                          ? "border-abyss-600 opacity-50"
                          : "border-abyss-600"
                    }`}
                  >
                    <p className={`font-display ${isActive ? "text-crimson-400" : "text-parchment-300"}`}>
                      {isActive && "▶ "}
                      {phase.name}
                      <span className="ml-2 text-xs text-parchment-500">
                        (from {phase.hpThresholdPercent}% HP)
                      </span>
                    </p>
                    <p className="mt-0.5 text-parchment-400">{phase.description}</p>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Objectives */}
          <section className="card p-5">
            <h2 className="heading-display mb-1 text-lg">Objectives</h2>
            <p className="mb-4 text-sm text-parchment-500">
              Complete each musical objective in your score, then strike. The final
              blow demands the finished composition itself.
            </p>
            {error && <p className="mb-3 text-sm text-crimson-400">{error}</p>}
            <ul className="space-y-3">
              {boss.objectives.map((obj) => {
                const done = completedIds.includes(obj.id);
                if (obj.finalBlow) {
                  return (
                    <li
                      key={obj.id}
                      className={`rounded border p-4 ${
                        requiredDone
                          ? "border-gold-600/60 bg-gold-fade"
                          : "border-abyss-600 opacity-60"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-display text-gold-300">
                          ⚜ {obj.name} <span className="text-xs">(final blow)</span>
                        </p>
                        <span className="text-sm text-crimson-400">
                          {obj.damage.toLocaleString()} dmg
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-parchment-400">{obj.description}</p>
                      {!requiredDone && (
                        <p className="mt-2 text-xs text-parchment-500">
                          🔒 Sealed until every required objective is complete.
                        </p>
                      )}
                      {requiredDone && !finalOpen && (
                        <button
                          onClick={() => setFinalOpen(true)}
                          className="btn-danger mt-3"
                        >
                          Prepare the Final Blow
                        </button>
                      )}
                      {requiredDone && finalOpen && (
                        <form
                          className="mt-3 space-y-3"
                          onSubmit={(e) => {
                            e.preventDefault();
                            strike(obj.id, true);
                          }}
                        >
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
                            <label className="label">Reflection</label>
                            <textarea
                              className="input min-h-16"
                              maxLength={2000}
                              value={reflection}
                              onChange={(e) => setReflection(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="label">Score Link (optional)</label>
                            <input
                              className="input"
                              type="url"
                              value={scoreLink}
                              onChange={(e) => setScoreLink(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="label">Visibility</label>
                            <select
                              className="input"
                              value={visibility}
                              onChange={(e) => setVisibility(e.target.value)}
                            >
                              <option value="PRIVATE">Private</option>
                              <option value="PUBLIC">Public</option>
                            </select>
                          </div>
                          <button type="submit" disabled={busy} className="btn-danger w-full">
                            {busy ? "Striking…" : "⚔️ DELIVER THE FINAL BLOW"}
                          </button>
                        </form>
                      )}
                    </li>
                  );
                }
                return (
                  <li
                    key={obj.id}
                    className={`rounded border p-4 ${
                      done ? "border-emerald-700/50 bg-emerald-900/10" : "border-abyss-600"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-parchment-100">
                        {done ? "✓ " : ""}
                        {obj.name}
                        {obj.bonus && (
                          <span className="ml-2 text-xs text-gold-400">bonus</span>
                        )}
                      </p>
                      <span className="shrink-0 text-sm text-crimson-400">
                        {obj.damage.toLocaleString()} dmg
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-parchment-400">{obj.description}</p>
                    {!done && (
                      <button
                        onClick={() => strike(obj.id, false)}
                        disabled={busy}
                        className="btn-secondary mt-3 text-xs"
                      >
                        I Completed This — Strike!
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
