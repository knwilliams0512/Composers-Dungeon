import { Icon, type IconName } from "@/components/ui/Icon";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  icon,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: IconName;
}) {
  return (
    <header className="mb-7">
      {eyebrow && (
        <p className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-600">
          {icon && <Icon name={icon} size={13} />}
          {eyebrow}
        </p>
      )}
      <h1 className="heading-display text-balance text-3xl sm:text-4xl">{title}</h1>
      {subtitle && (
        <p className="mt-2.5 max-w-2xl leading-relaxed text-parchment-400">{subtitle}</p>
      )}
      <div className="mt-4 h-px w-24 bg-gradient-to-r from-gold-700/70 to-transparent" />
    </header>
  );
}
