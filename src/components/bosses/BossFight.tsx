"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startBossFight, completeBossObjective } from "@/server/actions/boss";
import { AwardBanner } from "@/components/ui/AwardBanner";
import { Meter } from "@/components/ui/primitives";
import type { AwardResult } from "@/lib/progression";
import { Icon } from "@/components/ui/Icon";
import { CountUp } from "@/components/ui/CountUp";
import { ScoreEditor } from "@/components/composer/ScoreEditor";
import type { Freedom } from "@/lib/composer-freedom";
import type { Brief } from "@/lib/challenge-brief";
import type { CheckResult, Score } from "@/lib/score";

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
  brief,
  freedom,
  initialProgress,
}: {
  boss: BossDto;
  brief: Brief;
  freedom: Freedom;
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
  const [score, setScore] = useState<Score>(brief.setup);
  const [failed, setFailed] = useState<CheckResult[] | null>(null);

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
    setFailed(null);
    const res = await completeBossObjective({
      bossKey: boss.key,
      objectiveId,
      composition: withComposition
        ? { title, reflection, scoreLink, visibility }
        : undefined,
      score: withComposition ? score : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "The strike glances off");
      setFailed(res.results?.filter((r) => !r.passed) ?? null);
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
        className={`card-crimson lit-edge relative overflow-hidden p-8 text-center ${
          defeated ? "border-emerald2-500/40" : ""
        }`}
      >
        {/* A crimson aura bleeding from behind the portrait, dimmed once defeated */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/3 rounded-full opacity-30 blur-3xl transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle, ${defeated ? "#2fa27c" : "#a03c38"}, transparent 70%)`,
            opacity: defeated ? 0.18 : 0.35,
          }}
        />
        {boss.final && !defeated && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #dc8580, transparent)" }}
          />
        )}

        <div className="relative">
          <span
            className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 text-5xl leading-none backdrop-blur ${
              defeated
                ? "border-emerald2-500/40 bg-emerald2-500/10 grayscale"
                : "border-crimson-400/50 bg-crimson-500/10 animate-flicker"
            }`}
          >
            {boss.artwork}
          </span>
          <h1 className="text-gilded mt-4 font-display text-3xl">{boss.name}</h1>
          <p className="text-sm italic text-parchment-500">{boss.title}</p>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-parchment-300">
            {boss.description}
          </p>

          <div className="mx-auto mt-6 max-w-xl">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold uppercase tracking-[0.14em] text-parchment-400">
                <Icon name="heart" size={13} className={defeated ? "text-emerald2-400" : "text-crimson-400"} />
                {defeated ? "Defeated" : "Health"}
              </span>
              {!defeated && (
                <span className="tabular-nums text-parchment-500">
                  {currentHp.toLocaleString()} / {boss.totalHp.toLocaleString()}
                </span>
              )}
            </div>
            {/* Keyed on the running total so each landed blow replays the
                shake rather than animating once and never again. */}
            <div key={`hp-${currentHp}`} className={lastHit && !defeated ? "struck" : undefined}>
              <Meter percent={hpPercent} color={defeated ? "emerald" : "crimson"} thick />
            </div>
            {lastHit && !defeated && (
              <p className="mt-2 animate-rise text-sm text-crimson-400">
                <Icon name="sword" size={15} className="mr-1 inline" />
                <CountUp to={lastHit} suffix=" damage!" />
              </p>
            )}
          </div>
        </div>
      </section>

      {defeated && (
        <section className="victory card-gold aura lit-edge relative overflow-hidden p-7 text-center">
          <div
            className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, #f0d894, transparent 70%)" }}
          />
          <div className="relative">
            <Icon name="trophy" size={38} className="mx-auto text-gold-300" />
            <h2 className="text-gilded mt-3 font-display text-2xl">{boss.name} Has Fallen</h2>
            {rewardArtifactName && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-gold-300">
                <span className="text-lg">{boss.rewardArtifact?.icon}</span>
                You claimed the <strong>{rewardArtifactName}</strong>
              </p>
            )}
          </div>
        </section>
      )}

      {award && <AwardBanner award={award} newSpecializations={newSpecs} />}

      {!started && !defeated && (
        <div className="text-center">
          {error && <p className="mb-2 text-sm text-crimson-400">{error}</p>}
          <button onClick={begin} disabled={busy} className="btn-danger px-10 py-3 text-base">
            {busy ? "Steeling yourself…" : <><Icon name="sword" size={16} /> Begin the Encounter</>}
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
            {error && (
              <div className="mb-3 rounded-lg border border-crimson-600/50 bg-abyss-900/60 p-3">
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
                          <Icon name="lock" size={12} className="mr-1 inline" /> Sealed
                          until every required objective is complete.
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
                          <div className="rounded-lg border border-crimson-700/40 bg-abyss-900/50 p-3">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <h4 className="heading-display text-base">Write the Final Piece</h4>
                              <span className="pill-arcane">
                                <Icon name="quill" size={11} /> {freedom.name} tools
                              </span>
                            </div>
                            <p className="mb-3 text-sm text-parchment-500">
                              {brief.setup.bars} bars in {brief.setup.key}{" "}
                              {brief.setup.mode}, {brief.setup.meter.beats}/
                              {brief.setup.meter.unit}. The fight sets the terms; the music is
                              yours.
                            </p>
                            <ScoreEditor
                              score={score}
                              onChange={setScore}
                              freedom={freedom}
                              checks={brief.checks}
                            />
                          </div>
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
                            {busy ? "Striking…" : <><Icon name="sword" size={16} /> DELIVER THE FINAL BLOW</>}
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
