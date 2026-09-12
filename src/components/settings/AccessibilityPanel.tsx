"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { setAccessibility } from "@/server/actions/profile";

type Scale = "NORMAL" | "LARGE" | "LARGER";

const SCALES: { value: Scale; label: string; sample: string }[] = [
  { value: "NORMAL", label: "Normal", sample: "16px" },
  { value: "LARGE", label: "Large", sample: "18px" },
  { value: "LARGER", label: "Larger", sample: "20px" },
];

/**
 * Accessibility settings.
 *
 * Each control applies to the live page the moment it is changed, before the
 * save round-trips — someone choosing a text size needs to see the text size,
 * not read a description of it and hope. The server write follows and makes
 * the choice stick across devices.
 */
export function AccessibilityPanel({
  reduceMotion,
  textScale,
  highContrast,
  readableFont,
}: {
  reduceMotion: boolean | null;
  textScale: string;
  highContrast: boolean;
  readableFont: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [motion, setMotion] = useState<boolean | null>(reduceMotion);
  const [scale, setScale] = useState<Scale>((textScale as Scale) ?? "NORMAL");
  const [contrast, setContrast] = useState(highContrast);
  const [font, setFont] = useState(readableFont);

  /** Mirror a preference onto <html> immediately, then persist it. */
  function apply(next: {
    motion?: boolean | null;
    scale?: Scale;
    contrast?: boolean;
    font?: boolean;
  }) {
    const d = document.documentElement;
    if (next.scale !== undefined) {
      setScale(next.scale);
      if (next.scale === "NORMAL") d.removeAttribute("data-text");
      else d.setAttribute("data-text", next.scale);
    }
    if (next.motion !== undefined) {
      setMotion(next.motion);
      if (next.motion === true) d.setAttribute("data-motion", "reduce");
      else d.removeAttribute("data-motion");
    }
    if (next.contrast !== undefined) {
      setContrast(next.contrast);
      if (next.contrast) d.setAttribute("data-contrast", "high");
      else d.removeAttribute("data-contrast");
    }
    if (next.font !== undefined) {
      setFont(next.font);
      if (next.font) d.setAttribute("data-font", "readable");
      else d.removeAttribute("data-font");
    }

    startTransition(async () => {
      await setAccessibility({
        ...(next.motion !== undefined ? { reduceMotion: next.motion } : {}),
        ...(next.scale !== undefined ? { textScale: next.scale } : {}),
        ...(next.contrast !== undefined ? { highContrast: next.contrast } : {}),
        ...(next.font !== undefined ? { readableFont: next.font } : {}),
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Text size */}
      <fieldset>
        <legend className="text-sm text-parchment-200">Text size</legend>
        <p className="mt-1 text-sm leading-relaxed text-parchment-400">
          Scales everything together, including the notation labels and the
          lesson text.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {SCALES.map((s) => (
            <button
              key={s.value}
              onClick={() => apply({ scale: s.value })}
              disabled={pending}
              aria-pressed={scale === s.value}
              className={`rounded-lg border px-3.5 py-2 text-sm transition-colors disabled:opacity-50 ${
                scale === s.value
                  ? "border-gold-500/70 bg-gold-600/20 text-gold-200"
                  : "border-abyss-600 text-parchment-300 hover:border-gold-700/60"
              }`}
            >
              {s.label}{" "}
              <span className="text-[11px] text-parchment-300">{s.sample}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <Toggle
        label="Reduce motion"
        description="Stops the drifting background and shortens every transition. Leave this off to follow your system setting, which the app already honours."
        checked={motion === true}
        disabled={pending}
        onChange={(v) => apply({ motion: v ? true : null })}
      />

      <Toggle
        label="Higher contrast"
        description="Makes the cards solid instead of translucent, strengthens every border, and lifts the dimmer text up to the main ramp."
        checked={contrast}
        disabled={pending}
        onChange={(v) => apply({ contrast: v })}
      />

      <Toggle
        label="Reading font"
        description="Swaps the body serif for your system's interface font. Headings keep the dungeon's face, so the app still looks like itself."
        checked={font}
        disabled={pending}
        onChange={(v) => apply({ font: v })}
      />

      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-parchment-400">
        <Icon name="info" size={12} className="mt-0.5 shrink-0" />
        These are saved to your composer, not to this browser, so they follow
        you to any machine you sign in on.
      </p>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-parchment-200">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-parchment-400">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-50 ${
          checked ? "border-gold-500/70 bg-gold-600/70" : "border-abyss-600 bg-abyss-800"
        }`}
      >
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-parchment-100 transition-all ${
            checked ? "left-[26px]" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
