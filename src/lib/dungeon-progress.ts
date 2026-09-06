/**
 * What counts as clearing a room.
 *
 * Three places ask this question — the dungeon map, an area's room list, and
 * the room itself — and they used to answer it three different ways. A room
 * page called a treasure vault cleared once you held its artifact, while both
 * list pages only looked for a completed challenge, which opening a vault
 * never creates; and the map ignored defeated bosses that the area page
 * counted. So the same room read as cleared in one view and untouched in
 * another. The rule lives here now, and every view calls it.
 */

export interface ClearableRoom {
  id: string;
  type: string;
  bossId?: string | null;
  artifactId?: string | null;
}

export interface ClearedSets {
  /** Rooms with a completed challenge in them. */
  challengeRoomIds: ReadonlySet<string | null | undefined>;
  /** Bosses the player has put down. */
  defeatedBossIds: ReadonlySet<string>;
  /** Artifacts the player holds. */
  ownedArtifactIds: ReadonlySet<string>;
}

export function isRoomCleared(room: ClearableRoom, sets: ClearedSets): boolean {
  // A boss room is cleared by beating its boss, not by writing in it.
  if (room.type === "BOSS") return room.bossId != null && sets.defeatedBossIds.has(room.bossId);
  // Vaults and rest rooms hand over an artifact; holding it is the proof.
  if (room.type === "TREASURE" || room.type === "REST") {
    if (room.artifactId) return sets.ownedArtifactIds.has(room.artifactId);
  }
  return sets.challengeRoomIds.has(room.id);
}

export function countCleared(rooms: ClearableRoom[], sets: ClearedSets): number {
  return rooms.filter((r) => isRoomCleared(r, sets)).length;
}
