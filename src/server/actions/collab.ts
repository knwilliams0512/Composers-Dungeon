"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { collabProjectSchema, scoreSchema } from "@/lib/validation";
import { type Score } from "@/lib/score";
import { setupForProject } from "@/lib/collab";
import { awardProgress, syncAchievements, type AwardResult } from "@/lib/progression";

/**
 * Collaborations: a piece the guild writes together, one part each.
 *
 * The parts are the whole mechanism. Several composers editing one score is a
 * merge conflict with a tune in it; several composers each owning a named line
 * — the melody, the bass, the inner voices — is simply how music written by
 * more than one person has always worked.
 *
 * What makes the parts fit is the project's shared setup: one key, one mode,
 * one meter, one length, fixed when the project is created and handed to every
 * part as its starting score. A part written in a different key is not a
 * disagreement to be resolved later, it is a part that cannot be played, so
 * the server refuses it rather than storing it and hoping.
 */

export interface CollabResult {
  ok: boolean;
  error?: string;
  projectId?: string;
  /**
   * What the action earned the person who took it, when it earned anything.
   *
   * Claiming and releasing a part never pay, so they never set this. Writing a
   * part and finishing a piece do — 70 and 150 XP — and both used to pay in
   * silence, which made the most collaborative thing in the app the least
   * rewarding-looking.
   *
   * Finishing pays every writer, but only the caller's own award can be
   * returned: the others belong to people who are not here to be told.
   */
  award?: AwardResult;
}

async function requireMembership(guildKey: string) {
  const userId = await requireUserId();
  const guild = await db.guild.findUnique({ where: { key: guildKey } });
  if (!guild) return { error: "Guild not found" };
  const membership = await db.guildMember.findUnique({ where: { userId } });
  if (!membership || membership.guildId !== guild.id) {
    return { error: "Guild not found" };
  }
  return { userId, guild };
}

