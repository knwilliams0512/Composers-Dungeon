/**
 * Secret rooms: what hides them, and what earns the sight of them.
 *
 * A secret room is not merely a locked door. A locked door tells you it is
 * there and names its key; a secret tells you nothing until you have already
 * done the thing that reveals it. That difference only survives if the client
 * is never sent the room at all before discovery — otherwise the secret is a
 * line in the page source and the game is to read it, not to play it. So
 * every rule here is evaluated on the server against real rows, and an
 * undiscovered secret is filtered out of the payload entirely.
 *
 * Rules are stored as JSON on DungeonRoom.secretRule.
 */

import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

/** Every way a secret can be earned. */
export type SecretRule =
  /** Clear every non-secret room in the same area. */
  | { kind: "AREA_CLEARED" }
  /** Hold a particular artifact. */
  | { kind: "HOLDS_ARTIFACT"; artifactKey: string }
  /** Put down a particular boss. */
  | { kind: "BOSS_DEFEATED"; bossKey: string }
  /** Raise one skill to a level. */
  | { kind: "SKILL_LEVEL"; skillKey: string; level: number }
  /** Finish a number of Academy lessons. */
  | { kind: "LESSONS_COMPLETED"; count: number }
  /** Solve a number of puzzle rooms anywhere. */
  | { kind: "PUZZLES_SOLVED"; count: number }
  /** Keep the Creative Flame alive this many days. */
  | { kind: "STREAK"; days: number }
  /** Write a number of compositions. */
  | { kind: "COMPOSITIONS"; count: number }
  /** Find this many other secrets first — the deepest rooms. */
  | { kind: "SECRETS_FOUND"; count: number };

export function parseSecretRule(raw: string | null | undefined): SecretRule | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SecretRule;
    return parsed && typeof parsed.kind === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * The counts every rule is judged against, gathered once per request rather
 * than once per room — a map page can hold a dozen secrets and this used to be
 * the obvious place to accidentally write a query loop.
 */
export interface SecretContext {
  ownedArtifactKeys: ReadonlySet<string>;
  defeatedBossKeys: ReadonlySet<string>;
  skillLevels: ReadonlyMap<string, number>;
  lessonsCompleted: number;
  puzzlesSolved: number;
  compositions: number;
  longestStreak: number;
  secretsFound: number;
  /** Area id -> whether every ordinary room in it is cleared. */
  clearedAreaIds: ReadonlySet<string>;
}

export function ruleSatisfied(
  rule: SecretRule,
  ctx: SecretContext,
  areaId: string
): boolean {
  switch (rule.kind) {
    case "AREA_CLEARED":
      return ctx.clearedAreaIds.has(areaId);
    case "HOLDS_ARTIFACT":
      return ctx.ownedArtifactKeys.has(rule.artifactKey);
    case "BOSS_DEFEATED":
      return ctx.defeatedBossKeys.has(rule.bossKey);
    case "SKILL_LEVEL":
      return (ctx.skillLevels.get(rule.skillKey) ?? 0) >= rule.level;
    case "LESSONS_COMPLETED":
      return ctx.lessonsCompleted >= rule.count;
    case "PUZZLES_SOLVED":
      return ctx.puzzlesSolved >= rule.count;
    case "STREAK":
      return ctx.longestStreak >= rule.days;
    case "COMPOSITIONS":
      return ctx.compositions >= rule.count;
    case "SECRETS_FOUND":
      return ctx.secretsFound >= rule.count;
    default:
      // An unknown rule stays unsatisfiable rather than defaulting to open:
      // a typo in seed data should hide a room, never hand one out.
      return false;
  }
}

/** Human wording for a rule, shown only after the room has been found. */
export function describeRule(rule: SecretRule): string {
  switch (rule.kind) {
    case "AREA_CLEARED":
      return "Found by clearing every other room in this area.";
    case "HOLDS_ARTIFACT":
      return "Found by carrying the right artifact through the door.";
    case "BOSS_DEFEATED":
      return "Found in the quiet after a boss fell.";
    case "SKILL_LEVEL":
      return `Found once your ${rule.skillKey.toLowerCase()} reached level ${rule.level}.`;
    case "LESSONS_COMPLETED":
      return `Found after ${rule.count} lessons — the reward for studying.`;
    case "PUZZLES_SOLVED":
      return `Found after solving ${rule.count} puzzles.`;
    case "STREAK":
      return `Found by keeping the Creative Flame alive ${rule.days} days.`;
    case "COMPOSITIONS":
      return `Found after writing ${rule.count} pieces of your own.`;
    case "SECRETS_FOUND":
      return `Found only by those who had already found ${rule.count} others.`;
    default:
      return "Found by a path no one has written down.";
  }
}

/**
 * Builds the context for one user. `clearedAreaIds` is computed by the caller
 * (it needs the room-clearing rule from dungeon-progress) and passed in.
 */
export async function loadSecretContext(
  tx: Tx,
  userId: string,
  clearedAreaIds: ReadonlySet<string>
): Promise<SecretContext> {
  const [artifacts, bosses, skills, lessons, puzzles, compositions, profile, found] =
    await Promise.all([
      tx.userArtifact.findMany({
        where: { userId },
        select: { artifact: { select: { key: true } } },
      }),
      tx.userBossProgress.findMany({
        where: { userId, defeated: true },
        select: { boss: { select: { key: true } } },
      }),
      tx.userSkill.findMany({
        where: { userId },
        select: { level: true, skill: { select: { key: true } } },
      }),
      tx.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
      tx.userChallenge.count({
        where: { userId, status: "COMPLETED", challenge: { type: "PUZZLE" } },
      }),
      tx.composition.count({ where: { userId } }),
      tx.userProfile.findUnique({
        where: { userId },
        select: { longestStreak: true },
      }),
      tx.roomDiscovery.count({ where: { userId } }),
    ]);

  return {
    ownedArtifactKeys: new Set(artifacts.map((a) => a.artifact.key)),
    defeatedBossKeys: new Set(bosses.map((b) => b.boss.key)),
    skillLevels: new Map(skills.map((s) => [s.skill.key, s.level])),
    lessonsCompleted: lessons,
    puzzlesSolved: puzzles,
    compositions,
    longestStreak: profile?.longestStreak ?? 0,
    secretsFound: found,
    clearedAreaIds,
  };
}
