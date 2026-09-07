"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import {
  joinGuild,
  leaveGuild,
  foundGuild,
  disbandGuild,
} from "@/server/actions/guild";

export interface GuildSummary {
  id: string;
  key: string;
  name: string;
  tagline: string;
  description: string;
  emblem: string;
  accent: string;
  focus: string;
  official: boolean;
  memberCount: number;
}

export interface MyMembership {
  guildId: string;
  role: string;
  joinedAt: string;
}

const FOCUS_LABELS: Record<string, string> = {
  MELODY: "Melody",
  HARMONY: "Harmony",
  RHYTHM: "Rhythm",
  FORM: "Form",
  TECHNIQUE: "Technique",
  EXPRESSION: "Expression",
};

const EMBLEMS = ["♬", "♪", "⚏", "◈", "◲", "☾", "✦", "✧", "❋", "◆"];
const ACCENTS = [
  "#c9a84c",
  "#d4557f",
  "#4f7fd4",
  "#2fb3a7",
  "#9358c9",
  "#e0803a",
  "#2fb37f",
  "#c08adf",
];

export function GuildHall({
  guilds,
  membership,
}: {
  guilds: GuildSummary[];
  membership: MyMembership | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [founding, setFounding] = useState(false);

  const mine = membership ? guilds.find((g) => g.id === membership.guildId) : null;
  const isFounder = membership?.role === "FOUNDER";

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) setError(res.error ?? "That didn't work");
      else router.refresh();
    });
  }

  return (
    <section className="mb-8 space-y-4">
      {error && (
        <p className="rounded-lg border border-crimson-600/50 bg-crimson-900/20 px-3 py-2 text-sm text-crimson-300">
          {error}
        </p>
      )}

      {/* ---- The house you belong to ------------------------------------- */}
      {mine ? (
        <div
          className="relative overflow-hidden rounded-2xl border p-5"
          style={{
            borderColor: `color-mix(in srgb, ${mine.accent} 40%, transparent)`,
            backgroundImage: `linear-gradient(140deg, color-mix(in srgb, ${mine.accent} 26%, transparent) 0%, color-mix(in srgb, ${mine.accent} 8%, transparent) 50%, rgba(10,8,16,0.6) 100%)`,
          }}
        >
          <p
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: `color-mix(in srgb, ${mine.accent} 30%, white)` }}
          >
            <Icon name="users" size={12} /> Your house
            {isFounder && <span className="pill-gold ml-1">Founder</span>}
          </p>
          <div className="mt-2 flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-2xl"
              style={{
                borderColor: `color-mix(in srgb, ${mine.accent} 45%, transparent)`,
                background: `color-mix(in srgb, ${mine.accent} 14%, rgba(12,10,20,0.7))`,
                color: `color-mix(in srgb, ${mine.accent} 55%, #f5ecd7)`,
              }}
            >
              {mine.emblem}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl text-parchment-100">{mine.name}</h2>
              {mine.tagline && (
                <p className="text-sm italic text-parchment-300">{mine.tagline}</p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-parchment-300">
                {mine.description}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-parchment-400">
                <span>
                  {mine.memberCount} member{mine.memberCount === 1 ? "" : "s"}
                </span>
                {mine.focus && (
                  <>
                    <span className="text-parchment-600">·</span>
                    <span>Known for {FOCUS_LABELS[mine.focus] ?? mine.focus}</span>
                  </>
                )}
              </p>
            </div>
            <button
              disabled={pending}
              onClick={() =>
                run(isFounder ? disbandGuild : leaveGuild)
              }
              className="btn-secondary shrink-0 text-xs"
            >
              {isFounder ? "Disband" : "Leave"}
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-5">
          <p className="eyebrow">
            <Icon name="users" size={12} /> No house yet
          </p>
          <p className="mt-2 text-sm leading-relaxed text-parchment-300">
            A guild is the company you keep while you write. Join one below, or
            found your own.
          </p>
        </div>
      )}

      {/* ---- The houses on offer ----------------------------------------- */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="heading-display text-lg">
            {mine ? "Other houses" : "Houses of the Guild"}
          </h2>
          {!mine && (
            <button
              onClick={() => setFounding((f) => !f)}
              className="btn-primary text-xs"
            >
              <Icon name="plus" size={13} /> Found your own
            </button>
          )}
        </div>

        {founding && !mine && (
          <FoundGuildForm
            pending={pending}
            onCancel={() => setFounding(false)}
            onSubmit={(values) =>
              run(async () => {
                const res = await foundGuild(values);
                if (res.ok) setFounding(false);
                return res;
              })
            }
          />
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {guilds
            .filter((g) => g.id !== mine?.id)
            .map((g) => (
              <div
                key={g.id}
                className="relative flex flex-col overflow-hidden rounded-2xl border p-4"
                style={{
                  borderColor: `color-mix(in srgb, ${g.accent} 30%, transparent)`,
                  backgroundImage: `linear-gradient(150deg, color-mix(in srgb, ${g.accent} 18%, transparent) 0%, rgba(10,8,16,0.55) 70%)`,
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xl"
                    style={{
                      borderColor: `color-mix(in srgb, ${g.accent} 45%, transparent)`,
                      background: `color-mix(in srgb, ${g.accent} 14%, rgba(12,10,20,0.7))`,
                      color: `color-mix(in srgb, ${g.accent} 55%, #f5ecd7)`,
                    }}
                  >
                    {g.emblem}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg leading-tight text-parchment-100">
                      {g.name}
                    </h3>
                    {g.tagline && (
                      <p className="text-xs italic text-parchment-400">{g.tagline}</p>
                    )}
                  </div>
                </div>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-parchment-300">
                  {g.description}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-parchment-400">
                    <span>
                      {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                    </span>
                    {g.focus && (
                      <>
                        <span className="text-parchment-600">·</span>
                        <span>{FOCUS_LABELS[g.focus] ?? g.focus}</span>
                      </>
                    )}
                    {!g.official && (
                      <span className="pill-arcane ml-0.5">Player-founded</span>
                    )}
                  </p>
                  <button
                    disabled={pending || isFounder}
                    title={
                      isFounder
                        ? "Disband your own house before joining another"
                        : undefined
                    }
                    onClick={() => run(() => joinGuild(g.id))}
                    className="btn-secondary shrink-0 text-xs disabled:opacity-40"
                  >
                    {mine ? "Switch" : "Join"}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function FoundGuildForm({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    name: string;
    tagline: string;
    description: string;
    emblem: string;
    accent: string;
    focus: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [emblem, setEmblem] = useState(EMBLEMS[0]);
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [focus, setFocus] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, tagline, description, emblem, accent, focus });
      }}
      className="card mb-4 space-y-3 p-5"
    >
      <p className="eyebrow">
        <Icon name="sparkle" size={12} /> Found a house
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.16em] text-parchment-400">
            Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={48}
            placeholder="The Wandering Consort"
            className="mt-1 w-full rounded-md border border-abyss-600 bg-abyss-900 px-3 py-2 text-sm text-parchment-100"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.16em] text-parchment-400">
            Tagline
          </span>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={80}
            placeholder="What the house stands for."
            className="mt-1 w-full rounded-md border border-abyss-600 bg-abyss-900 px-3 py-2 text-sm text-parchment-100"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.16em] text-parchment-400">
          Description
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder="Who it is for, and how its members work."
          className="mt-1 w-full rounded-md border border-abyss-600 bg-abyss-900 px-3 py-2 text-sm text-parchment-100"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <span className="text-[11px] uppercase tracking-[0.16em] text-parchment-400">
            Emblem
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {EMBLEMS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmblem(e)}
                className={`h-8 w-8 rounded-md border text-base transition-colors ${
                  emblem === e
                    ? "border-gold-500 bg-abyss-700 text-gold-300"
                    : "border-abyss-600 bg-abyss-900 text-parchment-300 hover:border-gold-700/60"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-[0.16em] text-parchment-400">
            Colour
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setAccent(c)}
                className={`h-8 w-8 rounded-md border-2 transition-transform ${
                  accent === c ? "scale-110 border-parchment-100" : "border-transparent"
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.16em] text-parchment-400">
            Known for
          </span>
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className="mt-1 w-full rounded-md border border-abyss-600 bg-abyss-900 px-3 py-2 text-sm text-parchment-100"
          >
            <option value="">No specialism</option>
            {Object.entries(FOCUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary text-sm">
          {pending ? "Founding…" : "Found the house"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
