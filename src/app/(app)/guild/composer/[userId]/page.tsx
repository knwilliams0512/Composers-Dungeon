import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { avatarGlyph, TIER_INFO, type ExperienceTier } from "@/lib/enums";
import { FollowButton } from "@/components/guild/FollowButton";

export default async function PublicProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const viewerId = await getSessionUserId();
  if (!viewerId) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: params.userId },
    include: { profile: true },
  });
  if (!user?.profile) notFound();

  const isSelf = viewerId === user.id;
  // Privacy: private profiles are only visible to their owner.
  if (user.profile.visibility === "PRIVATE" && !isSelf) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-3xl">🕯️</p>
        <h1 className="heading-display mt-2 text-xl">A Private Composer</h1>
        <p className="mt-2 text-parchment-400">
          This composer works behind closed doors.
        </p>
        <Link href="/guild" className="btn-secondary mt-4">
          Back to the Guild
        </Link>
      </div>
    );
  }

  const [specializations, bossVictories, publicCompositions, followerCount, isFollowing, skills] =
    await Promise.all([
      db.userSpecialization.findMany({
        where: { userId: user.id },
        include: { specialization: true },
      }),
      db.userBossProgress.findMany({
        where: { userId: user.id, defeated: true },
        include: { boss: true },
        orderBy: { defeatedAt: "desc" },
      }),
      db.composition.findMany({
        where: { userId: user.id, visibility: "PUBLIC" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.follow.count({ where: { followingId: user.id } }),
      db.follow
        .findUnique({
          where: {
            followerId_followingId: { followerId: viewerId, followingId: user.id },
          },
        })
        .then(Boolean),
      db.userSkill.findMany({
        where: { userId: user.id },
        include: { skill: true },
        orderBy: { level: "desc" },
        take: 3,
      }),
    ]);

  const tierLabel =
    TIER_INFO[user.profile.experienceTier as ExperienceTier]?.label ??
    user.profile.experienceTier;
  const specTitle = specializations
    .map((s) => s.specialization.name.replace("The ", ""))
    .join(" / ");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/guild" className="text-sm text-parchment-500 hover:text-gold-300">
        ← Back to the Guild
      </Link>
      <div className="card-gold mt-2 p-6 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold-600/60 bg-abyss-800 text-4xl shadow-glow">
          {avatarGlyph(user.profile.avatar)}
        </span>
        <h1 className="heading-display mt-3 text-2xl">{user.profile.displayName}</h1>
        <p className="text-sm text-parchment-400">
          Level {user.profile.level} {specTitle ? `${specTitle}` : "Composer"} · {tierLabel}
        </p>
        {user.profile.bio && (
          <p className="mx-auto mt-2 max-w-md text-parchment-300">{user.profile.bio}</p>
        )}
        <p className="mt-2 text-xs text-parchment-500">
          {followerCount} follower{followerCount === 1 ? "" : "s"} · joined{" "}
          {user.profile.createdAt.toLocaleDateString()}
        </p>
        {!isSelf && <FollowButton targetUserId={user.id} initialFollowing={isFollowing} />}
      </div>

      {skills.length > 0 && (
        <section className="card mt-4 p-5">
          <h2 className="heading-display mb-2 text-lg">Strongest Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s.id}
                className="rounded-full border border-arcane-500/50 px-3 py-1 text-sm text-arcane-300"
              >
                {s.skill.icon} {s.skill.name} · Lv {s.level}
              </span>
            ))}
          </div>
        </section>
      )}

      {bossVictories.length > 0 && (
        <section className="card mt-4 p-5">
          <h2 className="heading-display mb-2 text-lg">Defeated</h2>
          <div className="flex flex-wrap gap-3">
            {bossVictories.map((v) => (
              <span key={v.id} className="rounded border border-crimson-600/40 px-3 py-1.5 text-sm text-parchment-200">
                {v.boss.artwork} {v.boss.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="card mt-4 p-5">
        <h2 className="heading-display mb-2 text-lg">Public Compositions</h2>
        {publicCompositions.length === 0 ? (
          <p className="text-sm text-parchment-500">Nothing published yet.</p>
        ) : (
          <ul className="space-y-2">
            {publicCompositions.map((c) => (
              <li key={c.id} className="rounded border border-abyss-600 p-3">
                <p className="font-display text-sm text-gold-300">🎼 {c.title}</p>
                {c.description && (
                  <p className="mt-0.5 text-xs text-parchment-400">{c.description}</p>
                )}
                {c.scoreLink && (
                  <a
                    href={c.scoreLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-arcane-300"
                  >
                    View score ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
