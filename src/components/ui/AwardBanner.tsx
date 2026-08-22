"use client";

import type { AwardResult } from "@/lib/progression";
import { SKILL_LABELS } from "@/lib/enums";

/** Renders the outcome of a progression award: XP, level-ups, achievements. */
export function AwardBanner({
  award,
  newSpecializations,
  extra,
}: {
  award?: AwardResult;
  newSpecializations?: string[];
  extra?: string[];
}) {
  if (!award && (!extra || extra.length === 0)) return null;
  return (
    <div className="card-gold animate-rise space-y-2 p-4">
      {award && (
        <p className="font-display text-lg text-gold-300">
          ✦ +{award.xpAwarded} XP
          {award.streakBonusApplied && (
            <span className="ml-2 text-sm text-crimson-400">🔥 flame bonus</span>
          )}
        </p>
      )}
      {award?.leveledUp && (
        <p className="text-parchment-100">
          ⬆ You have reached <strong>Composer Level {award.newLevel}</strong>!
        </p>
      )}
      {award?.skillLevelUps.map((s) => (
        <p key={s.skill} className="text-sm text-arcane-300">
          ✧ {SKILL_LABELS[s.skill]} rose to level {s.level}
        </p>
      ))}
      {award?.streak.milestone && (
        <p className="text-sm text-crimson-400">
          🔥 Creative Flame milestone: {award.streak.milestone} day
          {award.streak.milestone > 1 ? "s" : ""}!
        </p>
      )}
      {award?.streak.usedRestDay && (
        <p className="text-sm text-parchment-400">⏳ A Rest Day preserved your flame.</p>
      )}
      {award?.achievements.map((a) => (
        <p key={a.key} className="text-sm text-gold-300">
          {a.icon} Achievement unlocked: <strong>{a.name}</strong> (+{a.xpReward} XP)
        </p>
      ))}
      {newSpecializations?.map((s) => (
        <p key={s} className="text-sm text-purple-300">
          🎭 Specialization unlocked: <strong>{s}</strong>
        </p>
      ))}
      {extra?.map((line) => (
        <p key={line} className="text-sm text-parchment-200">
          {line}
        </p>
      ))}
    </div>
  );
}
