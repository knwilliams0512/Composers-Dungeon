"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ENSEMBLES } from "@/lib/studio/instruments";
import {
  createStudioScore,
  deleteStudioScore,
  duplicateStudioScore,
  renameStudioScore,
} from "@/server/actions/studio";
import { Icon } from "@/components/ui/Icon";

export interface ScoreCard {
  id: string;
  title: string;
  subtitle: string;
  composer: string;
  instrumentation: string;
  measures: number;
  parts: number;
  createdAt: string;
  visibility: string;
}

/**
 * The Studio's front door: what you have written, and the quickest route to
 * something new. Creating a score asks only for a name and an ensemble, so the
 * first note is never more than two clicks away.
 */
export function StudioLibrary({ scores }: { scores: ScoreCard[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scores;
    return scores.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.composer.toLowerCase().includes(q) ||
        s.instrumentation.toLowerCase().includes(q)
    );
  }, [query, scores]);

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    await fn();
    setBusy(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Icon name="plus" size={15} /> New score
        </button>
        <label className="ml-auto flex items-center gap-2 rounded border border-abyss-600 bg-abyss-900 px-2 py-1.5">
          <Icon name="search" size={13} className="text-parchment-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scores…"
            className="w-44 bg-transparent text-sm text-parchment-200 outline-none"
          />
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="card p-10 text-center">
          <Icon name="staff" size={32} className="mx-auto text-gold-600" />
          <p className="mt-3 text-parchment-300">
            {scores.length === 0 ? "No scores yet." : "Nothing matches that search."}
          </p>
          {scores.length === 0 && (
            <button onClick={() => setCreating(true)} className="btn-primary mt-4">
              Write your first score
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => (
            <div key={s.id} className="card flex flex-col p-4">
              <Link href={`/studio/${s.id}`} className="group">
                <h3 className="truncate font-display text-lg text-parchment-100 group-hover:text-gold-300">
                  {s.title}
                </h3>
                {s.subtitle && (
                  <p className="truncate text-xs italic text-parchment-500">{s.subtitle}</p>
                )}
              </Link>

              <dl className="mt-3 space-y-1 text-[11px] text-parchment-500">
                {s.composer && (
                  <div className="flex gap-1.5">
                    <dt className="text-parchment-600">Composer</dt>
                    <dd className="truncate text-parchment-400">{s.composer}</dd>
                  </div>
                )}
                <div className="flex gap-1.5">
                  <dt className="text-parchment-600">Parts</dt>
                  <dd className="truncate text-parchment-400">{s.instrumentation}</dd>
                </div>
                <div className="flex gap-3">
                  <span>{s.measures} measures</span>
                  <span>{s.parts} staves</span>
                </div>
                <div className="text-parchment-600">
                  Edited {new Date(s.createdAt).toLocaleDateString()}
                </div>
              </dl>

              <div className="mt-3 flex gap-1 border-t border-abyss-700 pt-2">
                <Link href={`/studio/${s.id}`} className="btn-ghost text-xs">
                  <Icon name="pencil" size={12} /> Open
                </Link>
                <button
                  disabled={busy === s.id}
                  onClick={() => {
                    const t = window.prompt("Rename this score", s.title);
                    if (t) void act(s.id, () => renameStudioScore(s.id, t));
                  }}
                  className="btn-ghost text-xs"
                >
                  Rename
                </button>
                <button
                  disabled={busy === s.id}
                  onClick={() => void act(s.id, () => duplicateStudioScore(s.id))}
                  className="btn-ghost text-xs"
                  title="Duplicate"
                >
                  <Icon name="copy" size={12} />
                </button>
                <button
                  disabled={busy === s.id}
                  onClick={() => {
                    if (window.confirm(`Delete “${s.title}”? This cannot be undone.`)) {
                      void act(s.id, () => deleteStudioScore(s.id));
                    }
                  }}
                  className="btn-ghost ml-auto text-xs text-crimson-400 hover:text-crimson-300"
                  title="Delete"
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <NewScoreDialog onClose={() => setCreating(false)} />}
    </>
  );
}

function NewScoreDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [ensembleId, setEnsembleId] = useState("piano");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensemble = ENSEMBLES.find((e) => e.id === ensembleId);

  async function create() {
    setBusy(true);
    setError(null);
    const res = await createStudioScore({ title, ensembleId });
    if (!res.ok || !res.id) {
      setError(res.error ?? "Could not create the score");
      setBusy(false);
      return;
    }
    router.push(`/studio/${res.id}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border border-abyss-600 bg-abyss-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg text-parchment-100">New score</h2>

        <label className="mt-4 block text-xs text-parchment-500">
          Title
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Score"
            className="mt-1 w-full rounded border border-abyss-600 bg-abyss-950 px-2 py-1.5 text-sm text-parchment-100 outline-none focus:border-gold-600"
          />
        </label>

        <label className="mt-3 block text-xs text-parchment-500">
          Instrumentation
          <select
            value={ensembleId}
            onChange={(e) => setEnsembleId(e.target.value)}
            className="mt-1 w-full rounded border border-abyss-600 bg-abyss-950 px-2 py-1.5 text-sm text-parchment-100 outline-none focus:border-gold-600"
          >
            {ENSEMBLES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>

        {ensemble && (
          <p className="mt-2 rounded bg-abyss-950 px-2 py-1.5 text-[11px] text-parchment-500">
            {ensemble.description}
            <span className="mt-1 block text-parchment-600">
              {ensemble.parts.length} part{ensemble.parts.length === 1 ? "" : "s"}
            </span>
          </p>
        )}

        {error && <p className="mt-2 text-xs text-crimson-400">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button onClick={create} disabled={busy} className="btn-primary flex-1">
            {busy ? "Creating…" : "Create and open"}
          </button>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
