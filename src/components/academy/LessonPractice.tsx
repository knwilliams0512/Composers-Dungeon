import Link from "next/link";
import { DRILLS, type DrillKey } from "@/lib/drills";
import { Icon } from "@/components/ui/Icon";
import { LESSON_PRACTICE } from "@/lib/lesson-practice";

/**
 * The bridge from a lesson to the drill that trains it.
 *
 * A lesson used to end at "read this, now answer three questions about whether
 * you read it". The one place in the app that asks you to *recognise* anything
 * by ear is the Proving Grounds, and nothing ever pointed there at the moment
 * it would have helped — a learner finishing the lesson on intervals had to
 * guess, unprompted, that one of six drills elsewhere trained what they had
 * just read. So the lesson names it and offers it.
 *
 * It links rather than embedding the round. A drill is sixty seconds against a
 * clock with a combo that resets when you are wrong, and dropping that into the
 * middle of a lesson would make learning feel more like a test, not less. The
 * invitation belongs in the lesson; the test belongs in the arena.
 *
 * A lesson with no suitable drill renders nothing. That is most of the
 * orchestration and form lessons, and it is deliberate — see
 * src/lib/lesson-practice.ts, which has to state a reason for every empty one.
 */
export function LessonPractice({ slug }: { slug: string }) {
  const entry = LESSON_PRACTICE[slug];
  const drills = entry?.drills ?? [];
  if (drills.length === 0) return null;

  const primary = DRILLS[drills[0] as DrillKey];

  return (
    <section className="mt-8">
      <div
        className="rounded-xl border border-abyss-600 bg-abyss-900/60 p-5"
        style={{ borderColor: `${primary.accent}44` }}
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg"
            style={{ background: `${primary.accent}22`, color: primary.accent }}
          >
            <Icon name="waveform" size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg leading-tight text-parchment-100">
              Now hear it
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-parchment-300">
              Knowing what this is called and hearing it are two different skills, and only
              one of them makes you a composer. {drills.length > 1 ? "These drills" : "This drill"}{" "}
              {drills.length > 1 ? "train" : "trains"} the second.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {drills.map((key) => {
                const d = DRILLS[key as DrillKey];
                return (
                  <Link
                    key={key}
                    href={`/trials/${key}`}
                    className="group flex items-center gap-2.5 rounded-lg border border-abyss-600 bg-abyss-950/60 px-3 py-2 transition-colors hover:border-abyss-500 hover:bg-abyss-800"
                  >
                    <Icon name={d.icon} size={15} style={{ color: d.accent }} />
                    <span className="min-w-0">
                      <span className="block text-sm text-parchment-100">{d.name}</span>
                      <span className="block text-[11px] text-parchment-400">{d.blurb}</span>
                    </span>
                    <Icon
                      name="chevron"
                      size={12}
                      className="shrink-0 text-parchment-600 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
