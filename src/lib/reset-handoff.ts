import "server-only";

import { db } from "@/lib/db";

/**
 * The local hand-over: how someone sitting at this machine gets back into an
 * account without a mail service and without being shown a token.
 *
 * Composer's Dungeon has no server behind it, so there is nobody to email a
 * reset link except whatever mailbox the owner lends it. That left the old
 * reset flow printing the link on the page, which handed an account to anyone
 * who could reach the sign-in screen.
 *
 * The replacement leans on something the install already guarantees. The
 * launcher binds the server to 127.0.0.1, so a request that arrives at all
 * arrived from this machine — from the person who can already open the data
 * folder and read the database. For that person a reset needs no secret
 * channel; it only needs not to create one. So the page is handed a
 * single-use handle, the handle is redeemed on the server, and the token
 * appears only in the redirect the browser follows.
 */

/** Ten minutes: a hand-over is followed in the next few seconds or not at all. */
export const HANDOFF_MINUTES = 10;

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1", "::ffff:127.0.0.1"]);

/** Strips a port and IPv6 brackets, so one set of names matches every spelling. */
function bareHost(value: string): string {
  const trimmed = value.trim().toLowerCase();
  // [::1]:3000 → ::1, and localhost:3000 → localhost. A bare IPv6 address has
  // colons of its own, so the port is only stripped when brackets said where
  // the address ended, or when there is exactly one colon.
  const bracketed = trimmed.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketed) return bracketed[1];
  return trimmed.split(":").length === 2 ? trimmed.split(":")[0] : trimmed;
}

/**
 * Whether a request came from the machine the app runs on.
 *
 * The Windows launcher starts the server with HOSTNAME=127.0.0.1, so it only
 * accepts connections from loopback and the question is already settled. These
 * checks are for every other way the app can be run: a source install, a dev
 * server, a copy somebody has put behind a proxy.
 *
 * The forwarded headers are read for their *values*, not merely for being
 * there. Next.js adds `x-forwarded-for` to every request it serves, itself,
 * naming the address the connection actually came from — so treating their
 * presence as evidence of a proxy, as the first version of this did, rejects
 * every request including the local ones. A real proxy shows up as a
 * non-loopback address in that chain, or a different host in
 * `x-forwarded-host`, and either is enough to say no.
 */
export function isLoopbackHost(
  host: string | null,
  forwarded: {
    for?: string | null;
    host?: string | null;
    /** RFC 7239's `Forwarded:`, which no part of this stack sets but a proxy might. */
    raw?: string | null;
  } = {}
): boolean {
  if (!LOOPBACK.has(bareHost(host ?? ""))) return false;
  if (forwarded.host && !LOOPBACK.has(bareHost(forwarded.host))) return false;
  if (forwarded.raw) return false;
  if (forwarded.for) {
    // Every hop must be loopback: one public address anywhere in the chain
    // means the request started somewhere else.
    const hops = forwarded.for.split(",");
    if (!hops.every((hop) => LOOPBACK.has(bareHost(hop)))) return false;
  }
  return true;
}

/**
 * Redeems a hand-over handle and returns the reset path once.
 *
 * Clearing the handle before returning is the whole point: a link left in
 * browser history, or a page left open on a shared desk, is then worth
 * nothing. The reset token keeps its own half-hour, so someone who redeems
 * and then wanders off still has time to finish.
 */
export async function redeemResetHandoff(handoff: string): Promise<string | null> {
  if (!/^[a-f0-9]{64}$/.test(handoff)) return null;
  const user = await db.user.findUnique({ where: { resetHandoff: handoff } });
  if (!user || !user.resetToken) return null;

  // Spent either way: expired or not, this handle never works again.
  await db.user.update({
    where: { id: user.id },
    data: { resetHandoff: null, resetHandoffExpiry: null },
  });

  const expiry = user.resetHandoffExpiry?.getTime() ?? 0;
  if (expiry < Date.now()) return null;
  return `/reset-password?token=${user.resetToken}`;
}
