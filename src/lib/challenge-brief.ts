/**
 * Turns a challenge into a brief the in-app composer can open: the score setup
 * (key, meter, bars, instrument) and the machine-checkable standard the piece
 * must meet before the trial counts as passed.
 *
 * The generator writes prose requirements for flavour; this turns the same
 * inputs into something the app can actually judge, so "meet the standard"
 * means something concrete rather than the player ticking their own box.
 */

import { freedomTier } from "@/lib/composer-freedom";
import { emptyScore, type Check, type Score } from "@/lib/score";

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

const KEY_PATTERN = /^([A-G](?:#|b|♯|♭)?)\s*(major|minor|maj|min|m)?/i;

export function parseKey(raw?: string | null): { key: string; mode: "major" | "minor" } {
  if (!raw) return { key: "C", mode: "major" };
  const m = KEY_PATTERN.exec(raw.trim());
  if (!m) return { key: "C", mode: "major" };
  const key = m[1].replace("♯", "#").replace("♭", "b");
  const rest = (m[2] ?? "").toLowerCase();
  return { key, mode: rest.startsWith("min") || rest === "m" ? "minor" : "major" };
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
    { id: "min-notes", value: Math.max(6, bars * 2) },
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

export function briefForChallenge(c: ChallengeLike): Brief {
  const { key, mode } = parseKey(c.keySig);
  const meter = parseMeter(c.meter);

  let cap = freedomCapForDifficulty(c.difficulty);
  const rawBars = c.lengthBars ?? 8;

  // Provisional checks decide whether harmony is needed, which sets a floor on
  // the tier — you cannot be asked for chords with the chord lane hidden.
  const provisional = checksForChallenge(c, rawBars);
  if (provisional.some((x) => x.id.startsWith("chords") || x.id === "authentic-cadence")) {
    cap = Math.max(cap, 2);
  }
  if (provisional.some((x) => x.id === "melody-fits-chords")) cap = Math.max(cap, 2);

  const bars = Math.max(2, Math.min(rawBars, freedomTier(cap).maxBars));
  const checks = checksForChallenge(c, bars);

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
