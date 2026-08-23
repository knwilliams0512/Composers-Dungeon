import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Icon, ROOM_ICONS, SKILL_ICONS } from "@/components/ui/Icon";
import { Meter, DangerRating } from "@/components/ui/primitives";
import { tierOrdinal } from "@/lib/enums";

export const metadata = { title: "The Dungeon" };

export default async function DungeonMapPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [profile, areas, completedByArea] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    db.dungeonArea.findMany({
      orderBy: { order: "asc" },
      include: { rooms: { orderBy: { order: "asc" } } },
    }),
    db.userChallenge.findMany({
      where: { userId, status: "COMPLETED" },
      include: { challenge: { select: { roomId: true } } },
    }),
  ]);
  if (!profile) redirect("/login");

  const completedRoomIds = new Set(
    completedByArea.map((c) => c.challenge.roomId).filter(Boolean)
  );
  const userOrdinal = tierOrdinal(profile.experienceTier);

  const mainAreas = areas.filter((a) => !a.special);
  const specialAreas = areas.filter((a) => a.special);

  function AreaCard({ area }: { area: (typeof areas)[number] }) {
    const unlocked =
      profile!.level >= area.levelRequirement &&
      userOrdinal >= tierOrdinal(area.tierRequirement) - 2;
    const clearedRooms = area.rooms.filter((r) => completedRoomIds.has(r.id)).length;
    const percent = area.rooms.length ? (clearedRooms / area.rooms.length) * 100 : 0;
    const cleared = area.rooms.length > 0 && clearedRooms === area.rooms.length;
    const inner = (
      <div
        className={`card lit-edge relative h-full overflow-hidden p-5 transition-all ${
          unlocked
            ? "hover:-translate-y-0.5 hover:border-gold-700/60 hover:shadow-glow"
            : "opacity-45"
        } ${cleared ? "border-emerald-700/50" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-3xl leading-none">{area.icon}</span>
          <div className="flex flex-col items-end gap-1.5">
            <DangerRating level={area.dangerRating} />
            {!unlocked ? (
              <span className="pill">
                <Icon name="lock" size={10} /> Level {area.levelRequirement}
              </span>
            ) : cleared ? (
              <span className="pill border-emerald-700/60 text-emerald-300">
                <Icon name="check" size={10} /> Cleared
              </span>
            ) : null}
          </div>
        </div>

        <h2 className="heading-display mt-3 text-lg">{area.name}</h2>
        <p className="text-xs italic text-parchment-500">{area.theme}</p>
        <p className="mt-2 text-sm leading-relaxed text-parchment-400">{area.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {area.skillKey && (
            <span className="pill-arcane">
              <Icon name={SKILL_ICONS[area.skillKey] ?? "note"} size={10} />
              Trains {area.skillKey.charAt(0) + area.skillKey.slice(1).toLowerCase()}
            </span>
          )}
          <span className="pill">
            <Icon name="compass" size={10} /> {area.rooms.length} rooms
          </span>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-parchment-500">
            <span>
              {clearedRooms}/{area.rooms.length} rooms cleared
            </span>
            <span className="flex items-center gap-1">
              {area.rooms.slice(0, 8).map((r) => (
                <Icon
                  key={r.id}
                  name={ROOM_ICONS[r.type] ?? "sword"}
                  size={12}
                  className={
                    completedRoomIds.has(r.id) ? "text-emerald-400" : "text-abyss-600"
                  }
                />
              ))}
            </span>
          </div>
          <Meter percent={percent} color={cleared ? "emerald" : "crimson"} />
        </div>
      </div>
    );
    return unlocked ? (
      <Link href={`/dungeon/${area.key}`}>{inner}</Link>
    ) : (
      <div>{inner}</div>
    );
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Dark · Adventurous · Yours to conquer"
        title="The Dungeon"
        subtitle="Connected halls descend beneath the Academy. Each area trains a different craft; each room holds a trial, a puzzle, a curse, or worse."
      />

      <Link
        href="/dungeon/daily"
        className="card-gold mb-6 block p-5 transition-all hover:shadow-glow-strong"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-700/50 bg-abyss-900/60 text-gold-400">
            <Icon name="sun" size={24} />
          </span>
          <div>
            <p className="eyebrow">Daily Dungeon Challenge</p>
            <p className="mt-1 font-display text-lg text-gold-300">
              A fresh trial appears each dawn — bonus XP, and it feeds the Creative Flame.
            </p>
          </div>
          <Icon name="arrow" size={18} className="ml-auto hidden text-gold-600 sm:block" />
        </div>
      </Link>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mainAreas.map((area) => (
          <AreaCard key={area.id} area={area} />
        ))}
      </div>

      <div className="rune-divider mt-10">
        <span className="font-display text-xs uppercase tracking-[0.3em] text-crimson-400">
          Special Dungeons
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {specialAreas.map((area) => (
          <AreaCard key={area.id} area={area} />
        ))}
      </div>
    </div>
  );
}
