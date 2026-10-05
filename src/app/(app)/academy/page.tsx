import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Icon } from "@/components/ui/Icon";
import { Meter } from "@/components/ui/primitives";
import { categoryTheme, categoryVars } from "@/lib/category-theme";
import { tierOrdinal } from "@/lib/enums";
import { effectiveTier } from "@/lib/tier";
import { CURRICULUM, CRAFT_SLUGS, unitForSlug } from "@/lib/curriculum";
import { lessonOpen, roadmapProgress, unitOpen } from "@/lib/unit-gate";

export const metadata = { title: "The Academy of Musical Arts" };

export default async function AcademyPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [profile, lessons, progress, examAttempts] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    db.lesson.findMany({ orderBy: { order: "asc" } }),
    db.lessonProgress.findMany({ where: { userId } }),
    db.unitExamAttempt.findMany({
      where: { userId },
      select: { unit: true, passed: true, score: true },
    }),
  ]);
  if (!profile) redirect("/login");

  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));
  // Which units have been passed — the thing that actually opens the roadmap.
  const unitsPassed = new Set(examAttempts.filter((a) => a.passed).map((a) => a.unit));
  const bestByUnit = new Map<string, number>();
  for (const attempt of examAttempts) {
    const best = bestByUnit.get(attempt.unit) ?? 0;
    if (attempt.score > best) bestByUnit.set(attempt.unit, attempt.score);
  }
  const roadmap = roadmapProgress(unitsPassed);
  const completedIds = new Set(
    progress.filter((p) => p.status === "COMPLETED").map((p) => p.lessonId)
  );
  // The declared tier is where someone started, not a ceiling: a lesson they
  // have earned their way to never stays locked because of an answer they
  // gave during onboarding. See @/lib/tier.
  const userOrdinal = tierOrdinal(
    effectiveTier(profile.experienceTier, completedIds.size)
  );
  const overallPercent = lessons.length ? (completedIds.size / lessons.length) * 100 : 0;

  // The Academy is presented as the roadmap, not as a flat list sorted by
  // difficulty. "Difficulty 6" is not a place anyone recognises; "Level 3,
  // unit 3.4" is somewhere you can say you are, and come back to.
  const bySlug = new Map(lessons.map((l) => [l.slug, l]));
  const craftLessons = (CRAFT_SLUGS as readonly string[])
    .map((slug) => bySlug.get(slug))
    .filter((l): l is (typeof lessons)[number] => Boolean(l));

  return (
    <div>
      <ScrollProgress />

      <SectionHeading
        eyebrow="Scholarly · Structured · Yours to climb"
        icon="book"
        title="The Academy of Musical Arts"
        subtitle="Every lesson: learn the concept, study examples, pass the quiz, practice, then compose. Knowledge here becomes power below."
        accent="#4f7fd4"
        motif="book"
        aside={
          <div className="grid grid-cols-3 gap-2.5 text-center lg:w-72">
            {[
              // Units passed first: the exams are what actually move you
              // through the roadmap, so that is the number that answers
              // "how far along am I".
              {
                n: `${roadmap.cleared}/${roadmap.total}`,
                label: "Units passed",
                cls: "text-gold-300",
                ring: "ring-gold-500/30",
              },
              { n: completedIds.size, label: "Lessons done", cls: "text-emerald2-300", ring: "ring-emerald2-500/30" },
              {
                n: lessons.length - completedIds.size,
                label: "Left",
                cls: "text-parchment-300",
                ring: "ring-white/10",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`rounded-xl bg-white/[0.05] px-4 py-3 ring-1 ring-inset backdrop-blur ${s.ring}`}
              >
                <p className={`font-display text-2xl leading-none ${s.cls}`}>{s.n}</p>
                <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-parchment-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        }
        footer={
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="font-display text-2xl leading-none">
                <span className="text-gilded">{completedIds.size}</span>
                <span className="ml-2 text-base text-parchment-400">
                  of {lessons.length} lessons
                </span>
              </p>
              <p className="text-xs text-parchment-400">
                {Math.round(overallPercent)}% of the Academy behind you
              </p>
            </div>
            <Meter percent={overallPercent} thick />
          </div>
        }
      />

      {/* ---- The roadmap, level by level ----------------------------------- */}
      <div className="space-y-14">
        {CURRICULUM.map((level) => {
          const levelLessons = level.units.flatMap((u) =>
            u.slugs.map((slug) => bySlug.get(slug)).filter(Boolean)
          ) as typeof lessons;
          if (levelLessons.length === 0) return null;
          const levelDone = levelLessons.filter((l) => completedIds.has(l.id)).length;
          const levelComplete = levelDone === levelLessons.length;

          return (
            <section key={level.level}>
              {/* Level banner */}
              <div
                className="mb-5 rounded-2xl border p-5"
                style={{
                  borderColor: `color-mix(in srgb, ${level.accent} 40%, transparent)`,
                  background: `linear-gradient(150deg, color-mix(in srgb, ${level.accent} 18%, #0b0916), #0b0916 70%)`,
                }}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: `color-mix(in srgb, ${level.accent} 60%, transparent)`,
                      background: `color-mix(in srgb, ${level.accent} 24%, #0b0916)`,
                      color: `color-mix(in srgb, ${level.accent} 88%, white)`,
                    }}
                  >
                    <Icon name={levelComplete ? "check" : level.icon as never} size={22} solid />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                      style={{ color: `color-mix(in srgb, ${level.accent} 82%, white)` }}
                    >
                      Level {level.level}
                    </p>
                    <h2 className="font-display text-xl leading-tight text-parchment-100">
                      {level.name}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-parchment-300">
                      {level.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-abyss-950/80 ring-1 ring-inset ring-white/10">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{
                          width: `${(levelDone / levelLessons.length) * 100}%`,
                          background: levelComplete
                            ? "linear-gradient(90deg,#35b88c,#9ff0cb)"
                            : `linear-gradient(90deg, ${level.accent}, color-mix(in srgb, ${level.accent} 60%, white))`,
                        }}
                      />
                    </div>
                    <span className="font-display text-xs tabular-nums text-parchment-300">
                      {levelDone}/{levelLessons.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Units within the level */}
              <div className="space-y-7">
                {level.units.map((unit) => {
                  const unitLessons = unit.slugs
                    .map((slug) => bySlug.get(slug))
                    .filter(Boolean) as typeof lessons;
                  if (unitLessons.length === 0) return null;
                  const unitDone = unitLessons.every((l) => completedIds.has(l.id));
                  const examPassed = unitsPassed.has(unit.unit);
                  const open = unitOpen(unit.unit, unitsPassed);
                  const bestScore = bestByUnit.get(unit.unit);
                  return (
                    <div key={unit.unit}>
                      <div className="mb-3 flex items-baseline gap-2.5">
                        <span
                          className="font-display text-sm tabular-nums"
                          style={{ color: `color-mix(in srgb, ${level.accent} 85%, white)` }}
                        >
                          {unit.unit}
                        </span>
                        <h3 className="font-display text-base text-parchment-100">
                          {unit.title}
                        </h3>
                        {examPassed ? (
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald2-300">
                            <Icon name="check" size={13} /> Passed
                          </span>
                        ) : unitDone ? (
                          <Icon name="check" size={14} className="text-emerald2-400" />
                        ) : null}
                      </div>
                      <p className="mb-3 text-[13px] leading-relaxed text-parchment-400">
                        {unit.blurb}
                      </p>

                      {/* The exam is the gate, so it is shown as one — above
                          the lessons rather than buried under them, because
                          somebody who already knows this unit should see the
                          way past it before they see the way through it. */}
                      <Link
                        href={`/academy/exam/${unit.unit}`}
                        className={`mb-4 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 transition ${
                          examPassed
                            ? "border-emerald2-500/40 bg-emerald2-500/5 hover:border-emerald2-400/60"
                            : open
                              ? "border-gold-600/50 bg-gold-500/5 hover:border-gold-500/70"
                              : "border-abyss-600/60 bg-abyss-900/40 opacity-70"
                        }`}
                      >
                        <Icon
                          name={examPassed ? "check" : open ? "target" : "lock"}
                          size={16}
                          className={
                            examPassed
                              ? "shrink-0 text-emerald2-300"
                              : open
                                ? "shrink-0 text-gold-400"
                                : "shrink-0 text-parchment-600"
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-parchment-100">
                            {examPassed
                              ? `Unit ${unit.unit} exam passed`
                              : open
                                ? `Unit ${unit.unit} exam`
                                : `Unit ${unit.unit} exam — locked`}
                          </p>
                          <p className="text-xs text-parchment-500">
                            {examPassed
                              ? `The lessons below are optional${
                                  bestScore ? ` · best ${bestScore}%` : ""
                                }`
                              : open
                                ? "Pass it to skip this unit and open the next — you do not have to read the lessons first"
                                : "Pass the unit before this one to open it"}
                          </p>
                        </div>
                        {open && (
                          <span className="shrink-0 text-xs text-gold-300">
                            {examPassed ? "Sit again" : "Take it"} →
                          </span>
                        )}
                      </Link>

                      <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2">
                        {renderLessons(unitLessons)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Craft sits beside the roadmap rather than inside it: you can know
            every unit of Level 4 and still not know how to start a tune. */}
        {craftLessons.length > 0 && (
          <section>
            <div className="mb-5 rounded-2xl border border-emerald2-500/40 bg-gradient-to-br from-emerald2-500/15 to-transparent p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald2-400/60 bg-emerald2-500/20 text-emerald2-200">
                  <Icon name="quill" size={22} solid />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald2-300">
                    Alongside the roadmap
                  </p>
                  <h2 className="font-display text-xl leading-tight text-parchment-100">
                    The Composer&apos;s Craft
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-parchment-300">
                    How to write, rather than how music works. Take these whenever
                    you like — they do not assume a level.
                  </p>
                </div>
              </div>
            </div>
            <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderLessons(craftLessons)}
            </div>
          </section>
        )}
      </div>
    </div>
  );

  function renderLessons(list: typeof lessons) {
    return (
      <>
        {list.map((lesson) => {
          const p = progressByLesson.get(lesson.id);
          const done = completedIds.has(lesson.id);
          // The unit exam is the gate between units now, so a prerequisite is
          // only honoured inside a unit. Across a boundary it would undo the
          // skip: pass the 1.4 exam without reading 1.4, and 1.5's first
          // lesson would still be waiting on a lesson you were excused from.
          const myUnit = unitForSlug(lesson.slug);
          const prereqLesson = lesson.prerequisiteId
            ? lessons.find((l) => l.id === lesson.prerequisiteId)
            : null;
          const prereqSameUnit =
            prereqLesson && myUnit
              ? unitForSlug(prereqLesson.slug)?.unit === myUnit.unit
              : false;
          const prereqMet = !prereqSameUnit || completedIds.has(lesson.prerequisiteId!);
          // Lessons are grouped by roadmap level now rather than by experience
          // tier, so each one carries its own tier gate instead of inheriting
          // one from the section it happened to sit in.
          const tierLocked = tierOrdinal(lesson.tierRequirement) > userOrdinal + 1;
          const unitLocked = !lessonOpen(lesson.slug, unitsPassed);
          const locked = tierLocked || !prereqMet || unitLocked;
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
                prereqMet
                  ? "Your experience tier does not reach this yet"
                  : "Complete the previous lesson first"
              }
            >
              {card}
            </div>
          ) : (
            <Link key={lesson.id} href={`/academy/${lesson.slug}`} className="group block">
              {card}
            </Link>
          );
        })}
      </>
    );
  }
}
