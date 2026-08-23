"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrStartRoomChallenge } from "@/server/actions/dungeon";
import { Icon } from "@/components/ui/Icon";

/**
 * Rooms hold no trial until you ask for one — the challenge is generated on
 * entry so it can be themed to the room and to how far you have come.
 */
export function BeginTrialButton({ roomId, isCurse }: { roomId: string; isCurse: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const res = await getOrStartRoomChallenge(roomId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "The room will not open");
      return;
    }
    router.refresh();
  }

  return (
    <section className="card-crimson lit-edge p-8 text-center">
      <Icon
        name={isCurse ? "moon" : "sword"}
        size={34}
        className="mx-auto text-crimson-400"
      />
      <h2 className="heading-display mt-3 text-xl">
        {isCurse ? "A Curse Waits Here" : "A Trial Waits Here"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-parchment-400">
        {isCurse
          ? "Curses hand you a creative restriction and dare you to write something good inside it."
          : "The dungeon forges a fresh brief for you — key, meter, length and instrument all decided. You bring the music."}
      </p>
      {error && <p className="mt-3 text-sm text-crimson-400">{error}</p>}
      <button onClick={start} disabled={busy} className="btn-primary mt-5">
        <Icon name="candle" size={15} />
        {busy ? "Lighting the torches…" : "Begin the Trial"}
      </button>
    </section>
  );
}
