import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelFromXp, skillLevelFromXp } from "@/lib/xp";
import { flameAlive } from "@/lib/streak";
import { getRecommendations } from "@/lib/recommendations";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { avatarGlyph, TIER_INFO, type ExperienceTier, SKILL_LABELS, type SkillKey } from "@/lib/enums";

export const metadata = { title: "The Entrance Hall" };

export default async function EntranceHallPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [profile, skills, recentAchievements, recentArtifacts, activeChallenge, currentLessonProgress, specializations] =
    await Promise.all([
      db.userProfile.findUnique({ where: { userId } }),
      db.userSkill.findMany({ where: { userId }, include: { skill: true }, orderBy: { skill: { order: "asc" } } }),
      db.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: "desc" },
        take: 3,
      }),
      db.userArtifact.findMany({
        where: { userId },
        include: { artifact: true },
        orderBy: { acquiredAt: "desc" },
        take: 4,
      }),
      db.userChallenge.findFirst({
        where: { userId, status: "ACTIVE" },
        include: { challenge: { include: { room: { include: { area: true } } } } },
        orderBy: { startedAt: "desc" },
      }),
      db.lessonProgress.findFirst({
        where: { userId, status: "IN_PROGRESS" },
        include: { lesson: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.userSpecialization.findMany({ where: { userId }, include: { specialization: true } }),
    ]);
  if (!profile) redirect("/login");

  const xp = levelFromXp(profile.totalXp);
  const flame = flameAlive({
    streakCount: profile.streakCount,
    longestStreak: profile.longestStreak,
    lastActivityDate: profile.lastActivityDate,
    restDays: profile.restDays,
  });
  const recommendations = await getRecommendations(userId);
  const tierLabel = TIER_INFO[profile.experienceTier as ExperienceTier]?.label ?? profile.experienceTier;
  const specTitle = specializations.map((s) => s.specialization.name.replace("The ", "")).join(" / ");

  return (
    <div className="space-y-6">
      {/* Identity banner */}
      <section className="card-gold flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-gold-600/60 bg-abyss-800 text-3xl shadow-glow">
          {avatarGlyph(profile.avatar)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-parchment-500">
            The Entrance Hall
          </p>
          <h1 className="heading-display truncate text-2xl">{profile.displayName}</h1>
          <p className="text-sm text-parchment-400">
            Level {xp.level} Composer · {tierLabel}
            {specTitle && <span className="text-purple-300"> · {specTitle}</span>}
          </p>
          <ProgressBar
            percent={xp.percent}
            className="mt-2"
            label={`${xp.intoLevel} / ${xp.needed} XP to level ${xp.level + 1} · ${profile.totalXp} total`}
          />
        </div>
        <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
          <div className={`text-center ${flame ? "" : "opacity-50"}`}>
            <p className={`text-2xl ${flame ? "animate-flicker" : "grayscale"}`}>🔥</p>
            <p className="text-xs text-parchment-400">
              {profile.streakCount} day flame
            </p>
            <p className="text-[10px] text-parchment-500">
              {profile.restDays} rest day{profile.restDays === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/dungeon" className="btn-danger justify-between px-5 py-4 text-base">
          <span>🕯️ Enter the Dungeon</span>
          <span aria-hidden>→</span>
        </Link>
        <Link href="/academy" className="btn-primary justify-between px-5 py-4 text-base">
          <span>📖 Continue Learning</span>
          <span aria-hidden>→</span>
        </Link>
      </section>

      {/* What to do next */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {recommendations.map((rec) => (
          <Link key={rec.href + rec.title} href={rec.href} className="card group p-5 transition-all hover:border-gold-700/60 hover:shadow-glow">
            <p className="text-xs uppercase tracking-widest text-parchment-500">
              {rec.kind === "LESSON" ? "📖 Academy" : rec.kind === "DAILY" ? "🌅 Daily Challenge" : "🕯️ Dungeon"}
            </p>
            <p className="mt-1 font-display text-gold-300 group-hover:text-gold-200">{rec.title}</p>
            <p className="mt-1 text-sm text-parchment-400">{rec.message}</p>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Current activities */}
        <section className="card p-5">
          <h2 className="heading-display mb-3 text-lg">Open Threads</h2>
          <div className="space-y-3 text-sm">
            {currentLessonProgress ? (
              <Link href={`/academy/${currentLessonProgress.lesson.slug}`} className="block rounded border border-abyss-600 p-3 hover:border-gold-700/60">
                <p className="text-parchment-500">Current lesson</p>
                <p className="text-parchment-100">📖 {currentLessonProgress.lesson.title}</p>
              </Link>
            ) : (
              <p className="text-parchment-500">No lesson in progress — the Academy awaits.</p>
            )}
            {activeChallenge ? (
              <Link
                href={
                  activeChallenge.challenge.room
                    ? `/dungeon/room/${activeChallenge.challenge.room.id}`
                    : "/dungeon/daily"
                }
                className="block rounded border border-abyss-600 p-3 hover:border-crimson-600/60"
              >
                <p className="text-parchment-500">
                  Current challenge
                  {activeChallenge.challenge.room && ` · ${activeChallenge.challenge.room.area.name}`}
                </p>
                <p className="text-parchment-100">⚔️ {activeChallenge.challenge.title}</p>
              </Link>
            ) : (
              <p className="text-parchment-500">No active dungeon challenge.</p>
            )}
            <Link href="/dungeon/daily" className="block rounded border border-gold-700/40 bg-gold-fade p-3 hover:border-gold-600">
              <p className="text-parchment-500">Daily Dungeon Challenge</p>
              <p className="text-gold-300">🌅 Today&apos;s trial keeps the flame burning</p>
            </Link>
          </div>
        </section>

        {/* Skill summary */}
        <section className="card p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="heading-display text-lg">Your Skills</h2>
            <Link href="/profile" className="text-xs text-parchment-500 hover:text-gold-300">
              Full profile →
            </Link>
          </div>
          <div className="space-y-2.5">
            {skills.length === 0 && (
              <p className="text-sm text-parchment-500">
                Complete lessons and challenges to awaken your skills.
              </p>
            )}
            {skills.map((s) => {
              const p = skillLevelFromXp(s.xp);
              return (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 text-parchment-300">
                    {s.skill.icon} {SKILL_LABELS[s.skill.key as SkillKey] ?? s.skill.name}
                  </span>
                  <span className="w-8 text-right font-display text-gold-400">{p.level}</span>
                  <ProgressBar percent={p.percent} color="arcane" className="flex-1" />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Recent achievements + artifacts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="heading-display mb-3 text-lg">Recent Achievements</h2>
          {recentAchievements.length === 0 ? (
            <p className="text-sm text-parchment-500">Your first triumph is close at hand.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentAchievements.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <span className="text-xl">{a.achievement.icon}</span>
                  <div>
                    <p className="text-parchment-100">{a.achievement.name}</p>
                    <p className="text-xs text-parchment-500">{a.achievement.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-5">
          <h2 className="heading-display mb-3 text-lg">Recently Unlocked Artifacts</h2>
          {recentArtifacts.length === 0 ? (
            <p className="text-sm text-parchment-500">
              The Dungeon hides treasures for those who descend.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {recentArtifacts.map((a) => (
                <div key={a.id} className="rounded border border-abyss-600 p-3 text-center">
                  <p className="text-2xl">{a.artifact.icon}</p>
                  <p className="mt-1 text-xs text-parchment-200">{a.artifact.name}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
