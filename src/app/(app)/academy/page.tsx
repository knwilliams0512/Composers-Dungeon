import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Icon } from "@/components/ui/Icon";
import { Meter } from "@/components/ui/primitives";
import { categoryTheme, categoryVars } from "@/lib/category-theme";
import { TIER_INFO, tierOrdinal, type ExperienceTier } from "@/lib/enums";

export const metadata = { title: "The Academy of Musical Arts" };

export default async function AcademyPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [profile, lessons, progress] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    db.lesson.findMany({ orderBy: { order: "asc" } }),
    db.lessonProgress.findMany({ where: { userId } }),
  ]);
  if (!profile) redirect("/login");

  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));
  const completedIds = new Set(
    progress.filter((p) => p.status === "COMPLETED").map((p) => p.lessonId)
  );
  const userOrdinal = tierOrdinal(profile.experienceTier);
  const overallPercent = lessons.length ? (completedIds.size / lessons.length) * 100 : 0;
  const inProgress = progress.filter((p) => p.status !== "COMPLETED").length;

  const tiers = Array.from(new Set(lessons.map((l) => l.tierRequirement)));

  return (
    <div>
      <ScrollProgress />

      <SectionHeading
        eyebrow="Scholarly · Structured · Yours to climb"
        icon="book"
        title="The Academy of Musical Arts"
        subtitle="Every lesson: learn the concept, study examples, pass the quiz, practice, then compose. Knowledge here becomes power below."
      />

      {/* ---- Curriculum progress ------------------------------------------ */}
      <section className="card-gold aura lit-edge relative mb-10 overflow-hidden p-6">
        {/* A gilded arc behind the numbers */}
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #c9a84c, transparent 70%)" }}
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="eyebrow">
              <Icon name="book" size={12} /> Curriculum progress
            </p>
            <p className="mt-2 font-display text-4xl leading-none">
              <span className="text-gilded">{completedIds.size}</span>
              <span className="ml-2 text-lg text-parchment-400">of {lessons.length} lessons</span>
            </p>
            <Meter percent={overallPercent} className="mt-4" thick />
            <p className="mt-2 text-xs text-parchment-500">
              {Math.round(overallPercent)}% of the Academy behind you
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2.5 text-center sm:w-72">
            {[
              { n: completedIds.size, label: "Done", cls: "text-emerald2-300", ring: "ring-emerald2-500/30" },
              { n: inProgress, label: "Open", cls: "text-arcane-300", ring: "ring-arcane-500/30" },
              { n: lessons.length - completedIds.size, label: "Left", cls: "text-parchment-300", ring: "ring-white/10" },
            ].map((s) => (
              <div
                key={s.label}
                className={`rounded-xl bg-white/[0.04] px-2 py-3 ring-1 ring-inset backdrop-blur ${s.ring}`}
              >
                <p className={`font-display text-2xl leading-none ${s.cls}`}>{s.n}</p>
                <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-parchment-500">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- The curriculum, tier by tier ---------------------------------- */}
      <div className="space-y-12">
        {tiers.map((tier) => {
          const tierLessons = lessons.filter((l) => l.tierRequirement === tier);
          if (tierLessons.length === 0) return null;
          const info = TIER_INFO[tier as ExperienceTier];
          const tierLocked = tierOrdinal(tier) > userOrdinal + 1;
          const tierDone = tierLessons.filter((l) => completedIds.has(l.id)).length;
          const tierComplete = tierDone === tierLessons.length;

          return (
            <section key={tier}>
              {/* Tier banner */}
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border backdrop-blur ${
                    tierComplete
                      ? "border-emerald2-500/50 bg-emerald2-500/10 text-emerald2-300"
                      : tierLocked
                        ? "border-white/10 bg-white/[0.04] text-parchment-500"
                        : "border-gold-500/50 bg-gold-500/10 text-gold-300"
                  }`}
                >
                  <Icon
                    name={tierComplete ? "check" : tierLocked ? "lock" : "book"}
                    size={19}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg tracking-wide text-parchment-100">
                    {info?.label ?? tier}
                  </h2>
                  {info?.blurb && (
                    <p className="mt-0.5 text-xs leading-relaxed text-parchment-500">
                      {info.blurb}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-abyss-950/80 ring-1 ring-inset ring-white/10">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${(tierDone / tierLessons.length) * 100}%`,
                        background: tierComplete
                          ? "linear-gradient(90deg,#1f6b52,#4dc79a)"
                          : "linear-gradient(90deg,#a8863a,#f0d894)",
                      }}
                    />
                  </div>
                  <span className="font-display text-xs tabular-nums text-parchment-400">
                    {tierDone}/{tierLessons.length}
                  </span>
                </div>
              </div>

              {/* Lesson cards */}
              <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2">
                {tierLessons.map((lesson) => {
                  const p = progressByLesson.get(lesson.id);
                  const done = completedIds.has(lesson.id);
                  const prereqMet =
                    !lesson.prerequisiteId || completedIds.has(lesson.prerequisiteId);
                  const locked = tierLocked || !prereqMet;
                  const theme = categoryTheme(lesson.category);

                  const card = (
                    <article
                      className={`card-accent h-full p-5 ${
                        // A locked lesson steps back, but keeps its subject's
                        // colour: draining it turned a wall of different
                        // subjects into one undifferentiated brown.
                        done ? "border-emerald2-500/40" : locked ? "opacity-75" : ""
                      }`}
                      style={categoryVars(theme)}
                    >
                      <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="flex items-start gap-2 font-display text-[17px] leading-snug text-parchment-100 transition-colors group-hover:text-gold-200">
                            {done && (
                              <Icon
                                name="check"
                                size={16}
                                className="mt-0.5 shrink-0 text-emerald2-400"
                              />
                            )}
                            {locked && (
                              <Icon
                                name="lock"
                                size={15}
                                className="mt-0.5 shrink-0 text-parchment-500"
                              />
                            )}
                            {lesson.title}
                          </h3>
                          <span className="accent-chip">
                            <Icon name={theme.icon} size={10} />
                            {theme.label}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-relaxed text-parchment-400">
                          {lesson.description}
                        </p>

                        {lesson.summary && !locked && (
                          <p className="accent-quote mt-3 line-clamp-2 pl-3 text-[12.5px] leading-relaxed text-parchment-500">
                            {lesson.summary}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-1.5">
                          <span className="pill-gold">
                            <Icon name="sparkle" size={10} /> {lesson.xpReward} XP
                          </span>
                          <span className="pill">
                            <Icon name="clock" size={10} /> {lesson.estimatedMinutes}m
                          </span>
                          <span className="pill">
                            <Icon name="target" size={10} /> {lesson.difficulty}/10
                          </span>
                          {p && !done && (
                            <span className="pill-arcane">
                              <Icon name="compass" size={10} /> In progress
                            </span>
                          )}
                          {done && (
                            <span className="pill-emerald">
                              <Icon name="check" size={10} /> Complete
                            </span>
                          )}
                        </div>

                        {!locked && (
                          <span className="accent-text mt-4 inline-flex items-center gap-1.5 text-xs font-semibold opacity-70 transition-opacity group-hover:opacity-100">
                            {done ? "Revisit" : p ? "Continue" : "Begin"}
                            <Icon name="arrow" size={13} />
                          </span>
                        )}
                      </div>
                    </article>
                  );

                  return locked ? (
                    <div
                      key={lesson.id}
                      title={
                        prereqMet ? "Locked by tier" : "Complete the previous lesson first"
                      }
                    >
                      {card}
                    </div>
                  ) : (
                    <Link
                      key={lesson.id}
                      href={`/academy/${lesson.slug}`}
                      className="group block"
                    >
                      {card}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