export async function createCollabProject(input: {
  guildKey: string;
  title: string;
  brief?: string;
  musicalKey?: string;
  mode?: string;
  meter?: string;
  bars?: number;
  parts: { name: string; instrument?: string }[];
}): Promise<CollabResult> {
  const parsed = collabProjectSchema.safeParse({
    guildKey: input.guildKey,
    title: input.title,
    brief: input.brief ?? "",
    musicalKey: input.musicalKey ?? "C",
    mode: input.mode ?? "major",
    meter: input.meter ?? "4/4",
    bars: input.bars ?? 8,
    parts: input.parts.map((p) => ({ name: p.name, instrument: p.instrument ?? "" })),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid project" };
  }
  const member = await requireMembership(parsed.data.guildKey);
  if ("error" in member) return { ok: false, error: member.error };

  const project = await db.collabProject.create({
    data: {
      guildId: member.guild.id,
      createdById: member.userId,
      title: parsed.data.title,
      brief: parsed.data.brief,
      musicalKey: parsed.data.musicalKey,
      mode: parsed.data.mode,
      meter: parsed.data.meter,
      bars: parsed.data.bars,
      parts: {
        create: parsed.data.parts.map((p, i) => ({
          name: p.name,
          instrument: p.instrument,
          order: i,
        })),
      },
    },
  });
  revalidatePath(`/guild/${parsed.data.guildKey}`);
  return { ok: true, projectId: project.id };
}

/**
 * Take a part, or put it back.
 *
 * One part per composer per project, so a collaboration cannot be quietly
 * completed by one person claiming everything — which is the failure mode this
 * whole feature exists to avoid. Releasing a part you have already written
 * keeps the music: the next composer inherits it rather than starting over.
 */
export async function claimPart(partId: string): Promise<CollabResult> {
  const userId = await requireUserId();
  const part = await db.collabPart.findUnique({
    where: { id: partId },
    include: { project: { include: { guild: true, parts: true } } },
  });
  if (!part) return { ok: false, error: "No such part" };

  const membership = await db.guildMember.findUnique({ where: { userId } });
  if (!membership || membership.guildId !== part.project.guildId) {
    return { ok: false, error: "That is not your guild's piece" };
  }
  if (part.project.status === "COMPLETE") {
    return { ok: false, error: "That piece is finished" };
  }
  if (part.claimedById && part.claimedById !== userId) {
    return { ok: false, error: "Somebody else has that part" };
  }
  const alreadyMine = part.project.parts.find(
    (p) => p.claimedById === userId && p.id !== partId
  );
  if (alreadyMine) {
    return {
      ok: false,
      error: `You already have "${alreadyMine.name}". Put it back first if you would rather write this one.`,
    };
  }

  await db.collabPart.update({
    where: { id: partId },
    data: { claimedById: userId },
  });
  revalidatePath(`/guild/${part.project.guild.key}`);
  return { ok: true };
}

export async function releasePart(partId: string): Promise<CollabResult> {
  const userId = await requireUserId();
  const part = await db.collabPart.findUnique({
    where: { id: partId },
    include: { project: { include: { guild: true } } },
  });
  if (!part) return { ok: false, error: "No such part" };
  if (part.claimedById !== userId) return { ok: false, error: "That part is not yours" };
  if (part.project.status === "COMPLETE") {
    return { ok: false, error: "That piece is finished" };
  }

  // The music stays. Somebody who picks this up next should be continuing the
  // work, not told it was thrown away when its writer stepped back.
  await db.collabPart.update({
    where: { id: partId },
    data: { claimedById: null },
  });
  revalidatePath(`/guild/${part.project.guild.key}`);
  return { ok: true };
}

/** Writes a part in. Rejected unless it matches the project's own setup. */
export async function submitPart(input: {
  partId: string;
  score: unknown;
  notes?: string;
}): Promise<CollabResult> {
  const userId = await requireUserId();
  const part = await db.collabPart.findUnique({
    where: { id: input.partId },
    include: { project: { include: { guild: true, parts: true } } },
  });
  if (!part) return { ok: false, error: "No such part" };
  if (part.claimedById !== userId) return { ok: false, error: "Claim the part first" };
  if (part.project.status === "COMPLETE") {
    return { ok: false, error: "That piece is finished" };
  }

  const parsed = scoreSchema.safeParse(input.score);
  if (!parsed.success) return { ok: false, error: "That part is not a readable score" };
  const score = parsed.data as Score;

  const setup = setupForProject(part.project);
  if (
    score.key !== setup.key ||
    score.mode !== setup.mode ||
    score.bars !== setup.bars ||
    score.meter.beats !== setup.meter.beats ||
    score.meter.unit !== setup.meter.unit
  ) {
    return {
      ok: false,
      error: `This part has to be in ${setup.key} ${setup.mode}, ${setup.meter.beats}/${setup.meter.unit}, ${setup.bars} bars — the rest of the piece is.`,
    };
  }
  if (score.melody.length === 0) {
    return { ok: false, error: "There are no notes in it yet" };
  }

  const first = !part.submittedAt;
  await db.collabPart.update({
    where: { id: input.partId },
    data: {
      score: JSON.stringify(score),
      notes: (input.notes ?? "").slice(0, 400),
      submittedAt: new Date(),
    },
  });

  // Paid once per part, on the first submission. Revising your own line is
  // what writing is; it should not also be an income.
  let award: AwardResult | undefined;
  if (first) {
    award = await awardProgress({
      userId,
      xp: 70,
      skillXp: { COUNTERPOINT: 20, FORM: 15 },
    });
    await syncAchievements(userId);
  }
  revalidatePath(`/guild/${part.project.guild.key}`);
  return { ok: true, award };
}

/**
 * Calls the piece finished.
 *
 * Only once every part has music in it, and only by the composer who set it
 * up — somebody has to decide a collaboration is done, and the alternative is
 * that it is done by whoever clicks first.
 */
export async function completeCollabProject(projectId: string): Promise<CollabResult> {
  const userId = await requireUserId();
  const project = await db.collabProject.findUnique({
    where: { id: projectId },
    include: { guild: true, parts: true },
  });
  if (!project) return { ok: false, error: "No such piece" };
  if (project.createdById !== userId) {
    return { ok: false, error: "Only the composer who started it can call it finished" };
  }
  if (project.status === "COMPLETE") return { ok: true };

  const unwritten = project.parts.filter((p) => !p.score);
  if (unwritten.length > 0) {
    return {
      ok: false,
      error: `${unwritten.length} part${unwritten.length === 1 ? " is" : "s are"} still empty.`,
    };
  }

  await db.collabProject.update({
    where: { id: projectId },
    data: { status: "COMPLETE", completedAt: new Date() },
  });

  // Everyone who wrote a part gets the finishing bounty, once each.
  const writers = Array.from(
    new Set(project.parts.map((p) => p.claimedById).filter((id): id is string => Boolean(id)))
  );
  // Only the caller's own award can be shown. The others are real and are
  // granted, but they belong to composers who are not in front of this screen
  // — they will meet them as a changed level the next time they look.
  let award: AwardResult | undefined;
  for (const id of writers) {
    const result = await awardProgress({
      userId: id,
      xp: 150,
      skillXp: { FORM: 40, COUNTERPOINT: 30 },
      countsAsActivity: id === userId,
    });
    if (id === userId) award = result;
    await syncAchievements(id);
  }

  revalidatePath(`/guild/${project.guild.key}`);
  return { ok: true, award };
}
