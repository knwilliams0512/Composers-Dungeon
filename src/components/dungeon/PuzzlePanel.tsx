"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { solvePuzzle } from "@/server/actions/dungeon";
import { AwardBanner } from "@/components/ui/AwardBanner";
import type { AwardResult } from "@/lib/progression";
import { Icon } from "@/components/ui/Icon";

export function PuzzlePanel({
  roomId,
  puzzle,
  alreadySolved,
}: {
  roomId: string;
  puzzle: {
    kind: string;
    prompt: string;
    choices?: string[];
    pieces?: { id: string; label: string }[];
  };
  alreadySolved: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [solved, setSolved] = useState(alreadySolved);
  const [award, setAward] = useState<AwardResult | undefined>();
  // For ARRANGE puzzles: the current ordering the user has built.
  const [arrangement, setArrangement] = useState<string[]>([]);

  async function submitChoice(answerIndex: number) {
    setBusy(true);
    setFeedback(null);
    const res = await solvePuzzle({ roomId, answerIndex });
    setBusy(false);
    if (!res.ok) {
      setFeedback(res.error ?? "The puzzle rejects your offering.");
      return;
    }
    setFeedback(res.explanation ?? null);
    if (res.correct) {
      setSolved(true);
      setAward(res.award);
      router.refresh();
    }
  }

  async function submitArrangement() {
    setBusy(true);
    setFeedback(null);
    const res = await solvePuzzle({ roomId, arrangement });
    setBusy(false);
    if (!res.ok) {
      setFeedback(res.error ?? "The puzzle rejects your offering.");
      return;
    }
    setFeedback(res.explanation ?? null);
    if (res.correct) {
      setSolved(true);
      setAward(res.award);
      router.refresh();
    } else {
      setArrangement([]);
    }
  }

  const remainingPieces =
    puzzle.pieces?.filter((p) => !arrangement.includes(p.id)) ?? [];

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <h2 className="heading-display mb-2 flex items-center gap-2 text-lg">
          <Icon name="puzzle" size={18} className="text-arcane-300" /> The Puzzle
        </h2>
        <p className="text-parchment-200">{puzzle.prompt}</p>

        {solved && (
          <p className="mt-4 rounded border border-emerald-600/50 bg-emerald-900/20 p-3 text-sm text-emerald-300">
            ✓ Solved. {feedback ?? "The mechanism stays open forever."}
          </p>
        )}

        {!solved && puzzle.kind === "MULTIPLE_CHOICE" && puzzle.choices && (
          <div className="mt-4 space-y-2">
            {puzzle.choices.map((choice, i) => (
              <button
                key={i}
                disabled={busy}
                onClick={() => submitChoice(i)}
                className="block w-full rounded-md border border-abyss-600 bg-abyss-800/60 p-3 text-left text-sm text-parchment-200 transition-colors hover:border-gold-700/60"
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        {!solved && puzzle.kind === "ARRANGE" && puzzle.pieces && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="label">Your arrangement (tap in order)</p>
              <ol className="min-h-12 space-y-1.5 rounded border border-dashed border-abyss-600 p-2">
                {arrangement.map((id, idx) => {
                  const piece = puzzle.pieces!.find((p) => p.id === id)!;
                  return (
                    <li key={id}>
                      <button
                        onClick={() =>
                          setArrangement((a) => a.filter((x) => x !== id))
                        }
                        className="w-full rounded border border-gold-700/50 bg-abyss-700/60 p-2 text-left text-sm text-gold-300"
                      >
                        {idx + 1}. {piece.label} ✕
                      </button>
                    </li>
                  );
                })}
                {arrangement.length === 0 && (
                  <li className="p-2 text-center text-xs text-parchment-500">
                    The pedestal is empty…
                  </li>
                )}
              </ol>
            </div>
            <div>
              <p className="label">Fragments</p>
              <div className="space-y-1.5">
                {remainingPieces.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setArrangement((a) => [...a, p.id])}
                    className="block w-full rounded border border-abyss-600 bg-abyss-800/60 p-2 text-left text-sm text-parchment-200 hover:border-gold-700/60"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={submitArrangement}
              disabled={busy || arrangement.length !== (puzzle.pieces?.length ?? 0)}
              className="btn-primary w-full"
            >
              Set the Fragments
            </button>
          </div>
        )}

        {!solved && feedback && (
          <p className="mt-3 rounded border border-crimson-600/50 bg-crimson-700/20 p-3 text-sm text-parchment-200">
            {feedback}
          </p>
        )}
      </section>
      {award && <AwardBanner award={award} />}
    </div>
  );
}
