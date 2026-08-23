"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { claimTreasure } from "@/server/actions/dungeon";
import { RARITY_COLORS, type ArtifactRarity } from "@/lib/enums";
import { Icon } from "@/components/ui/Icon";

export function TreasurePanel({
  roomId,
  artifact,
  alreadyOwned,
}: {
  roomId: string;
  artifact: { name: string; icon: string; rarity: string; description: string };
  alreadyOwned: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [owned, setOwned] = useState(alreadyOwned);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setBusy(true);
    setError(null);
    const res = await claimTreasure(roomId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "The chest will not open");
      return;
    }
    setOwned(true);
    router.refresh();
  }

  const rarityClass =
    RARITY_COLORS[artifact.rarity as ArtifactRarity] ?? RARITY_COLORS.COMMON;

  return (
    <div className={`card border p-6 text-center ${rarityClass.split(" ")[1] ?? ""}`}>
      <p className="text-5xl">{owned ? artifact.icon : "🧰"}</p>
      {owned ? (
        <>
          <p className={`mt-3 font-display text-lg ${rarityClass.split(" ")[0]}`}>
            {artifact.name}
          </p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-parchment-500">
            {artifact.rarity.toLowerCase()}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-parchment-400">
            {artifact.description}
          </p>
          <p className="mt-2 text-xs text-emerald-300">✓ In your collection</p>
        </>
      ) : (
        <>
          <p className="mt-3 text-parchment-400">
            An old chest waits, its lock long since given up.
          </p>
          {error && <p className="mt-2 text-sm text-crimson-400">{error}</p>}
          <button onClick={claim} disabled={busy} className="btn-primary mt-4">
            {busy ? "Opening…" : <><Icon name="chest" size={16} /> Open the Chest</>}
          </button>
        </>
      )}
    </div>
  );
}
