"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/server/actions/profile";
import { AVATARS, AVATAR_GLYPHS } from "@/lib/enums";

export function ProfileEditor({
  initial,
}: {
  initial: { displayName: string; bio: string; avatar: string; visibility: string };
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [avatar, setAvatar] = useState(initial.avatar);
  const [visibility, setVisibility] = useState(initial.visibility);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await updateProfile({ displayName, bio, avatar, visibility });
    setBusy(false);
    if (!res.ok) {
      setMessage({ ok: false, text: res.error ?? "Save failed" });
      return;
    }
    setMessage({ ok: true, text: "Profile updated." });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card sticky top-20 space-y-4 p-5">
      <h2 className="heading-display text-lg">Edit Profile</h2>
      <div>
        <label className="label">Display Name</label>
        <input
          className="input"
          required
          minLength={2}
          maxLength={40}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Sigil (avatar)</label>
        <div className="grid grid-cols-4 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              className={`flex h-12 items-center justify-center rounded-md border text-xl transition-colors ${
                avatar === a
                  ? "border-gold-500 bg-abyss-700/70 shadow-glow"
                  : "border-abyss-600 bg-abyss-800/60 hover:border-gold-700/50"
              }`}
            >
              {AVATAR_GLYPHS[a]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Bio</label>
        <textarea
          className="input min-h-20"
          maxLength={500}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Who are you, composer?"
        />
      </div>
      <div>
        <label className="label">Profile Visibility</label>
        <select
          className="input"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="PUBLIC">Public — visible in the Guild</option>
          <option value="PRIVATE">Private — only you</option>
        </select>
      </div>
      {message && (
        <p className={`text-sm ${message.ok ? "text-emerald-300" : "text-crimson-400"}`}>
          {message.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
