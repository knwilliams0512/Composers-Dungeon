import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { ALL_UNITS } from "@/lib/curriculum";
import { previousUnit, unitOpen } from "@/lib/unit-gate";
import { UnitExam } from "@/components/academy/UnitExam";
import { SectionHeading } from "@/components/ui/SectionHeading";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export default async function UnitExamPage({ params }: { params: { unit: string } }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const unit = ALL_UNITS.find((u) => u.unit === params.unit);
  const exam = await db.unitExam.findUnique({
    where: { unit: params.unit },
    include: { _count: { select: { questions: true } } },
  });
  if (!unit || !exam) notFound();

  const [attempts, levelName] = await Promise.all([
    db.unitExamAttempt.findMany({
      where: { userId },
      select: { unit: true, passed: true, score: true },
    }),
    Promise.resolve(unit.level),
  ]);

  const passed = new Set(attempts.filter((a) => a.passed).map((a) => a.unit));
  const mine = attempts.filter((a) => a.unit === params.unit);
  const best = mine.length ? Math.max(...mine.map((a) => a.score)) : null;
  const open = unitOpen(unit.unit, passed);
  const before = previousUnit(unit.unit);

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading
        eyebrow={`Level ${levelName} · Unit ${unit.unit}`}
        title={`${unit.title} — Exam`}
        subtitle={unit.blurb}
        icon="target"
        accent="#f2cf68"
        motif="quill"
      />

      {open ? (
        <UnitExam
          unit={unit.unit}
          title={unit.title}
          blurb={exam.blurb}
          lessonCount={unit.slugs.length}
          alreadyPassed={passed.has(unit.unit)}
          best={best}
          questionCount={Math.min(exam.askCount || exam._count.questions, exam._count.questions)}
          passMark={exam.passMark}
        />
      ) : (
        <div className="card p-6">
          <p className="flex items-center gap-2 font-display text-lg text-parchment-200">
            <Icon name="lock" size={16} /> Not open yet
          </p>
          <p className="mt-2 text-sm leading-relaxed text-parchment-400">
            The roadmap is taken in order. Unit {before} has to be passed before this exam
            opens — which you can do without reading its lessons, if you already know it.
          </p>
          {before && (
            <Link href={`/academy/exam/${before}`} className="btn-primary mt-4">
              <Icon name="target" size={14} /> Sit the unit {before} exam
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
