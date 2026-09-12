"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { profileUpdateSchema, compositionSchema, scoreSchema } from "@/lib/validation";

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
  /** A piece written in the app's own composer, if there is one. */
  score?: unknown;
}): Promise<{ ok: boolean; error?: string; compositionId?: string }> {
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

  let score: string | null = null;
  if (input.score !== undefined && input.score !== null) {
    const parsedScore = scoreSchema.safeParse(input.score);
    if (!parsedScore.success) return { ok: false, error: "That piece could not be read." };
    if (parsedScore.data.melody.length === 0) {
      return { ok: false, error: "Write at least one note before saving." };
    }
    score = JSON.stringify(parsedScore.data);
  }

  const composition = await db.composition.create({
    data: { userId, ...parsed.data, source: "FREE", score },
  });
  const { awardProgress } = await import("@/lib/progression");
  // Writing something real in the app is worth more than logging a link to it.
  await awardProgress({
    userId,
    xp: score ? 90 : 60,
    skillXp: score ? { EXPRESSION: 25, MELODY: 20 } : { EXPRESSION: 20 },
  });
  revalidatePath("/library");
  revalidatePath("/workshop");
  return { ok: true, compositionId: composition.id };
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

/**
 * Turns the tiered composer tools off or on.
 *
 * Off (the default) the editor hands back one decision at a time as the
 * composer earns it. On, every tool appears at once — which is what some
 * people want, and which the Settings copy warns is a lot to meet all at once.
 */
export async function setFullFreedom(
  enabled: boolean
): Promise<{ ok: boolean; fullFreedom?: boolean }> {
  const userId = await requireUserId();
  const profile = await db.userProfile.update({
    where: { userId },
    data: { fullFreedom: enabled },
  });
  revalidatePath("/settings");
  revalidatePath("/workshop");
  revalidatePath("/academy");
  revalidatePath("/dungeon");
  return { ok: true, fullFreedom: profile.fullFreedom };
}

/** The accessibility preferences a composer may set for themselves. */
export interface AccessibilityPrefs {
  reduceMotion: boolean | null;
  textScale: "NORMAL" | "LARGE" | "LARGER";
  highContrast: boolean;
  readableFont: boolean;
}

const TEXT_SCALES = ["NORMAL", "LARGE", "LARGER"] as const;

/**
 * Saves accessibility preferences.
 *
 * These live on the profile rather than in the browser so they follow the
 * composer to another machine — someone who needs larger text needs it on
 * every device, not on the one where they first found the setting.
 *
 * `reduceMotion: null` means "follow the operating system", which is the
 * default and the right one: the OS setting is already an explicit statement
 * of need, and an app that ignores it until you find its own toggle has
 * failed the person twice.
 */
export async function setAccessibility(
  prefs: Partial<AccessibilityPrefs>
): Promise<{ ok: boolean }> {
  const userId = await requireUserId();

  const data: Record<string, unknown> = {};
  if ("reduceMotion" in prefs) {
    data.reduceMotion =
      prefs.reduceMotion === null ? null : Boolean(prefs.reduceMotion);
  }
  if (prefs.textScale !== undefined) {
    // Never trust the string: an unknown scale falls back to NORMAL rather
    // than reaching the class name that builds the CSS variable.
    data.textScale = TEXT_SCALES.includes(prefs.textScale) ? prefs.textScale : "NORMAL";
  }
  if (prefs.highContrast !== undefined) data.highContrast = Boolean(prefs.highContrast);
  if (prefs.readableFont !== undefined) data.readableFont = Boolean(prefs.readableFont);

  if (Object.keys(data).length === 0) return { ok: true };

  await db.userProfile.update({ where: { userId }, data });
  // Every page is affected, so revalidate the layout that carries the setting
  // rather than listing routes that will drift out of date.
  revalidatePath("/", "layout");
  return { ok: true };
}
