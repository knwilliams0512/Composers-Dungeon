"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { ScoreEditor } from "@/components/composer/ScoreEditor";
import type { Freedom } from "@/lib/composer-freedom";
import type { Check, CheckResult, Score } from "@/lib/score";
import { landRaidObjective, openRaid } from "@/server/actions/raid";
import { FINAL_BLOW_THRESHOLD } from "@/lib/guild-rules";

export interface RaidObjectiveView {
  id: string;
  name: string;
  description: string;
  damage: number;
  bonus: boolean;
  finalBlow: boolean;
  /** Whether the signed-in composer has landed this one. */
  mine: boolean;
  /** Everyone in the guild who has. */
  landedBy: string[];
}

export interface RaidPhaseView {
  order: number;
  name: string;
  description: string;
  hpThresholdPercent: number;
}

export interface RaidView {
  bossKey: string;
  name: string;
  title: string;
  description: string;
  artwork: string;
  totalHp: number;
  currentHp: number | null;
  defeated: boolean;
  levelRequirement: number;
  minMembers: number;
  memberCount: number;
  xpReward: number;
  open: boolean;
  phases: RaidPhaseView[];
  objectives: RaidObjectiveView[];
  contributions: { author: string; objective: string; damage: number; at: string }[];
  /** The brief the final blow is judged against. */
  brief: { setup: Score; checks: Check[]; summary: string[] };
}

/**
 * The same threshold the server enforces, printed rather than guessed. A panel
 * that said 20% while the action demanded 15% would read as a bug in the boss.
 */
const FINAL_BLOW_PERCENT = Math.round(FINAL_BLOW_THRESHOLD * 100);

/**
 * A boss fought by the house rather than by a composer.
 *
 * The bar at the top is the guild's, not yours, and that is the whole point —
 * it goes down when anybody lands anything, and the final blow stays sealed
 * until the house as a whole has brought it low. One composer landing
 * everything they are allowed to land cannot reach that threshold on any of
 * the three raids; the numbers are checked rather than asserted, in
 * scripts/check-raids.mjs.
 */
