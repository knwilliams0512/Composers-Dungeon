import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { tierOrdinal, ROOM_TYPE_INFO, type RoomType } from "@/lib/enums";
import { ChallengePanel } from "@/components/dungeon/ChallengePanel";
import { BeginTrialButton } from "@/components/dungeon/BeginTrialButton";
import { briefForChallenge, parseChecks } from "@/lib/challenge-brief";
import { cappedFreedom, freedomForPlayer } from "@/lib/composer-freedom";
import { PuzzlePanel } from "@/components/dungeon/PuzzlePanel";
import { TreasurePanel } from "@/components/dungeon/TreasurePanel";
import { Icon } from "@/components/ui/Icon";

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

  const unlocked =
    profile.level >= room.levelRequirement &&
    profile.level >= room.area.levelRequirement &&
    tierOrdinal(profile.experienceTier) >= tierOrdinal(room.area.tierRequirement) - 2;
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
  const freedom = cappedFreedom(
    freedomForPlayer(profile.level, lessonsCompleted),
    activeChallenge?.challenge.freedomCap ?? brief.freedomCap
  );

  const ownsArtifact = room.artifactId
    ? (await db.userArtifact.count({
        where: { userId, artifactId: room.artifactId },
      })) > 0
    : false;

  return (
    <div className="mx-auto max-w-3xl">
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
      </header>

      {(room.type === "CHALLENGE" || room.type === "CURSE" || room.type === "EVENT") &&
        (activeChallenge ? (
          <ChallengePanel
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

      {room.type === "PUZZLE" && room.puzzleData && (
        <PuzzlePanel
          roomId={room.id}
          alreadySolved={puzzleSolved}
          puzzle={sanitizePuzzle(room.puzzleData)}
        />
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

/** Strips answers/solutions before the puzzle definition reaches the client. */
function sanitizePuzzle(raw: string): {
  kind: string;
  prompt: string;
  choices?: string[];
  pieces?: { id: string; label: string }[];
} {
  const parsed = JSON.parse(raw) as {
    kind: string;
    prompt: string;
    choices?: string[];
    pieces?: { id: string; label: string }[];
  };
  return {
    kind: parsed.kind,
    prompt: parsed.prompt,
    choices: parsed.choices,
    pieces: parsed.pieces,
  };
}
