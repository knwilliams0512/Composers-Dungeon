"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { profileUpdateSchema, compositionSchema } from "@/lib/validation";

export async function updateProfile(input: {
  displayName: string;
  bio: string;
  avatar: string;
  visibility: string;
}): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  await db.userProfile.update({ where: { userId }, data: parsed.data });
  revalidatePath("/profile");
  return { ok: true };
}

/** Free composition submission (not tied to a challenge). */
export async function createComposition(input: {
  title: string;
  description?: string;
  reflection?: string;
  scoreLink?: string;
  visibility?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const parsed = compositionSchema.safeParse({
    title: input.title,
    description: input.description ?? "",
    reflection: input.reflection ?? "",
    scoreLink: input.scoreLink ?? "",
    visibility: input.visibility ?? "PRIVATE",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  await db.composition.create({ data: { userId, ...parsed.data, source: "FREE" } });
  const { awardProgress } = await import("@/lib/progression");
  await awardProgress({ userId, xp: 60, skillXp: { EXPRESSION: 20 } });
  revalidatePath("/library");
  return { ok: true };
}

export async function setCompositionVisibility(input: {
  compositionId: string;
  visibility: string;
}): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  if (input.visibility !== "PUBLIC" && input.visibility !== "PRIVATE") {
    return { ok: false, error: "Invalid visibility" };
  }
  const comp = await db.composition.findUnique({ where: { id: input.compositionId } });
  if (!comp || comp.userId !== userId) return { ok: false, error: "Not found" };
  await db.composition.update({
    where: { id: comp.id },
    data: { visibility: input.visibility },
  });
  revalidatePath("/library");
  return { ok: true };
}
