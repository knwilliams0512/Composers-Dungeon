import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Icon } from "@/components/ui/Icon";
import { GuildTabs } from "@/components/guild/GuildTabs";
import { GuildRoster } from "@/components/guild/GuildRoster";
import { GuildChat } from "@/components/guild/GuildChat";
import { GuildFeed } from "@/components/guild/GuildFeed";
import { CollabProjects } from "@/components/guild/CollabProjects";
import { boostsRemaining } from "@/server/actions/guild-life";
import { resolveFreedom } from "@/lib/composer-freedom";

export const dynamic = "force-dynamic";

/**
 * One guild's own page.
 *
 * Everything here is gated on membership, and the gate is the first thing that
 * happens. A guild's board, room and collaborations are private to its members
 * — that is what makes it a guild rather than a label on a profile — so a
 * non-member gets the same 404 as a guild that does not exist. Telling them
 * "this house exists but is not yours" would hand anyone who can type a URL a
 * directory of who is where.
 */
export default async function GuildPage({ params }: { params: { key: string } }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const guild = await db.guild.findUnique({ where: { key: params.key } });
  if (!guild) notFound();

  const membership = await db.guildMember.findUnique({ where: { userId } });
  if (!membership || membership.guildId !== guild.id) notFound();

  const [
    members,
    posts,
    myPublicCompositions,
    myFollowing,
    projects,
    raidBosses,
    raids,
    boostRows,
    remaining,
    profile,
    lessonsCompleted,
  ] = await Promise.all([
    db.guildMember.findMany({
      where: { guildId: guild.id },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      include: { user: { include: { profile: true } } },
    }),
    db.guildPost.findMany({
      where: { guildId: guild.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { include: { profile: true } },
        composition: true,
        likes: true,
        comments: {
          orderBy: { createdAt: "asc" },
          include: { user: { include: { profile: true } } },
        },
      },
    }),
    db.composition.findMany({
      where: { userId, visibility: "PUBLIC" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
    db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    db.collabProject.findMany({
      where: { guildId: guild.id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        createdBy: { include: { profile: true } },
        parts: {
          orderBy: { order: "asc" },
          include: { claimedBy: { include: { profile: true } } },
        },
      },
    }),
    db.boss.findMany({ where: { collab: true }, orderBy: { levelRequirement: "asc" } }),
    db.guildRaid.findMany({
      where: { guildId: guild.id },
      include: { contributions: true },
    }),
    db.guildBoost.findMany({
      where: { guildId: guild.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    boostsRemaining(),
    db.userProfile.findUnique({ where: { userId } }),
    db.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
  ]);

  const followingIds = new Set(myFollowing.map((f) => f.followingId));
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const roster = members.map((m) => {
    const received = boostRows.filter((b) => b.toUserId === m.userId);
    return {
      userId: m.userId,
      displayName: m.user.profile?.displayName ?? "A composer",
      avatar: m.user.profile?.avatar ?? "quill",
      level: m.user.profile?.level ?? 1,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      isPrivate: m.user.profile?.visibility === "PRIVATE",
      isMe: m.userId === userId,
      boostsReceived: received.length,
      boostedByMeToday: received.some(
        (b) => b.fromUserId === userId && b.createdAt >= dayStart
      ),
      lastNote: received[0]?.note || null,
    };
  });

  const feed = posts.map((post) => ({
    id: post.id,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    isMine: post.userId === userId,
    author: {
      id: post.userId,
      displayName: post.user.profile?.displayName ?? "A composer",
      avatar: post.user.profile?.avatar ?? "quill",
      level: post.user.profile?.level ?? 1,
      isPrivate: post.user.profile?.visibility === "PRIVATE",
      isFollowing: followingIds.has(post.userId),
    },
    composition:
      post.composition && post.composition.visibility === "PUBLIC"
        ? {
            title: post.composition.title,
            description: post.composition.description,
            scoreLink: post.composition.scoreLink,
          }
        : null,
    likeCount: post.likes.length,
    likedByMe: post.likes.some((l) => l.userId === userId),
    comments: post.comments.map((c) => ({
      id: c.id,
      content: c.content,
      author: c.user.profile?.displayName ?? "A composer",
      createdAt: c.createdAt.toISOString(),
    })),
  }));

  const freedom = resolveFreedom({
    level: profile?.level ?? 1,
    lessonsCompleted,
    fullFreedom: profile?.fullFreedom,
  });

  const raidByBoss = new Map(raids.map((r) => [r.bossId, r]));
  const openRaids = raidBosses.map((boss) => {
    const raid = raidByBoss.get(boss.id);
    return {
      key: boss.key,
      name: boss.name,
      title: boss.title,
      artwork: boss.artwork,
      levelRequirement: boss.levelRequirement,
      minMembers: boss.minMembers,
      totalHp: boss.totalHp,
      currentHp: raid?.currentHp ?? null,
      defeated: raid?.defeated ?? false,
      started: Boolean(raid),
      fighters: raid ? new Set(raid.contributions.map((c) => c.userId)).size : 0,
    };
  });

  const collabs = projects.map((p) => ({
    id: p.id,
    title: p.title,
    brief: p.brief,
    musicalKey: p.musicalKey,
    mode: p.mode,
    meter: p.meter,
    bars: p.bars,
    status: p.status,
    createdById: p.createdById,
    createdBy: p.createdBy.profile?.displayName ?? "A composer",
    createdAt: p.createdAt.toISOString(),
    parts: p.parts.map((part) => ({
      id: part.id,
      name: part.name,
      instrument: part.instrument,
      order: part.order,
      claimedById: part.claimedById,
      claimedBy: part.claimedBy?.profile?.displayName ?? null,
      written: Boolean(part.score),
      notes: part.notes,
      score: part.score,
    })),
  }));

  const openProjects = collabs.filter((c) => c.status !== "COMPLETE").length;

  return (
    <div className="mx-auto max-w-4xl">
      <SectionHeading
        eyebrow={guild.official ? "A house of the Guild" : "Founded by a composer"}
        title={guild.name}
        subtitle={guild.tagline || guild.description || "Your house."}
        icon="shield"
        accent={guild.accent}
        motif="tower"
        aside={
          <div className="grid grid-cols-3 gap-2.5 text-center lg:w-64">
            {[
              { n: members.length, label: "Members" },
              { n: openProjects, label: "In progress" },
              { n: openRaids.filter((r) => r.defeated).length, label: "Raids won" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white/[0.05] px-3 py-3 ring-1 ring-inset ring-white/10"
              >
                <p className="font-display text-2xl leading-none text-parchment-200">{s.n}</p>
                <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-parchment-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="text-3xl" aria-hidden>{guild.emblem}</span>
        {guild.description && (
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-parchment-400">
            {guild.description}
          </p>
        )}
        <Link href="/guild" className="btn-ghost shrink-0 text-xs">
          <Icon name="users" size={13} /> All houses
        </Link>
      </div>

      <GuildTabs
        tabs={[
          {
            id: "board",
            label: "Board",
            icon: "scroll",
            badge: feed.length,
            content: (
              <GuildFeed
                posts={feed}
                myPublicCompositions={myPublicCompositions}
                guildKey={guild.key}
                guildName={guild.name}
              />
            ),
          },
          {
            id: "room",
            label: "Room",
            icon: "users",
            content: <GuildChat guildKey={guild.key} />,
          },
          {
            id: "write",
            label: "Write together",
            icon: "quill",
            badge: openProjects,
            content: (
              <CollabProjects
                projects={collabs}
                guildKey={guild.key}
                userId={userId}
                freedom={freedom}
              />
            ),
          },
          {
            id: "raids",
            label: "Raids",
            icon: "skull",
            content: (
              <section className="space-y-3">
                <p className="text-sm leading-relaxed text-parchment-400">
                  Three encounters that will not open for one composer. They hold a single
                  pool of health for the whole house, every member may land each objective
                  once, and the last blow stays sealed until the guild together has brought
                  the boss below 15%.
                </p>
                {openRaids.map((r) => {
                  const tooSmall = members.length < r.minMembers;
                  const percent =
                    r.currentHp === null
                      ? 100
                      : Math.round((r.currentHp / r.totalHp) * 100);
                  return (
                    <article
                      key={r.key}
                      className={`card flex flex-wrap items-center gap-4 p-4 ${
                        r.defeated ? "border-emerald-600/40" : ""
                      }`}
                    >
                      <span className="text-3xl" aria-hidden>{r.artwork}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base text-parchment-100">{r.name}</p>
                        <p className="text-xs text-parchment-500">{r.title}</p>
                        <p className="mt-1 text-[11px] text-parchment-500">
                          Level {r.levelRequirement} · needs {r.minMembers} composers
                          {r.started && !r.defeated && ` · ${percent}% left`}
                          {r.fighters > 0 && ` · ${r.fighters} fighting`}
                        </p>
                      </div>
                      {r.defeated ? (
                        <span className="shrink-0 rounded-full border border-emerald-600/50 px-2.5 py-1 text-[10px] uppercase tracking-widest text-emerald-300">
                          Defeated
                        </span>
                      ) : tooSmall ? (
                        <span className="shrink-0 text-xs text-parchment-500">
                          {members.length}/{r.minMembers} composers
                        </span>
                      ) : (
                        <Link
                          href={`/guild/raid/${r.key}`}
                          className="btn-secondary shrink-0 text-xs"
                        >
                          <Icon name="skull" size={13} />
                          {r.started ? "Rejoin" : "Approach"}
                        </Link>
                      )}
                    </article>
                  );
                })}
              </section>
            ),
          },
          {
            id: "roster",
            label: "Roster",
            icon: "shield",
            badge: members.length,
            content: (
              <GuildRoster
                members={roster}
                guildKey={guild.key}
                remaining={remaining}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
