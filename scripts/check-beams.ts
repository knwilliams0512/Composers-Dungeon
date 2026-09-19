/**
 * Beaming check.
 *
 * Engraved music beams eighths and shorter within a beat; handwritten music
 * flags them individually. The Studio did the latter for every note, so a bar
 * of eight eighths came out as eight flags instead of two groups of four.
 *
 * These are the cases that decide whether the grouping rule is right, written
 * out by hand from standard practice rather than derived from the code.
 *
 *   npx tsx scripts/check-beams.ts
 */
import { beamGroups, beamLevels } from "../src/lib/studio/staff";

const problems: string[] = [];
const fail = (m: string) => problems.push(m);
// Ticks: whole 16, half 8, quarter 4, eighth 2, sixteenth 1.
const E = 2, S = 1, Q = 4, H = 8, W = 16;

const seq = (start: number, ...durs: number[]) => {
  const out = [] as { start: number; duration: number }[];
  let t = start;
  for (const d of durs) { out.push({ start: t, duration: d }); t += d; }
  return out;
};
const show = (g: number[][]) => JSON.stringify(g);

const check = (label: string, got: number[][], want: number[][]) => {
  if (show(got) !== show(want)) fail(`${label}: got ${show(got)}, expected ${show(want)}`);
};

const four4 = { beats: 4, unit: 4 };

// Eight eighths in 4/4 beam in four pairs — one per beat.
check("8 eighths in 4/4",
  beamGroups(seq(0, E,E,E,E,E,E,E,E), four4, 0, 16),
  [[0,2],[4,6],[8,10],[12,14]]);

// Sixteen sixteenths beam in fours, one group per beat.
check("16 sixteenths in 4/4",
  beamGroups(seq(0, ...Array(16).fill(S)), four4, 0, 16),
  [[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15]]);

// Quarters and longer are never beamed.
check("4 quarters", beamGroups(seq(0, Q,Q,Q,Q), four4, 0, 16), []);
check("a whole note", beamGroups(seq(0, W), four4, 0, 16), []);
check("halves", beamGroups(seq(0, H,H), four4, 0, 16), []);

// A lone eighth keeps its flag.
check("one eighth then a quarter", beamGroups(seq(0, E, Q), four4, 0, 16), []);

// A gap breaks the group: two eighths, a rest's worth of silence, two more.
check("gap splits the group",
  beamGroups([{start:0,duration:E},{start:2,duration:E},{start:6,duration:E},{start:8,duration:E}], four4, 0, 16),
  [[0,2]]);

// A beam never crosses a beat, even when the notes run on.
check("eighths offset across a beat",
  beamGroups(seq(1, E,E,E,E), four4, 0, 16),
  [[1,3],[5,7]]);

// Mixed: a sixteenth pair then an eighth, all inside beat 1.
check("mixed values inside one beat",
  beamGroups(seq(0, S,S,E), four4, 0, 16),
  [[0,1,2]]);

// Compound time groups in threes.
check("6/8 groups eighths in threes",
  beamGroups(seq(0, E,E,E,E,E,E), { beats: 6, unit: 8 }, 0, 12),
  [[0,2,4],[6,8,10]]);
check("9/8 groups eighths in threes",
  beamGroups(seq(0, ...Array(9).fill(E)), { beats: 9, unit: 8 }, 0, 18),
  [[0,2,4],[6,8,10],[12,14,16]]);
// A 3/8 bar is one group of three, not three separate beats.
check("3/8 beams its three eighths together",
  beamGroups(seq(0, E,E,E), { beats: 3, unit: 8 }, 0, 6),
  [[0,2,4]]);

// Cut time is felt in halves, so eighths group in fours.
check("2/2 groups eighths in fours",
  beamGroups(seq(0, ...Array(8).fill(E)), { beats: 2, unit: 2 }, 0, 16),
  [[0,2,4,6],[8,10,12,14]]);

// Only notes inside the bar being drawn are considered.
check("notes belonging to an earlier bar are ignored",
  beamGroups(seq(0, E,E,E,E), four4, 8, 8),
  []);
check("notes are picked up from the bar asked for",
  beamGroups(seq(0, E,E,E,E,E,E,E,E), four4, 8, 8),
  [[8,10],[12,14]]);

// Levels.
if (beamLevels(E) !== 1) fail(`an eighth should have 1 beam, got ${beamLevels(E)}`);
if (beamLevels(S) !== 2) fail(`a sixteenth should have 2 beams, got ${beamLevels(S)}`);
if (beamLevels(Q) !== 0) fail(`a quarter should have 0 beams, got ${beamLevels(Q)}`);
if (beamLevels(H) !== 0) fail(`a half should have 0 beams, got ${beamLevels(H)}`);

// Every group must be in order, contiguous in the list, and at least two long.
for (const g of beamGroups(seq(0, ...Array(16).fill(S)), four4, 0, 16)) {
  if (g.length < 2) fail(`a group of ${g.length} should not be beamed`);
  for (let i = 1; i < g.length; i++) if (g[i] <= g[i - 1]) fail(`group ${show([g])} is out of order`);
}

console.log("beams: grouping checked against 16 hand-written cases");
if (problems.length === 0) console.log("OK - beaming follows the conventional rule");
else { console.log(`FAIL - ${problems.length} problems:`); problems.forEach((p) => console.log("  -", p)); }
process.exit(problems.length ? 1 : 0);
