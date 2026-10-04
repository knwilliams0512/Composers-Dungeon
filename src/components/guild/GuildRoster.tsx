"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { avatarGlyph } from "@/lib/enums";
import { boostMember } from "@/server/actions/guild-life";

export interface RosterMember {
  userId: string;
  displayName: string;
  avatar: string;
  level: number;
  role: string;
  joinedAt: string;
  isPrivate: boolean;
  isMe: boolean;
  /** Boosts received, all time, and whether this composer has had one today. */
  boostsReceived: number;
  boostedByMeToday: boolean;
  lastNote: string | null;
}

/**
 * Who is in the house, and the one thing you can do for them.
 *
 * The boost is the only outward action on this list, and it is deliberately
 * narrow: a named composer saying a specific thing about your work, three a
 * day, never to yourself and never twice to the same person in a day. The
 * limit is not there to create scarcity for its own sake — it is there so that
 * receiving one means somebody chose you over two other people.
 */
export function GuildRoster({
  members,
  guildKey,
  remaining,
}: {
  members: RosterMember[];
  guildKey: string;
  remaining: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(remaining);

  async function send(toUserId: string) {
    setBusy(true);
    setError(null);
    const res = await boostMember({ guildKey, toUserId, note });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "That did not work");
      return;
    }
    setLeft(res.remaining ?? Math.max(0, left - 1));
    setOpen(null);
    setNote("");
    router.refresh();
  }

  return (
    <section className="card p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="heading-display text-base">
          <Icon name="users" size={15} className="mr-1.5 inline text-teal-300" />
          The Roster
        </h3>
        <p className="text-xs text-parchment-500">
          {left > 0 ? (
            <>
              <span className="text-gold-300">{left}</span> boost{left === 1 ? "" : "s"} left
              today
            </>
          ) : (
            "No boosts left today"
          )}
        </p>
      </header>

      <ul className="space-y-2">
        {members.map((m) => (
          <li
            key={m.userId}
            className="rounded-lg border border-abyss-600/60 bg-abyss-900/40 p-3"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xl" aria-hidden>
                {avatarGlyph(m.avatar)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm text-parchment-100">
                  {m.isPrivate || m.isMe ? (
                    <span>{m.displayName}</span>
                  ) : (
                    <Link
                      href={`/guild/composer/${m.userId}`}
                      className="hover:text-gold-300 hover:underline"
                    >
                      {m.displayName}
                    </Link>
                  )}
                  {m.role === "FOUNDER" && (
                    <span className="rounded-full border border-gold-700/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-gold-400">
                      Founder
                    </span>
                  )}
                  {m.isMe && <span className="text-[10px] text-parchment-500">(you)</span>}
                </p>
                <p className="text-xs text-parchment-500">
                  Level {m.level}
                  {m.boostsReceived > 0 && (
                    <>
                      {" · "}
                      <span className="text-teal-300">
                        {m.boostsReceived} boost{m.boostsReceived === 1 ? "" : "s"}
                      </span>
                    </>
                  )}
                </p>
              </div>

              {!m.isMe && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(open === m.userId ? null : m.userId);
                    setNote("");
                    setError(null);
                  }}
                  disabled={m.boostedByMeToday || left === 0}
                  className="btn-secondary shrink-0 text-xs disabled:opacity-40"
                  title={
                    m.boostedByMeToday
                      ? "You have already lifted them today"
                      : left === 0
                        ? "No boosts left today"
                        : `Lift ${m.displayName}`
                  }
                >
                  <Icon name="flame" size={13} />
                  {m.boostedByMeToday ? "Lifted" : "Boost"}
                </button>
              )}
            </div>

            {m.lastNote && (
              <p className="mt-2 border-l-2 border-teal-500/40 pl-2.5 text-xs italic leading-relaxed text-parchment-400">
                “{m.lastNote}”
              </p>
            )}

            {open === m.userId && (
              <div className="mt-3 space-y-2 border-t border-abyss-600/60 pt-3">
                <label className="label" htmlFor={`boost-${m.userId}`}>
                  What are you lifting them for?
                </label>
                <textarea
                  id={`boost-${m.userId}`}
                  className="input min-h-16 text-sm"
                  maxLength={240}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="The bass line in your last piece did the whole job on its own."
                />
                {error && <p className="text-xs text-crimson-400">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => send(m.userId)}
                    disabled={busy || note.trim().length < 4}
                    className="btn-primary text-xs"
                  >
                    {busy ? "Sending…" : "Send it"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(null)}
                    className="btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
