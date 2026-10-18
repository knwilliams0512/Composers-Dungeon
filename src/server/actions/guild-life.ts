"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import {
  guildBoostSchema,
  guildMessageSchema,
  guildPostSchema,
} from "@/lib/validation";
import { awardProgress, syncAchievements } from "@/lib/progression";
import { BOOSTS_PER_DAY, BOOST_XP } from "@/lib/guild-rules";

/**
 * What happens inside a guild, rather than to it.
 *
 * Joining, founding and leaving live in guild.ts: those are things done to the
 * list of houses. Everything here needs the one check that file does not —
 * that the person asking is a member of the guild they are asking about. It is
 * written once, below, and every action in this file starts with it. A guild
 * whose room could be read by anyone who guessed its slug would not be a guild.
 */

export interface GuildActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Resolves a guild by slug and confirms the caller belongs to it.
 *
 * Returns the same "not found" for a guild that does not exist and one the
 * caller is not in. The alternative tells anyone who can type a URL which
 * houses exist and who is in them, which is a strange thing to leak from a
 * feature whose entire purpose is that it is private to its members.
 */
async function requireMembership(guildKey: string) {
  const userId = await requireUserId();
  const guild = await db.guild.findUnique({ where: { key: guildKey } });
  if (!guild) return { error: "Guild not found" as const };
  const membership = await db.guildMember.findUnique({ where: { userId } });
  if (!membership || membership.guildId !== guild.id) {
    return { error: "Guild not found" as const };
  }
  return { userId, guild, membership };
}

/* -------------------------------------------------------------------------- */
/* The noticeboard                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A post written inside a guild, visible to its members.
 *
 * The same row type as a Guild Hall post, with guildId set. Sharing the table
 * means likes, comments and composition attachments all work here without a
 * second implementation of each — and a post cannot accidentally exist in both
 * places, because a row has one guildId or none.
 */
