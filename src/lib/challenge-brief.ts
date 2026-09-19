/**
 * Turns a challenge into a brief the in-app composer can open: the score setup
 * (key, meter, bars, instrument) and the machine-checkable standard the piece
 * must meet before the trial counts as passed.
 *
 * The generator writes prose requirements for flavour; this turns the same
 * inputs into something the app can actually judge, so "meet the standard"
 * means something concrete rather than the player ticking their own box.
 */

import { freedomTier, minimumTierFor } from "@/lib/composer-freedom";
import { emptyScore, minNotesFor, type Check, type Score } from "@/lib/score";

export interface ChallengeLike {
  difficulty: number;
  keySig?: string | null;
  meter?: string | null;
  lengthBars?: number | null;
  instrument?: string | null;
  skillKey?: string | null;
}

export interface Brief {
  setup: Score;
  checks: Check[];
  freedomCap: number;
}

/**
 * Letter, then an optional accidental written any of the ways it is written,
 * then an optional mode.
 *
 * The spelled-out forms matter: the challenge generator's own key list says
 * "B-flat major" and "F-sharp minor", and an earlier pattern that accepted
 * only "#" and "b" read those as B major and F major. Five of the twelve keys
 * in the game were silently wrong — the trial named one key on screen and was
 * set, and graded, in another.
 */
const KEY_PATTERN =
  /^([A-G])\s*(#|♯|b|♭|[-\s]?sharp|[-\s]?flat)?[\s-]*(major|minor|maj|min|m)?/i;

export function parseKey(raw?: string | null): { key: string; mode: "major" | "minor" } {
  if (!raw) return { key: "C", mode: "major" };
  const m = KEY_PATTERN.exec(raw.trim());
  if (!m) return { key: "C", mode: "major" };

  const accidental = (m[2] ?? "").toLowerCase().replace(/[-\s]/g, "");
  const suffix =
    accidental === "#" || accidental === "♯" || accidental === "sharp"
      ? "#"
      : accidental === "b" || accidental === "♭" || accidental === "flat"
        ? "b"
        : "";

  const rest = (m[3] ?? "").toLowerCase();
  return {
    key: m[1].toUpperCase() + suffix,
    mode: rest.startsWith("min") || rest === "m" ? "minor" : "major",
  };
}

export function parseMeter(raw?: string | null): { beats: number; unit: number } {
  if (!raw) return { beats: 4, unit: 4 };
  const m = /(\d+)\s*\/\s*(\d+)/.exec(raw);
  if (!m) return { beats: 4, unit: 4 };
  const beats = Math.max(1, Math.min(12, parseInt(m[1], 10)));
  const unit = [1, 2, 4, 8, 16].includes(parseInt(m[2], 10)) ? parseInt(m[2], 10) : 4;
  return { beats, unit };
}

/** Difficulty 1–10 → which composer tier the trial hands you. */
export function freedomCapForDifficulty(difficulty: number): number {
  if (difficulty <= 2) return 1;
  if (difficulty <= 4) return 2;
  if (difficulty <= 6) return 3;
  if (difficulty <= 8) return 4;
  return 5;
}

export function checksForChallenge(c: ChallengeLike, bars: number): Check[] {
  const d = Math.max(1, Math.min(10, c.difficulty));
  const skill = (c.skillKey ?? "MELODY").toUpperCase();
  const checks: Check[] = [
    { id: "fills-all-bars" },
    { id: "in-key" },
    { id: "min-notes", value: minNotesFor(bars, parseMeter(c.meter)) },
    { id: "ends-on-tonic" },
  ];

  if (d >= 2) checks.push({ id: "starts-on-chord-tone" });
  if (d >= 2) checks.push({ id: "range-limit", value: d >= 6 ? 19 : d >= 4 ? 16 : 12 });
  if (d >= 3 || skill === "MELODY") {
    checks.push({ id: "mostly-stepwise", value: d >= 7 ? 0.5 : 0.6 });
    checks.push({ id: "single-climax" });
  }
  if (d >= 4) checks.push({ id: "no-long-repeats", value: 3 });
  if (d >= 4 || skill === "RHYTHM") checks.push({ id: "rhythmic-variety", value: d >= 7 ? 3 : 2 });
  if (d >= 5 || skill === "HARMONY") {
    checks.push({ id: "chords-every-bar" });
    checks.push({ id: "authentic-cadence" });
  }
  if (d >= 6) checks.push({ id: "leap-recovery" });
  if (d >= 6 || skill === "HARMONY") checks.push({ id: "melody-fits-chords", value: 0.6 });
  if (d >= 7 || skill === "FORM") checks.push({ id: "motif-repetition" });
  if (d >= 7 || skill === "RHYTHM") checks.push({ id: "uses-rests" });

  // Never ask for more than a dozen things at once — a wall of red is not
  // feedback, it is a reason to close the app.
  return dedupe(checks).slice(0, 11);
}

function dedupe(checks: Check[]): Check[] {
  const seen = new Set<string>();
  return checks.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

/**
 * Which trials are written on a full score rather than the piano roll.
 *
 * The grid composer is one line and a harmony lane, which is the right tool
 * for learning to write a tune. It is the wrong tool for a trial whose whole
 * subject is orchestration, and for the deepest trials in the game, where what
 * is being tested is a score. Both of those get the score maker.
 */
export function usesFullScore(c: {
  difficulty: number;
  skillKey?: string | null;
  areaSkillKey?: string | null;
}): boolean {
  const skill = (c.skillKey ?? c.areaSkillKey ?? "").toUpperCase();
  if (skill === "ORCHESTRATION" || skill === "INSTRUMENTATION") return true;
  return c.difficulty >= 8;
}

export function briefForChallenge(c: ChallengeLike): Brief {
  const { key, mode } = parseKey(c.keySig);
  const meter = parseMeter(c.meter);

  let cap = freedomCapForDifficulty(c.difficulty);
  const rawBars = c.lengthBars ?? 8;

  // Provisional checks set a floor on the tier: you cannot be asked for chords
  // with the chord lane hidden, nor for more note lengths than the toolbar has.
  cap = Math.max(cap, minimumTierFor(checksForChallenge(c, rawBars)));

  const bars = Math.max(2, Math.min(rawBars, freedomTier(cap).maxBars));
  const checks = checksForChallenge(c, bars);
  // Shortening the piece to fit the tier can change the checks, which can in
  // turn need a higher tier than the one that did the shortening.
  cap = Math.max(cap, minimumTierFor(checks));

  return {
    setup: emptyScore({
      key,
      mode,
      meter,
      bars,
      tempo: meter.unit === 8 ? 84 : 96,
      instrument: (c.instrument ?? "Piano").toUpperCase(),
    }),
    checks,
    freedomCap: cap,
  };
}

/** Parses a stored checks column, tolerating anything malformed. */
export function parseChecks(raw?: string | null): Check[] | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return null;
    return value.filter((c) => c && typeof c.id === "string") as Check[];
  } catch {
    return null;
  }
}
