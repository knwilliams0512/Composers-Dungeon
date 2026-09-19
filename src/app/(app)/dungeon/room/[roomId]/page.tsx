import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { tierOrdinal, ROOM_TYPE_INFO, type RoomType } from "@/lib/enums";
import { currentTierOrdinal } from "@/server/tier";
import { ChallengePanel } from "@/components/dungeon/ChallengePanel";
import { BeginTrialButton } from "@/components/dungeon/BeginTrialButton";
import { briefForChallenge, parseChecks, usesFullScore } from "@/lib/challenge-brief";
import { resolveFreedom } from "@/lib/composer-freedom";
import { PuzzlePanel } from "@/components/dungeon/PuzzlePanel";
import { TreasurePanel } from "@/components/dungeon/TreasurePanel";
import { Icon } from "@/components/ui/Icon";
import { Panel } from "@/components/ui/primitives";

export default async function DungeonRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const room = await db.dungeonRoom.findUnique({
    where: { id: params.roomId },
    include: { area: true, artifact: true, boss: true },
  });
  if (!room) notFound();
  if (room.type === "BOSS" && room.boss) redirect(`/bosses/${room.boss.key}`);

  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/login");

  const userOrdinal = await currentTierOrdinal(userId, profile.experienceTier);
  const unlocked =
    profile.level >= room.levelRequirement &&
    profile.level >= room.area.levelRequirement &&
    userOrdinal >= tierOrdinal(room.area.tierRequirement) - 2;
  if (!unlocked) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <Icon name="lock" size={30} className="mx-auto text-gold-600" />
        <h1 className="heading-display mt-2 text-xl">The Door Will Not Move</h1>
        <p className="mt-2 text-parchment-400">
          Reach Composer Level {Math.max(room.levelRequirement, room.area.levelRequirement)} to enter.
        </p>
        <Link href={`/dungeon/${room.area.key}`} className="btn-secondary mt-4">
          Back to {room.area.name}
        </Link>
      </div>
    );
  }

  const info = ROOM_TYPE_INFO[room.type as RoomType];

  // Existing state for the room
  const activeChallenge = await db.userChallenge.findFirst({
    where: { userId, status: "ACTIVE", challenge: { roomId: room.id } },
    include: { challenge: true },
  });
  const completedCount = await db.userChallenge.count({
    where: { userId, status: "COMPLETED", challenge: { roomId: room.id } },
  });
  const hasRerollArtifact =
    (await db.userArtifact.count({
      where: { userId, artifact: { effect: "REROLL" } },
    })) > 0;

  const puzzleSolved =
    room.type === "PUZZLE"
      ? (await db.userChallenge.count({
          where: {
            userId,
            status: "COMPLETED",
            challenge: { roomId: room.id, type: "PUZZLE" },
          },
        })) > 0
      : false;

  // The composer's brief: the same standard the server will grade against.
  const brief = briefForChallenge({
    difficulty: activeChallenge?.challenge.difficulty ?? room.levelRequirement,
    keySig: activeChallenge?.challenge.keySig,
    meter: activeChallenge?.challenge.meter,
    lengthBars: activeChallenge?.challenge.lengthBars,
    instrument: activeChallenge?.challenge.instrument,
    skillKey: activeChallenge?.challenge.skillKey ?? room.area.skillKey,
  });
  const checks = parseChecks(activeChallenge?.challenge.checks) ?? brief.checks;
  const lessonsCompleted = await db.lessonProgress.count({
    where: { userId, status: "COMPLETED" },
  });
  const freedom = resolveFreedom({
    level: profile.level,
    lessonsCompleted,
    fullFreedom: profile.fullFreedom,
    cap: activeChallenge?.challenge.freedomCap ?? brief.freedomCap,
  });

  const ownsArtifact = room.artifactId
    ? (await db.userArtifact.count({
        where: { userId, artifactId: room.artifactId },
      })) > 0
    : false;

  const puzzle = room.puzzleData ? sanitizePuzzle(room.puzzleData) : null;

  // A trial written on a full score needs the width a score needs. Squeezed
  // into the reading column, the staves end up a finger wide between the
  // instrument list and the tool panel, and the editor is unusable.
  const wide =
    activeChallenge !== null &&
    usesFullScore({
      difficulty: activeChallenge.challenge.difficulty,
      skillKey: activeChallenge.challenge.skillKey,
      areaSkillKey: room.area.skillKey,
    });

  return (
    <div className={wide ? "mx-auto max-w-[1600px]" : "mx-auto max-w-3xl"}>
      <Link
        href={`/dungeon/${room.area.key}`}
        className="text-sm text-parchment-500 hover:text-gold-300"
      >
        ← Back to {room.area.name}
      </Link>
      <header className="mb-6 mt-2">
        <p className="text-xs uppercase tracking-[0.3em] text-parchment-500">
          {info?.icon} {info?.label} · {room.area.name}
        </p>
        <h1 className="heading-display mt-1 text-3xl">{room.name}</h1>
        <p className="mt-2 text-parchment-400">{room.description}</p>
        {completedCount > 0 && room.type !== "PUZZLE" && (
          <p className="mt-1 text-xs text-emerald-300">
            ✓ Conquered {completedCount} time{completedCount > 1 ? "s" : ""} — new
            trials regenerate endlessly.
          </p>
        )}
        {ownsArtifact && (room.type === "TREASURE" || room.type === "REST") && room.artifact && (
          <p className="mt-1 text-xs text-emerald-300">✓ CLEARED</p>
        )}
      </header>

      {(room.type === "CHALLENGE" || room.type === "CURSE" || room.type === "EVENT") &&
        (activeChallenge ? (
          <ChallengePanel
            fullScore={wide}
            challenge={{
              userChallengeId: activeChallenge.id,
              title: activeChallenge.challenge.title,
              description: activeChallenge.challenge.description,
              difficulty: activeChallenge.challenge.difficulty,
              keySig: activeChallenge.challenge.keySig,
              meter: activeChallenge.challenge.meter,
              // Show the length the composer is actually set to, not the raw
              // generated number — a tier can shorten it.
              lengthBars: brief.setup.bars,
              instrument: activeChallenge.challenge.instrument,
              style: activeChallenge.challenge.style,
              requirement: activeChallenge.challenge.requirement,
              restriction: activeChallenge.challenge.restriction,
              xpReward: activeChallenge.challenge.xpReward,
              canReroll: hasRerollArtifact && !activeChallenge.challenge.curated,
            }}
            setup={brief.setup}
            checks={checks}
            freedom={freedom}
          />
        ) : (
          <BeginTrialButton roomId={room.id} isCurse={room.type === "CURSE"} />
        ))}

      {room.type === "PUZZLE" && room.puzzleData && puzzle && (
        <PuzzlePanel roomId={room.id} alreadySolved={puzzleSolved} puzzle={puzzle} />
      )}
      {room.type === "PUZZLE" && room.puzzleData && !puzzle && (
        <Panel title="The Riddle Is Worn Away" icon="warning" tone="crimson" className="mt-6">
          <p className="text-[15px] leading-[1.75] text-parchment-300">
            Something has scratched this puzzle past reading. The rest of the dungeon is
            untouched — try another room.
          </p>
        </Panel>
      )}

      {room.type === "TREASURE" && room.artifact && (
        <TreasurePanel
          roomId={room.id}
          artifact={{
            name: room.artifact.name,
            icon: room.artifact.icon,
            rarity: room.artifact.rarity,
            description: room.artifact.description,
          }}
          alreadyOwned={ownsArtifact}
        />
      )}

      {room.type === "REST" && (
        <div className="card p-6 text-center">
          <Icon name="flame" size={36} className="mx-auto animate-flicker text-gold-400" />
          <h2 className="heading-display mt-3 text-xl">A Moment of Peace</h2>
          <p className="mx-auto mt-2 max-w-md text-parchment-400">
            The Dungeon cannot reach you here. Rest Days protect your Creative
            Flame when life pulls you away — you currently hold{" "}
            <strong className="text-gold-300">{profile.restDays}</strong>.
            {room.artifact && !ownsArtifact && (
              <> Something glimmers by the hearth…</>
            )}
          </p>
          {room.artifact && (
            <div className="mx-auto mt-4 max-w-sm">
              <TreasurePanel
                roomId={room.id}
                artifact={{
                  name: room.artifact.name,
                  icon: room.artifact.icon,
                  rarity: room.artifact.rarity,
                  description: room.artifact.description,
                }}
                alreadyOwned={ownsArtifact}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Strips answers/solutions before the puzzle definition reaches the client.
 *
 * Returns null rather than throwing on a column that will not parse: a single
 * bad puzzle row should cost the player that puzzle, not the whole room.
 */
function sanitizePuzzle(raw: string): {
  kind: string;
  prompt: string;
  choices?: string[];
  pieces?: { id: string; label: string }[];
} | null {
  let parsed: {
    kind: string;
    prompt: string;
    choices?: string[];
    pieces?: { id: string; label: string }[];
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed.kind !== "string" || typeof parsed.prompt !== "string") return null;
  return {
    kind: parsed.kind,
    prompt: parsed.prompt,
    choices: parsed.choices,
    pieces: parsed.pieces,
  };
}
