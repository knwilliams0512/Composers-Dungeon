import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { tierOrdinal, ROOM_TYPE_INFO, type RoomType } from "@/lib/enums";
import { Icon, ROOM_ICONS, SKILL_ICONS } from "@/components/ui/Icon";
import { Meter, DangerRating, Panel } from "@/components/ui/primitives";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { roomTypeTheme, categoryVars } from "@/lib/category-theme";

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
      <div className="card-crimson mx-auto max-w-lg p-8 text-center">
        <p className="text-4xl">{area.icon}</p>
        <Icon name="lock" size={26} className="mx-auto mt-3 text-crimson-400" />
        <h1 className="heading-display mt-3 text-xl">{area.name} Is Sealed</h1>
        <p className="mt-2 text-parchment-400">
          Reach Composer Level {area.levelRequirement} to break the seal. You are level{" "}
          {profile.level}.
        </p>
        <Link href="/dungeon" className="btn-secondary mt-5">
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

  const clearedCount = area.rooms.filter((r) =>
    r.type === "BOSS"
      ? r.bossId != null && defeatedBossIds.has(r.bossId)
      : clearedRoomIds.has(r.id)
  ).length;
  const areaPercent = area.rooms.length ? (clearedCount / area.rooms.length) * 100 : 0;

  let survivalTips: string[] = [];
  try {
    survivalTips = area.survivalTips ? (JSON.parse(area.survivalTips) as string[]) : [];
  } catch {
    survivalTips = [];
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ScrollProgress />
      <Link href="/dungeon" className="text-sm text-parchment-500 hover:text-gold-300">
        ← Back to the Dungeon map
      </Link>
      <header className="card-crimson lit-edge mb-6 mt-3 p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="text-4xl leading-none">{area.icon}</span>
          <div className="flex flex-col items-end gap-2">
            <DangerRating level={area.dangerRating} />
            {area.skillKey && (
              <span className="pill-arcane">
                <Icon name={SKILL_ICONS[area.skillKey] ?? "note"} size={10} />
                Trains {area.skillKey.charAt(0) + area.skillKey.slice(1).toLowerCase()}
              </span>
            )}
          </div>
        </div>
        <h1 className="heading-display mt-3 text-3xl">{area.name}</h1>
        <p className="italic text-parchment-500">{area.theme}</p>
        <p className="mt-2 leading-relaxed text-parchment-400">{area.description}</p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-parchment-500">
            <span>
              {clearedCount} of {area.rooms.length} rooms cleared
            </span>
            <span>{Math.round(areaPercent)}%</span>
          </div>
          <Meter
            percent={areaPercent}
            color={clearedCount === area.rooms.length ? "emerald" : "crimson"}
            thick
          />
        </div>
      </header>

      {area.lore && (
        <Panel title="What Is Known" icon="scroll" className="mb-6">
          <p className="text-[15px] leading-[1.75] text-parchment-300">{area.lore}</p>
          {survivalTips.length > 0 && (
            <>
              <div className="rune-divider">
                <span className="text-[10px] uppercase tracking-[0.3em] text-gold-600">
                  Advice from those who returned
                </span>
              </div>
              <ul className="space-y-2">
                {survivalTips.map((tip) => (
                  <li key={tip} className="flex gap-2.5 text-sm text-parchment-300">
                    <Icon name="candle" size={15} className="mt-0.5 shrink-0 text-gold-600" />
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      )}

      {/* Rooms as a descending, glowing path — each type its own colour */}
      <ol className="stagger relative space-y-4 before:absolute before:bottom-4 before:left-6 before:top-4 before:w-px before:bg-gradient-to-b before:from-gold-700/50 before:via-abyss-600 before:to-crimson-600/50">
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
          const theme = roomTypeTheme(room.type);
          const inner = (
            <div
              className={`card-accent group relative ml-12 p-4 ${
                roomLocked ? "opacity-55 saturate-[0.55]" : cleared ? "border-emerald2-500/40" : ""
              }`}
              style={categoryVars(theme)}
            >
              <span
                className="absolute -left-[2.4rem] top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-abyss-950/90 text-base backdrop-blur transition-transform duration-300 group-hover:scale-110"
                style={{
                  borderColor: cleared
                    ? "rgba(79,215,168,0.6)"
                    : `color-mix(in srgb, ${theme.hex} 55%, transparent)`,
                  boxShadow: roomLocked
                    ? "none"
                    : `0 0 14px -2px ${cleared ? "#4dc79a" : theme.hex}`,
                }}
              >
                {roomLocked ? (
                  <Icon name="lock" size={15} className="text-parchment-500" />
                ) : cleared ? (
                  <Icon name="check" size={17} className="text-emerald2-400" />
                ) : (
                  <Icon name={ROOM_ICONS[room.type] ?? "sword"} size={17} style={{ color: theme.light }} />
                )}
              </span>
              <div className="relative flex items-baseline justify-between gap-2">
                <p className="flex items-center gap-1.5 font-display text-parchment-100">
                  {cleared && <Icon name="check" size={14} className="text-emerald2-400" />}
                  {room.name}
                </p>
                <span className="accent-chip">
                  <Icon name={theme.icon} size={10} />
                  {info?.label ?? theme.label}
                </span>
              </div>
              <p className="relative mt-1 text-sm leading-relaxed text-parchment-400">
                {room.description}
              </p>
              <div className="relative mt-2.5 flex flex-wrap items-center gap-1.5">
                {roomLocked ? (
                  <span className="pill">
                    <Icon name="lock" size={10} /> Needs level {room.levelRequirement}
                  </span>
                ) : cleared ? (
                  <span className="pill-emerald">
                    <Icon name="check" size={10} /> Cleared
                  </span>
                ) : (
                  <span className="accent-text inline-flex items-center gap-1 text-xs font-semibold opacity-80 transition-opacity group-hover:opacity-100">
                    Enter <Icon name="arrow" size={12} />
                  </span>
                )}
                {room.type === "BOSS" && room.boss && (
                  <span className="pill-crimson">
                    <Icon name="skull" size={10} /> {room.boss.name}
                  </span>
                )}
              </div>
            </div>
          );
          return (
            <li key={room.id}>
              {roomLocked ? inner : <Link href={href} className="group block">{inner}</Link>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
