import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Icon } from "@/components/ui/Icon";
import { Meter } from "@/components/ui/primitives";

export const metadata = { title: "The Bosses" };

export default async function BossesPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [profile, bosses, progress] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    db.boss.findMany({ orderBy: [{ final: "asc" }, { levelRequirement: "asc" }] }),
    db.userBossProgress.findMany({ where: { userId } }),
  ]);
  if (!profile) redirect("/login");
  const progressByBoss = new Map(progress.map((p) => [p.bossId, p]));

  return (
    <div>
      <SectionHeading
        eyebrow="Intense · Dramatic · Unforgiving"
        title="The Bosses"
        subtitle="Great musical adversaries guard the Dungeon's depths. Wound them with modulations, motifs, and counterpoint — finish them with a completed composition."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {bosses.map((boss) => {
          const p = progressByBoss.get(boss.id);
          const locked = profile.level < boss.levelRequirement;
          const hpPercent = p ? (p.currentHp / boss.totalHp) * 100 : 100;
          const inner = (
            <div
              className={`card lit-edge h-full p-5 transition-all ${
                boss.final ? "border-crimson-600/60" : ""
              } ${
                locked
                  ? "opacity-50"
                  : p?.defeated
                    ? "border-emerald-700/50"
                    : "hover:border-crimson-600/60 hover:shadow-crimson"
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{boss.artwork}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="flex items-center gap-1.5 heading-display text-lg">
                    {p?.defeated && <Icon name="check" size={15} className="text-emerald-400" />}
                    {boss.name}
                  </h2>
                  <p className="text-xs italic text-parchment-500">{boss.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="pill-crimson">
                      <Icon name="target" size={10} /> Difficulty {boss.difficulty}/10
                    </span>
                    <span className="pill-gold">
                      <Icon name="sparkle" size={10} /> {boss.xpReward} XP
                    </span>
                    {boss.final && (
                      <span className="pill-crimson">
                        <Icon name="star" size={10} /> Final
                      </span>
                    )}
                  </div>
                </div>
                {locked && (
                  <span className="pill shrink-0">
                    <Icon name="lock" size={10} /> Lv {boss.levelRequirement}
                  </span>
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-parchment-400">
                {boss.description}
              </p>
              <div className="mt-4">
                {p?.defeated ? (
                  <p className="flex items-center gap-2 text-sm text-emerald-300">
                    <Icon name="trophy" size={15} /> Defeated · {boss.xpReward} XP claimed
                  </p>
                ) : (
                  <>
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-parchment-500">
                      <span className="flex items-center gap-1.5">
                        <Icon name="heart" size={11} className="text-crimson-400" />
                        {p
                          ? `${p.currentHp.toLocaleString()} / ${boss.totalHp.toLocaleString()} HP`
                          : `${boss.totalHp.toLocaleString()} HP · untouched`}
                      </span>
                      <span className="tabular-nums">{Math.round(hpPercent)}%</span>
                    </div>
                    <Meter percent={hpPercent} color="crimson" thick />
                  </>
                )}
              </div>
            </div>
          );
          return locked ? (
            <div key={boss.id}>{inner}</div>
          ) : (
            <Link key={boss.id} href={`/bosses/${boss.key}`}>
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
