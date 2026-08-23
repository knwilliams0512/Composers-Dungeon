import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelFromXp, skillLevelFromXp } from "@/lib/xp";
import { flameAlive } from "@/lib/streak";
import { getRecommendations } from "@/lib/recommendations";
import { Icon, SKILL_ICONS, type IconName } from "@/components/ui/Icon";
import {
  Panel,
  Meter,
  SkillMeter,
  XpRing,
  StatTile,
  EmptyState,
  FlameBadge,
} from "@/components/ui/primitives";
import {
  avatarGlyph,
  TIER_INFO,
  type ExperienceTier,
  SKILL_LABELS,
  type SkillKey,
} from "@/lib/enums";

export const metadata = { title: "The Entrance Hall" };

const REC_META: Record<string, { icon: IconName; label: string }> = {
  LESSON: { icon: "book", label: "Academy" },
  DAILY: { icon: "sun", label: "Daily Challenge" },
  DUNGEON: { icon: "candle", label: "Dungeon" },
};

function timeAgo(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default async function EntranceHallPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [
    profile,
    skills,
    recentAchievements,
    achievementCount,
    achievementTotal,
    recentArtifacts,
    artifactCount,
    artifactTotal,
    activeChallenge,
    currentLessonProgress,
    specializations,
    lessonsDone,
    lessonTotal,
    challengesDone,
    bossesDefeated,
    bossTotal,
    compositionCount,
    recentCompositions,
    recentChallenges,
  ] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    db.userSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { skill: { order: "asc" } },
    }),
    db.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
      take: 4,
    }),
    db.userAchievement.count({ where: { userId } }),
    db.achievement.count(),
    db.userArtifact.findMany({
      where: { userId },
      include: { artifact: true },
      orderBy: { acquiredAt: "desc" },
      take: 4,
    }),
    db.userArtifact.count({ where: { userId } }),
    db.artifact.count(),
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
    db.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
    db.lesson.count(),
    db.userChallenge.count({ where: { userId, status: "COMPLETED" } }),
    db.userBossProgress.count({ where: { userId, defeated: true } }),
    db.boss.count(),
    db.composition.count({ where: { userId } }),
    db.composition.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, createdAt: true, source: true },
    }),
    db.userChallenge.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 3,
      include: { challenge: { select: { title: true, xpReward: true } } },
    }),
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
  const tierLabel =
    TIER_INFO[profile.experienceTier as ExperienceTier]?.label ?? profile.experienceTier;
  const specTitle = specializations.map((s) => s.specialization.name.replace("The ", "")).join(" / ");

  const ranked = [...skills].sort((a, b) => b.xp - a.xp);
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];

  // One merged, time-ordered activity feed beats three separate lists.
  const activity = [
    ...recentChallenges.map((c) => ({
      at: c.completedAt ?? new Date(0),
      icon: "sword" as IconName,
      text: c.challenge.title,
      meta: `+${c.challenge.xpReward} XP`,
    })),
    ...recentCompositions.map((c) => ({
      at: c.createdAt,
      icon: "quill" as IconName,
      text: c.title,
      meta: c.source === "DAILY" ? "daily trial" : c.source.toLowerCase(),
    })),
    ...recentAchievements.map((a) => ({
      at: a.unlockedAt,
      icon: "trophy" as IconName,
      text: a.achievement.name,
      meta: "achievement",
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* ---- Identity banner ------------------------------------------------ */}
      <section className="card-gold lit-edge animate-rise overflow-hidden p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            <div className="relative">
              <XpRing percent={xp.percent} level={xp.level} />
              <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-gold-700/60 bg-abyss-850 text-lg shadow-glow">
                {avatarGlyph(profile.avatar)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="eyebrow">
                <Icon name="hall" size={12} /> The Entrance Hall
              </p>
              <h1 className="heading-display mt-1 truncate text-3xl">{profile.displayName}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-parchment-400">
                <span>{tierLabel}</span>
                {specTitle && (
                  <>
                    <span className="text-abyss-600">·</span>
                    <span className="text-arcane-300">{specTitle}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-parchment-400">
                {xp.intoLevel.toLocaleString()} / {xp.needed.toLocaleString()} XP to level{" "}
                {xp.level + 1}
              </span>
              <span className="tabular-nums text-parchment-500">
                {profile.totalXp.toLocaleString()} total
              </span>
            </div>
            <Meter percent={xp.percent} thick />
            <p className="text-[11px] text-parchment-500">
              {(xp.needed - xp.intoLevel).toLocaleString()} XP remaining — roughly{" "}
              {Math.max(1, Math.ceil((xp.needed - xp.intoLevel) / 120))} more trials at your
              current rate.
            </p>
          </div>

          <FlameBadge
            days={profile.streakCount}
            alive={flame}
            restDays={profile.restDays}
            best={profile.longestStreak}
          />
        </div>
      </section>

      {/* ---- Stats strip ---------------------------------------------------- */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          icon="book"
          label="Lessons"
          value={`${lessonsDone}/${lessonTotal}`}
          hint="Academy"
          href="/academy"
        />
        <StatTile icon="sword" label="Trials won" value={challengesDone} href="/library" />
        <StatTile
          icon="skull"
          label="Bosses felled"
          value={`${bossesDefeated}/${bossTotal}`}
          href="/bosses"
        />
        <StatTile icon="quill" label="Compositions" value={compositionCount} href="/library" />
        <StatTile
          icon="chest"
          label="Artifacts"
          value={`${artifactCount}/${artifactTotal}`}
          href="/library"
        />
        <StatTile
          icon="trophy"
          label="Achievements"
          value={`${achievementCount}/${achievementTotal}`}
          href="/library"
        />
      </section>

      {/* ---- Quick actions -------------------------------------------------- */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/dungeon" className="btn-danger justify-between px-5 py-4 text-base">
          <span className="flex items-center gap-2.5">
            <Icon name="candle" size={20} /> Enter the Dungeon
          </span>
          <Icon name="arrow" size={18} />
        </Link>
        <Link href="/academy" className="btn-primary justify-between px-5 py-4 text-base">
          <span className="flex items-center gap-2.5">
            <Icon name="book" size={20} /> Continue Learning
          </span>
          <Icon name="arrow" size={18} />
        </Link>
      </section>

      {/* ---- Recommendations ------------------------------------------------ */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {recommendations.map((rec) => {
          const meta = REC_META[rec.kind] ?? REC_META.DUNGEON;
          return (
            <Link
              key={rec.href + rec.title}
              href={rec.href}
              className="card-link lit-edge group p-5"
            >
              <p className="eyebrow">
                <Icon name={meta.icon} size={12} /> {meta.label}
              </p>
              <p className="mt-2 font-display text-lg text-gold-300 group-hover:text-gold-200">
                {rec.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-parchment-400">{rec.message}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-parchment-500 transition-colors group-hover:text-gold-400">
                Begin <Icon name="chevron" size={12} />
              </span>
            </Link>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---- Open threads ------------------------------------------------- */}
        <Panel title="Open Threads" icon="compass" subtitle="Everything you have left mid-flight">
          <div className="space-y-3 text-sm">
            {currentLessonProgress ? (
              <Link
                href={`/academy/${currentLessonProgress.lesson.slug}`}
                className="flex items-center gap-3 rounded-lg border border-abyss-600 p-3 transition-colors hover:border-gold-700/60"
              >
                <Icon name="book" size={18} className="text-gold-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-widest text-parchment-500">
                    Lesson in progress
                  </p>
                  <p className="truncate text-parchment-100">
                    {currentLessonProgress.lesson.title}
                  </p>
                </div>
                <Icon name="chevron" size={14} className="text-parchment-500" />
              </Link>
            ) : (
              <EmptyState icon="book">No lesson in progress — the Academy awaits.</EmptyState>
            )}

            {activeChallenge ? (
              <Link
                href={
                  activeChallenge.challenge.room
                    ? `/dungeon/room/${activeChallenge.challenge.room.id}`
                    : "/dungeon/daily"
                }
                className="flex items-center gap-3 rounded-lg border border-crimson-700/50 p-3 transition-colors hover:border-crimson-500"
              >
                <Icon name="sword" size={18} className="text-crimson-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-widest text-parchment-500">
                    Active trial
                    {activeChallenge.challenge.room &&
                      ` · ${activeChallenge.challenge.room.area.name}`}
                  </p>
                  <p className="truncate text-parchment-100">{activeChallenge.challenge.title}</p>
                </div>
                <Icon name="chevron" size={14} className="text-parchment-500" />
              </Link>
            ) : (
              <EmptyState icon="sword">No trial underway. The Dungeon is patient.</EmptyState>
            )}

            <Link
              href="/dungeon/daily"
              className="flex items-center gap-3 rounded-lg border border-gold-700/40 bg-gold-fade p-3 transition-colors hover:border-gold-600"
            >
              <Icon name="sun" size={18} className="text-gold-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-widest text-parchment-500">
                  Daily Dungeon Challenge
                </p>
                <p className="text-gold-300">
                  {flame ? "Keep the flame burning" : "Relight your Creative Flame"}
                </p>
              </div>
              <Icon name="chevron" size={14} className="text-parchment-500" />
            </Link>
          </div>
        </Panel>

        {/* ---- Skills -------------------------------------------------------- */}
        <Panel
          title="Your Skills"
          icon="target"
          subtitle={
            strongest && weakest && strongest.id !== weakest.id
              ? `Strongest: ${SKILL_LABELS[strongest.skill.key as SkillKey] ?? strongest.skill.name} · Weakest: ${SKILL_LABELS[weakest.skill.key as SkillKey] ?? weakest.skill.name}`
              : undefined
          }
          action={
            <Link href="/profile" className="text-xs text-parchment-500 hover:text-gold-300">
              Full profile →
            </Link>
          }
        >
          {skills.length === 0 ? (
            <EmptyState icon="sparkle">
              Complete lessons and trials to awaken your skills.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {skills.map((s) => {
                const p = skillLevelFromXp(s.xp);
                return (
                  <SkillMeter
                    key={s.id}
                    icon={SKILL_ICONS[s.skill.key] ?? "note"}
                    name={SKILL_LABELS[s.skill.key as SkillKey] ?? s.skill.name}
                    level={p.level}
                    percent={p.percent}
                    intoLevel={p.intoLevel}
                    needed={p.needed}
                  />
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---- Activity feed -------------------------------------------------- */}
        <Panel title="Recent Deeds" icon="scroll" subtitle="Your last few marks on the record">
          {activity.length === 0 ? (
            <EmptyState icon="scroll">
              Nothing written yet. Your first lesson starts the chronicle.
            </EmptyState>
          ) : (
            <ol className="relative space-y-4 border-l border-abyss-600/60 pl-5">
              {activity.map((a, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[26px] flex h-5 w-5 items-center justify-center rounded-full border border-abyss-600 bg-abyss-900 text-gold-500">
                    <Icon name={a.icon} size={11} />
                  </span>
                  <p className="text-sm text-parchment-100">{a.text}</p>
                  <p className="text-[11px] text-parchment-500">
                    {a.meta} · {timeAgo(a.at)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        {/* ---- Achievements + artifacts --------------------------------------- */}
        <div className="space-y-6">
          <Panel
            title="Achievements"
            icon="trophy"
            subtitle={`${achievementCount} of ${achievementTotal} unlocked`}
            action={
              <Link
                href="/library?tab=achievements"
                className="text-xs text-parchment-500 hover:text-gold-300"
              >
                All →
              </Link>
            }
          >
            <Meter
              percent={achievementTotal ? (achievementCount / achievementTotal) * 100 : 0}
              className="mb-4"
            />
            {recentAchievements.length === 0 ? (
              <EmptyState icon="trophy">Your first triumph is close at hand.</EmptyState>
            ) : (
              <ul className="space-y-2.5 text-sm">
                {recentAchievements.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg">{a.achievement.icon}</span>
                    <div className="min-w-0">
                      <p className="text-parchment-100">{a.achievement.name}</p>
                      <p className="text-xs text-parchment-500">{a.achievement.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Artifacts"
            icon="chest"
            subtitle={`${artifactCount} of ${artifactTotal} recovered`}
          >
            {recentArtifacts.length === 0 ? (
              <EmptyState icon="chest">
                The Dungeon hides treasures for those who descend.
              </EmptyState>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {recentArtifacts.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-abyss-600/70 bg-abyss-900/40 p-3 text-center transition-colors hover:border-gold-700/60"
                    title={a.artifact.description}
                  >
                    <p className="text-2xl">{a.artifact.icon}</p>
                    <p className="mt-1 text-[11px] leading-tight text-parchment-200">
                      {a.artifact.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
