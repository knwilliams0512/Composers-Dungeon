import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GuildFeed } from "@/components/guild/GuildFeed";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

export const metadata = { title: "The Composer's Guild" };
export const dynamic = "force-dynamic";

export default async function GuildPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [posts, myPublicCompositions, myFollowing] = await Promise.all([
    db.guildPost.findMany({
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
  ]);

  const followingIds = new Set(myFollowing.map((f) => f.followingId));

  // Respect privacy: anonymize authors whose profile is PRIVATE (their posts
  // are still their deliberate public act, but their profile stays unlinkable).
  const feed = posts.map((post) => {
    const authorPrivate = post.user.profile?.visibility === "PRIVATE";
    return {
      id: post.id,
      content: post.content,
      createdAt: post.createdAt.toISOString(),
      isMine: post.userId === userId,
      author: {
        id: post.userId,
        displayName: post.user.profile?.displayName ?? "A composer",
        avatar: post.user.profile?.avatar ?? "quill",
        level: post.user.profile?.level ?? 1,
        isPrivate: authorPrivate,
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
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <ScrollProgress />
      <SectionHeading
        eyebrow="Fellowship · Craft · Renown"
        title="The Composer's Guild"
        subtitle="Share your victories, post your public compositions, and follow the composers whose work lights your way."
      />
      <GuildFeed
        posts={feed}
        myPublicCompositions={myPublicCompositions.map((c) => ({
          id: c.id,
          title: c.title,
        }))}
      />
    </div>
  );
}
