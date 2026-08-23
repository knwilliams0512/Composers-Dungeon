import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Icon } from "@/components/ui/Icon";
import { Meter } from "@/components/ui/primitives";
import { TIER_INFO, tierOrdinal, type ExperienceTier } from "@/lib/enums";

export const metadata = { title: "The Academy of Musical Arts" };

const CATEGORY_LABELS: Record<string, string> = {
  FUNDAMENTALS: "Fundamentals",
  RHYTHM: "Rhythm",
  MELODY: "Melody",
  HARMONY: "Harmony",
  FORM: "Form",
  COUNTERPOINT: "Counterpoint",
  ORCHESTRATION: "Orchestration",
  VIRTUOSO: "Virtuoso Repertoire",
};

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
  const overallPercent = lessons.length
    ? (completedIds.size / lessons.length) * 100
    : 0;

  // Group by tier for a structured curriculum view.
  const tiers = Array.from(new Set(lessons.map((l) => l.tierRequirement)));

  return (
    <div>
      <SectionHeading
        eyebrow="Scholarly · Structured · Yours to climb"
        title="The Academy of Musical Arts"
        subtitle="Every lesson: learn the concept, study examples, pass the quiz, practice, then compose. Knowledge here becomes power below."
      />
      {/* Curriculum progress at a glance */}
      <section className="card-gold lit-edge mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="eyebrow">
            <Icon name="book" size={12} /> Curriculum progress
          </p>
          <p className="mt-1 font-display text-2xl text-gold-300">
            {completedIds.size} <span className="text-base text-parchment-400">of {lessons.length} lessons</span>
          </p>
          <Meter percent={overallPercent} className="mt-3" thick />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center sm:w-64">
          <div className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 px-2 py-2">
            <p className="font-display text-lg text-parchment-100">{completedIds.size}</p>
            <p className="text-[10px] uppercase tracking-widest text-parchment-500">Done</p>
          </div>
          <div className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 px-2 py-2">
            <p className="font-display text-lg text-arcane-300">
              {progress.filter((p) => p.status !== "COMPLETED").length}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-parchment-500">Open</p>
          </div>
          <div className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 px-2 py-2">
            <p className="font-display text-lg text-parchment-400">
              {lessons.length - completedIds.size}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-parchment-500">Left</p>
          </div>
        </div>
      </section>

      <div className="space-y-8">
        {tiers.map((tier) => {
          const tierLessons = lessons.filter((l) => l.tierRequirement === tier);
          if (tierLessons.length === 0) return null;
          const info = TIER_INFO[tier as ExperienceTier];
          const tierLocked = tierOrdinal(tier) > userOrdinal + 1;
          const tierDone = tierLessons.filter((l) => completedIds.has(l.id)).length;
          return (
            <section key={tier}>
              <div className="rune-divider">
                <span className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.25em] text-gold-500">
                  {tierLocked && <Icon name="lock" size={13} />}
                  {info?.label ?? tier}
                  <span className="text-[11px] tracking-normal text-parchment-500">
                    {tierDone}/{tierLessons.length}
                  </span>
                </span>
              </div>
              {info?.blurb && (
                <p className="mb-3 text-center text-xs text-parchment-500">{info.blurb}</p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tierLessons.map((lesson) => {
                  const p = progressByLesson.get(lesson.id);
                  const done = completedIds.has(lesson.id);
                  const prereqMet =
                    !lesson.prerequisiteId || completedIds.has(lesson.prerequisiteId);
                  const locked = tierLocked || !prereqMet;
                  const card = (
                    <div
                      className={`card lit-edge h-full p-4 transition-all ${
                        done
                          ? "border-emerald-700/50"
                          : locked
                            ? "opacity-45"
                            : "hover:-translate-y-0.5 hover:border-gold-700/60 hover:shadow-glow"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex items-center gap-1.5 font-display text-gold-300">
                          {done && <Icon name="check" size={14} className="text-emerald-400" />}
                          {locked && <Icon name="lock" size={13} className="text-parchment-500" />}
                          {lesson.title}
                        </p>
                        <span className="shrink-0 rounded border border-abyss-600 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-parchment-500">
                          {CATEGORY_LABELS[lesson.category] ?? lesson.category}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-parchment-400">
                        {lesson.description}
                      </p>
                      {lesson.summary && !locked && (
                        <p className="mt-2 line-clamp-2 border-l border-abyss-600 pl-2.5 text-[12px] leading-relaxed text-parchment-500">
                          {lesson.summary}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
                      </div>
                    </div>
                  );
                  return locked ? (
                    <div key={lesson.id} title={prereqMet ? "Locked by tier" : "Complete the previous lesson first"}>
                      {card}
                    </div>
                  ) : (
                    <Link key={lesson.id} href={`/academy/${lesson.slug}`}>
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
