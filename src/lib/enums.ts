// Central enum definitions for Composer's Dungeon.
// SQLite has no native enums, so these const-unions are the single source of
// truth; every write path validates against them with zod (src/lib/validation.ts).

export const EXPERIENCE_TIERS = [
  "NO_EXPERIENCE",
  "NEW_TO_COMPOSING",
  "KNOW_A_LITTLE",
  "BASIC_COMPOSER",
  "DECENT_COMPOSER",
  "ADVANCED_COMPOSER",
  "VIRTUOSO_REPERTOIRE",
] as const;
export type ExperienceTier = (typeof EXPERIENCE_TIERS)[number];

export const TIER_INFO: Record<
  ExperienceTier,
  { label: string; blurb: string; ordinal: number }
> = {
  NO_EXPERIENCE: {
    label: "No Experience",
    blurb: "I don't know music theory or composition yet.",
    ordinal: 1,
  },
  NEW_TO_COMPOSING: {
    label: "New to Composing",
    blurb: "I know some music, but I am new to writing my own music.",
    ordinal: 2,
  },
  KNOW_A_LITTLE: {
    label: "Know a Little Bit",
    blurb: "I have composed before and understand some basic music theory.",
    ordinal: 3,
  },
  BASIC_COMPOSER: {
    label: "Basic Composer",
    blurb: "I can write complete pieces and understand basic theory.",
    ordinal: 4,
  },
  DECENT_COMPOSER: {
    label: "Decent Composer",
    blurb: "I have experience and can write more complex music.",
    ordinal: 5,
  },
  ADVANCED_COMPOSER: {
    label: "Advanced Composer",
    blurb: "I understand advanced theory and can compose difficult music.",
    ordinal: 6,
  },
  VIRTUOSO_REPERTOIRE: {
    label: "Virtuoso Repertoire",
    blurb:
      "I want to write technically demanding and virtuosic music that pushes performers.",
    ordinal: 7,
  },
};

export function tierOrdinal(tier: string): number {
  return TIER_INFO[tier as ExperienceTier]?.ordinal ?? 1;
}

export function tierFromOrdinal(ordinal: number): ExperienceTier {
  const clamped = Math.min(7, Math.max(1, Math.round(ordinal)));
  return EXPERIENCE_TIERS[clamped - 1];
}

export const GOALS = [
  "LEARN_THEORY",
  "LEARN_COMPOSITION",
  "BETTER_MELODIES",
  "BETTER_HARMONY",
  "IMPROVE_RHYTHM",
  "LEARN_COUNTERPOINT",
  "LEARN_ORCHESTRATION",
  "LEARN_FORM",
  "WRITE_VIRTUOSO",
  "EXPLORE_EVERYTHING",
] as const;
export type Goal = (typeof GOALS)[number];

export const GOAL_LABELS: Record<Goal, string> = {
  LEARN_THEORY: "Learn Music Theory",
  LEARN_COMPOSITION: "Learn Composition",
  BETTER_MELODIES: "Write Better Melodies",
  BETTER_HARMONY: "Write Better Harmony",
  IMPROVE_RHYTHM: "Improve Rhythm",
  LEARN_COUNTERPOINT: "Learn Counterpoint",
  LEARN_ORCHESTRATION: "Learn Orchestration",
  LEARN_FORM: "Learn Musical Form",
  WRITE_VIRTUOSO: "Write Virtuoso Music",
  EXPLORE_EVERYTHING: "Explore Everything",
};

export const INTERESTS = [
  "CLASSICAL",
  "IMPRESSIONIST",
  "CINEMATIC",
  "EXPERIMENTAL",
  "CONTEMPORARY",
  "VIRTUOSO",
] as const;
export type MusicalInterest = (typeof INTERESTS)[number];

export const INTEREST_LABELS: Record<MusicalInterest, string> = {
  CLASSICAL: "Classical",
  IMPRESSIONIST: "Impressionist",
  CINEMATIC: "Cinematic",
  EXPERIMENTAL: "Experimental",
  CONTEMPORARY: "Contemporary",
  VIRTUOSO: "Virtuoso",
};