export function RaidPanel({
  raid,
  freedom,
}: {
  raid: RaidView;
  freedom: Freedom;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missed, setMissed] = useState<CheckResult[] | null>(null);
  const [striking, setStriking] = useState(false);
  const [score, setScore] = useState<Score>(() => raid.brief.setup);
  const [title, setTitle] = useState("");
  const [won, setWon] = useState<string | null>(null);

  const hp = raid.currentHp ?? raid.totalHp;
  const hpPercent = Math.round((hp / raid.totalHp) * 100);
  const finalUnlocked = hpPercent <= FINAL_BLOW_PERCENT;
  const tooSmall = raid.memberCount < raid.minMembers;

  async function land(objectiveId: string) {
    setBusy(true);
    setError(null);
    setMissed(null);
    const res = await landRaidObjective({ bossKey: raid.bossKey, objectiveId });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "That did not land");
      return;
    }
    if (res.defeated) setWon(raid.name);
    router.refresh();
  }

  async function strike(objectiveId: string) {
    setBusy(true);
    setError(null);
    setMissed(null);
    const res = await landRaidObjective({
      bossKey: raid.bossKey,
      objectiveId,
      composition: { title, visibility: "PUBLIC" },
      score,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "The blow glanced off");
      if (res.results) setMissed(res.results);
      return;
    }
    setStriking(false);
    if (res.defeated) setWon(raid.name);
    router.refresh();
  }

  if (!raid.open) {
    return (
      <div className="card p-6 text-center">
        <p className="text-5xl" aria-hidden>{raid.artwork}</p>
        <h2 className="heading-display mt-3 text-2xl">{raid.name}</h2>
        <p className="font-display text-sm uppercase tracking-[0.2em] text-crimson-400">
          {raid.title}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-parchment-400">
          {raid.description}
        </p>
        <dl className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-2 text-center text-xs">
          {[
            ["Level", raid.levelRequirement],
            ["Composers", `${raid.memberCount}/${raid.minMembers}`],
            ["HP", raid.totalHp.toLocaleString()],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 py-2.5"
            >
              <dd className="font-display text-base text-parchment-100">{value}</dd>
              <dt className="text-parchment-500">{label}</dt>
            </div>
          ))}
        </dl>

        {tooSmall ? (
          <p className="mt-5 text-sm text-crimson-300">
            This encounter will not open for fewer than {raid.minMembers} composers. Your
            guild has {raid.memberCount}.
          </p>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const res = await openRaid(raid.bossKey);
              setBusy(false);
              if (!res.ok) setError(res.error ?? "It would not open");
              else router.refresh();
            }}
            className="btn-primary mt-5"
          >
            <Icon name="skull" size={15} /> Open the encounter
          </button>
        )}
        {error && <p className="mt-3 text-sm text-crimson-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {won && (
        <div className="card-gold p-5 text-center">
          <p className="text-4xl" aria-hidden>🏆</p>
          <h3 className="heading-display mt-2 text-xl">{won} has fallen</h3>
          <p className="mt-1 text-sm text-parchment-300">
            Everyone who landed a blow shares the bounty.
          </p>
        </div>
      )}

      {/* The guild's health bar */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-4xl" aria-hidden>{raid.artwork}</span>
          <div className="min-w-0 flex-1">
            <h2 className="heading-display text-xl">{raid.name}</h2>
            <p className="text-xs uppercase tracking-[0.18em] text-crimson-400">
              {raid.title}
            </p>
          </div>
          <p className="shrink-0 font-display text-lg text-parchment-200">
            {hp.toLocaleString()}{" "}
            <span className="text-xs text-parchment-500">/ {raid.totalHp.toLocaleString()}</span>
          </p>
        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-abyss-900 ring-1 ring-inset ring-abyss-600">
          <div
            className="h-full rounded-full bg-gradient-to-r from-crimson-600 to-crimson-400 transition-[width] duration-700"
            style={{ width: `${Math.max(0, hpPercent)}%` }}
          />
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-parchment-500">
          <span>{hpPercent}% remaining</span>
          <span>·</span>
          <span>{raid.memberCount} in the house</span>
          <span>·</span>
          <span className={finalUnlocked ? "text-gold-300" : ""}>
            {raid.defeated
              ? "Defeated"
              : finalUnlocked
                ? "The last blow is possible"
                : `The last blow unlocks below ${FINAL_BLOW_PERCENT}%`}
          </span>
        </p>
      </div>

      {/* Phases, lit by how far the guild has driven it */}
      <ol className="space-y-2">
        {raid.phases.map((phase) => {
          const reached = hpPercent <= phase.hpThresholdPercent;
          return (
            <li
              key={phase.order}
              className={`rounded-lg border px-4 py-3 ${
                reached
                  ? "border-crimson-600/40 bg-crimson-900/10"
                  : "border-abyss-600/60 bg-abyss-900/30"
              }`}
            >
              <p
                className={`font-display text-sm ${
                  reached ? "text-crimson-200" : "text-parchment-500"
                }`}
              >
                {phase.name}
                {!reached && (
                  <span className="ml-2 text-[10px] uppercase tracking-widest text-parchment-600">
                    at {phase.hpThresholdPercent}%
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-parchment-400">
                {phase.description}
              </p>
            </li>
          );
        })}
      </ol>

      {error && (
        <p className="rounded-lg border border-crimson-600/50 bg-crimson-900/20 px-3 py-2 text-sm text-crimson-300">
          {error}
        </p>
      )}
      {missed && (
        <ul className="card space-y-1.5 p-4 text-xs">
          {missed.map((r) => (
            <li
              key={r.id}
              className={`flex items-start gap-2 ${
                r.passed ? "text-emerald-300" : "text-parchment-300"
              }`}
            >
              <Icon
                name={r.passed ? "check" : "warning"}
                size={12}
                className="mt-0.5 shrink-0"
              />
              <span>
                <span className="text-parchment-100">{r.label}</span> — {r.detail}
                {!r.passed && r.hint && (
                  <span className="block text-parchment-500">{r.hint}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Objectives */}
      <section className="space-y-2">
        <h3 className="heading-display text-base">What you can land</h3>
        {raid.objectives.map((o) => {
          const locked = o.finalBlow && !finalUnlocked;
          return (
            <article
              key={o.id}
              className={`card p-4 ${o.mine ? "border-emerald-600/40" : ""}`}
            >
              <header className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-display text-sm text-parchment-100">
                    {o.name}
                    {o.bonus && (
                      <span className="rounded-full border border-arcane-500/50 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-arcane-300">
                        Bonus
                      </span>
                    )}
                    {o.finalBlow && (
                      <span className="rounded-full border border-gold-600/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-gold-300">
                        Last blow
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-parchment-400">
                    {o.description}
                  </p>
                </div>
                <span className="shrink-0 font-display text-sm text-crimson-300">
                  {o.damage.toLocaleString()}
                </span>
              </header>

              {o.landedBy.length > 0 && (
                <p className="mt-2 text-[11px] text-parchment-500">
                  Landed by {o.landedBy.join(", ")}
                </p>
              )}

              {!raid.defeated && (
                <div className="mt-3">
                  {o.mine ? (
                    <p className="text-xs text-emerald-300">
                      <Icon name="check" size={12} className="mr-1 inline" />
                      You have landed this one
                    </p>
                  ) : o.finalBlow ? (
                    <button
                      type="button"
                      disabled={busy || locked}
                      onClick={() => setStriking((v) => !v)}
                      className="btn-primary text-xs disabled:opacity-40"
                      title={
                        locked
                          ? `Bring it below ${FINAL_BLOW_PERCENT}% first`
                          : "Write the final piece"
                      }
                    >
                      <Icon name="skull" size={13} />
                      {striking ? "Close" : locked ? "Sealed" : "Strike the last blow"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => land(o.id)}
                      className="btn-secondary text-xs"
                    >
                      Land it
                    </button>
                  )}
                </div>
              )}

              {o.finalBlow && striking && !o.mine && (
                <div className="mt-4 rounded-lg border border-abyss-600/60 bg-abyss-900/40 p-4">
                  <p className="mb-2 text-xs leading-relaxed text-parchment-400">
                    The last blow is a finished piece, judged by the same engine that judges
                    a solo boss. It must be in{" "}
                    <span className="text-gold-300">
                      {raid.brief.setup.key} {raid.brief.setup.mode}
                    </span>
                    , {raid.brief.setup.meter.beats}/{raid.brief.setup.meter.unit},{" "}
                    {raid.brief.setup.bars} bars.
                  </p>
                  <ul className="mb-3 space-y-0.5 text-[11px] text-parchment-500">
                    {raid.brief.summary.map((line) => (
                      <li key={line}>· {line}</li>
                    ))}
                  </ul>
                  <ScoreEditor
                    score={score}
                    onChange={setScore}
                    freedom={freedom}
                    checks={raid.brief.checks}
                  />
                  <input
                    className="input mt-3"
                    maxLength={80}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title the piece"
                  />
                  <button
                    type="button"
                    disabled={busy || !title.trim() || score.melody.length === 0}
                    onClick={() => strike(o.id)}
                    className="btn-primary mt-3 text-xs disabled:opacity-40"
                  >
                    {busy ? "Striking…" : "Strike"}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Who has done what */}
      {raid.contributions.length > 0 && (
        <section className="card p-5">
          <h3 className="heading-display mb-3 text-base">The Ledger</h3>
          <ul className="space-y-1.5 text-xs">
            {raid.contributions.map((c, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-2">
                <span className="text-parchment-200">{c.author}</span>
                <span className="text-parchment-500">{c.objective}</span>
                <span className="ml-auto text-crimson-300">
                  −{c.damage.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
