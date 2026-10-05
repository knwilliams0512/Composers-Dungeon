import { ALL_UNITS, unitForSlug } from "@/lib/curriculum";

/**
 * Which units a composer has cleared, and what that opens.
 *
 * The rule in one sentence: a unit's lessons are available once every unit
 * before it has had its exam passed. Finishing the lessons of a unit is not
 * enough, and is not required either.
 *
 * Both halves of that matter. Somebody who already knows Level 1 can sit seven
 * exams and start at 2.1 without reading a word — which is what the exams are
 * mainly for. And somebody who clicked through every lesson without taking any
 * of it in does not arrive in Level 4 on the strength of having scrolled.
 *
 * Deliberately not included: any notion of a unit being "partly" cleared.
 * A gate that half-opens is a gate nobody can reason about.
 */

export interface UnitGateState {
  /** Units whose exam has been passed, in curriculum order. */
  passed: Set<string>;
}

/** Every unit, in the order the roadmap presents them. */
export function unitOrder(): string[] {
  return ALL_UNITS.map((u) => u.unit);
}

/**
 * Is this unit open to be studied?
 *
 * The first unit always is — there has to be a way in. After that, a unit is
 * open when the one before it has been passed.
 */
export function unitOpen(unit: string, passed: Set<string>): boolean {
  const order = unitOrder();
  const index = order.indexOf(unit);
  if (index <= 0) return index === 0;
  return passed.has(order[index - 1]);
}

/** The unit immediately before this one, or null for the first. */
export function previousUnit(unit: string): string | null {
  const order = unitOrder();
  const index = order.indexOf(unit);
  return index > 0 ? order[index - 1] : null;
}

/**
 * Is this lesson available?
 *
 * Craft lessons — melody writing, phrasing — sit outside the numbered roadmap
 * and are never gated by it. They teach how to write rather than how music
 * works, and holding them behind a theory exam would be holding back the part
 * of the Academy a composer most wants on day one.
 */
export function lessonOpen(slug: string, passed: Set<string>): boolean {
  const unit = unitForSlug(slug);
  if (!unit) return true;
  return unitOpen(unit.unit, passed);
}

/** The furthest unit a composer has opened, for "you are here". */
export function currentUnit(passed: Set<string>): string {
  const order = unitOrder();
  for (const unit of order) {
    if (!passed.has(unit)) return unit;
  }
  return order[order.length - 1];
}

/** How far through the roadmap the exams say they are. */
export function roadmapProgress(passed: Set<string>): {
  cleared: number;
  total: number;
  percent: number;
} {
  const total = unitOrder().length;
  const cleared = unitOrder().filter((u) => passed.has(u)).length;
  return { cleared, total, percent: total ? Math.round((cleared / total) * 100) : 0 };
}
