"use client";

import { useCallback, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SPARKS, SPARK_KINDS, type Spark, type SparkKind } from "@/lib/sparks";

/**
 * A prompt you can take or leave.
 *
 * Everything about this is deliberately weightless: no score, no record of
 * whether you used it, no XP for drawing one. The moment a prompt is tracked
 * it becomes a brief, and briefs are what the rest of the app is for. The
 * Workshop is the one place that asks nothing, so the inspiration here has to
 * ask nothing either.
 *
 * Filtering by kind is offered because the block you are facing has a shape:
 * "I have no idea what to write about" wants an image, and "I have an idea and
 * it is going nowhere" wants a limit.
 */
export function SparkDeck({ initial }: { initial: Spark }) {
  const [spark, setSpark] = useState<Spark>(initial);
  const [kind, setKind] = useState<SparkKind | null>(null);
  const [open, setOpen] = useState(false);

  const pool = useMemo(
    () => (kind ? SPARKS.filter((s) => s.kind === kind) : SPARKS),
    [kind]
  );

  const draw = useCallback(
    (from = pool) => {
      // Never hand back the card already on the table — with a filter active
      // the pool can be small, and redrawing the same prompt reads as broken.
      const others = from.filter((s) => s.id !== spark.id);
      const source = others.length > 0 ? others : from;
      setSpark(source[Math.floor(Math.random() * source.length)]);
    },
    [pool, spark.id]
  );

  const meta = SPARK_KINDS[spark.kind];

  return (
    <section className="card mt-6 overflow-hidden p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="heading-display flex items-center gap-2 text-base">
          <Icon name="sparkle" size={18} solid className="text-amethyst-300" />
          Creative Sparks
        </h3>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="text-xs text-parchment-300 underline-offset-4 hover:text-gold-300 hover:underline"
        >
          {open ? "Hide the deck" : "Pick a kind"}
        </button>
      </div>
      <p className="mt-1 text-xs text-parchment-400">
        Suggestions, not briefs. Nothing checks whether you took one.
      </p>

      {open && (
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Kind of spark">
          <FilterChip active={kind === null} onClick={() => setKind(null)} label="Anything" />
          {(Object.keys(SPARK_KINDS) as SparkKind[]).map((k) => (
            <FilterChip
              key={k}
              active={kind === k}
              onClick={() => setKind(k)}
              label={SPARK_KINDS[k].label}
              hex={SPARK_KINDS[k].hex}
            />
          ))}
        </div>
      )}

      <figure
        className="mt-4 rounded-xl border p-4"
        style={{
          borderColor: `color-mix(in srgb, ${meta.hex} 45%, transparent)`,
          background: `color-mix(in srgb, ${meta.hex} 12%, #0b0916)`,
        }}
      >
        <figcaption
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: `color-mix(in srgb, ${meta.hex} 82%, white)` }}
        >
          <Icon name={meta.icon as never} size={12} solid /> {meta.label}
        </figcaption>
        {/* Announced politely so a screen-reader user hears the new prompt
            after drawing without being interrupted mid-sentence. */}
        <p aria-live="polite" className="mt-2 font-display text-lg leading-snug text-parchment-100">
          {spark.text}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-parchment-300">{spark.why}</p>
      </figure>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => draw()} className="btn-secondary text-sm">
          <Icon name="refresh" size={14} /> Draw another
        </button>
        <span className="text-xs text-parchment-400">
          {pool.length} {kind ? SPARK_KINDS[kind].plural : "sparks"} in the deck
        </span>
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  hex,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hex?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active ? "text-abyss-950" : "border-abyss-600 text-parchment-300 hover:border-gold-700/60"
      }`}
      style={
        active
          ? { borderColor: hex ?? "#f2d071", background: hex ?? "#f2d071" }
          : undefined
      }
    >
      {label}
    </button>
  );
}
