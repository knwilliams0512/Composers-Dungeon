import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
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

  // Group by tier for a structured curriculum view.
  const tiers = Array.from(new Set(lessons.map((l) => l.tierRequirement)));

  return (
    <div>
      <SectionHeading
        eyebrow="Scholarly · Structured · Yours to climb"
        title="The Academy of Musical Arts"
        subtitle="Every lesson: learn the concept, study examples, pass the quiz, practice, then compose. Knowledge here becomes power below."
      />
      <div className="space-y-8">
        {tiers.map((tier) => {
          const tierLessons = lessons.filter((l) => l.tierRequirement === tier);
          if (tierLessons.length === 0) return null;
          const info = TIER_INFO[tier as ExperienceTier];
          const tierLocked = tierOrdinal(tier) > userOrdinal + 1;
          return (
            <section key={tier}>
              <div className="rune-divider">
                <span className="font-display text-sm uppercase tracking-[0.25em] text-gold-500">
                  {info?.label ?? tier} {tierLocked && "· 🔒"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tierLessons.map((lesson) => {
                  const p = progressByLesson.get(lesson.id);
                  const done = completedIds.has(lesson.id);
                  const prereqMet =
                    !lesson.prerequisiteId || completedIds.has(lesson.prerequisiteId);
                  const locked = tierLocked || !prereqMet;
                  const card = (
                    <div
                      className={`card h-full p-4 transition-all ${
                        done
                          ? "border-emerald-700/50"
                          : locked
                            ? "opacity-50"
                            : "hover:border-gold-700/60 hover:shadow-glow"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-gold-300">
                          {done ? "✓ " : locked ? "🔒 " : ""}
                          {lesson.title}
                        </p>
                        <span className="shrink-0 rounded border border-abyss-600 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-parchment-500">
                          {CATEGORY_LABELS[lesson.category] ?? lesson.category}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-parchment-400">{lesson.description}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-parchment-500">
                        <span>✦ {lesson.xpReward} XP</span>
                        <span>Difficulty {lesson.difficulty}/10</span>
                        {p && !done && <span className="text-arcane-300">In progress</span>}
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
