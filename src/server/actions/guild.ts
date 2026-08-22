"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { guildPostSchema, commentSchema } from "@/lib/validation";

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
