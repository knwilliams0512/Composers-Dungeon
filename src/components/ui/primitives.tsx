import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { Motif, type MotifName } from "./Motif";

/* -------------------------------------------------------------------------- */
/* Panels                                                                      */
/* -------------------------------------------------------------------------- */

export function Panel({
  title,
  icon,
  action,
  subtitle,
  children,
  tone = "plain",
  className = "",
}: {
  title?: string;
  icon?: IconName;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  tone?: "plain" | "gold" | "crimson";
  className?: string;
}) {
  const base = tone === "gold" ? "card-gold" : tone === "crimson" ? "card-crimson" : "card";
  return (
    <section className={`${base} lit-edge p-5 ${className}`}>
      {title && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="heading-display flex items-center gap-2 text-lg">
              {icon && <Icon name={icon} size={18} solid className="text-gold-300" />}
              <span className="truncate">{title}</span>
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-parchment-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-abyss-600/70 px-4 py-5 text-sm text-parchment-500">
      <Icon name={icon} size={20} className="text-abyss-600" />
      <span>{children}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Meters                                                                      */
/* -------------------------------------------------------------------------- */

const METER_FILLS: Record<string, string> = {
  gold: "linear-gradient(90deg,#d9b757,#ffe9a8)",
  arcane: "linear-gradient(90deg,#5a72c4,#aec3f5)",
  crimson: "linear-gradient(90deg,#b8443f,#f09a94)",
  emerald: "linear-gradient(90deg,#35b88c,#9ff0cb)",
};

export function Meter({
  percent,
  color = "gold",
  className = "",
  thick = false,
}: {
  percent: number;
  color?: keyof typeof METER_FILLS;
  className?: string;
  thick?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={`meter-track ${thick ? "h-3" : ""} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="meter-fill"
        style={{ width: `${clamped}%`, backgroundImage: METER_FILLS[color] }}
      />
    </div>
  );
}

/** A skill row: icon, name, level badge, meter, and the XP still to go. */
export function SkillMeter({
  icon,
  name,
  level,
  percent,
  intoLevel,
  needed,
  accent = "#7289d1",
}: {
  icon: IconName;
  name: string;
  level: number;
  percent: number;
  intoLevel?: number;
  needed?: number;
  /** The skill's own jewel tone. */
  accent?: string;
}) {
  return (
    <div className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur transition-transform duration-300 group-hover:scale-110"
        style={{
          borderColor: `color-mix(in srgb, ${accent} 60%, transparent)`,
          background: `color-mix(in srgb, ${accent} 26%, #0b0916)`,
          color: `color-mix(in srgb, ${accent} 88%, white)`,
        }}
      >
        <Icon name={icon} size={17} solid />
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm text-parchment-200">{name}</span>
          {intoLevel !== undefined && needed !== undefined && (
            <span className="shrink-0 text-[10px] tabular-nums text-parchment-500">
              {intoLevel}/{needed} XP
            </span>
          )}
        </div>
        <div className="meter-track mt-1.5">
          <div
            className="meter-fill"
            style={{
              width: `${Math.max(0, Math.min(100, percent))}%`,
              /* Starts at the accent and finishes brighter, so a short bar
                 still reads as its skill's colour instead of a dark stub. */
              background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 68%, white))`,
              color: accent,
            }}
          />
        </div>
      </div>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl border font-display text-sm backdrop-blur"
        style={{
          borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
          background: `color-mix(in srgb, ${accent} 18%, #0b0916)`,
          color: `color-mix(in srgb, ${accent} 30%, white)`,
        }}
      >
        {level}
      </span>
    </div>
  );
}

/** Circular XP gauge used on the identity banner. */
export function XpRing({
  percent,
  level,
  size = 92,
}: {
  percent: number;
  level: number;
  size?: number;
}) {
  // Thicker and brighter than it was: this ring is the first thing you look
  // at on the Entrance Hall, and a 6px muted-gold hairline read as a border
  // rather than a gauge.
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#292144"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#xpgrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * clamped) / 100}
          style={{
            transition: "stroke-dashoffset 900ms ease-out",
            filter: "drop-shadow(0 0 6px rgba(240, 210, 120, 0.55))",
          }}
        />
        <defs>
          <linearGradient id="xpgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d9b757" />
            <stop offset="100%" stopColor="#ffeaad" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] uppercase tracking-[0.2em] text-parchment-300">Level</span>
        <span className="font-display text-2xl leading-none text-gold-300">{level}</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small pieces                                                                */
/* -------------------------------------------------------------------------- */

export function StatTile({
  icon,
  label,
  value,
  hint,
  href,
  accent = "#c9a84c",
  motif,
  linkLabel,
}: {
  icon: IconName;
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  /** Jewel tone the whole tile is built from. */
  accent?: string;
  /** Scene drawn behind the numbers. */
  motif?: MotifName;
  /** Where the tile goes, named on its face rather than left to a hover. */
  linkLabel?: string;
}) {
  // A value written "3/25" is a score out of something, and a score out of
  // something deserves to be shown as a proportion rather than read as text.
  const parts = String(value).split("/");
  const done = Number(parts[0]);
  const outOf = parts.length === 2 ? Number(parts[1]) : NaN;
  const ratio =
    Number.isFinite(done) && Number.isFinite(outOf) && outOf > 0
      ? Math.max(0, Math.min(1, done / outOf))
      : null;
  const complete = ratio === 1;

  const body = (
    <>
      {motif && (
        <>
          <Motif name={motif} tint={accent} opacity={0.8} className="scale-110" />
          {/* Keeps the figures readable wherever the scene happens to fall.
              Heavy enough on the left to carry white text, gone by the right
              so the scene behind it is actually seen. */}
          <span
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(115deg, rgba(8,6,14,0.8) 0%, rgba(8,6,14,0.34) 48%, transparent 84%)",
            }}
          />
        </>
      )}

      {/* A lit rim along the top, the way each tile is separated in a rack. */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      <span className="relative flex items-start gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110"
          style={{
            borderColor: `color-mix(in srgb, ${accent} 70%, transparent)`,
            background: `linear-gradient(150deg, color-mix(in srgb, ${accent} 30%, #0b0916), color-mix(in srgb, ${accent} 14%, #0b0916))`,
            /* Barely lifted toward white — enough to glow, not so much that
               the jewel tone washes out to a pastel. */
            color: `color-mix(in srgb, ${accent} 86%, white)`,
            boxShadow: `0 0 20px -5px ${accent}`,
          }}
        >
          <Icon name={icon} size={18} solid />
        </span>
        {complete && (
          <span
            className="ml-auto rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ borderColor: `color-mix(in srgb, ${accent} 60%, transparent)`, color: accent }}
          >
            Done
          </span>
        )}
      </span>

      {/* The figure is the point of the tile, so it is plain white: a tinted
          number competes with its own accent and reads dimmer than it is. */}
      <span className="relative mt-3 block font-display text-[1.95rem] leading-none text-white">
        {value}
      </span>

      <span className="relative mt-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-parchment-200">
        {label}
      </span>
      {hint && <span className="relative mt-0.5 block text-[10px] text-parchment-500">{hint}</span>}

      {linkLabel && (
        <span
          className="relative mt-2 flex items-center gap-1 text-[10px] font-semibold"
          style={{ color: `color-mix(in srgb, ${accent} 35%, white)` }}
        >
          {linkLabel}
          <Icon
            name="arrow"
            size={11}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </span>
      )}
    </>
  );

  const cls =
    "group relative overflow-hidden rounded-xl border px-4 py-4 text-left transition-all duration-300";
  // Mixed toward a dark ground rather than toward `transparent`: over a
  // near-black page a transparent mix has almost no colour left in it, which
  // is why the rack of tiles used to read as six identical dark rectangles.
  const skin = {
    borderColor: `color-mix(in srgb, ${accent} 48%, transparent)`,
    backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${accent} 32%, #0b0916) 0%, color-mix(in srgb, ${accent} 16%, #0b0916) 48%, #0b0916 100%)`,
    boxShadow: `inset 0 1px 0 0 color-mix(in srgb, ${accent} 34%, transparent)`,
  };

  return href ? (
    <Link href={href} className={`${cls} block hover:-translate-y-0.5`} style={skin}>
      {body}
    </Link>
  ) : (
    <div className={cls} style={skin}>
      {body}
    </div>
  );
}

export function Callout({
  kind,
  children,
}: {
  kind: "note" | "warning" | "insight";
  children: ReactNode;
}) {
  const styles = {
    note: { icon: "info" as IconName, ring: "border-arcane-600/50", tint: "text-arcane-300" },
    warning: { icon: "warning" as IconName, ring: "border-crimson-600/50", tint: "text-crimson-400" },
    insight: { icon: "insight" as IconName, ring: "border-gold-700/50", tint: "text-gold-300" },
  }[kind];
  return (
    <div className={`flex gap-3 rounded-lg border ${styles.ring} bg-abyss-900/50 px-4 py-3`}>
      <Icon name={styles.icon} size={18} className={`mt-0.5 ${styles.tint}`} />
      <p className="text-sm leading-relaxed text-parchment-300">{children}</p>
    </div>
  );
}

/** Skull rating, 1–5, for dungeon area danger. */
export function DangerRating({ level, className = "" }: { level: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      title={`Danger ${level} of 5`}
      aria-label={`Danger ${level} of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="skull"
          size={12}
          className={n <= level ? "text-crimson-400" : "text-abyss-600"}
        />
      ))}
    </span>
  );
}

/** The Creative Flame, drawn rather than emoji, with its own glow when alive. */
export function FlameBadge({
  days,
  alive,
  restDays,
  best,
}: {
  days: number;
  alive: boolean;
  restDays: number;
  best?: number;
}) {
  return (
    <div
      className={`flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 ${
        alive
          ? "border-gold-700/50 bg-abyss-900/50"
          : "border-abyss-600/60 bg-abyss-900/30 opacity-60"
      }`}
    >
      <Icon
        name="flame"
        size={28}
        className={alive ? "animate-flicker text-gold-400" : "text-abyss-600"}
      />
      <div className="leading-tight">
        <p className="font-display text-lg text-gold-300">
          {days} <span className="text-xs tracking-widest text-parchment-400">DAY FLAME</span>
        </p>
        <p className="text-[11px] text-parchment-400">
          {alive ? "burning" : "gone cold"} · {restDays} rest day{restDays === 1 ? "" : "s"}
          {best !== undefined && best > days ? ` · best ${best}` : ""}
        </p>
      </div>
    </div>
  );
}
