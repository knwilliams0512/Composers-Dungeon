import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { DRILL_KEYS, DRILLS, type DrillKey } from "@/lib/drills";
import { DrillRound } from "@/components/trials/DrillRound";

/** "interval-ear" in a URL is INTERVAL_EAR in the code. */
function toKey(slug: string): DrillKey | null {
  const key = slug.toUpperCase().replace(/-/g, "_");
  return (DRILL_KEYS as readonly string[]).includes(key) ? (key as DrillKey) : null;
}

export async function generateMetadata({ params }: { params: { drillKey: string } }) {
  const key = toKey(params.drillKey);
  return { title: key ? DRILLS[key].name : "The Proving Grounds" };
}

export default async function DrillPage({ params }: { params: { drillKey: string } }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const key = toKey(params.drillKey);
  if (!key) notFound();

  // As on the index: no table yet means no personal best, not a broken page.
  const best = await db.drillResult
    .findFirst({
      where: { userId, drill: key },
      orderBy: { score: "desc" },
      select: { score: true },
    })
    .catch(() => null);

  return (
    <div className="mx-auto max-w-2xl">
      <DrillRound drill={key} best={best?.score ?? 0} />
    </div>
  );
}
