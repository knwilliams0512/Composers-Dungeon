"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { guildPostSchema, commentSchema, guildFoundSchema } from "@/lib/validation";

export async function createGuildPost(input: {
  content: string;
  compositionId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const parsed = guildPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid post" };
  }
  // Attach only a PUBLIC composition the user owns.
  let compositionId: string | null = null;
  if (parsed.data.compositionId) {
    const comp = await db.composition.findUnique({
      where: { id: parsed.data.compositionId },
    });
    if (!comp || comp.userId !== userId) {
      return { ok: false, error: "Composition not found" };
    }
    if (comp.visibility !== "PUBLIC") {
      return { ok: false, error: "Make the composition public before sharing it" };
    }
    compositionId = comp.id;
  }
  await db.guildPost.create({
    data: { userId, content: parsed.data.content, compositionId },
  });
  revalidatePath("/guild");
  return { ok: true };
}

export async function toggleLike(postId: string): Promise<{ ok: boolean; liked?: boolean }> {
  const userId = await requireUserId();
  const post = await db.guildPost.findUnique({ where: { id: postId } });
  if (!post) return { ok: false };
  const existing = await db.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) {
    await db.postLike.delete({ where: { id: existing.id } });
    revalidatePath("/guild");
    return { ok: true, liked: false };
  }
  await db.postLike.create({ data: { postId, userId } });
  revalidatePath("/guild");
  return { ok: true, liked: true };
}

export async function addComment(input: {
  postId: string;
  content: string;
}): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid comment" };
  }
  const post = await db.guildPost.findUnique({ where: { id: parsed.data.postId } });
  if (!post) return { ok: false, error: "Post not found" };
  await db.comment.create({
    data: { postId: post.id, userId, content: parsed.data.content },
  });
  revalidatePath("/guild");
  return { ok: true };
}

export async function toggleFollow(
  targetUserId: string
): Promise<{ ok: boolean; following?: boolean; error?: string }> {
  const userId = await requireUserId();
  if (targetUserId === userId) return { ok: false, error: "You cannot follow yourself" };
  const target = await db.user.findUnique({ where: { id: targetUserId } });
  if (!target) return { ok: false, error: "Composer not found" };
  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
  });
  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    revalidatePath("/guild");
    return { ok: true, following: false };
  }
  await db.follow.create({ data: { followerId: userId, followingId: targetUserId } });
  revalidatePath("/guild");
  return { ok: true, following: true };
}

export async function deleteOwnPost(postId: string): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  const post = await db.guildPost.findUnique({ where: { id: postId } });
  if (!post || post.userId !== userId) return { ok: false };
  await db.guildPost.delete({ where: { id: postId } });
  revalidatePath("/guild");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Guild membership                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Joins a house. A composer belongs to one at a time, so this replaces any
 * existing membership rather than stacking — the swap happens in a
 * transaction so a failure can't leave someone in two houses or none.
 */
export async function joinGuild(
  guildId: string
): Promise<{ ok: boolean; error?: string; guildName?: string }> {
  const userId = await requireUserId();
  const guild = await db.guild.findUnique({ where: { id: guildId } });
  if (!guild) return { ok: false, error: "That guild no longer exists" };

  const existing = await db.guildMember.findUnique({ where: { userId } });
  if (existing?.guildId === guild.id) {
    return { ok: false, error: `You are already of ${guild.name}` };
  }
  // A founder leaving their own house would orphan it, so make them hand it
  // on — or disband it — rather than silently abandoning it.
  if (existing?.role === "FOUNDER") {
    return {
      ok: false,
      error: "You founded your house. Disband it before joining another.",
    };
  }

  await db.$transaction(async (tx) => {
    if (existing) await tx.guildMember.delete({ where: { id: existing.id } });
    await tx.guildMember.create({ data: { guildId: guild.id, userId, role: "MEMBER" } });
  });

  revalidatePath("/guild");
  revalidatePath("/profile");
  return { ok: true, guildName: guild.name };
}

/** Leaves the current house. Founders disband instead — see below. */
export async function leaveGuild(): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const membership = await db.guildMember.findUnique({ where: { userId } });
  if (!membership) return { ok: false, error: "You are not in a guild" };
  if (membership.role === "FOUNDER") {
    return { ok: false, error: "A founder disbands their house rather than leaving it." };
  }
  await db.guildMember.delete({ where: { id: membership.id } });
  revalidatePath("/guild");
  revalidatePath("/profile");
  return { ok: true };
}

/**
 * Founds a new house and puts the founder in it. The URL key is derived from
 * the name and made unique, so two houses may share a name without colliding.
 */
export async function foundGuild(input: {
  name: string;
  tagline?: string;
  description?: string;
  emblem?: string;
  accent?: string;
  focus?: string;
}): Promise<{ ok: boolean; error?: string; guildKey?: string }> {
  const userId = await requireUserId();
  const parsed = guildFoundSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Check the details" };
  }

  const existing = await db.guildMember.findUnique({ where: { userId } });
  if (existing) {
    return {
      ok: false,
      error: "Leave your current house before founding one of your own.",
    };
  }

  const base =
    parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "guild";
  let key = base;
  for (let n = 2; await db.guild.findUnique({ where: { key } }); n++) {
    key = `${base}-${n}`;
  }

  const guild = await db.$transaction(async (tx) => {
    const g = await tx.guild.create({
      data: {
        key,
        name: parsed.data.name,
        tagline: parsed.data.tagline,
        description: parsed.data.description,
        emblem: parsed.data.emblem,
        accent: parsed.data.accent,
        focus: parsed.data.focus,
        official: false,
        founderId: userId,
        order: 100,
      },
    });
    await tx.guildMember.create({ data: { guildId: g.id, userId, role: "FOUNDER" } });
    return g;
  });

  revalidatePath("/guild");
  revalidatePath("/profile");
  return { ok: true, guildKey: guild.key };
}

/**
 * Disbands a house you founded. Members are released rather than stranded,
 * and only the founder may do it.
 */
export async function disbandGuild(): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const membership = await db.guildMember.findUnique({ where: { userId } });
  if (!membership || membership.role !== "FOUNDER") {
    return { ok: false, error: "Only a founder may disband a house." };
  }
  const guild = await db.guild.findUnique({ where: { id: membership.guildId } });
  if (!guild) return { ok: false, error: "That guild no longer exists" };
  if (guild.official) {
    return { ok: false, error: "The app's own houses cannot be disbanded." };
  }
  // Members cascade with the guild row, which releases every one of them.
  await db.guild.delete({ where: { id: guild.id } });
  revalidatePath("/guild");
  revalidatePath("/profile");
  return { ok: true };
}
