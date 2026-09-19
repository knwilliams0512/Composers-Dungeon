"use client";

import type { AwardResult } from "@/lib/progression";
import { SKILL_LABELS } from "@/lib/enums";
import { Icon } from "@/components/ui/Icon";
import { CountUp } from "@/components/ui/CountUp";

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
    <div className={`card-gold animate-rise space-y-2 p-4 ${award?.leveledUp ? "award-levelled" : ""}`}>
      {award && (
        <p className="font-display text-lg text-gold-300">
          <Icon name="sparkle" size={16} className="mr-1 inline text-gold-400" />
          <CountUp to={award.xpAwarded} prefix="+" suffix=" XP" />
          {award.streakBonusApplied && (
            <span className="ml-2 inline-flex items-center gap-1 text-sm text-crimson-400">
              <Icon name="flame" size={13} /> flame bonus
            </span>
          )}
        </p>
      )}
      {award?.leveledUp && (
        <p className="level-up flex items-center gap-2 text-parchment-100">
          <Icon name="trophy" size={17} className="level-up-mark shrink-0 text-gold-400" />
          <span>
            You have reached <strong>Composer Level {award.newLevel}</strong>!
          </span>
        </p>
      )}
      {award?.skillLevelUps.map((s) => (
        <p key={s.skill} className="text-sm text-arcane-300">
          ✧ {SKILL_LABELS[s.skill]} rose to level {s.level}
        </p>
      ))}
      {award?.streak.milestone && (
        <p className="text-sm text-crimson-400">
          <Icon name="flame" size={14} className="mr-1 inline text-crimson-400" />
          Creative Flame milestone: {award.streak.milestone} day
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
