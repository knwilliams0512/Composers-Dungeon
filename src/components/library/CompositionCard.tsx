"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setCompositionVisibility } from "@/server/actions/profile";
import { ScorePlayer } from "@/components/composer/ScorePlayer";
import { Icon } from "@/components/ui/Icon";
import { instrumentById } from "@/lib/studio/instruments";
import type { Score } from "@/lib/score";

const SOURCE_LABELS: Record<string, string> = {
  FREE: "Free composition",
  CHALLENGE: "Dungeon challenge",
  LESSON: "Academy lesson",
  BOSS: "Boss encounter",
  DAILY: "Daily challenge",
  STUDIO: "Studio score",
};

/**
 * A stored score is only playable here if it is one of the game's single-line
 * scores. Studio scores live in the same column but hold many parts and no
 * `melody`, and older or hand-edited rows can hold anything at all — so the
 * shape is checked rather than assumed, and the player is only handed a score
 * it can actually read.
 */
function studioSummary(
  raw: string | null | undefined
): { parts: string; staves: number; measures: number } | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as {
      parts?: { instrumentId?: string; name?: string }[];
      measures?: unknown[];
    };
    if (!Array.isArray(s.parts) || s.parts.length === 0) return null;
    const names = s.parts.map((x) => x.name ?? instrumentById(x.instrumentId ?? "piano").name);
    return {
      parts:
        names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")} +${names.length - 3}`,
      staves: s.parts.length,
      measures: Array.isArray(s.measures) ? s.measures.length : 0,
    };
  } catch {
    return null;
  }
}

function parsePlayableScore(raw: string | null | undefined): Score | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Score>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.melody) || !Array.isArray(parsed.chords)) return null;
    if (!parsed.meter || typeof parsed.meter.beats !== "number") return null;
    if (typeof parsed.bars !== "number" || typeof parsed.tempo !== "number") return null;
    return parsed as Score;
  } catch {
    return null;
  }
}

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

  const score = parsePlayableScore(composition.score);
  const isStudio = composition.source === "STUDIO";
  const studio = isStudio ? studioSummary(composition.score) : null;

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
      {isStudio && (
        <div className="mt-3 rounded border border-abyss-700 bg-abyss-950/40 p-3">
          {studio ? (
            <>
              <p className="truncate text-xs text-parchment-300" title={studio.parts}>
                {studio.parts}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-parchment-500">
                {studio.staves} stave{studio.staves === 1 ? "" : "s"} · {studio.measures} measures
              </p>
            </>
          ) : (
            <p className="text-xs text-parchment-500">A Studio score.</p>
          )}
          <Link
            href={`/studio/${composition.id}`}
            className="mt-2 inline-flex items-center gap-1.5 rounded border border-abyss-600 px-2 py-1 text-xs text-gold-300 hover:border-gold-700/60 hover:bg-abyss-800"
          >
            <Icon name="staff" size={12} /> Open in the Studio
          </Link>
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