export const SKILL_KEYS = [
  "MELODY",
  "HARMONY",
  "RHYTHM",
  "FORM",
  "TECHNIQUE",
  "EXPRESSION",
  "INSTRUMENTATION",
  "COUNTERPOINT",
  "ORCHESTRATION",
] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

export const SKILL_LABELS: Record<SkillKey, string> = {
  MELODY: "Melody",
  HARMONY: "Harmony",
  RHYTHM: "Rhythm",
  FORM: "Form",
  TECHNIQUE: "Technique",
  EXPRESSION: "Expression",
  INSTRUMENTATION: "Instrumentation",
  COUNTERPOINT: "Counterpoint",
  ORCHESTRATION: "Orchestration",
};

export const PROFILE_VISIBILITIES = ["PUBLIC", "PRIVATE"] as const;
export type ProfileVisibility = (typeof PROFILE_VISIBILITIES)[number];

export const ROOM_TYPES = [
  "CHALLENGE",
  "PUZZLE",
  "CURSE",
  "TREASURE",
  "REST",
  "BOSS",
  "EVENT",
] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const ROOM_TYPE_INFO: Record<RoomType, { label: string; icon: string }> = {
  CHALLENGE: { label: "Challenge Room", icon: "⚔️" },
  PUZZLE: { label: "Puzzle Room", icon: "🧩" },
  CURSE: { label: "Curse Room", icon: "🕯️" },
  TREASURE: { label: "Treasure Room", icon: "🗝️" },
  REST: { label: "Rest Room", icon: "🔥" },
  BOSS: { label: "Boss Room", icon: "💀" },
  EVENT: { label: "Special Event", icon: "✨" },
};

export const CHALLENGE_TYPES = [
  "CHALLENGE",
  "PUZZLE",
  "CURSE",
  "DAILY",
  "BOSS",
  "LESSON",
] as const;
export type ChallengeType = (typeof CHALLENGE_TYPES)[number];

export const CHALLENGE_STATUSES = ["ACTIVE", "COMPLETED", "ABANDONED"] as const;
export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];

export const ARTIFACT_RARITIES = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
] as const;
export type ArtifactRarity = (typeof ARTIFACT_RARITIES)[number];

export const RARITY_COLORS: Record<ArtifactRarity, string> = {
  COMMON: "text-stone-300 border-stone-500/40",
  UNCOMMON: "text-emerald-300 border-emerald-500/40",
  RARE: "text-arcane-300 border-arcane-400/50",
  EPIC: "text-purple-300 border-purple-400/50",
  LEGENDARY: "text-gold-300 border-gold-400/60",
};

export const COMPONENT_TYPES = [
  "KEY",
  "MODE",
  "METER",
  "LENGTH",
  "INSTRUMENT",
  "STYLE",
  "REQUIREMENT",
  "RESTRICTION",
  "TITLE_FRAGMENT",
] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

export const SPECIALIZATION_KEYS = [
  "VIRTUOSO",
  "IMPRESSIONIST",
  "CLASSICIST",
  "CINEMATIC",
  "EXPERIMENTALIST",
] as const;
export type SpecializationKey = (typeof SPECIALIZATION_KEYS)[number];

export const AVATARS = [
  "quill",
  "lyre",
  "bell",
  "flame",
  "raven",
  "key",
  "moth",
  "crown",
] as const;
export type AvatarKey = (typeof AVATARS)[number];

export const AVATAR_GLYPHS: Record<AvatarKey, string> = {
  quill: "🪶",
  lyre: "🎻",
  bell: "🔔",
  flame: "🕯️",
  raven: "🐦‍⬛",
  key: "🗝️",
  moth: "🦋",
  crown: "👑",
};

export function avatarGlyph(key: string): string {
  return AVATAR_GLYPHS[key as AvatarKey] ?? "🪶";
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}
