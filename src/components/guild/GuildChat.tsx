"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { avatarGlyph } from "@/lib/enums";
import {
  fetchGuildMessages,
  sendGuildMessage,
  type GuildChatLine,
} from "@/server/actions/guild-life";

/**
 * The guild's room.
 *
 * Polled, not pushed, and unapologetically so. There is no server behind this
 * app — it is a process on one machine that stops when the window closes — so
 * there is nothing to hold a socket open against. A query every three seconds
 * against a table on the same disk is cheaper than the machinery that would
 * avoid it.
 *
 * Two details worth keeping: the poll asks only for lines newer than the last
 * one it has, so a long conversation does not re-send itself every tick; and
 * it stops entirely while the tab is hidden, because a background window
 * quietly waking the disk every three seconds for a room nobody is reading is
 * how a local app earns a reputation for being heavy.
 */
export function GuildChat({ guildKey }: { guildKey: string }) {
  const [lines, setLines] = useState<GuildChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);
  const newest = useRef<string | undefined>(undefined);
  // Only stick to the bottom when the reader is already there; yanking
  // somebody back down while they are reading older lines is rude.
  const pinned = useRef(true);

  const poll = useCallback(async () => {
    const res = await fetchGuildMessages({ guildKey, after: newest.current });
    if (!res.ok || !res.messages) return;
    setLoaded(true);
    if (res.messages.length === 0) return;
    newest.current = res.messages[res.messages.length - 1].createdAt;
    setLines((prev) => {
      const seen = new Set(prev.map((l) => l.id));
      const added = res.messages!.filter((l) => !seen.has(l.id));
      return added.length ? [...prev, ...added] : prev;
    });
  }, [guildKey]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (cancelled || document.hidden) return;
      void poll();
    };

    void poll();
    timer = setInterval(tick, 3000);

    // Catch up the moment the tab comes back, rather than up to three
    // seconds later.
    const onVisible = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  useEffect(() => {
    const el = scroller.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [lines]);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    setError(null);
    const res = await sendGuildMessage({ guildKey, content });
    setSending(false);
    if (!res.ok) {
      setError(res.error ?? "That did not send");
      return;
    }
    setDraft("");
    pinned.current = true;
    await poll();
  }

  return (
    <section className="card flex h-[32rem] flex-col p-0">
      <header className="flex items-center gap-2 border-b border-abyss-600/60 px-5 py-3">
        <Icon name="users" size={15} className="text-teal-300" />
        <h3 className="heading-display text-base">The Room</h3>
        <span className="ml-auto text-[10px] uppercase tracking-widest text-parchment-600">
          Members only
        </span>
      </header>

      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
      >
        {!loaded && <p className="text-sm text-parchment-500">Listening…</p>}
        {loaded && lines.length === 0 && (
          <p className="text-sm text-parchment-500">
            Nobody has said anything yet. Rooms are quieter than boards — that is what
            they are for.
          </p>
        )}
        {lines.map((line, i) => {
          // Consecutive lines from the same composer read as one turn of
          // speech, which is how people actually talk.
          const runOn = i > 0 && lines[i - 1].authorId === line.authorId;
          return (
            <div key={line.id} className={runOn ? "pl-9" : "flex gap-3"}>
              {!runOn && (
                <span className="mt-0.5 text-lg leading-none" aria-hidden>
                  {avatarGlyph(line.avatar)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                {!runOn && (
                  <p className="flex items-baseline gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        line.mine ? "text-gold-300" : "text-parchment-200"
                      }`}
                    >
                      {line.author}
                    </span>
                    <time
                      className="text-[10px] text-parchment-600"
                      dateTime={line.createdAt}
                    >
                      {new Date(line.createdAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-parchment-300">
                  {line.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="border-t border-abyss-600/60 p-3">
        {error && <p className="mb-2 text-xs text-crimson-400">{error}</p>}
        <div className="flex gap-2">
          <input
            className="input flex-1"
            maxLength={600}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Say something to the house…"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="btn-primary shrink-0"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
