"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { emptyStudioScore, type StudioScore } from "@/lib/studio/model";
import { applyEnsemble } from "@/lib/studio/edit";

/**
 * Studio scores are stored in the same `Composition` table the rest of the app
 * uses, with the multi-part score living in the `score` JSON column. A studio
 * score is told apart by its `source` marker, so the Library keeps showing
 * everything while the Studio lists only what it can open.
 */

const STUDIO_SOURCE = "STUDIO";

export async function createStudioScore(input: {
  title?: string;
  ensembleId?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const userId = await requireUserId();

  const title = (input.title ?? "").trim() || "Untitled Score";
  if (title.length > 120) return { ok: false, error: "That title is too long" };

  let score = emptyStudioScore({ info: { title } as StudioScore["info"] });
  if (input.ensembleId) score = applyEnsemble(score, input.ensembleId);

  const created = await db.composition.create({
    data: {
      userId,
      title,
      source: STUDIO_SOURCE,
      visibility: "PRIVATE",
      score: JSON.stringify(score),
    },
  });

  revalidatePath("/studio");
  return { ok: true, id: created.id };
}

export async function saveStudioScore(
  id: string,
  score: StudioScore
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();

  const existing = await db.composition.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "Score not found" };
  }

  // The title on the record follows the one printed on the page, so the
  // Library and the score itself can never disagree about what this is.
  await db.composition.update({
    where: { id },
    data: {
      title: score.info.title.slice(0, 120) || "Untitled Score",
      description: score.info.subtitle.slice(0, 400),
      score: JSON.stringify(score),
    },
  });

  return { ok: true };
}

export async function renameStudioScore(
  id: string,
  title: string
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const existing = await db.composition.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return { ok: false, error: "Score not found" };

  const clean = title.trim().slice(0, 120) || "Untitled Score";

  // Keep the printed title in step with the record's.
  let score: string | null = existing.score;
  if (score) {
    try {
      const parsed = JSON.parse(score) as StudioScore;
      parsed.info.title = clean;
      score = JSON.stringify(parsed);
    } catch {
      // A score that will not parse is left exactly as it is rather than
      // being replaced with something that would lose the writer's work.
    }
  }

  await db.composition.update({ where: { id }, data: { title: clean, score } });
  revalidatePath("/studio");
  return { ok: true };
}

export async function duplicateStudioScore(
  id: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const userId = await requireUserId();
  const existing = await db.composition.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return { ok: false, error: "Score not found" };

  const title = `${existing.title} (copy)`.slice(0, 120);
  let score = existing.score;
  if (score) {
    try {
      const parsed = JSON.parse(score) as StudioScore;
      parsed.info.title = title;
      score = JSON.stringify(parsed);
    } catch {
      /* copy the bytes as they are rather than failing the duplicate */
    }
  }

  const created = await db.composition.create({
    data: {
      userId,
      title,
      description: existing.description,
      source: STUDIO_SOURCE,
      visibility: "PRIVATE",
      score,
    },
  });

  revalidatePath("/studio");
  return { ok: true, id: created.id };
}

export async function deleteStudioScore(id: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const existing = await db.composition.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return { ok: false, error: "Score not found" };

  await db.composition.delete({ where: { id } });
  revalidatePath("/studio");
  return { ok: true };
}

export async function setStudioVisibility(
  id: string,
  visibility: "PRIVATE" | "PUBLIC"
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const existing = await db.composition.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return { ok: false, error: "Score not found" };

  await db.composition.update({ where: { id }, data: { visibility } });
  revalidatePath("/studio");
  return { ok: true };
}
