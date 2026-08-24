"use client";

import { useCallback } from "react";
import { saveStudioScore } from "@/server/actions/studio";
import type { StudioScore } from "@/lib/studio/model";
import { StudioEditor } from "./StudioEditor";

/**
 * Bridges the server route to the editor: the page stays a server component
 * that reads the database, and this passes the save action down as a plain
 * callback the editor can await.
 */
export function StudioWorkspace({
  scoreId,
  initialScore,
}: {
  scoreId: string;
  initialScore: StudioScore;
}) {
  const onSave = useCallback(
    async (score: StudioScore) => {
      const res = await saveStudioScore(scoreId, score);
      return { ok: res.ok };
    },
    [scoreId]
  );

  return <StudioEditor scoreId={scoreId} initialScore={initialScore} onSave={onSave} />;
}
