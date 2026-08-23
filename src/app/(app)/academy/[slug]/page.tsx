import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { LessonFlow } from "@/components/academy/LessonFlow";
import { Icon, SKILL_ICONS } from "@/components/ui/Icon";
import { Callout, Panel } from "@/components/ui/primitives";
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

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/academy"
        className="inline-flex items-center gap-1.5 text-sm text-parchment-500 transition-colors hover:text-gold-300"
      >
        <Icon name="chevron" size={13} className="rotate-180" /> Back to the Academy
      </Link>

      {/* ---- Header ---------------------------------------------------------- */}
      <header className="card-gold lit-edge mt-3 p-6">
        <div className="flex flex-wrap items-center gap-2">
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
            <span className="pill border-emerald-700/60 text-emerald-300">
              <Icon name="check" size={11} /> Completed
            </span>
          )}
        </div>

        <h1 className="heading-display mt-3 text-3xl text-balance">{lesson.title}</h1>
        <p className="mt-1.5 text-parchment-400">{lesson.description}</p>

        {lesson.summary && (
          <div className="mt-4 border-l-2 border-gold-700/60 pl-4">
            <p className="eyebrow mb-1">
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
      </header>

      {/* ---- Key terms ------------------------------------------------------- */}
      {keyTerms.length > 0 && (
        <Panel title="Vocabulary" icon="scroll" className="mt-6">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {keyTerms.map((t) => (
              <div
                key={t.term}
                className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 p-3"
              >
                <dt className="font-display text-sm text-gold-300">{t.term}</dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-parchment-400">
                  {t.definition}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}

      {/* ---- The lesson ------------------------------------------------------ */}
      <div className="prose-lesson mt-6 space-y-4">
        {content.map((section, i) => (
          <section key={section.heading} className="card lit-edge p-5">
            <div className="mb-2 flex items-baseline gap-3">
              <span className="font-display text-sm text-gold-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="heading-display text-lg">{section.heading}</h2>
            </div>
            <p>{section.body}</p>
            {section.example && (
              <div className="mt-3 rounded-lg border border-gold-700/40 bg-abyss-900/80 p-3">
                <p className="eyebrow mb-1.5">
                  <Icon name="note" size={11} /> Example
                </p>
                <p className="font-mono text-sm leading-relaxed text-gold-300">
                  {section.example}
                </p>
              </div>
            )}
            {section.callout && (
              <div className="mt-3">
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
