import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { tierOrdinal, ROOM_TYPE_INFO, type RoomType } from "@/lib/enums";

export default async function DungeonAreaPage({
  params,
}: {
  params: { areaKey: string };
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const area = await db.dungeonArea.findUnique({
    where: { key: params.areaKey },
    include: {
      rooms: { orderBy: { order: "asc" }, include: { boss: true } },
    },
  });
  if (!area) notFound();

  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/login");

  const unlocked =
    profile.level >= area.levelRequirement &&
    tierOrdinal(profile.experienceTier) >= tierOrdinal(area.tierRequirement) - 2;
  if (!unlocked) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="text-3xl">{area.icon}</p>
        <h1 className="heading-display mt-2 text-xl">{area.name} Is Sealed</h1>
        <p className="mt-2 text-parchment-400">
          Reach Composer Level {area.levelRequirement} to break the seal.
        </p>
        <Link href="/dungeon" className="btn-secondary mt-4">
          Back to the Map
        </Link>
      </div>
    );
  }

  const [completed, bossProgress] = await Promise.all([
    db.userChallenge.findMany({
      where: {
        userId,
        status: "COMPLETED",
        challenge: { roomId: { in: area.rooms.map((r) => r.id) } },
      },
      include: { challenge: { select: { roomId: true } } },
    }),
    db.userBossProgress.findMany({ where: { userId } }),
  ]);
  const clearedRoomIds = new Set(completed.map((c) => c.challenge.roomId));
  const defeatedBossIds = new Set(
    bossProgress.filter((b) => b.defeated).map((b) => b.bossId)
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dungeon" className="text-sm text-parchment-500 hover:text-gold-300">
        ← Back to the Dungeon map
      </Link>
      <header className="mb-8 mt-2">
        <p className="text-4xl">{area.icon}</p>
        <h1 className="heading-display mt-2 text-3xl">{area.name}</h1>
        <p className="italic text-parchment-500">{area.theme}</p>
        <p className="mt-2 text-parchment-400">{area.description}</p>
      </header>

      {/* Rooms as a descending path */}
      <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-6 before:top-4 before:w-px before:bg-gradient-to-b before:from-gold-700/50 before:via-abyss-600 before:to-crimson-600/50">
        {area.rooms.map((room) => {
          const info = ROOM_TYPE_INFO[room.type as RoomType];
          const roomLocked = profile.level < room.levelRequirement;
          const cleared =
            room.type === "BOSS"
              ? room.bossId != null && defeatedBossIds.has(room.bossId)
              : clearedRoomIds.has(room.id);
          const href =
            room.type === "BOSS" && room.boss
              ? `/bosses/${room.boss.key}`
              : `/dungeon/room/${room.id}`;
          const inner = (
            <div
              className={`card relative ml-12 p-4 transition-all ${
                roomLocked
                  ? "opacity-50"
                  : cleared
                    ? "border-emerald-700/50"
                    : room.type === "BOSS"
                      ? "border-crimson-600/50 hover:shadow-crimson"
                      : "hover:border-gold-700/60 hover:shadow-glow"
              }`}
            >
              <span
                className={`absolute -left-[2.4rem] top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-abyss-900 text-base ${
                  cleared
                    ? "border-emerald-600"
                    : room.type === "BOSS"
                      ? "border-crimson-600"
                      : "border-abyss-600"
                }`}
              >
                {roomLocked ? "🔒" : info?.icon ?? "▫"}
              </span>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-display text-gold-300">
                  {cleared && "✓ "}
                  {room.name}
                </p>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-parchment-500">
                  {info?.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-parchment-400">{room.description}</p>
              {roomLocked && (
                <p className="mt-1 text-xs text-parchment-500">
                  Requires Composer Level {room.levelRequirement}
                </p>
              )}
            </div>
          );
          return (
            <li key={room.id}>
              {roomLocked ? inner : <Link href={href}>{inner}</Link>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
