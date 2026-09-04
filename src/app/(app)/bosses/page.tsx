import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Icon } from "@/components/ui/Icon";
import { Meter } from "@/components/ui/primitives";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

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

  const felled = progress.filter((p) => p.defeated).length;
  const wounded = progress.filter((p) => !p.defeated && p.currentHp > 0).length;
  const bossPercent = bosses.length ? (felled / bosses.length) * 100 : 0;

  return (
    <div>
      <ScrollProgress />
      <SectionHeading
        eyebrow="Intense · Dramatic · Unforgiving"
        icon="skull"
        title="The Bosses"
        subtitle="Great musical adversaries guard the Dungeon's depths. Wound them with modulations, motifs, and counterpoint — finish them with a completed composition."
        accent="#e0803a"
        motif="crown"
        aside={
          <div className="grid grid-cols-3 gap-2.5 text-center lg:w-72">
            {[
              { n: felled, label: "Felled", cls: "text-emerald2-300", ring: "ring-emerald2-500/30" },
              { n: wounded, label: "Wounded", cls: "text-rose-300", ring: "ring-rose-500/30" },
              {
                n: bosses.length - felled,
                label: "Standing",
                cls: "text-parchment-300",
                ring: "ring-white/10",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`rounded-xl bg-white/[0.05] px-4 py-3 ring-1 ring-inset backdrop-blur ${s.ring}`}
              >
                <p className={`font-display text-2xl leading-none ${s.cls}`}>{s.n}</p>
                <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-parchment-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        }
        footer={
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="font-display text-2xl leading-none">
                <span className="text-gilded">{felled}</span>
                <span className="ml-2 text-base text-parchment-400">
                  of {bosses.length} adversaries felled
                </span>
              </p>
              <p className="text-xs text-parchment-400">
                {bosses.length - felled === 0
                  ? "The depths hold nothing left to fight."
                  : `${bosses.length - felled} still guard the depths.`}
              </p>
            </div>
            <Meter percent={bossPercent} thick />
          </div>
        }
      />
      <div className="stagger grid grid-cols-1 gap-5 md:grid-cols-2">
        {bosses.map((boss) => {
          const p = progressByBoss.get(boss.id);
          const locked = profile.level < boss.levelRequirement;
          const hpPercent = p ? (p.currentHp / boss.totalHp) * 100 : 100;
          const inner = (
            <div
              className={`${
                boss.final ? "card-crimson" : "card"
              } lit-edge group relative h-full overflow-hidden p-6 transition-all duration-300 ${
                locked
                  ? "opacity-70"
                  : p?.defeated
                    ? "border-emerald2-500/40"
                    : "hover:-translate-y-1 hover:border-crimson-400/50 hover:shadow-crimson"
              }`}
            >
              {!locked && (
                <div
                  className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                  style={{ background: "radial-gradient(circle, #a03c38, transparent 70%)" }}
                />
              )}
              <div className="relative flex items-start gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-crimson-500/40 bg-crimson-500/10 text-4xl leading-none backdrop-blur transition-transform duration-300 group-hover:scale-110">
                  {boss.artwork}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="flex items-center gap-1.5 font-display text-xl text-parchment-100">
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
              <p className="relative mt-3 line-clamp-2 text-sm leading-relaxed text-parchment-400">
                {boss.description}
              </p>
              <div className="relative mt-4">
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
