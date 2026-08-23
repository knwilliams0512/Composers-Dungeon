import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { LessonFlow } from "@/components/academy/LessonFlow";
import { Icon, SKILL_ICONS } from "@/components/ui/Icon";
import { Callout, Panel } from "@/components/ui/primitives";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { categoryTheme, categoryVars } from "@/lib/category-theme";
import { briefForLesson } from "@/lib/lesson-brief";
import { cappedFreedom, freedomForPlayer } from "@/lib/composer-freedom";

type Section = {
  heading: string;
  body: string;
  example?: string;
  callout?: { kind: "note" | "warning" | "insight"; text: string };
};

/** Parses a JSON column that may be null, without throwing on bad data. */
function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default async function LessonPage({ params }: { params: { slug: string } }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const lesson = await db.lesson.findUnique({
    where: { slug: params.slug },
    include: {
      quiz: { include: { questions: true } },
      exercises: { orderBy: { order: "asc" } },
      skillRewards: { include: { skill: true } },
      prerequisite: true,
      unlocks: { orderBy: { order: "asc" }, take: 1 },
    },
  });
  if (!lesson) notFound();

  // Enforce prerequisite server-side.
  if (lesson.prerequisiteId) {
    const prereqDone = await db.lessonProgress.findFirst({
      where: { userId, lessonId: lesson.prerequisiteId, status: "COMPLETED" },
    });
    if (!prereqDone) {
      return (
        <div className="card-gold mx-auto max-w-lg p-8 text-center">
          <Icon name="lock" size={36} className="mx-auto text-gold-600" />
          <h1 className="heading-display mt-3 text-xl">This Door Is Sealed</h1>
          <p className="mt-2 text-parchment-400">
            Complete <strong className="text-parchment-100">{lesson.prerequisite?.title}</strong>{" "}
            first.
          </p>
          <Link href={`/academy/${lesson.prerequisite?.slug}`} className="btn-primary mt-5">
            Go There <Icon name="arrow" size={15} />
          </Link>
        </div>
      );
    }
  }

  const progress = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  });
  if (!progress) {
    await db.lessonProgress.create({ data: { userId, lessonId: lesson.id } });
  }

  const content = (parseJson<Section[]>(lesson.content) ?? []) as Section[];
  const keyTerms = parseJson<{ term: string; definition: string }[]>(lesson.keyTerms) ?? [];
  const mistakes = parseJson<{ mistake: string; fix: string }[]>(lesson.commonMistakes) ?? [];
  const listening =
    parseJson<{ piece: string; composer: string; why: string }[]>(lesson.listening) ?? [];
  const routine = parseJson<string[]>(lesson.practiceRoutine) ?? [];

  const quizQuestions =
    lesson.quiz?.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      choices: JSON.parse(q.choices) as string[],
    })) ?? [];

  const brief = briefForLesson(lesson);
  const [playerProfile, lessonsCompleted] = await Promise.all([
    db.userProfile.findUnique({ where: { userId }, select: { level: true } }),
    db.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
  ]);
  const freedom = cappedFreedom(
    freedomForPlayer(playerProfile?.level ?? 1, lessonsCompleted),
    brief.freedomCap
  );

  const practice = lesson.exercises.filter((e) => e.type === "PRACTICE");
  const composition = lesson.exercises.find((e) => e.type === "COMPOSITION");
  const done = progress?.status === "COMPLETED";
  const theme = categoryTheme(lesson.category);

  return (
    <div className="mx-auto max-w-3xl" style={categoryVars(theme)}>
      <ScrollProgress />
      <Link
        href="/academy"
        className="inline-flex items-center gap-1.5 text-sm text-parchment-500 transition-colors hover:text-gold-300"
      >
        <Icon name="chevron" size={13} className="rotate-180" /> Back to the Academy
      </Link>

      {/* ---- Header ---------------------------------------------------------- */}
      <header className="card lit-edge relative mt-3 overflow-hidden p-7">
        {/* Category light washing the header */}
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: `radial-gradient(circle, ${theme.hex}, transparent 70%)` }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${theme.hex}, transparent)` }}
        />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="accent-chip">
              <Icon name={theme.icon} size={11} />
              {theme.label}
            </span>
            <span className="pill-gold">
              <Icon name="sparkle" size={11} /> {lesson.xpReward} XP
            </span>
            <span className="pill">
              <Icon name="clock" size={11} /> ~{lesson.estimatedMinutes} min
            </span>
            <span className="pill">
              <Icon name="target" size={11} /> Difficulty {lesson.difficulty}/10
            </span>
            {done && (
              <span className="pill-emerald">
                <Icon name="check" size={11} /> Completed
              </span>
            )}
          </div>

          <h1 className="text-gilded mt-4 font-display text-4xl leading-tight text-balance">
            {lesson.title}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-parchment-400">
            {lesson.description}
          </p>

          {lesson.summary && (
            <div className="accent-quote mt-5 rounded-r-lg bg-white/[0.03] py-3 pl-4 pr-3">
              <p className="eyebrow mb-1.5">
                <Icon name="compass" size={11} /> What you walk away with
              </p>
              <p className="text-sm leading-relaxed text-parchment-200">{lesson.summary}</p>
            </div>
          )}

        {lesson.skillRewards.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-parchment-500">
              Trains
            </span>
            {lesson.skillRewards.map((r) => (
              <span key={r.id} className="pill-arcane">
                <Icon name={SKILL_ICONS[r.skill.key] ?? "note"} size={11} />
                {r.skill.name} +{r.xp}
              </span>
            ))}
            </div>
          )}
        </div>
      </header>

      {/* ---- Key terms ------------------------------------------------------- */}
      {keyTerms.length > 0 && (
        <Panel title="Vocabulary" icon="scroll" className="mt-6">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {keyTerms.map((t) => (
              <div
                key={t.term}
                className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5 backdrop-blur transition-colors hover:border-white/15"
              >
                <dt className="accent-text font-display text-sm">{t.term}</dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-parchment-400">
                  {t.definition}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}

      {/* ---- The lesson ------------------------------------------------------ */}
      {/* A numbered rail runs down the left of the whole reading section, so a
          long lesson reads as a descent rather than a stack of boxes. */}
      <div className="prose-lesson relative mt-8 space-y-5 pl-11 before:absolute before:bottom-6 before:left-[18px] before:top-6 before:w-px before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {content.map((section, i) => (
          <section key={section.heading} className="card group relative p-6">
            {/* Numbered node on the rail */}
            <span
              className="absolute -left-11 top-6 flex h-9 w-9 items-center justify-center rounded-full border font-display text-xs backdrop-blur transition-all duration-300 group-hover:scale-110"
              style={{
                borderColor: `color-mix(in srgb, ${theme.hex} 55%, transparent)`,
                background: `color-mix(in srgb, ${theme.hex} 14%, rgba(12,10,20,0.9))`,
                color: theme.light,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            <h2 className="font-display text-xl leading-snug text-parchment-100">
              {section.heading}
            </h2>
            <p className="mt-2.5">{section.body}</p>

            {section.example && (
              <figure
                className="mt-4 overflow-hidden rounded-xl border bg-abyss-950/70 backdrop-blur"
                style={{ borderColor: `color-mix(in srgb, ${theme.hex} 35%, transparent)` }}
              >
                <figcaption
                  className="flex items-center gap-1.5 border-b px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{
                    borderColor: `color-mix(in srgb, ${theme.hex} 25%, transparent)`,
                    background: `color-mix(in srgb, ${theme.hex} 10%, transparent)`,
                    color: theme.light,
                  }}
                >
                  <Icon name="note" size={11} /> Example
                </figcaption>
                <p className="px-3.5 py-3 font-mono text-sm leading-relaxed text-gold-200">
                  {section.example}
                </p>
              </figure>
            )}

            {section.callout && (
              <div className="mt-4">
                <Callout kind={section.callout.kind}>{section.callout.text}</Callout>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* ---- Mistakes -------------------------------------------------------- */}
      {mistakes.length > 0 && (
        <Panel
          title="Where This Goes Wrong"
          icon="warning"
          subtitle="The mistakes almost everyone makes first"
          className="mt-6"
        >
          <ul className="space-y-4">
            {mistakes.map((m) => (
              <li key={m.mistake}>
                <p className="flex gap-2 text-sm text-crimson-400">
                  <Icon name="warning" size={15} className="mt-0.5 shrink-0" />
                  <span>{m.mistake}</span>
                </p>
                <p className="mt-1.5 flex gap-2 pl-[23px] text-sm text-parchment-300">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                  <span>{m.fix}</span>
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ---- Listening + routine --------------------------------------------- */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {listening.length > 0 && (
          <Panel title="Go and Listen" icon="harp" subtitle="Hear the idea in the wild">
            <ul className="space-y-3.5">
              {listening.map((l) => (
                <li key={l.piece}>
                  <p className="text-sm text-parchment-100">{l.piece}</p>
                  <p className="text-xs text-gold-500">{l.composer}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-parchment-400">{l.why}</p>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {routine.length > 0 && (
          <Panel title="Five-Minute Drill" icon="clock" subtitle="Short enough to actually do">
            <ol className="space-y-2.5">
              {routine.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm text-parchment-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold-700/50 font-display text-[11px] text-gold-400">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </Panel>
        )}
      </div>

      <div className="rune-divider mt-8">
        <span className="font-display text-xs uppercase tracking-[0.3em] text-gold-500">
          Prove It
        </span>
      </div>

      <LessonFlow
        lessonSlug={lesson.slug}
        quizQuestions={quizQuestions}
        practiceExercises={practice.map((p) => ({
          title: p.title,
          prompt: p.prompt,
          hint: p.hint,
        }))}
        compositionExercise={
          composition
            ? { title: composition.title, prompt: composition.prompt, hint: composition.hint }
            : null
        }
        brief={brief}
        freedom={freedom}
        initialState={{
          quizPassed: progress?.quizPassed ?? false,
          practiceDone: progress?.practiceDone ?? false,
          completed: done,
          bestQuizScore: progress?.bestQuizScore ?? 0,
        }}
        nextLesson={
          lesson.unlocks[0]
            ? { slug: lesson.unlocks[0].slug, title: lesson.unlocks[0].title }
            : null
        }
      />
    </div>
  );
}
