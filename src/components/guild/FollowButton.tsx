"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleFollow } from "@/server/actions/guild";

export function FollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await toggleFollow(targetUserId);
    setBusy(false);
    if (res.ok && res.following !== undefined) {
      setFollowing(res.following);
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`mt-4 rounded-full border px-5 py-1.5 text-sm transition-colors ${
        following
          ? "border-gold-600 text-gold-300"
          : "border-abyss-600 text-parchment-300 hover:border-gold-700/60"
      }`}
    >
      {following ? "✓ Following" : "Follow This Composer"}
    </button>
  );
}
