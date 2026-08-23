import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureDailyChallenge } from "@/lib/daily";
import { ChallengePanel } from "@/components/dungeon/ChallengePanel";
import { briefForChallenge, parseChecks } from "@/lib/challenge-brief";
import { cappedFreedom, freedomForPlayer } from "@/lib/composer-freedom";

export const metadata = { title: "Daily Dungeon Challenge" };
export const dynamic = "force-dynamic";

export default async function DailyChallengePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const uc = await ensureDailyChallenge(userId);
  const profile = await db.userProfile.findUnique({ where: { userId } });

  const done = uc.status === "COMPLETED";
  const brief = briefForChallenge(uc.challenge);
  const checks = parseChecks(uc.challenge.checks) ?? brief.checks;
  const lessonsCompleted = await db.lessonProgress.count({
    where: { userId, status: "COMPLETED" },
  });
  const freedom = cappedFreedom(
    freedomForPlayer(profile?.level ?? 1, lessonsCompleted),
    uc.challenge.freedomCap ?? brief.freedomCap
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dungeon" className="text-sm text-parchment-500 hover:text-gold-300">
        ← Back to the Dungeon map
      </Link>
      <header className="mb-6 mt-2">
        <p className="text-xs uppercase tracking-[0.3em] text-parchment-500">
          🌅 Daily Dungeon Challenge
        </p>
        <h1 className="heading-display mt-1 text-3xl">The Dawn Trial</h1>
        <p className="mt-2 text-parchment-400">
          One challenge per day, forged fresh at midnight (UTC). Completing it
          grants bonus XP and feeds your Creative Flame
          {profile && ` — currently ${profile.streakCount} day${profile.streakCount === 1 ? "" : "s"}`}
          .
        </p>
      </header>

      {done ? (
        <div className="card-gold p-8 text-center">
          <p className="text-4xl">🌅</p>
          <h2 className="heading-display mt-3 text-xl">Today&apos;s Trial Is Complete</h2>
          <p className="mt-2 text-parchment-400">
            The flame burns bright. Return after the next dawn — or descend
            deeper into the Dungeon.
          </p>
          <Link href="/dungeon" className="btn-secondary mt-4">
            Explore the Dungeon
          </Link>
        </div>
      ) : (
        <ChallengePanel
          challenge={{
            userChallengeId: uc.id,
            title: uc.challenge.title,
            description: uc.challenge.description,
            difficulty: uc.challenge.difficulty,
            keySig: uc.challenge.keySig,
            meter: uc.challenge.meter,
            lengthBars: brief.setup.bars,
            instrument: uc.challenge.instrument,
            style: uc.challenge.style,
            requirement: uc.challenge.requirement,
            restriction: uc.challenge.restriction,
            xpReward: uc.challenge.xpReward,
            canReroll: false,
          }}
          setup={brief.setup}
          checks={checks}
          freedom={freedom}
        />
      )}
    </div>
  );
}
