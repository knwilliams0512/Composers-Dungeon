import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelFromXp, skillLevelFromXp } from "@/lib/xp";
import { flameAlive } from "@/lib/streak";
import { getRecommendations } from "@/lib/recommendations";
import { Icon, SKILL_ICONS, type IconName } from "@/components/ui/Icon";
import { Motif, type MotifName } from "@/components/ui/Motif";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { skillTheme } from "@/lib/category-theme";
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

const REC_META: Record<
  string,
  { icon: IconName; label: string; accent: string; motif: MotifName; cta: string }
> = {
  LESSON: { icon: "book", label: "Academy", accent: "#4f7fd4", motif: "keys", cta: "Begin lesson" },
  DAILY: { icon: "sun", label: "Daily Challenge", accent: "#e0b53c", motif: "candle", cta: "Start challenge" },
  DUNGEON: { icon: "candle", label: "Dungeon", accent: "#d4455f", motif: "arch", cta: "Enter" },
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
      <ScrollProgress />

      {/* ---- Identity banner ------------------------------------------------ */}
      <section className="card-gold aura lit-edge animate-rise relative overflow-hidden p-7">
        {/* Twin auroras behind the identity block */}
        <div
          className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #c9a84c, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #9358c9, transparent 70%)" }}
        />
        {/* A page of music behind the name, where a photograph would sit. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/3 opacity-[0.28] sm:block">
          <Motif name="sheet" tint="#e3c26d" opacity={1} />
        </div>
        <div className="relative space-y-6">
          {/* Who you are, and how the flame is doing — one line at the top. */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-5">
              <div className="relative shrink-0">
                <XpRing percent={xp.percent} level={xp.level} />
                <span className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border border-gold-500/60 bg-abyss-900/90 text-lg shadow-[0_0_18px_-2px_rgba(201,168,76,0.8)] backdrop-blur">
                  {avatarGlyph(profile.avatar)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="eyebrow">
                  <Icon name="hall" size={12} /> The Entrance Hall
                </p>
                <h1 className="text-gilded mt-1 truncate font-display text-3xl leading-tight sm:text-4xl">
                  {profile.displayName}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-parchment-400">
                  <span className="text-parchment-300">Composer in Progress</span>
                  <span className="text-parchment-600">·</span>
                  <span>{tierLabel}</span>
                  {specTitle && (
                    <span className="pill-arcane">
                      <Icon name="star" size={10} /> {specTitle}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <FlameBadge
              days={profile.streakCount}
              alive={flame}
              restDays={profile.restDays}
              best={profile.longestStreak}
            />

            {/* What the whole app is for, in the order you meet it. */}
            <ul className="hidden shrink-0 flex-col gap-1 border-l border-gold-700/30 pl-5 text-right xl:flex">
              {["Create", "Practice", "Explore", "Ascend"].map((word) => (
                <li
                  key={word}
                  className="font-display text-[15px] italic leading-tight text-gold-300/85"
                >
                  {word}
                </li>
              ))}
            </ul>
          </div>

          {/* The climb to the next level, given the full width beneath. */}
          <div className="space-y-2.5 border-t border-gold-700/20 pt-5">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <div className="min-w-0">
                <p className="font-display text-lg leading-none text-parchment-100">
                  <span className="tabular-nums text-gold-300">
                    {xp.intoLevel.toLocaleString()}
                  </span>
                  <span className="text-parchment-400"> / {xp.needed.toLocaleString()}</span>
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-parchment-400">
                  XP to level {xp.level + 1}
                </p>
              </div>
              <p className="text-[11px] leading-relaxed text-parchment-400">
                {(xp.needed - xp.intoLevel).toLocaleString()} XP remaining — roughly{" "}
                {Math.max(1, Math.ceil((xp.needed - xp.intoLevel) / 120))} more trials at your
                current rate.
              </p>
              <div className="shrink-0 text-right">
                <p className="font-display text-lg leading-none tabular-nums text-parchment-300">
                  {profile.totalXp.toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-parchment-400">
                  total
                </p>
              </div>
            </div>
            <Meter percent={xp.percent} thick />
          </div>
        </div>
      </section>

      {/* ---- Stats strip ---------------------------------------------------- */}
      <section className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          icon="book"
          label="Lessons"
          value={`${lessonsDone}/${lessonTotal}`}
          hint="Academy"
          href="/academy"
          accent="#4f7fd4"
          motif="book"
          linkLabel="Academy"
        />
        <StatTile
          icon="sword"
          label="Trials won"
          value={challengesDone}
          href="/library"
          accent="#d4455f"
          motif="arch"
          linkLabel="Dungeon"
        />
        <StatTile
          icon="skull"
          label="Bosses felled"
          value={`${bossesDefeated}/${bossTotal}`}
          href="/bosses"
          accent="#e0803a"
          motif="crown"
          linkLabel="Bosses"
        />
        <StatTile
          icon="quill"
          label="Compositions"
          value={compositionCount}
          href="/library"
          accent="#2fb37f"
          motif="sheet"
          linkLabel="Studio"
        />
        <StatTile
          icon="chest"
          label="Artifacts"
          value={`${artifactCount}/${artifactTotal}`}
          href="/library"
          accent="#9358c9"
          motif="crystal"
          linkLabel="Workshop"
        />
        <StatTile
          icon="trophy"
          label="Achievements"
          value={`${achievementCount}/${achievementTotal}`}
          href="/library"
          accent="#e0b53c"
          motif="trophy"
          linkLabel="View all"
        />
      </section>

      {/* ---- Quick actions -------------------------------------------------- */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/dungeon" className="btn-danger justify-between px-5 py-3.5 text-left">
          <span className="flex items-center gap-3">
            <Icon name="candle" size={22} />
            <span className="flex flex-col leading-tight">
              <span className="text-base">Enter the Dungeon</span>
              <span className="text-[11px] font-normal normal-case tracking-normal opacity-75">
                Face challenges. Grow stronger.
              </span>
            </span>
          </span>
          <Icon name="arrow" size={18} />
        </Link>
        <Link href="/academy" className="btn-primary justify-between px-5 py-3.5 text-left">
          <span className="flex items-center gap-3">
            <Icon name="book" size={22} />
            <span className="flex flex-col leading-tight">
              <span className="text-base">Continue Learning</span>
              <span className="text-[11px] font-normal normal-case tracking-normal opacity-75">
                Pick up where you left off.
              </span>
            </span>
          </span>
          <Icon name="arrow" size={18} />
        </Link>
      </section>

      {/* ---- Recommendations ------------------------------------------------ */}
      <section className="stagger grid grid-cols-1 gap-4 lg:grid-cols-3">
        {recommendations.map((rec) => {
          const meta = REC_META[rec.kind] ?? REC_META.DUNGEON;
          return (
            <Link
              key={rec.href + rec.title}
              href={rec.href}
              className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                borderColor: `color-mix(in srgb, ${meta.accent} 34%, transparent)`,
                backgroundImage: `linear-gradient(150deg, color-mix(in srgb, ${meta.accent} 24%, transparent) 0%, color-mix(in srgb, ${meta.accent} 8%, transparent) 45%, rgba(10,8,16,0.6) 100%)`,
              }}
            >
              <Motif name={meta.motif} tint={meta.accent} opacity={0.36} />
              <span
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(100deg, rgba(8,6,14,0.86) 0%, rgba(8,6,14,0.6) 45%, transparent 82%)",
                }}
              />
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }}
              />

              <p
                className="relative flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: `color-mix(in srgb, ${meta.accent} 30%, white)` }}
              >
                <Icon name={meta.icon} size={12} /> {meta.label}
              </p>
              <p className="relative mt-2 font-display text-xl text-parchment-100">{rec.title}</p>
              <p className="relative mt-1.5 text-sm leading-relaxed text-parchment-300">
                {rec.message}
              </p>
              <span
                className="relative mt-4 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  borderColor: `color-mix(in srgb, ${meta.accent} 50%, transparent)`,
                  background: `color-mix(in srgb, ${meta.accent} 18%, transparent)`,
                  color: `color-mix(in srgb, ${meta.accent} 25%, white)`,
                }}
              >
                {meta.cta}
                <Icon
                  name="arrow"
                  size={12}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
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
                    accent={skillTheme(s.skill.key).hex}
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
