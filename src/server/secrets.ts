/**
 * Finding secrets.
 *
 * Called by every page that shows rooms. It answers two questions at once:
 * which secret rooms may this player see, and has any of them only just become
 * visible? The second is what makes a secret feel found rather than merely
 * present — the room is written into RoomDiscovery the first time its rule is
 * satisfied, and that write is what the UI announces.
 *
 * Discovery is idempotent: the unique index on (userId, roomId) means two
 * concurrent page loads cannot double-award the same room.
 */

import { db } from "@/lib/db";
import {
  loadSecretContext,
  parseSecretRule,
  ruleSatisfied,
} from "@/lib/secrets";
import { isRoomCleared, type ClearedSets } from "@/lib/dungeon-progress";

export interface SecretRoomRef {
  id: string;
  areaId: string;
  secret: boolean;
  secretRule: string | null;
  type: string;
  bossId?: string | null;
  artifactId?: string | null;
}

export interface SecretsResult {
  /** Ids of secret rooms this player has found and may now see. */
  visibleSecretIds: ReadonlySet<string>;
  /** Ids discovered on this very request — worth announcing. */
  newlyFoundIds: ReadonlySet<string>;
}

/**
 * @param rooms every room in scope, secret and ordinary alike. Ordinary rooms
 *        are needed too: "clear the area" is judged on them.
 * @param unlockedAreaIds areas this player may actually walk into. A secret in
 *        a sealed area stays sealed: without this, a rule met elsewhere (a
 *        seven-day streak, say) would announce by name a room behind a level
 *        gate the player has not passed — which spoils the secret and offers
 *        a door that does not open.
 */
export async function resolveSecrets(
  userId: string,
  rooms: SecretRoomRef[],
  clearedSets: ClearedSets,
  unlockedAreaIds: ReadonlySet<string>
): Promise<SecretsResult> {
  const secretRooms = rooms.filter(
    (r) => r.secret && unlockedAreaIds.has(r.areaId)
  );
  // Nothing to judge — and importantly, nothing to load. Building the context
  // here would run eight queries to answer a question nobody asked, on every
  // page load of a player with no unlocked area holding a secret.
  if (secretRooms.length === 0) {
    return { visibleSecretIds: new Set(), newlyFoundIds: new Set() };
  }

  // An area counts as cleared on its ordinary rooms only. Requiring the
  // secret too would make "clear the area to reveal the secret" unsatisfiable.
  const byArea = new Map<string, SecretRoomRef[]>();
  for (const r of rooms) {
    if (r.secret) continue;
    const list = byArea.get(r.areaId);
    if (list) list.push(r);
    else byArea.set(r.areaId, [r]);
  }
  const clearedAreaIds = new Set<string>();
  byArea.forEach((areaRooms, areaId) => {
    if (areaRooms.length > 0 && areaRooms.every((r) => isRoomCleared(r, clearedSets))) {
      clearedAreaIds.add(areaId);
    }
  });

  const context = await loadSecretContext(db, userId, clearedAreaIds);

  const already = await db.roomDiscovery.findMany({
    where: { userId, roomId: { in: secretRooms.map((r) => r.id) } },
    select: { roomId: true },
  });
  const found = new Set(already.map((d) => d.roomId));

  // Rules are re-checked until nothing new turns up, because one discovery can
  // satisfy another: a room that opens at five secrets found should open in
  // the same breath as the fifth, not force a page refresh to notice. The pass
  // count is bounded by the number of secret rooms, so the loop always ends.
  const justFound: string[] = [];
  let progress = true;
  while (progress) {
    progress = false;
    for (const room of secretRooms) {
      if (found.has(room.id)) continue;
      const rule = parseSecretRule(room.secretRule);
      if (!rule) continue;
      if (!ruleSatisfied(rule, context, room.areaId)) continue;
      justFound.push(room.id);
      found.add(room.id);
      // The count a SECRETS_FOUND rule reads has to move with the discoveries
      // being made, or the chain is judged against the number from before it
      // started.
      context.secretsFound += 1;
      progress = true;
    }
  }

  if (justFound.length > 0) {
    // SQLite's Prisma driver has no `skipDuplicates`, and a racing tab really
    // can insert the same discovery first. Each row goes in on its own and a
    // unique-constraint collision is the expected outcome of that race, not a
    // failure: the room is found either way, so swallow P2002 and carry on.
    await Promise.all(
      justFound.map(async (roomId) => {
        try {
          await db.roomDiscovery.create({ data: { userId, roomId } });
        } catch (err) {
          const code = (err as { code?: string })?.code;
          if (code !== "P2002") throw err;
        }
      })
    );
  }

  return {
    visibleSecretIds: found,
    newlyFoundIds: new Set(justFound),
  };
}
