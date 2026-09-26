import type { FormFigure as Spec, ScoreOrderFigure as OrderSpec } from "@/lib/lesson-figure";

/**
 * A piece seen from a distance.
 *
 * Form is the one thing in music you cannot hear all at once and cannot read
 * off a page either — twenty minutes of score is not a shape anyone can hold.
 * Drawn to width, with returning material sharing a colour, ABA stops being a
 * label and becomes the picture it describes.
 */

const TONES: Record<string, { fill: string; text: string }> = {
  a: { fill: "#c98f4b", text: "#0c0a14" },
  b: { fill: "#7c6cf0", text: "#f4f1ea" },
  c: { fill: "#3fb0a6", text: "#0c0a14" },
  intro: { fill: "rgba(240,235,225,0.18)", text: "#f4f1ea" },
  coda: { fill: "rgba(240,235,225,0.28)", text: "#f4f1ea" },
};

export function FormFigure({ spec, accent }: { spec: Spec; accent: string }) {
  const total = spec.sections.reduce((t, s) => t + (s.bars ?? 1), 0);
  return (
    <div className="w-full">
      <div className="flex w-full gap-1.5">
        {spec.sections.map((section, i) => {
          const tone = TONES[section.tone ?? "a"] ?? { fill: accent, text: "#0c0a14" };
          return (
            <div
              key={i}
              className="flex min-w-0 flex-col items-center justify-center rounded-lg px-2 py-3.5 text-center"
              style={{
                flexGrow: (section.bars ?? 1) / total,
                flexBasis: 0,
                background: tone.fill,
                color: tone.text,
              }}
            >
              <span className="font-display text-base leading-none">{section.label}</span>
              {section.bars !== undefined && (
                <span className="mt-1 text-[10px] uppercase tracking-[0.14em] opacity-70">
                  {section.bars} bars
                </span>
              )}
            </div>
          );
        })}
      </div>
      {spec.sections.some((s) => s.note) && (
        <div className="mt-2 flex w-full gap-1.5">
          {spec.sections.map((section, i) => (
            <p
              key={i}
              className="min-w-0 text-center text-[11px] leading-snug text-parchment-400"
              style={{ flexGrow: (section.bars ?? 1) / total, flexBasis: 0 }}
            >
              {section.note ?? ""}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The order of a full score, top to bottom.
 *
 * Every orchestral player opens a score expecting their instrument in one
 * place. Listing the order in prose asks someone to hold sixteen items in
 * their head; drawing it as the page they will actually see does not.
 */
export function ScoreOrderFigure({ spec, accent }: { spec: OrderSpec; accent: string }) {
  const lit = new Set(spec.highlight ?? []);
  let index = -1;
  return (
    <div className="w-full overflow-hidden rounded-xl border border-parchment-100/10 bg-abyss-950/60">
      {spec.groups.map((group, g) => (
        <div key={g} className="border-b border-parchment-100/8 last:border-b-0">
          <div
            className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: accent, background: `color-mix(in srgb, ${accent} 10%, transparent)` }}
          >
            {group.name}
          </div>
          <ul>
            {group.staves.map((stave) => {
              index += 1;
              const on = lit.has(index);
              return (
                <li
                  key={stave}
                  className="flex items-center gap-3 px-3 py-1.5 text-sm"
                  style={{
                    background: on ? `color-mix(in srgb, ${accent} 16%, transparent)` : undefined,
                    color: on ? accent : undefined,
                  }}
                >
                  {/* A miniature staff, so the list reads as a page of music */}
                  <svg width="46" height="14" aria-hidden="true" className="shrink-0">
                    {[0, 1, 2, 3, 4].map((line) => (
                      <line
                        key={line}
                        x1={0}
                        x2={46}
                        y1={2 + line * 2.5}
                        y2={2 + line * 2.5}
                        stroke={on ? accent : "rgba(240,235,225,0.3)"}
                        strokeWidth={0.7}
                      />
                    ))}
                  </svg>
                  <span className={on ? "font-semibold" : "text-parchment-300"}>{stave}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
