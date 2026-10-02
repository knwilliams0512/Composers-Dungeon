import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Panel } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { UpdatePanel } from "@/components/settings/UpdatePanel";
import { FreedomPanel } from "@/components/settings/FreedomPanel";
import { AccessibilityPanel } from "@/components/settings/AccessibilityPanel";
import { MailPanel } from "@/components/settings/MailPanel";
import { appVersion, isDesktop } from "@/lib/desktop";
import { readMailConfigView } from "@/lib/mail";
import { DRILL_KEYS } from "@/lib/drills";
import { INSTRUMENTS } from "@/lib/studio/instruments";

/**
 * What this install actually holds.
 *
 * Read rather than written down. The lessons' sections live inside a JSON
 * column, so the only way to know how many of them carry a figure is to open
 * them — cheap enough once per visit to a settings page, and the alternative
 * is a number that is wrong by the next release.
 */
async function countContents() {
  const [lessons, quiz, areas, rooms, bosses, achievements, artifacts] = await Promise.all([
    db.lesson.findMany({ select: { content: true } }),
    db.quizQuestion.count(),
    db.dungeonArea.count(),
    db.dungeonRoom.count(),
    db.boss.count(),
    db.achievement.count(),
    db.artifact.count(),
  ]);

  let figures = 0;
  for (const lesson of lessons) {
    try {
      const sections = JSON.parse(lesson.content) as { figure?: unknown }[];
      if (!Array.isArray(sections)) continue;
      figures += sections.filter((section) => section?.figure).length;
    } catch {
      // A lesson whose content will not parse is a seeding problem the Academy
      // itself reports; it should not take the settings page down with it.
    }
  }

  return {
    lessons: lessons.length,
    figures,
    quiz,
    areas,
    rooms,
    bosses,
    achievements,
    artifacts,
  };
}

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [profile, counts, mail, library] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    Promise.all([
      db.composition.count({ where: { userId } }),
      db.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
      db.userChallenge.count({ where: { userId, status: "COMPLETED" } }),
    ]),
    readMailConfigView(),
    countContents(),
  ]);
  if (!profile) redirect("/login");
  const [compositions, lessons, challenges] = counts;

  const figures = library.figures;
  const contents: [string, number][] = [
    ["Lessons", library.lessons],
    ["Illustrated sections", library.figures],
    ["Quiz questions", library.quiz],
    ["Dungeon areas", library.areas],
    ["Rooms", library.rooms],
    ["Bosses", library.bosses],
    ["Drills", DRILL_KEYS.length],
    ["Studio instruments", INSTRUMENTS.length],
    ["Achievements", library.achievements],
    ["Artifacts", library.artifacts],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeading
        eyebrow="Housekeeping"
        title="Settings"
        subtitle="Version, updates, your data, and where everything lives."
        icon="settings"
        accent="#6d7db0"
        motif="keys"
      />

      <div className="space-y-6">
        <Panel
          title="Updates"
          icon="download"
          subtitle="New lessons, new areas and fixes arrive here"
        >
          <UpdatePanel
            initial={{ current: appVersion(), desktop: isDesktop(), available: false }}
          />
        </Panel>

        <Panel
          title="Composer Tools"
          icon="quill"
          subtitle="How much the editor offers you at once"
        >
          <FreedomPanel
            fullFreedom={profile.fullFreedom}
            level={profile.level}
            lessonsCompleted={lessons}
          />
        </Panel>

        <Panel
          title="Accessibility"
          icon="eye"
          subtitle="Text size, motion, contrast and typeface"
        >
          <AccessibilityPanel
            reduceMotion={profile.reduceMotion}
            textScale={profile.textScale}
            highContrast={profile.highContrast}
            readableFont={profile.readableFont}
          />
        </Panel>

        <MailPanel saved={mail} />

        <Panel title="Your Data" icon="scroll" subtitle="All of it stays on this machine">
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 py-3">
              <dt className="text-[10px] uppercase tracking-widest text-parchment-500">
                Compositions
              </dt>
              <dd className="font-display text-xl text-parchment-100">{compositions}</dd>
            </div>
            <div className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 py-3">
              <dt className="text-[10px] uppercase tracking-widest text-parchment-500">
                Lessons done
              </dt>
              <dd className="font-display text-xl text-parchment-100">{lessons}</dd>
            </div>
            <div className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 py-3">
              <dt className="text-[10px] uppercase tracking-widest text-parchment-500">
                Trials won
              </dt>
              <dd className="font-display text-xl text-parchment-100">{challenges}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-parchment-400">
            Composer&apos;s Dungeon runs entirely on this computer. Nothing is uploaded, no
            account lives on a server, and the Guild is populated only by people who sign up
            on this install.
          </p>
          {isDesktop() && (
            <p className="mt-2 flex items-start gap-2 text-xs text-parchment-500">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              Your save file lives in{" "}
              {/* A Windows path has nothing a line break can land on, so on a
                  narrow window it pushed the whole page wider than the screen.
                  break-all lets it wrap mid-path. */}
              <code className="break-all rounded bg-abyss-900 px-1 py-0.5 text-gold-400">
                %LOCALAPPDATA%\ComposersDungeon\data
              </code>
              . Updates never touch it; uninstalling backs it up to your Desktop first.
            </p>
          )}
        </Panel>

        <Panel title="Account" icon="feather">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/profile" className="btn-secondary">
              <Icon name="feather" size={14} /> Edit profile
            </Link>
            <Link href="/library" className="btn-secondary">
              <Icon name="scroll" size={14} /> Your library
            </Link>
            <Link href="/forgot-password" className="btn-ghost">
              Change password
            </Link>
          </div>
        </Panel>

        <Panel title="About" icon="info">
          <p className="text-sm leading-relaxed text-parchment-400">
            <span className="heading-display">Composer&apos;s Dungeon</span> — an RPG for
            composers. The Academy teaches you, the Dungeon tests you, the Workshop lets you
            write with nobody grading it, and the Studio takes the lid off entirely.
          </p>
          {/* Counted from what this install actually holds, rather than typed
              in. The sentence these replace claimed twenty-five lessons and
              four bosses for several releases after both had stopped being
              true, which is what a hand-written number does eventually. */}
          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            {contents.map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline gap-2 rounded-lg border border-abyss-600/60 bg-abyss-900/40 px-3 py-2"
              >
                <dd className="font-display text-base text-parchment-100">{value}</dd>
                <dt className="text-parchment-500">{label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-parchment-400">
            Every one of those {figures} lesson sections carries a figure you can hear and
            play with — a staff, a keyboard, a rhythm, a circle of fifths, a waveform —
            rather than a paragraph asking you to imagine one.
          </p>
          <p className="mt-3 text-xs text-parchment-500">Version {appVersion()}</p>
        </Panel>
      </div>
    </div>
  );
}
