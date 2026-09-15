import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Icon } from "@/components/ui/Icon";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { DRILL_KEYS, DRILLS, type DrillKey } from "@/lib/drills";
import { SKILL_LABELS, type SkillKey } from "@/lib/enums";

export const metadata = { title: "The Proving Grounds" };

export default async function TrialsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const results = await db.drillResult.findMany({
    where: { userId },
    orderBy: { playedAt: "desc" },
  });

  const bestFor = new Map<string, number>();
  const runsFor = new Map<string, number>();
  for (const r of results) {
    bestFor.set(r.drill, Math.max(bestFor.get(r.drill) ?? 0, r.score));
    runsFor.set(r.drill, (runsFor.get(r.drill) ?? 0) + 1);
  }
  const totalRuns = results.length;
  const totalCorrect = results.reduce((n, r) => n + r.correct, 0);
  const totalAsked = results.reduce((n, r) => n + r.total, 0);
  const accuracy = totalAsked ? Math.round((totalCorrect / totalAsked) * 100) : 0;

  return (
    <div>
      <ScrollProgress />
      <SectionHeading
        eyebrow="Fast · Scored · Yours to beat"
        icon="bolt"
        title="The Proving Grounds"
        subtitle="The Academy explains it and the Dungeon asks you to write it. Here you have sixty seconds to recognise it. Short rounds, a combo that builds while you are right, and a personal best to take off yourself."
      />

      <div className="mt-6 grid grid-cols-3 gap-3 text-center sm:max-w-md">
        {[
          { n: totalRuns, label: "Rounds run" },
          { n: totalAsked, label: "Questions faced" },
          { n: `${accuracy}%`, label: "Accuracy" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-abyss-900/70 px-3 py-3 ring-1 ring-white/10">
            <p className="text-2xl font-semibold text-gold-400">{s.n}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-parchment-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {DRILL_KEYS.map((key) => {
          const d = DRILLS[key as DrillKey];
          const best = bestFor.get(key) ?? 0;
          const runs = runsFor.get(key) ?? 0;
          return (
            <Link
              key={key}
              href={`/trials/${key.toLowerCase().replace(/_/g, "-")}`}
              className="card group flex flex-col p-5 transition hover:-translate-y-0.5"
              style={{ borderColor: `color-mix(in srgb, ${d.accent} 38%, transparent)` }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1"
                  style={{
                    background: `color-mix(in srgb, ${d.accent} 20%, #0b0916)`,
                    borderColor: "transparent",
                    color: `color-mix(in srgb, ${d.accent} 90%, white)`,
                  }}
                >
                  <Icon name={d.icon as never} size={20} solid />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="heading-display text-lg leading-tight">{d.name}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-parchment-400">{d.blurb}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-parchment-500">
                <span>{d.seconds}s round</span>
                <span>Trains {SKILL_LABELS[d.skill as SkillKey] ?? d.skill}</span>
                {runs > 0 ? (
                  <span style={{ color: d.accent }}>Best {best} · {runs} run{runs === 1 ? "" : "s"}</span>
                ) : (
                  <span className="text-parchment-600">Not yet attempted</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {results.length > 0 && (
        <div className="card mt-8 p-5">
          <h2 className="heading-display text-lg">Recent runs</h2>
          <ul className="mt-3 divide-y divide-abyss-700/50 text-sm">
            {results.slice(0, 8).map((r) => {
              const d = DRILLS[r.drill as DrillKey];
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-parchment-300">{d?.name ?? r.drill}</span>
                  <span className="text-parchment-500">
                    {r.score} pts · {r.correct}/{r.total} · best combo {r.bestCombo}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
