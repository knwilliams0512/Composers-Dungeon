export function ProgressBar({
  percent,
  color = "gold",
  className = "",
  label,
}: {
  percent: number;
  color?: "gold" | "crimson" | "arcane" | "emerald";
  className?: string;
  label?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const colors: Record<string, string> = {
    gold: "from-gold-700 to-gold-400",
    crimson: "from-crimson-700 to-crimson-400",
    arcane: "from-arcane-700 to-arcane-400",
    emerald: "from-emerald-800 to-emerald-400",
  };
  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-parchment-400">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full border border-abyss-600/60 bg-abyss-900">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${colors[color]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