export async function postToGuild(input: {
  guildKey: string;
  content: string;
  compositionId?: string;
}): Promise<GuildActionResult> {
  const member = await requireMembership(input.guildKey);
  if ("error" in member) return { ok: false, error: member.error };

  const parsed = guildPostSchema.safeParse({
    content: input.content,
    compositionId: input.compositionId,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid post" };
  }

  // Only a composition the caller owns, and only one they have made public.
  // Inside a guild the audience is smaller, but it is still an audience.
  let compositionId: string | null = null;
  if (parsed.data.compositionId) {
    const comp = await db.composition.findUnique({
      where: { id: parsed.data.compositionId },
    });
    if (!comp || comp.userId !== member.userId) {
      return { ok: false, error: "Composition not found" };
    }
    if (comp.visibility !== "PUBLIC") {
      return { ok: false, error: "Make the composition public before sharing it" };
    }
    compositionId = comp.id;
  }

  await db.guildPost.create({
    data: {
      userId: member.userId,
      guildId: member.guild.id,
      content: parsed.data.content,
      compositionId,
    },
  });
  await syncAchievements(member.userId);
  revalidatePath(`/guild/${input.guildKey}`);
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* The room                                                                    */
/* -------------------------------------------------------------------------- */

export async function sendGuildMessage(input: {
  guildKey: string;
  content: string;
}): Promise<GuildActionResult> {
  const parsed = guildMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid message" };
  }
  const member = await requireMembership(parsed.data.guildKey);
  if ("error" in member) return { ok: false, error: member.error };

  await db.guildMessage.create({
    data: {
      guildId: member.guild.id,
      userId: member.userId,
      content: parsed.data.content,
    },
  });
  // Deliberately no revalidatePath: the chat polls for itself, and refreshing
  // the whole route on every line typed would redraw the raid and the roster
  // underneath it.
  return { ok: true };
}

export interface GuildChatLine {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: string;
  avatar: string;
  mine: boolean;
}

/**
 * The room's recent lines.
 *
 * Polled rather than pushed. There is no server to hold a socket open — the
 * app is a local process that stops when the window closes — so a poll every
 * few seconds against a table on the same machine is both the simplest thing
 * and, at this scale, the right one.
 *
 * `after` lets the client ask only for what it has not seen, so a long
 * conversation does not re-send itself every tick.
 */
export async function fetchGuildMessages(input: {
  guildKey: string;
  after?: string;
}): Promise<{ ok: boolean; messages?: GuildChatLine[]; error?: string }> {
  const member = await requireMembership(input.guildKey);
  if ("error" in member) return { ok: false, error: member.error };

  const since = input.after ? new Date(input.after) : null;
  const rows = await db.guildMessage.findMany({
    where: {
      guildId: member.guild.id,
      ...(since && !Number.isNaN(since.getTime()) ? { createdAt: { gt: since } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { user: { include: { profile: true } } },
  });

  return {
    ok: true,
    messages: rows.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      authorId: m.userId,
      author: m.user.profile?.displayName ?? "A composer",
      avatar: m.user.profile?.avatar ?? "quill",
      mine: m.userId === member.userId,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Lifting each other                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Lift a guildmate.
 *
 * Three rules, and each one exists to stop a different way of ruining it:
 *
 *   - Not yourself, or it is a button that prints XP.
 *   - Three a day, or a guild of two farms each other all afternoon.
 *   - Not the same person twice in a day, or the cap becomes one friendship.
 *
 * The XP is small on purpose. Forty is a nudge — a fraction of a lesson — so
 * that being liked moves nobody up a level, and the thing actually worth
 * having is the note, which is why the note is required.
 */
export async function boostMember(input: {
  guildKey: string;
  toUserId: string;
  note: string;
}): Promise<GuildActionResult & { remaining?: number }> {
  const parsed = guildBoostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid boost" };
  }
  const member = await requireMembership(parsed.data.guildKey);
  if ("error" in member) return { ok: false, error: member.error };

  if (parsed.data.toUserId === member.userId) {
    return { ok: false, error: "Boosting yourself is not a boost" };
  }

  // The recipient must be in the same guild — this is a guild's own currency.
  const theirs = await db.guildMember.findUnique({
    where: { userId: parsed.data.toUserId },
  });
  if (!theirs || theirs.guildId !== member.guild.id) {
    return { ok: false, error: "They are not in this guild" };
  }

  const dayStart = startOfToday();
  const todays = await db.guildBoost.findMany({
    where: { fromUserId: member.userId, createdAt: { gte: dayStart } },
    select: { toUserId: true },
  });
  if (todays.length >= BOOSTS_PER_DAY) {
    return {
      ok: false,
      error: `You have given today's ${BOOSTS_PER_DAY} boosts. More tomorrow.`,
    };
  }
  if (todays.some((b) => b.toUserId === parsed.data.toUserId)) {
    return { ok: false, error: "You have already lifted them today" };
  }

  await db.guildBoost.create({
    data: {
      guildId: member.guild.id,
      fromUserId: member.userId,
      toUserId: parsed.data.toUserId,
      note: parsed.data.note,
    },
  });

  // The XP lands on the person boosted, never the giver. countsAsActivity is
  // false deliberately: a streak should be earned by writing music, not by
  // being complimented while you were away from the app.
  //
  // award-not-surfaced: the award belongs to the person boosted, who is not the
  // person on this screen. There is nobody here to show it to — the giver would
  // be shown someone else's level-up, and the receiver is not in the request.
  // Returning it would also leak how close another composer is to levelling.
  await awardProgress({
    userId: parsed.data.toUserId,
    xp: BOOST_XP,
    countsAsActivity: false,
  });
  await syncAchievements(member.userId);

  revalidatePath(`/guild/${parsed.data.guildKey}`);
  return { ok: true, remaining: BOOSTS_PER_DAY - todays.length - 1 };
}

/** Local midnight, which is the day the person giving the boost is living in. */
function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** How many boosts the caller has left today. */
export async function boostsRemaining(): Promise<number> {
  const userId = await requireUserId();
  const used = await db.guildBoost.count({
    where: { fromUserId: userId, createdAt: { gte: startOfToday() } },
  });
  return Math.max(0, BOOSTS_PER_DAY - used);
}
