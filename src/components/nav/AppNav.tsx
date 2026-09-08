"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { Icon, type IconName } from "@/components/ui/Icon";

interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: IconName;
  /**
   * The colour this place answers to. Each destination keeps its own mark and
   * its own hue, so the sidebar reads as a set of doors rather than a column
   * of identical grey glyphs — and you learn the shape of the app by colour
   * before you have read a single label.
   */
  tint: string;
  /** The bottom bar only has room for six; the rest live in the sidebar. */
  mobile?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/hall", label: "Entrance Hall", short: "Hall", icon: "hall", tint: "#f2cf68", mobile: true },
  { href: "/academy", label: "Academy", short: "Academy", icon: "book", tint: "#8fbcff", mobile: true },
  { href: "/dungeon", label: "Dungeon", short: "Dungeon", icon: "arch", tint: "#a3b4ff", mobile: true },
  { href: "/workshop", label: "Workshop", short: "Write", icon: "quill", tint: "#6fe9b4", mobile: true },
  { href: "/bosses", label: "Bosses", short: "Bosses", icon: "skull", tint: "#eef0fa" },
  { href: "/studio", label: "Studio", short: "Studio", icon: "waveform", tint: "#7fd6ff", mobile: true },
  { href: "/library", label: "Library", short: "Library", icon: "scroll", tint: "#9cc6ff", mobile: true },
  { href: "/guild", label: "Guild", short: "Guild", icon: "users", tint: "#5ee6da" },
  { href: "/profile", label: "Profile", short: "Profile", icon: "user", tint: "#93baff", mobile: true },
  { href: "/settings", label: "Settings", short: "Settings", icon: "settings", tint: "#dde0f0" },
];

export function AppNav({
  displayName,
  level,
  avatarGlyph,
}: {
  displayName: string;
  level: number;
  avatarGlyph: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-abyss-700/60 bg-abyss-900/80 backdrop-blur md:flex">
        <Link href="/hall" className="flex items-center gap-3 border-b border-abyss-700/60 px-5 py-5">
          <Icon
            name="clef"
            size={34}
            strokeWidth={1.7}
            className="text-gold-300 drop-shadow-[0_0_10px_rgba(230,192,95,0.45)]"
          />
          <div>
          <p className="font-display text-lg leading-tight text-gold-200">
            Composer&apos;s
            <br />
            Dungeon
          </p>
          <p className="mt-1 whitespace-nowrap text-[9px] uppercase tracking-[0.2em] text-parchment-400">
            Learn · Create · Ascend
          </p>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "border border-gold-600/50 bg-abyss-700 text-gold-200 shadow-glow"
                    : "border border-transparent text-parchment-200 hover:bg-abyss-800 hover:text-parchment-50"
                }`}
              >
                <Icon
                  name={item.icon}
                  size={21}
                  solid
                  /* The mark keeps its own colour whether or not you are
                     standing in that room; only the label and the plate
                     change, so the sidebar never loses its map. */
                  style={{ color: item.tint }}
                  className={active ? "" : "opacity-90 transition-opacity group-hover:opacity-100"}
                />
                <span className="font-semibold tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-abyss-700/60 p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-700/50 bg-abyss-800 text-lg">
              {avatarGlyph}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-parchment-100">
                {displayName}
              </p>
              <p className="text-xs text-parchment-500">Level {level} · Composer</p>
            </div>
            <Icon name="chevron" size={14} className="shrink-0 text-parchment-600" />
          </div>
          <InstallAppButton className="mb-2" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-abyss-600 px-3 py-2 text-xs text-parchment-400 transition-colors hover:border-crimson-600 hover:text-crimson-400"
          >
            <Icon name="arrow" size={13} /> Leave the Dungeon
          </button>
          <p className="mx-auto mt-3 max-w-[150px] text-center font-display text-[12px] italic leading-snug text-parchment-500">
            &ldquo;Better composers build habits.&rdquo;
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-abyss-700/60 bg-abyss-900/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/hall" className="flex items-center gap-2 font-display text-gold-200">
          <Icon name="clef" size={24} strokeWidth={1.7} className="text-gold-300" />
          Composer&apos;s Dungeon
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-xs text-parchment-500"
        >
          Sign out
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-abyss-700/60 bg-abyss-900/95 px-1 py-1.5 backdrop-blur md:hidden">
        {NAV_ITEMS.filter((i) => i.mobile).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center rounded px-2 py-1 text-[10px] ${
              isActive(item.href) ? "text-gold-200" : "text-parchment-300"
            }`}
          >
            <Icon
              name={item.icon}
              size={19}
              solid
              style={{ color: item.tint }}
              className={`mb-0.5 ${isActive(item.href) ? "" : "opacity-80"}`}
            />
            {item.short}
          </Link>
        ))}
      </nav>
    </>
  );
}
