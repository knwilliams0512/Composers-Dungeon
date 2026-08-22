import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
    const inner = (
      <div
        className={`card relative h-full overflow-hidden p-5 transition-all ${
          unlocked ? "hover:border-gold-700/60 hover:shadow-glow" : "opacity-50"
        }`}
      >
        <div className="flex items-start justify-between">
          <p className="text-3xl">{area.icon}</p>
          {!unlocked && (
            <span className="rounded border border-abyss-600 px-2 py-0.5 text-[10px] uppercase tracking-wider text-parchment-500">
              🔒 Level {area.levelRequirement}
            </span>
          )}
        </div>
        <h2 className="heading-display mt-2 text-lg">{area.name}</h2>
        <p className="text-xs italic text-parchment-500">{area.theme}</p>
        <p className="mt-2 text-sm text-parchment-400">{area.description}</p>
        <p className="mt-3 text-xs text-parchment-500">
          {clearedRooms}/{area.rooms.length} rooms cleared ·{" "}
          {area.rooms.map((r) => roomGlyph(r.type)).join(" — ")}
        </p>
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
        <p className="text-xs uppercase tracking-[0.3em] text-parchment-500">
          🌅 Daily Dungeon Challenge
        </p>
        <p className="mt-1 font-display text-lg text-gold-300">
          A fresh trial appears each dawn — bonus XP, and it feeds the Creative Flame.
        </p>
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

function roomGlyph(type: string): string {
  const map: Record<string, string> = {
    CHALLENGE: "⚔️",
    PUZZLE: "🧩",
    CURSE: "🕯️",
    TREASURE: "🗝️",
    REST: "🔥",
    BOSS: "💀",
    EVENT: "✨",
  };
  return map[type] ?? "▫";
}
