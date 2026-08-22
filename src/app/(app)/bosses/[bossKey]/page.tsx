import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { BossFight } from "@/components/bosses/BossFight";

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
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="text-4xl">{boss.artwork}</p>
        <h1 className="heading-display mt-2 text-xl">{boss.name} Awaits a Stronger Foe</h1>
        <p className="mt-2 text-parchment-400">
          Return at Composer Level {boss.levelRequirement}.
        </p>
        <Link href="/bosses" className="btn-secondary mt-4">
          Back to the Bosses
        </Link>
      </div>
    );
  }

  const progress = await db.userBossProgress.findUnique({
    where: { userId_bossId: { userId, bossId: boss.id } },
    include: { objectives: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/bosses" className="text-sm text-parchment-500 hover:text-gold-300">
        ← Back to the Bosses
      </Link>
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
  );
}
