import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RARITY_COLORS, type ArtifactRarity } from "@/lib/enums";
import { CompositionCard } from "@/components/library/CompositionCard";
import { NewCompositionForm } from "@/components/library/NewCompositionForm";

export const metadata = { title: "The Library" };

const TABS = [
  { key: "compositions", label: "Compositions", icon: "🖋️" },
  { key: "challenges", label: "Challenge History", icon: "⚔️" },
  { key: "lessons", label: "Completed Lessons", icon: "📖" },
  { key: "bosses", label: "Boss Victories", icon: "💀" },
  { key: "artifacts", label: "Artifacts", icon: "🗝️" },
  { key: "achievements", label: "Achievements", icon: "🏆" },
] as const;

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string; sort?: string; filter?: string };
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const tab = TABS.some((t) => t.key === searchParams.tab)
    ? searchParams.tab!
    : "compositions";
  const q = (searchParams.q ?? "").trim();
  const sort = searchParams.sort === "oldest" ? "asc" : "desc";

  return (
    <div>
      <SectionHeading
        eyebrow="Ancient · Organized · Archival"
        title="The Library"
        subtitle="Everything you have written, solved, defeated, and unearthed — shelved in the dark and waiting."
      />

      {/* Tabs */}
      <nav className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/library?tab=${t.key}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              tab === t.key
                ? "border-gold-600 bg-abyss-700/70 text-gold-300"
                : "border-abyss-600 text-parchment-400 hover:border-gold-700/50"
            }`}
          >
            {t.icon} {t.label}
          </Link>
        ))}
      </nav>

      {/* Search + sort (compositions & challenges) */}
      {(tab === "compositions" || tab === "challenges") && (
        <form className="mb-6 flex flex-wrap gap-2" action="/library" method="get">
          <input type="hidden" name="tab" value={tab} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search titles…"
            className="input max-w-xs flex-1"
          />
          <select name="sort" defaultValue={searchParams.sort ?? "newest"} className="input w-36">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>
      )}

      {tab === "compositions" && <CompositionsTab userId={userId} q={q} sort={sort} />}
      {tab === "challenges" && <ChallengesTab userId={userId} q={q} sort={sort} />}
      {tab === "lessons" && <LessonsTab userId={userId} />}
      {tab === "bosses" && <BossesTab userId={userId} />}
      {tab === "artifacts" && <ArtifactsTab userId={userId} />}
      {tab === "achievements" && <AchievementsTab userId={userId} />}
    </div>
  );
}

async function CompositionsTab({
  userId,
  q,
  sort,
}: {
  userId: string;
  q: string;
  sort: "asc" | "desc";
}) {
  const compositions = await db.composition.findMany({
    where: { userId, ...(q ? { title: { contains: q } } : {}) },
    orderBy: { createdAt: sort },
  });
  return (
    <div className="space-y-6">
      <NewCompositionForm />
      {compositions.length === 0 ? (
        <p className="text-parchment-500">
          No compositions yet{q && " matching that search"}. The blank page is the
          first dungeon.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {compositions.map((c) => (
            <CompositionCard
              key={c.id}
              composition={{
                id: c.id,
                title: c.title,
                description: c.description,
                reflection: c.reflection,
                scoreLink: c.scoreLink,
                visibility: c.visibility,
                source: c.source,
                createdAt: c.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function ChallengesTab({
  userId,
  q,
  sort,
}: {
  userId: string;
  q: string;
  sort: "asc" | "desc";
}) {
  const challenges = await db.userChallenge.findMany({
    where: {
      userId,
      ...(q ? { challenge: { title: { contains: q } } } : {}),
    },
    include: { challenge: { include: { room: { include: { area: true } } } } },
    orderBy: { startedAt: sort },
    take: 100,
  });
  if (challenges.length === 0)
    return <p className="text-parchment-500">No challenges attempted yet.</p>;
  return (
    <ul className="space-y-2">
      {challenges.map((uc) => (
        <li key={uc.id} className="card flex flex-wrap items-center gap-3 p-4 text-sm">
          <span className="text-lg">
            {uc.status === "COMPLETED" ? "✓" : uc.status === "ACTIVE" ? "⚔️" : "✕"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-parchment-100">{uc.challenge.title}</p>
            <p className="text-xs text-parchment-500">
              {uc.challenge.type.toLowerCase()} · difficulty {uc.challenge.difficulty}/10
              {uc.challenge.room && ` · ${uc.challenge.room.area.name}`}
            </p>
          </div>
          <span
            className={`text-xs ${
              uc.status === "COMPLETED"
                ? "text-emerald-300"
                : uc.status === "ACTIVE"
                  ? "text-gold-400"
                  : "text-parchment-500"
            }`}
          >
            {uc.status.toLowerCase()} · ✦ {uc.challenge.xpReward} XP
          </span>
        </li>
      ))}
    </ul>
  );
}

async function LessonsTab({ userId }: { userId: string }) {
  const lessons = await db.lessonProgress.findMany({
    where: { userId, status: "COMPLETED" },
    include: { lesson: true },
    orderBy: { completedAt: "desc" },
  });
  if (lessons.length === 0)
    return <p className="text-parchment-500">No lessons completed yet — the Academy calls.</p>;
  return (
    <ul className="space-y-2">
      {lessons.map((p) => (
        <li key={p.id}>
          <Link
            href={`/academy/${p.lesson.slug}`}
            className="card flex items-center gap-3 p-4 text-sm hover:border-gold-700/50"
          >
            <span>📖</span>
            <div className="flex-1">
              <p className="text-parchment-100">{p.lesson.title}</p>
              <p className="text-xs text-parchment-500">
                Quiz best: {p.bestQuizScore}% · completed{" "}
                {p.completedAt?.toLocaleDateString() ?? ""}
              </p>
            </div>
            <span className="text-xs text-gold-400">✦ {p.lesson.xpReward} XP</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function BossesTab({ userId }: { userId: string }) {
  const victories = await db.userBossProgress.findMany({
    where: { userId, defeated: true },
    include: { boss: true },
    orderBy: { defeatedAt: "desc" },
  });
  if (victories.length === 0)
    return <p className="text-parchment-500">No bosses defeated yet. They are waiting.</p>;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {victories.map((v) => (
        <div key={v.id} className="card border-emerald-700/40 p-5 text-center">
          <p className="text-4xl grayscale">{v.boss.artwork}</p>
          <p className="mt-2 font-display text-gold-300">{v.boss.name}</p>
          <p className="text-xs text-parchment-500">
            Defeated {v.defeatedAt?.toLocaleDateString() ?? ""} · {v.boss.totalHp.toLocaleString()} HP destroyed
          </p>
        </div>
      ))}
    </div>
  );
}

async function ArtifactsTab({ userId }: { userId: string }) {
  const [owned, all] = await Promise.all([
    db.userArtifact.findMany({ where: { userId }, include: { artifact: true } }),
    db.artifact.findMany(),
  ]);
  const ownedIds = new Set(owned.map((o) => o.artifactId));
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {all.map((a) => {
        const isOwned = ownedIds.has(a.id);
        const rarityClass = RARITY_COLORS[a.rarity as ArtifactRarity] ?? "";
        return (
          <div
            key={a.id}
            className={`card border p-4 text-center ${
              isOwned ? rarityClass.split(" ")[1] : "opacity-40"
            }`}
          >
            <p className="text-3xl">{isOwned ? a.icon : "❓"}</p>
            <p className={`mt-2 text-sm font-semibold ${isOwned ? rarityClass.split(" ")[0] : "text-parchment-500"}`}>
              {isOwned ? a.name : "Undiscovered"}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-parchment-500">
              {a.rarity.toLowerCase()}
            </p>
            <p className="mt-1 text-xs text-parchment-400">
              {isOwned ? a.description : a.unlockMethod}
            </p>
          </div>
        );
      })}
    </div>
  );
}

async function AchievementsTab({ userId }: { userId: string }) {
  const [earned, all] = await Promise.all([
    db.userAchievement.findMany({ where: { userId } }),
    db.achievement.findMany(),
  ]);
  const earnedBy = new Map(earned.map((e) => [e.achievementId, e]));
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {all.map((a) => {
        const e = earnedBy.get(a.id);
        return (
          <div key={a.id} className={`card p-4 ${e ? "border-gold-700/50" : "opacity-50"}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{e ? a.icon : "🔒"}</span>
              <div>
                <p className="text-sm font-semibold text-parchment-100">{a.name}</p>
                <p className="text-xs text-parchment-400">{a.description}</p>
                <p className="mt-0.5 text-[10px] text-parchment-500">
                  ✦ {a.xpReward} XP
                  {e && ` · unlocked ${e.unlockedAt.toLocaleDateString()}`}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
