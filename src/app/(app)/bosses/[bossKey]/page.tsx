import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { BossFight } from "@/components/bosses/BossFight";
import { Icon } from "@/components/ui/Icon";
import { Panel } from "@/components/ui/primitives";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

export default async function BossPage({ params }: { params: { bossKey: string } }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const boss = await db.boss.findUnique({
    where: { key: params.bossKey },
    include: {
      phases: { orderBy: { order: "asc" } },
      objectives: { orderBy: { order: "asc" } },
      rewardArtifact: true,
    },
  });
  if (!boss) notFound();

  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/login");
  if (profile.level < boss.levelRequirement) {
    return (
      <div className="card-crimson mx-auto max-w-lg p-8 text-center">
        <p className="text-4xl">{boss.artwork}</p>
        <Icon name="lock" size={26} className="mx-auto mt-3 text-crimson-400" />
        <h1 className="heading-display mt-3 text-xl">{boss.name} Awaits a Stronger Foe</h1>
        <p className="mt-2 text-parchment-400">
          Return at Composer Level {boss.levelRequirement}. You are level {profile.level}.
        </p>
        <Link href="/bosses" className="btn-secondary mt-4">
          Back to the Bosses
        </Link>
      </div>
    );
  }

  let tactics: string[] = [];
  try {
    tactics = boss.tactics ? (JSON.parse(boss.tactics) as string[]) : [];
  } catch {
    tactics = [];
  }

  const progress = await db.userBossProgress.findUnique({
    where: { userId_bossId: { userId, bossId: boss.id } },
    include: { objectives: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <ScrollProgress />
      <Link
        href="/bosses"
        className="inline-flex items-center gap-1.5 text-sm text-parchment-500 transition-colors hover:text-gold-300"
      >
        <Icon name="chevron" size={13} className="rotate-180" /> Back to the Bosses
      </Link>

      <div className="mt-4">
        <BossFight
        boss={{
          key: boss.key,
          name: boss.name,
          title: boss.title,
          description: boss.description,
          artwork: boss.artwork,
          totalHp: boss.totalHp,
          difficulty: boss.difficulty,
          xpReward: boss.xpReward,
          final: boss.final,
          rewardArtifact: boss.rewardArtifact
            ? { name: boss.rewardArtifact.name, icon: boss.rewardArtifact.icon }
            : null,
          phases: boss.phases.map((p) => ({
            order: p.order,
            name: p.name,
            description: p.description,
            hpThresholdPercent: p.hpThresholdPercent,
          })),
          objectives: boss.objectives.map((o) => ({
            id: o.id,
            name: o.name,
            description: o.description,
            damage: o.damage,
            bonus: o.bonus,
            finalBlow: o.finalBlow,
          })),
        }}
        initialProgress={
          progress
            ? {
                started: true,
                currentHp: progress.currentHp,
                defeated: progress.defeated,
                completedObjectiveIds: progress.objectives.map((o) => o.objectiveId),
              }
            : { started: false, currentHp: boss.totalHp, defeated: false, completedObjectiveIds: [] }
        }
        />
      </div>

      {boss.lore && (
        <Panel title="The Story So Far" icon="scroll" tone="crimson" className="mt-6">
          <p className="text-[15px] leading-[1.75] text-parchment-300">{boss.lore}</p>
        </Panel>
      )}

      {tactics.length > 0 && (
        <Panel
          title="Before You Engage"
          icon="compass"
          subtitle="What previous challengers learned the hard way"
          className="mt-4"
        >
          <ul className="space-y-2.5">
            {tactics.map((t) => (
              <li key={t} className="flex gap-2.5 text-sm text-parchment-300">
                <Icon name="sword" size={15} className="mt-0.5 shrink-0 text-crimson-400" />
                <span className="leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
