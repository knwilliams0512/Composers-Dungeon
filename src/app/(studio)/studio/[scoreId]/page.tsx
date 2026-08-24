import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { StudioWorkspace } from "@/components/studio/StudioWorkspace";
import { emptyStudioScore, type StudioScore } from "@/lib/studio/model";

/**
 * A stored score is data the app wrote, but it has been through a database and
 * possibly an older version of this code, so it is checked rather than trusted:
 * a score missing its parts would crash the engraver on the first render.
 */
function parseScore(raw: string | null, fallbackTitle: string): StudioScore {
  if (!raw) return emptyStudioScore({ info: { title: fallbackTitle } as StudioScore["info"] });
  try {
    const parsed = JSON.parse(raw) as StudioScore;
    if (
      !parsed ||
      !Array.isArray(parsed.parts) ||
      parsed.parts.length === 0 ||
      !Array.isArray(parsed.measures) ||
      parsed.measures.length === 0
    ) {
      return emptyStudioScore({ info: { title: fallbackTitle } as StudioScore["info"] });
    }
    // Fill in anything a newer field expects but an older save never wrote.
    return { ...emptyStudioScore(), ...parsed, layout: { ...emptyStudioScore().layout, ...parsed.layout } };
  } catch {
    return emptyStudioScore({ info: { title: fallbackTitle } as StudioScore["info"] });
  }
}

export default async function StudioEditorPage({
  params,
}: {
  params: { scoreId: string };
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const row = await db.composition.findUnique({ where: { id: params.scoreId } });
  if (!row) notFound();
  if (row.userId !== userId) notFound();

  return (
    <StudioWorkspace
      scoreId={row.id}
      initialScore={parseScore(row.score, row.title)}
    />
  );
}
