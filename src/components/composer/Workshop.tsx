"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScoreEditor } from "@/components/composer/ScoreEditor";
import { Icon } from "@/components/ui/Icon";
import { createComposition } from "@/server/actions/profile";
import { ALL_TIERS, type Freedom } from "@/lib/composer-freedom";
import { emptyScore, type Check, type CheckId, type Score } from "@/lib/score";

const KEYS = ["C", "G", "D", "A", "E", "F", "Bb", "Eb", "Ab"];
const METERS = [
  { label: "4/4", beats: 4, unit: 4 },
  { label: "3/4", beats: 3, unit: 4 },
  { label: "2/4", beats: 2, unit: 4 },
  { label: "6/8", beats: 6, unit: 8 },
  { label: "5/4", beats: 5, unit: 4 },
];
const INSTRUMENTS = ["PIANO", "STRINGS", "FLUTE", "HARP", "ORGAN"];

/** Optional self-imposed standards — the same engine the dungeon grades with. */
const PRACTICE_CHECKS: { id: CheckId; label: string }[] = [
  { id: "in-key", label: "Stay in the key" },
  { id: "ends-on-tonic", label: "End on the tonic" },
  { id: "fills-all-bars", label: "Fill every bar" },
  { id: "mostly-stepwise", label: "Mostly stepwise" },
  { id: "single-climax", label: "One high point" },
  { id: "rhythmic-variety", label: "Varied rhythm" },
  { id: "motif-repetition", label: "Bring an idea back" },
  { id: "authentic-cadence", label: "Finish V–I" },
];

export function Workshop({ freedom }: { freedom: Freedom }) {
  const router = useRouter();
  const [score, setScore] = useState<Score>(() =>
    emptyScore({ bars: Math.min(4, freedom.maxBars) })
  );
  const [selected, setSelected] = useState<CheckId[]>([]);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const checks: Check[] = selected.map((id) => ({ id }));
  const locked = !freedom.canEditSetup;

  function update(patch: Partial<Score>) {
    setScore((s) => {
      const next = { ...s, ...patch };
      // Shortening the piece must not leave notes hanging past the end.
      const ticks = (next.meter.beats * (16 / next.meter.unit)) * next.bars;
      return {
        ...next,
        melody: next.melody.filter((n) => n.start + n.duration <= ticks),
        chords: next.chords.filter((c) => c.start + c.duration <= ticks),
      };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await createComposition({ title, visibility, score });
    setBusy(false);
    if (!res.ok) {
      setMessage({ ok: false, text: res.error ?? "Could not save" });
      return;
    }
    setMessage({ ok: true, text: "Saved to your Library." });
    setTitle("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* ---- Setup --------------------------------------------------------- */}
      <section className="card lit-edge p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="heading-display text-lg">The Brief Is Yours</h2>
            <p className="mt-1 text-sm text-parchment-400">
              No trial, no standard to meet. Set the piece up however you like and write.
            </p>
          </div>
          <span className="pill-arcane">
            <Icon name="quill" size={11} /> {freedom.name}
          </span>
        </div>

        {locked && (
          <p className="mt-3 flex gap-2 rounded-lg border border-abyss-600/70 bg-abyss-900/50 p-3 text-xs leading-relaxed text-parchment-400">
            <Icon name="lock" size={14} className="mt-0.5 shrink-0 text-gold-600" />
            <span>
              Key, meter and tempo unlock at the <strong>Master</strong> tier.{" "}
              {freedom.next ?? ""} Until then the Workshop keeps the setup simple so you can
              concentrate on the notes.
            </span>
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <label className="block">
            <span className="label">Key</span>
            <select
              className="input"
              value={score.key}
              disabled={locked}
              onChange={(e) => update({ key: e.target.value })}
            >
              {KEYS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Mode</span>
            <select
              className="input"
              value={score.mode}
              disabled={locked}
              onChange={(e) => update({ mode: e.target.value as "major" | "minor" })}
            >
              <option value="major">major</option>
              <option value="minor">minor</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Meter</span>
            <select
              className="input"
              value={`${score.meter.beats}/${score.meter.unit}`}
              disabled={locked}
              onChange={(e) => {
                const m = METERS.find((x) => x.label === e.target.value);
                if (m) update({ meter: { beats: m.beats, unit: m.unit } });
              }}
            >
              {METERS.map((m) => (
                <option key={m.label}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Bars</span>
            <select
              className="input"
              value={score.bars}
              onChange={(e) => update({ bars: Number(e.target.value) })}
            >
              {Array.from({ length: freedom.maxBars }, (_, i) => i + 1)
                .filter((n) => n % 2 === 0 || n === 1)
                .map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Instrument</span>
            <select
              className="input"
              value={score.instrument}
              onChange={(e) => update({ instrument: e.target.value })}
            >
              {INSTRUMENTS.map((i) => (
                <option key={i} value={i}>
                  {i.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5">
          <p className="label">Hold yourself to something (optional)</p>
          <div className="flex flex-wrap gap-2">
            {PRACTICE_CHECKS.map((c) => {
              const on = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setSelected((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))
                  }
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                    on
                      ? "border-gold-600 bg-abyss-700 text-gold-300"
                      : "border-abyss-600 text-parchment-400 hover:border-gold-700/60"
                  }`}
                >
                  {on && <Icon name="check" size={10} className="mr-1 inline" />}
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <ScoreEditor score={score} onChange={setScore} freedom={freedom} checks={checks} />

      {/* ---- Save ---------------------------------------------------------- */}
      <form onSubmit={save} className="card lit-edge space-y-4 p-5">
        <h3 className="heading-display text-lg">Keep It</h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <div>
            <label className="label" htmlFor="ws-title">
              Title
            </label>
            <input
              id="ws-title"
              className="input"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name your creation"
            />
          </div>
          <div>
            <label className="label" htmlFor="ws-vis">
              Visibility
            </label>
            <select
              id="ws-vis"
              className="input"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="PRIVATE">Private</option>
              <option value="PUBLIC">Public</option>
            </select>
          </div>
        </div>
        {message && (
          <p
            className={`flex items-center gap-2 text-sm ${
              message.ok ? "text-emerald-300" : "text-crimson-400"
            }`}
          >
            <Icon name={message.ok ? "check" : "warning"} size={15} />
            {message.text}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary">
          <Icon name="quill" size={15} />
          {busy ? "Saving…" : "Save to Library"}
        </button>
      </form>

      {/* ---- Tier ladder ---------------------------------------------------- */}
      <section className="card p-5">
        <h3 className="heading-display text-base">What Unlocks Next</h3>
        <ol className="mt-3 space-y-2">
          {ALL_TIERS.map((t) => (
            <li
              key={t.tier}
              className={`flex gap-3 rounded-lg border p-3 ${
                t.tier === freedom.tier
                  ? "border-gold-700/60 bg-abyss-900/50"
                  : t.tier < freedom.tier
                    ? "border-emerald-700/40 opacity-70"
                    : "border-abyss-600/60 opacity-60"
              }`}
            >
              <Icon
                name={t.tier <= freedom.tier ? "check" : "lock"}
                size={15}
                className={`mt-0.5 shrink-0 ${
                  t.tier <= freedom.tier ? "text-emerald-400" : "text-parchment-500"
                }`}
              />
              <div>
                <p className="text-sm text-parchment-100">
                  {t.name}
                  {t.tier === freedom.tier && (
                    <span className="ml-2 text-[11px] text-gold-400">you are here</span>
                  )}
                </p>
                <p className="text-xs leading-relaxed text-parchment-500">{t.blurb}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
