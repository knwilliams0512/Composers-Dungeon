"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCompositionVisibility } from "@/server/actions/profile";
import { ScorePlayer } from "@/components/composer/ScorePlayer";
import type { Score } from "@/lib/score";

const SOURCE_LABELS: Record<string, string> = {
  FREE: "Free composition",
  CHALLENGE: "Dungeon challenge",
  LESSON: "Academy lesson",
  BOSS: "Boss encounter",
  DAILY: "Daily challenge",
};

export function CompositionCard({
  composition,
}: {
  composition: {
    id: string;
    title: string;
    description: string;
    reflection: string;
    scoreLink: string;
    visibility: string;
    source: string;
    createdAt: string;
    /** JSON Score written in the app's composer, when there is one. */
    score?: string | null;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isPublic = composition.visibility === "PUBLIC";

  let score: Score | null = null;
  try {
    score = composition.score ? (JSON.parse(composition.score) as Score) : null;
  } catch {
    score = null;
  }

  async function toggleVisibility() {
    setBusy(true);
    await setCompositionVisibility({
      compositionId: composition.id,
      visibility: isPublic ? "PRIVATE" : "PUBLIC",
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-gold-300">{composition.title}</p>
        <button
          onClick={toggleVisibility}
          disabled={busy}
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors ${
            isPublic
              ? "border-emerald-600/60 text-emerald-300"
              : "border-abyss-600 text-parchment-500 hover:border-gold-700/50"
          }`}
          title="Toggle public/private"
        >
          {isPublic ? "Public" : "Private"}
        </button>
      </div>
      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-parchment-500">
        {SOURCE_LABELS[composition.source] ?? composition.source} ·{" "}
        {new Date(composition.createdAt).toLocaleDateString()}
      </p>
      {score && (
        <div className="mt-3">
          <ScorePlayer score={score} compact />
        </div>
      )}
      {composition.description && (
        <p className="mt-2 text-sm text-parchment-300">{composition.description}</p>
      )}
      {composition.reflection && (
        <p className="mt-1 text-xs italic text-parchment-500">
          “{composition.reflection}”
        </p>
      )}
      {composition.scoreLink && (
        <a
          href={composition.scoreLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-arcane-300 hover:text-arcane-400"
        >
          🔗 View score ↗
        </a>
      )}
    </div>
  );
}
