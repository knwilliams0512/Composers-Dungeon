import { Icon, type IconName } from "@/components/ui/Icon";
import { Motif, type MotifName } from "@/components/ui/Motif";

/**
 * The banner every page opens with.
 *
 * The Entrance Hall has its own identity card — the XP ring, the flame, the
 * climb to the next level — and this is that card's sibling rather than its
 * copy: the same rounded panel, aurora and drawn scene behind the words, but
 * carrying only what a section needs. Each page passes its own accent and
 * motif, so the family resemblance is obvious while no two pages look alike.
 */

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  icon,
  accent = "#c9a84c",
  motif,
  aside,
  footer,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** The section's colour. Everything else in the banner is mixed from it. */
  accent?: string;
  /** The scene drawn where a photograph would sit. */
  motif?: MotifName;
  /** Anything the page wants on the right — counts, a filter, an action. */
  aside?: React.ReactNode;
  /**
   * A full-width strip beneath the title, ruled off from it — where the
   * Entrance Hall puts the climb to the next level.
   */
  footer?: React.ReactNode;
}) {
  return (
    <header
      className="relative mb-7 overflow-hidden rounded-2xl border px-6 py-6 sm:px-8 sm:py-7"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 30%, transparent)`,
        backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${accent} 20%, transparent) 0%, color-mix(in srgb, ${accent} 7%, transparent) 42%, rgba(10,8,16,0.55) 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
      />
      {motif && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.3]">
          <Motif name={motif} tint={accent} opacity={1} />
        </div>
      )}

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p
              className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em]"
              style={{ color: `color-mix(in srgb, ${accent} 78%, #f4ead6)` }}
            >
              {icon && <Icon name={icon} size={13} />}
              {eyebrow}
            </p>
          )}
          <h1 className="heading-display text-balance text-3xl sm:text-4xl">{title}</h1>
          {subtitle && (
            <p className="mt-2.5 max-w-2xl leading-relaxed text-parchment-400">{subtitle}</p>
          )}
          <div
            className="mt-4 h-px w-24"
            style={{ backgroundImage: `linear-gradient(90deg, ${accent}, transparent)` }}
          />
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>

      {footer && (
        <div
          className="relative mt-5 border-t pt-5"
          style={{ borderColor: `color-mix(in srgb, ${accent} 22%, transparent)` }}
        >
          {footer}
        </div>
      )}
    </header>
  );
}
