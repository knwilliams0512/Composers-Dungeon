"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { AwardBanner } from "@/components/ui/AwardBanner";
import { ScoreEditor } from "@/components/composer/ScoreEditor";
import { setupForProject, describeSetup } from "@/lib/collab";
import type { Freedom } from "@/lib/composer-freedom";
import type { Score } from "@/lib/score";
import {
  claimPart,
  completeCollabProject,
  createCollabProject,
  releasePart,
  submitPart,
  type CollabResult,
} from "@/server/actions/collab";
import type { AwardResult } from "@/lib/progression";

export interface CollabPartView {
  id: string;
  name: string;
  instrument: string;
  order: number;
  claimedById: string | null;
  claimedBy: string | null;
  written: boolean;
  notes: string;
  score: string | null;
}

export interface CollabProjectView {
  id: string;
  title: string;
  brief: string;
  musicalKey: string;
  mode: string;
  meter: string;
  bars: number;
  status: string;
  createdById: string;
  createdBy: string;
  createdAt: string;
  parts: CollabPartView[];
}

const SUGGESTED_PARTS = [
  ["Melody", "Bass"],
  ["Melody", "Inner voices", "Bass"],
  ["Soprano", "Alto", "Tenor", "Bass"],
];

/**
 * Pieces the guild writes together, one part each.
 *
 * The part is the unit of collaboration, and claiming one is a commitment
 * rather than a reservation — a composer may hold exactly one part of a given
 * piece at a time, so nobody finishes a "collaboration" by taking all four
 * lines themselves. Putting a part back leaves whatever was written on it, so
 * the next person continues rather than starts over.
 *
 * Every part opens in the composer at the project's own key, meter and length.
 * That is not decoration: a part in a different key is not a disagreement, it
 * is a part that cannot be played, and the server refuses it.
 */
