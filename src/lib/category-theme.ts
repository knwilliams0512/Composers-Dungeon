import type { IconName } from "@/components/ui/Icon";

/**
 * A distinct jewel tone per lesson category, so each subject reads at a glance
 * instead of everything being gold-on-black.
 *
 * Colours are raw hex rather than Tailwind class names on purpose: these are
 * applied through inline styles and CSS custom properties, because Tailwind
 * cannot generate classes from values it only sees at runtime.
 */
export interface CategoryTheme {
  label: string;
  icon: IconName;
  /** Main accent, used for text, spines and rims. */
  hex: string;
  /** A lighter tint for text on dark glass. */
  light: string;
  /** A deeper shade for gradients. */
  deep: string;
}

export const CATEGORY_THEME: Record<string, CategoryTheme> = {
  FUNDAMENTALS: { label: "Fundamentals",  icon: "compass", hex: "#c9a84c", light: "#f0d894", deep: "#7d6229" },
  MELODY:       { label: "Melody",        icon: "note",    hex: "#cc5580", light: "#f3b6c9", deep: "#712c48" },
  HARMONY:      { label: "Harmony",       icon: "chord",   hex: "#4f63a8", light: "#9fb4e8", deep: "#2a365f" },
  RHYTHM:       { label: "Rhythm",        icon: "drum",    hex: "#2f97a0", light: "#8fdde0", deep: "#1a4f54" },
  FORM:         { label: "Form",          icon: "column",  hex: "#9358c9", light: "#d3aef5", deep: "#502d73" },
  COUNTERPOINT: { label: "Counterpoint",  icon: "layers",  hex: "#2fa27c", light: "#8fe0bc", deep: "#164e3c" },
  ORCHESTRATION:{ label: "Orchestration", icon: "harp",    hex: "#a03c38", light: "#dc8580", deep: "#5c1e1d" },
  VIRTUOSO:     { label: "Virtuoso",      icon: "star",    hex: "#e3c26d", light: "#fdf7e6", deep: "#a8863a" },
};

/**
 * The same jewel tones keyed by skill, so a dungeon area that trains Rhythm
 * glows the same teal as the Rhythm lessons that taught it.
 */
export const SKILL_THEME: Record<string, CategoryTheme> = {
  MELODY:         { label: "Melody",         icon: "note",   hex: "#cc5580", light: "#f3b6c9", deep: "#712c48" },
  HARMONY:        { label: "Harmony",        icon: "chord",  hex: "#4f63a8", light: "#9fb4e8", deep: "#2a365f" },
  RHYTHM:         { label: "Rhythm",         icon: "drum",   hex: "#2f97a0", light: "#8fdde0", deep: "#1a4f54" },
  FORM:           { label: "Form",           icon: "column", hex: "#9358c9", light: "#d3aef5", deep: "#502d73" },
  COUNTERPOINT:   { label: "Counterpoint",   icon: "layers", hex: "#2fa27c", light: "#8fe0bc", deep: "#164e3c" },
  ORCHESTRATION:  { label: "Orchestration",  icon: "harp",   hex: "#a03c38", light: "#dc8580", deep: "#5c1e1d" },
  INSTRUMENTATION:{ label: "Instrumentation",icon: "harp",   hex: "#c2554f", light: "#dc8580", deep: "#5c1e1d" },
  TECHNIQUE:      { label: "Technique",      icon: "bolt",   hex: "#c9a84c", light: "#f0d894", deep: "#7d6229" },
  EXPRESSION:     { label: "Expression",     icon: "moon",   hex: "#b47fe6", light: "#d3aef5", deep: "#502d73" },
};

export function skillTheme(skill?: string | null): CategoryTheme {
  return (skill && SKILL_THEME[skill]) || CATEGORY_THEME.FUNDAMENTALS;
}

const FALLBACK = CATEGORY_THEME.FUNDAMENTALS;

export function categoryTheme(category: string): CategoryTheme {
  return CATEGORY_THEME[category] ?? FALLBACK;
}

/**
 * Inline style bundle for a themed card. Uses a CSS custom property so hover
 * states in globals.css can reference the accent without Tailwind needing to
 * know the value at build time.
 */
export function categoryVars(theme: CategoryTheme): React.CSSProperties {
  return {
    ["--accent" as string]: theme.hex,
    ["--accent-light" as string]: theme.light,
    ["--accent-deep" as string]: theme.deep,
  };
}
