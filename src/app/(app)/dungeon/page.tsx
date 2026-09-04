import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Icon, ROOM_ICONS, SKILL_ICONS } from "@/components/ui/Icon";
import { Meter, DangerRating } from "@/components/ui/primitives";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { skillTheme, categoryVars } from "@/lib/category-theme";
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
    const theme = skillTheme(area.skillKey);
    const inner = (
      <div
        className={`card-accent h-full p-5 ${
          unlocked ? "" : "opacity-70"
        } ${cleared ? "border-emerald2-500/40" : ""}`}
        style={categoryVars(theme)}
      >
        <div className="relative flex items-start justify-between gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-3xl leading-none backdrop-blur transition-transform duration-300 group-hover:scale-110"
            style={{
              borderColor: `color-mix(in srgb, ${theme.hex} 45%, transparent)`,
              background: `color-mix(in srgb, ${theme.hex} 12%, rgba(12,10,20,0.7))`,
            }}
          >
            {area.icon}
          </span>
          <div className="flex flex-col items-end gap-1.5">
            <DangerRating level={area.dangerRating} />
            {!unlocked ? (
              <span className="pill">
                <Icon name="lock" size={10} /> Level {area.levelRequirement}
              </span>
            ) : cleared ? (
              <span className="pill-emerald">
                <Icon name="check" size={10} /> Cleared
              </span>
            ) : null}
          </div>
        </div>

        <h2 className="relative mt-4 font-display text-xl leading-snug text-parchment-100">
          {area.name}
        </h2>
        <p className="accent-text relative text-xs italic opacity-80">{area.theme}</p>
        <p className="relative mt-2 text-sm leading-relaxed text-parchment-400">
          {area.description}
        </p>

        <div className="relative mt-3.5 flex flex-wrap items-center gap-1.5">
          {area.skillKey && (
            <span className="accent-chip">
              <Icon name={SKILL_ICONS[area.skillKey] ?? "note"} size={10} />
              Trains {theme.label}
            </span>
          )}
          <span className="pill">
            <Icon name="compass" size={10} /> {area.rooms.length} rooms
          </span>
        </div>

        <div className="relative mt-4">
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
                  className={completedRoomIds.has(r.id) ? "text-emerald2-400" : "text-white/15"}
                />
              ))}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-abyss-950/80 ring-1 ring-inset ring-white/10">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{
                width: `${percent}%`,
                background: cleared
                  ? "linear-gradient(90deg,#1f6b52,#4dc79a)"
                  : `linear-gradient(90deg, ${theme.deep}, ${theme.hex}, ${theme.light})`,
                boxShadow: `0 0 12px -2px ${theme.hex}`,
              }}
            />
          </div>
        </div>
      </div>
    );
    return unlocked ? (
      <Link href={`/dungeon/${area.key}`} className="group block">
        {inner}
      </Link>
    ) : (
      <div>{inner}</div>
    );
  }

  return (
    <div>
      <ScrollProgress />
      <SectionHeading
        eyebrow="Dark · Adventurous · Yours to conquer"
        icon="candle"
        title="The Dungeon"
        subtitle="Connected halls descend beneath the Academy. Each area trains a different craft; each room holds a trial, a puzzle, a curse, or worse."
      />

      <Link
        href="/dungeon/daily"
        className="card-gold aura group relative mb-8 block overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
          style={{ background: "radial-gradient(circle, #e3c26d, transparent 70%)" }}
        />
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold-500/50 bg-gold-500/10 text-gold-300 backdrop-blur transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
            <Icon name="sun" size={26} />
          </span>
          <div>
            <p className="eyebrow">Daily Dungeon Challenge</p>
            <p className="text-gilded mt-1 font-display text-xl">
              A fresh trial appears each dawn
            </p>
            <p className="mt-0.5 text-sm text-parchment-400">
              Bonus XP, and it feeds the Creative Flame.
            </p>
          </div>
          <Icon
            name="arrow"
            size={20}
            className="ml-auto hidden text-gold-500 transition-transform duration-300 group-hover:translate-x-1.5 sm:block"
          />
        </div>
      </Link>

      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mainAreas.map((area) => (
          <AreaCard key={area.id} area={area} />
        ))}
      </div>

      <div className="rune-divider mt-10">
        <span className="font-display text-xs uppercase tracking-[0.3em] text-crimson-400">
          Special Dungeons
        </span>
      </div>
      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {specialAreas.map((area) => (
          <AreaCard key={area.id} area={area} />
        ))}
      </div>
    </div>
  );
}
