import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Panel } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { UpdatePanel } from "@/components/settings/UpdatePanel";
import { appVersion, isDesktop } from "@/lib/desktop";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [profile, counts] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    Promise.all([
      db.composition.count({ where: { userId } }),
      db.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
      db.userChallenge.count({ where: { userId, status: "COMPLETED" } }),
    ]),
  ]);
  if (!profile) redirect("/login");
  const [compositions, lessons, challenges] = counts;

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeading
        eyebrow="Housekeeping"
        title="Settings"
        subtitle="Version, updates, your data, and where everything lives."
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
              <code className="rounded bg-abyss-900 px-1 py-0.5 text-gold-400">
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
            composers. The Academy teaches you; the Dungeon tests you. Twenty-five lessons,
            nine dungeon areas, four bosses, and a challenge generator that never runs out.
          </p>
          <p className="mt-3 text-xs text-parchment-500">Version {appVersion()}</p>
        </Panel>
      </div>
    </div>
  );
}
