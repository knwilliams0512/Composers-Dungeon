import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { StudioLibrary } from "@/components/studio/StudioLibrary";
import { instrumentById } from "@/lib/studio/instruments";
import type { StudioScore } from "@/lib/studio/model";

/** Everything the library card needs, read out of the stored score once. */
function summarise(raw: string | null): {
  composer: string;
  instrumentation: string;
  measures: number;
  parts: number;
} {
  if (!raw) return { composer: "", instrumentation: "—", measures: 0, parts: 0 };
  try {
    const s = JSON.parse(raw) as StudioScore;
    if (!Array.isArray(s.parts)) return { composer: "", instrumentation: "—", measures: 0, parts: 0 };
    const names = s.parts.map((p) => p.name ?? instrumentById(p.instrumentId).name);
    return {
      composer: s.info?.composer ?? "",
      instrumentation:
        names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")} +${names.length - 3}`,
      measures: s.measures?.length ?? 0,
      parts: s.parts.length,
    };
  } catch {
    return { composer: "", instrumentation: "—", measures: 0, parts: 0 };
  }
}

export default async function StudioLibraryPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const rows = await db.composition.findMany({
    where: { userId, source: "STUDIO" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
      visibility: true,
      score: true,
    },
  });

  const scores = rows.map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.description,
    createdAt: r.createdAt.toISOString(),
    visibility: r.visibility,
    ...summarise(r.score),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-parchment-500">
          <Icon name="staff" size={12} /> The Studio
        </p>
        <h1 className="heading-display mt-1 text-3xl">Your Scores</h1>
        <p className="mt-2 max-w-2xl text-parchment-400">
          Full notation, as many instruments as the music asks for. Write anything from a solo
          line to a full orchestral score.
        </p>
      </header>

      <StudioLibrary scores={scores} />

      <p className="mt-8 text-center text-xs text-parchment-600">
        Looking for your dungeon compositions?{" "}
        <Link href="/library" className="text-gold-400 hover:underline">
          They live in the Library
        </Link>
        .
      </p>
    </div>
  );
}