export function CollabProjects({
  projects,
  guildKey,
  userId,
  freedom,
}: {
  projects: CollabProjectView[];
  guildKey: string;
  userId: string;
  freedom: Freedom;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** What the last collaborative act earned. Writing a part pays 70, finishing 150. */
  const [award, setAward] = useState<AwardResult | null>(null);

  async function run(fn: () => Promise<CollabResult>) {
    setBusy(true);
    setError(null);
    setAward(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "That did not work");
      return false;
    }
    // Claiming a part carries no award, so this stays null for those; writing
    // one or finishing a piece carries a real one that used to be thrown away.
    if (res.award) setAward(res.award);
    router.refresh();
    return true;
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="heading-display text-base">
          <Icon name="quill" size={15} className="mr-1.5 inline text-emerald-300" />
          Written Together
        </h3>
        <button
          type="button"
          onClick={() => setCreating((c) => !c)}
          className="btn-secondary text-xs"
        >
          <Icon name="quill" size={13} />
          {creating ? "Cancel" : "Start a piece"}
        </button>
      </header>

      {award && <AwardBanner award={award} />}

      {error && (
        <p className="rounded-lg border border-crimson-600/50 bg-crimson-900/20 px-3 py-2 text-sm text-crimson-300">
          {error}
        </p>
      )}

      {creating && (
        <NewProjectForm
          guildKey={guildKey}
          busy={busy}
          onDone={async (input) => {
            const ok = await run(() => createCollabProject(input));
            if (ok) setCreating(false);
          }}
        />
      )}

      {projects.length === 0 && !creating && (
        <p className="card p-5 text-sm leading-relaxed text-parchment-500">
          Nothing on the stands yet. A collaboration is one piece split into named parts —
          melody, bass, inner voices — with one composer on each. Everybody writes against
          the same key, meter and length, so the parts fit when they arrive.
        </p>
      )}

      {projects.map((project) => {
        const myPart = project.parts.find((p) => p.claimedById === userId);
        const written = project.parts.filter((p) => p.written).length;
        const complete = project.status === "COMPLETE";
        return (
          <article
            key={project.id}
            className={`card p-5 ${complete ? "border-emerald-600/40" : ""}`}
          >
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="heading-display text-lg">{project.title}</h4>
                <p className="text-xs text-parchment-500">
                  {describeSetup(project)} · started by {project.createdBy}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-widest ${
                  complete
                    ? "border border-emerald-600/50 text-emerald-300"
                    : "border border-abyss-600 text-parchment-500"
                }`}
              >
                {complete ? "Finished" : `${written}/${project.parts.length} parts written`}
              </span>
            </header>

            {project.brief && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-parchment-400">
                {project.brief}
              </p>
            )}

            <ul className="mt-4 space-y-2">
              {project.parts.map((part) => {
                const isMine = part.claimedById === userId;
                return (
                  <li
                    key={part.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-abyss-600/60 bg-abyss-900/40 px-3 py-2.5"
                  >
                    <Icon
                      name={part.written ? "check" : "note"}
                      size={14}
                      className={part.written ? "text-emerald-400" : "text-parchment-600"}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-parchment-100">
                        {part.name}
                        {part.instrument && (
                          <span className="text-parchment-500"> · {part.instrument}</span>
                        )}
                      </p>
                      <p className="text-xs text-parchment-500">
                        {part.claimedBy
                          ? isMine
                            ? "Yours"
                            : part.claimedBy
                          : "Unclaimed"}
                        {part.written && " · written"}
                      </p>
                    </div>

                    {!complete && (
                      <div className="flex shrink-0 gap-2">
                        {isMine ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setEditing(editing === part.id ? null : part.id)
                              }
                              className="btn-primary text-xs"
                            >
                              {editing === part.id
                                ? "Close"
                                : part.written
                                  ? "Revise"
                                  : "Write it"}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => run(() => releasePart(part.id))}
                              className="btn-ghost text-xs text-parchment-500"
                            >
                              Put back
                            </button>
                          </>
                        ) : (
                          !part.claimedById && (
                            <button
                              type="button"
                              disabled={busy || Boolean(myPart)}
                              onClick={() => run(() => claimPart(part.id))}
                              className="btn-secondary text-xs disabled:opacity-40"
                              title={
                                myPart
                                  ? `You already have "${myPart.name}"`
                                  : `Take ${part.name}`
                              }
                            >
                              Take it
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {part.notes && (
                      <p className="w-full border-l-2 border-abyss-600 pl-2.5 text-xs italic text-parchment-500">
                        {part.notes}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            {editing && project.parts.some((p) => p.id === editing) && (
              <PartEditor
                project={project}
                part={project.parts.find((p) => p.id === editing)!}
                freedom={freedom}
                busy={busy}
                onSubmit={async (score, notes) => {
                  const ok = await run(() =>
                    submitPart({ partId: editing, score, notes })
                  );
                  if (ok) setEditing(null);
                }}
              />
            )}

            {!complete && project.createdById === userId && (
              <button
                type="button"
                disabled={busy || written < project.parts.length}
                onClick={() => run(() => completeCollabProject(project.id))}
                className="btn-primary mt-4 text-xs disabled:opacity-40"
                title={
                  written < project.parts.length
                    ? "Every part needs music in it first"
                    : "Call it finished"
                }
              >
                <Icon name="check" size={13} /> Call it finished
              </button>
            )}
          </article>
        );
      })}
    </section>
  );
}

function NewProjectForm({
  guildKey,
  busy,
  onDone,
}: {
  guildKey: string;
  busy: boolean;
  onDone: (input: {
    guildKey: string;
    title: string;
    brief: string;
    musicalKey: string;
    mode: string;
    meter: string;
    bars: number;
    parts: { name: string; instrument: string }[];
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [musicalKey, setKey] = useState("C");
  const [mode, setMode] = useState("major");
  const [meter, setMeter] = useState("4/4");
  const [bars, setBars] = useState(8);
  const [parts, setParts] = useState<{ name: string; instrument: string }[]>([
    { name: "Melody", instrument: "" },
    { name: "Bass", instrument: "" },
  ]);

  return (
    <form
      className="card space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onDone({ guildKey, title, brief, musicalKey, mode, meter, bars, parts });
      }}
    >
      <div>
        <label className="label" htmlFor="collab-title">Title</label>
        <input
          id="collab-title"
          className="input"
          required
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Something for four hands"
        />
      </div>

      <div>
        <label className="label" htmlFor="collab-brief">
          What is everyone writing? (optional)
        </label>
        <textarea
          id="collab-brief"
          className="input min-h-20"
          maxLength={600}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Slow, in two halves, and the bass should never move faster than the melody."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="label" htmlFor="collab-key">Key</label>
          <select
            id="collab-key"
            className="input"
            value={musicalKey}
            onChange={(e) => setKey(e.target.value)}
          >
            {["C", "G", "D", "A", "E", "F", "Bb", "Eb", "Ab"].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="collab-mode">Mode</label>
          <select
            id="collab-mode"
            className="input"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="major">major</option>
            <option value="minor">minor</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="collab-meter">Meter</label>
          <select
            id="collab-meter"
            className="input"
            value={meter}
            onChange={(e) => setMeter(e.target.value)}
          >
            {["4/4", "3/4", "2/4", "6/8", "5/4"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="collab-bars">Bars</label>
          <input
            id="collab-bars"
            type="number"
            min={4}
            max={32}
            className="input"
            value={bars}
            onChange={(e) => setBars(Number(e.target.value) || 8)}
          />
        </div>
      </div>

      <div>
        <p className="label">Parts</p>
        <div className="mb-2 flex flex-wrap gap-2">
          {SUGGESTED_PARTS.map((set) => (
            <button
              key={set.join("-")}
              type="button"
              onClick={() => setParts(set.map((n) => ({ name: n, instrument: "" })))}
              className="rounded-full border border-parchment-100/15 px-3 py-1 text-xs text-parchment-300 transition hover:border-gold-500/50 hover:text-gold-200"
            >
              {set.join(" · ")}
            </button>
          ))}
        </div>
        <ul className="space-y-2">
          {parts.map((part, i) => (
            <li key={i} className="flex gap-2">
              <input
                className="input flex-1"
                maxLength={40}
                required
                value={part.name}
                onChange={(e) =>
                  setParts((p) =>
                    p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                  )
                }
                placeholder="Part name"
              />
              <input
                className="input flex-1"
                maxLength={40}
                value={part.instrument}
                onChange={(e) =>
                  setParts((p) =>
                    p.map((x, j) => (j === i ? { ...x, instrument: e.target.value } : x))
                  )
                }
                placeholder="Instrument (optional)"
              />
              {parts.length > 2 && (
                <button
                  type="button"
                  onClick={() => setParts((p) => p.filter((_, j) => j !== i))}
                  className="btn-ghost shrink-0 text-xs text-parchment-500"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {parts.length < 8 && (
          <button
            type="button"
            onClick={() => setParts((p) => [...p, { name: "", instrument: "" }])}
            className="btn-ghost mt-2 text-xs"
          >
            Add a part
          </button>
        )}
      </div>

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? "Setting it up…" : "Put it on the stands"}
      </button>
    </form>
  );
}

function PartEditor({
  project,
  part,
  freedom,
  busy,
  onSubmit,
}: {
  project: CollabProjectView;
  part: CollabPartView;
  freedom: Freedom;
  busy: boolean;
  onSubmit: (score: Score, notes: string) => void;
}) {
  const [score, setScore] = useState<Score>(() => {
    if (part.score) {
      try {
        return JSON.parse(part.score) as Score;
      } catch {
        // A part that will not parse is a part that has to be rewritten; the
        // blank one below is a better answer than a crash.
      }
    }
    return setupForProject(project);
  });
  const [notes, setNotes] = useState(part.notes);

  return (
    <div className="mt-4 rounded-lg border border-abyss-600/60 bg-abyss-900/40 p-4">
      <p className="mb-3 text-sm text-parchment-300">
        Writing <span className="text-gold-300">{part.name}</span> — {describeSetup(project)}.
      </p>
      <ScoreEditor score={score} onChange={setScore} freedom={freedom} checks={[]} />
      <div className="mt-3 space-y-2">
        <input
          className="input"
          maxLength={400}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="A note for the others about this part (optional)"
        />
        <button
          type="button"
          disabled={busy || score.melody.length === 0}
          onClick={() => onSubmit(score, notes)}
          className="btn-primary text-xs disabled:opacity-40"
        >
          {busy ? "Saving…" : part.written ? "Save the revision" : "Hand the part in"}
        </button>
      </div>
    </div>
  );
}
