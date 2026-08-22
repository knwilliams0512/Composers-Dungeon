export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6">
      {eyebrow && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-parchment-500">
          {eyebrow}
        </p>
      )}
      <h1 className="heading-display text-3xl sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-parchment-400">{subtitle}</p>}
    </header>
  );
}
