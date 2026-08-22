import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { LessonFlow } from "@/components/academy/LessonFlow";

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
        <div className="card mx-auto max-w-lg p-8 text-center">
          <p className="text-3xl">🔒</p>
          <h1 className="heading-display mt-2 text-xl">This Door Is Sealed</h1>
          <p className="mt-2 text-parchment-400">
            Complete <strong>{lesson.prerequisite?.title}</strong> first.
          </p>
          <Link
            href={`/academy/${lesson.prerequisite?.slug}`}
            className="btn-primary mt-4"
          >
            Go There
          </Link>
        </div>
      );
    }
  }

  const progress = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  });

  // Mark as started.
  if (!progress) {
    await db.lessonProgress.create({
      data: { userId, lessonId: lesson.id },
    });
  }

  const content = JSON.parse(lesson.content) as {
    heading: string;
    body: string;
    example?: string;
  }[];

  const quizQuestions =
    lesson.quiz?.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      choices: JSON.parse(q.choices) as string[],
    })) ?? [];

  const practice = lesson.exercises.filter((e) => e.type === "PRACTICE");
  const composition = lesson.exercises.find((e) => e.type === "COMPOSITION");

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/academy" className="text-sm text-parchment-500 hover:text-gold-300">
        ← Back to the Academy
      </Link>
      <header className="mb-6 mt-2">
        <h1 className="heading-display text-3xl">{lesson.title}</h1>
        <p className="mt-1 text-parchment-400">{lesson.description}</p>
        <p className="mt-2 text-xs text-parchment-500">
          ✦ {lesson.xpReward} XP
          {lesson.skillRewards.length > 0 && (
            <>
              {" · trains "}
              {lesson.skillRewards.map((r) => r.skill.name).join(", ")}
            </>
          )}
        </p>
      </header>

      {/* 1. Learn the concept + examples */}
      <div className="space-y-4">
        {content.map((section) => (
          <section key={section.heading} className="card p-5">
            <h2 className="heading-display mb-2 text-lg">{section.heading}</h2>
            <p className="leading-relaxed text-parchment-200">{section.body}</p>
            {section.example && (
              <p className="mt-3 rounded border border-gold-700/40 bg-abyss-900/80 p-3 font-mono text-sm text-gold-300">
                {section.example}
              </p>
            )}
          </section>
        ))}
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
        initialState={{
          quizPassed: progress?.quizPassed ?? false,
          practiceDone: progress?.practiceDone ?? false,
          completed: progress?.status === "COMPLETED",
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
