"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { setFullFreedom } from "@/server/actions/profile";
import { ALL_TIERS, freedomForPlayer } from "@/lib/composer-freedom";

/**
 * The switch that turns the tiered composer tools off.
 *
 * The tiers are a teaching device, not a paywall, so anyone may opt out — but
 * the warning is specific rather than decorative. The real cost is not "more
 * buttons": it is meeting notation nobody has taught you yet, and being able
 * to change a brief's key or length out from under the brief itself.
 */
export function FreedomPanel({
  fullFreedom,
  level,
  lessonsCompleted,
}: {
  fullFreedom: boolean;
  level: number;
  lessonsCompleted: number;
}) {
  const router = useRouter();
  const [on, setOn] = useState(fullFreedom);
  const [pending, startTransition] = useTransition();
  const earned = freedomForPlayer(level, lessonsCompleted);
  const top = ALL_TIERS[ALL_TIERS.length - 1];

  function toggle(next: boolean) {
    setOn(next);
    startTransition(async () => {
      const res = await setFullFreedom(next);
      if (!res.ok) setOn(!next);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-parchment-200">Give me every tool at once</p>
          <p className="mt-1 text-sm leading-relaxed text-parchment-400">
            By default the editor hands back one decision at a time as you earn
            it. Turn this on and every note length, the chromatic scale, all
            seven chords and full control of key, meter, tempo and length appear
            everywhere — in lessons and trials too, not just the Workshop.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={on}
          aria-label="Give me every tool at once"
          disabled={pending}
          onClick={() => toggle(!on)}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-50 ${
            on
              ? "border-gold-500/70 bg-gold-600/70"
              : "border-abyss-600 bg-abyss-800"
          }`}
        >
          <span
            className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-parchment-100 transition-all ${
              on ? "left-[26px]" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* The honest warning. */}
      <div className="rounded-lg border border-gold-700/40 bg-gold-900/10 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-400">
          <Icon name="warning" size={12} /> This can get confusing
        </p>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-parchment-300">
          <li>
            You will be offered notation the Academy has not taught you yet —
            sixteenths, dotted values, chromatic notes and the full chord set.
          </li>
          <li>
            Lessons and trials set their key, meter and length to suit the task.
            With this on you can change them, and a brief that asks for eight
            bars in G major will still say so while you write four in D.
          </li>
          <li>
            Nothing is lost by trying it. Turn it off again and the tools go
            back to matching what you have earned — your compositions are
            untouched either way.
          </li>
        </ul>
      </div>

      <p className="text-xs text-parchment-400">
        {on ? (
          <>
            Currently: <span className="text-gold-300">{top.name}</span> — every
            tool. Without this switch you would be at{" "}
            <span className="text-parchment-300">{earned.name}</span>.
          </>
        ) : (
          <>
            Currently: <span className="text-gold-300">{earned.name}</span> —{" "}
            {earned.blurb}
            {earned.next && <> {earned.next}</>}
          </>
        )}
      </p>
    </div>
  );
}
