"use client";

import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * The guild page's four rooms.
 *
 * A client component holding server-rendered children: each tab's content is
 * built on the server and handed down as a node, so the roster, the board, the
 * collaborations and the raids are all real server components and switching
 * between them costs nothing. Only the tab strip itself needs to be
 * interactive.
 *
 * All four are mounted at once and hidden with CSS rather than unmounted. That
 * is deliberate for the room: a chat that forgets its scroll position and
 * re-polls from scratch every time somebody glances at the roster is worse
 * than a little extra markup.
 */
export interface GuildTab {
  id: string;
  label: string;
  icon: IconName;
  badge?: number;
  content: ReactNode;
}

export function GuildTabs({ tabs }: { tabs: GuildTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Guild"
        className="mb-5 flex flex-wrap gap-1.5 border-b border-abyss-600/60 pb-2"
      >
        {tabs.map((tab) => {
          const on = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={on}
              aria-controls={`guild-panel-${tab.id}`}
              id={`guild-tab-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                on
                  ? "bg-white/[0.07] text-gold-200 ring-1 ring-inset ring-gold-600/40"
                  : "text-parchment-400 hover:bg-white/[0.04] hover:text-parchment-200"
              }`}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span className="rounded-full bg-abyss-900 px-1.5 text-[10px] text-parchment-400">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`guild-panel-${tab.id}`}
          aria-labelledby={`guild-tab-${tab.id}`}
          hidden={tab.id !== active}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
