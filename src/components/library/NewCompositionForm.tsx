"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createComposition } from "@/server/actions/profile";

export function NewCompositionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scoreLink, setScoreLink] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary">
        🖋️ File a New Composition
      </button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await createComposition({ title, description, scoreLink, visibility });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Filing failed");
      return;
    }
    setOpen(false);
    setTitle("");
    setDescription("");
    setScoreLink("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <p className="font-display text-gold-300">File a New Composition</p>
      <div>
        <label className="label">Title</label>
        <input
          className="input"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-16"
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Score Link (optional)</label>
        <input
          className="input"
          type="url"
          value={scoreLink}
          onChange={(e) => setScoreLink(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Visibility</label>
        <select
          className="input"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="PRIVATE">Private</option>
          <option value="PUBLIC">Public</option>
        </select>
      </div>
      {error && <p className="text-sm text-crimson-400">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Filing…" : "File It"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
