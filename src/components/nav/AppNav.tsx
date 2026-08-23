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
  /** The bottom bar only has room for six; the rest live in the sidebar. */
  mobile?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/hall", label: "Entrance Hall", short: "Hall", icon: "hall", mobile: true },
  { href: "/academy", label: "Academy", short: "Academy", icon: "book", mobile: true },
  { href: "/dungeon", label: "Dungeon", short: "Dungeon", icon: "candle", mobile: true },
  { href: "/workshop", label: "Workshop", short: "Write", icon: "quill", mobile: true },
  { href: "/bosses", label: "Bosses", short: "Bosses", icon: "skull" },
  { href: "/library", label: "Library", short: "Library", icon: "scroll", mobile: true },
  { href: "/guild", label: "Guild", short: "Guild", icon: "shield" },
  { href: "/profile", label: "Profile", short: "Profile", icon: "feather", mobile: true },
  { href: "/settings", label: "Settings", short: "Settings", icon: "settings" },
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
          <Icon name="note" size={26} className="text-gold-400" />
          <div>
          <p className="font-display text-lg leading-tight text-gold-300">
            Composer&apos;s
            <br />
            Dungeon
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-parchment-500">
            Learn · Descend
          </p>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-abyss-700/80 text-gold-300 shadow-glow"
                  : "text-parchment-300 hover:bg-abyss-800 hover:text-parchment-100"
              }`}
            >
              <Icon
                name={item.icon}
                size={17}
                className={isActive(item.href) ? "text-gold-400" : "text-parchment-500"}
              />
              <span className="font-semibold tracking-wide">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-abyss-700/60 p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-700/50 bg-abyss-800 text-lg">
              {avatarGlyph}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-parchment-100">
                {displayName}
              </p>
              <p className="text-xs text-parchment-500">Level {level} Composer</p>
            </div>
          </div>
          <InstallAppButton className="mb-2" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-md border border-abyss-600 px-3 py-1.5 text-xs text-parchment-400 transition-colors hover:border-crimson-600 hover:text-crimson-400"
          >
            Leave the Dungeon
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-abyss-700/60 bg-abyss-900/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/hall" className="flex items-center gap-2 font-display text-gold-300">
          <Icon name="note" size={20} className="text-gold-400" />
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
              isActive(item.href) ? "text-gold-300" : "text-parchment-500"
            }`}
          >
            <Icon name={item.icon} size={17} className="mb-0.5" />
            {item.short}
          </Link>
        ))}
      </nav>
    </>
  );
}
