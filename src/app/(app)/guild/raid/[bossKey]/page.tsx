import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { RaidPanel } from "@/components/guild/RaidPanel";
import { briefForBoss } from "@/lib/boss-brief";
import { describeCheck } from "@/lib/score";
import { resolveFreedom } from "@/lib/composer-freedom";

export const dynamic = "force-dynamic";

/**
 * One raid, as this guild is currently fighting it.
 *
 * Membership is required to see it at all. A raid's state — how far down the
 * boss is, who has landed what — is the guild's business, and a page that
 * showed it to anybody would turn the ledger into a leaderboard of other
 * people's houses.
 */
export default async function RaidPage({ params }: { params: { bossKey: string } }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const boss = await db.boss.findUnique({
    where: { key: params.bossKey },
    include: {
      objectives: { orderBy: { order: "asc" } },
      phases: { orderBy: { order: "asc" } },
    },
  });
  if (!boss || !boss.collab) notFound();

  const membership = await db.guildMember.findUnique({ where: { userId } });
  if (!membership) notFound();

  const [guild, memberCount, raid, profile, lessonsCompleted] = await Promise.all([
    db.guild.findUnique({ where: { id: membership.guildId } }),
    db.guildMember.count({ where: { guildId: membership.guildId } }),
    db.guildRaid.findUnique({
      where: { guildId_bossId: { guildId: membership.guildId, bossId: boss.id } },
      include: {
        contributions: {
          orderBy: { createdAt: "desc" },
          include: { user: { include: { profile: true } } },
        },
      },
    }),
    db.userProfile.findUnique({ where: { userId } }),
    db.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
  ]);
  if (!guild) notFound();

  const brief = briefForBoss(boss);
  const freedom = resolveFreedom({
    level: profile?.level ?? 1,
    lessonsCompleted,
    fullFreedom: profile?.fullFreedom,
    cap: brief.freedomCap,
  });

  type Contribution = NonNullable<typeof raid>["contributions"][number];
  const nameOf = (c: Contribution) => c.user.profile?.displayName ?? "A composer";
  const objectiveName = (id: string) =>
    boss.objectives.find((o) => o.id === id)?.name ?? "an objective";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href={`/guild/${guild.key}`} className="btn-ghost text-xs">
          <Icon name="shield" size={13} /> Back to {guild.name}
        </Link>
        <span className="text-xs text-parchment-500">
          {memberCount} composer{memberCount === 1 ? "" : "s"} in the house
        </span>
      </div>

      <RaidPanel
        freedom={freedom}
        raid={{
          bossKey: boss.key,
          name: boss.name,
          title: boss.title,
          description: boss.description,
          artwork: boss.artwork,
          totalHp: boss.totalHp,
          currentHp: raid?.currentHp ?? null,
          defeated: raid?.defeated ?? false,
          levelRequirement: boss.levelRequirement,
          minMembers: boss.minMembers,
          memberCount,
          xpReward: boss.xpReward,
          open: Boolean(raid),
          phases: boss.phases.map((p) => ({
            order: p.order,
            name: p.name,
            description: p.description,
            hpThresholdPercent: p.hpThresholdPercent,
          })),
          objectives: boss.objectives.map((o) => {
            const landed = raid?.contributions.filter((c) => c.objectiveId === o.id) ?? [];
            return {
              id: o.id,
              name: o.name,
              description: o.description,
              damage: o.damage,
              bonus: o.bonus,
              finalBlow: o.finalBlow,
              mine: landed.some((c) => c.userId === userId),
              landedBy: Array.from(new Set(landed.map(nameOf))),
            };
          }),
          contributions: (raid?.contributions ?? []).slice(0, 30).map((c) => ({
            author: nameOf(c),
            objective: objectiveName(c.objectiveId),
            damage: c.damage,
            at: c.createdAt.toISOString(),
          })),
          brief: {
            setup: brief.setup,
            checks: brief.checks,
            summary: brief.checks.map(describeCheck),
          },
        }}
      />
    </div>
  );
}
