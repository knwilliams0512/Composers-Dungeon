/**
 * Key-signature and spelling check for the notation library.
 *
 * The expected signatures below are written out by hand rather than derived,
 * so a bug in the code under test cannot quietly agree with itself.
 *
 *   npx tsx scripts/check-notation.ts
 */
import { sharpsInKey, signatureAlterations, spellPitch } from "../src/lib/notation";

// Independent ground truth, written out rather than derived from the code
// being tested — otherwise a shared bug would agree with itself.
const MAJOR_SIGS: Record<string, string[]> = {
  C: [], G: ["F"], D: ["F", "C"], A: ["F", "C", "G"], E: ["F", "C", "G", "D"],
  B: ["F", "C", "G", "D", "A"], "F#": ["F", "C", "G", "D", "A", "E"],
  F: ["B"], Bb: ["B", "E"], Eb: ["B", "E", "A"], Ab: ["B", "E", "A", "D"],
  Db: ["B", "E", "A", "D", "G"], Gb: ["B", "E", "A", "D", "G", "C"],
};
const MINOR_SIGS: Record<string, string[]> = {
  A: [], E: ["F"], B: ["F", "C"], "F#": ["F", "C", "G"], "C#": ["F", "C", "G", "D"],
  D: ["B"], G: ["B", "E"], C: ["B", "E", "A"], F: ["B", "E", "A", "D"],
  Bb: ["B", "E", "A", "D", "G"],
};
const problems: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) problems.push(m); };

for (const [key, letters] of Object.entries(MAJOR_SIGS)) {
  const alt = signatureAlterations(key, "major");
  const got = Array.from(alt.entries()).map(([l, d]) => `${l}${d === 1 ? "#" : "b"}`).sort();
  const want = letters.map((l) => `${l}${key.includes("b") || key === "F" ? "b" : "#"}`).sort();
  ok(got.join(",") === want.join(","), `${key} major signature: got ${got.join(",") || "(none)"}, expected ${want.join(",") || "(none)"}`);
  const n = sharpsInKey(key, "major");
  const expectedCount = (key.includes("b") || key === "F") ? -letters.length : letters.length;
  ok(n === expectedCount, `sharpsInKey("${key}","major") = ${n}, expected ${expectedCount}`);
}
for (const [key, letters] of Object.entries(MINOR_SIGS)) {
  const alt = signatureAlterations(key, "minor");
  const got = Array.from(alt.entries()).map(([l, d]) => `${l}${d === 1 ? "#" : "b"}`).sort();
  const flatKey = key.includes("b") || ["D", "G", "C", "F"].includes(key);
  const want = letters.map((l) => `${l}${flatKey ? "b" : "#"}`).sort();
  ok(got.join(",") === want.join(","), `${key} minor signature: got ${got.join(",") || "(none)"}, expected ${want.join(",") || "(none)"}`);
}

// Spelling: every key's own scale must use seven distinct letters.
const SCALES: Record<string, number[]> = {
  C: [60,62,64,65,67,69,71], G: [67,69,71,72,74,76,78], D: [62,64,66,67,69,71,73],
  A: [69,71,73,74,76,78,80], E: [64,66,68,69,71,73,75], B: [71,73,75,76,78,80,82],
  "F#": [66,68,70,71,73,75,77], F: [65,67,69,70,72,74,76], Bb: [70,72,74,75,77,79,81],
  Eb: [63,65,67,68,70,72,74], Ab: [68,70,72,73,75,77,79], Db: [61,63,65,66,68,70,72],
  Gb: [66,68,70,71,73,75,77],
};
for (const [key, pitches] of Object.entries(SCALES)) {
  const letters = pitches.map((p) => spellPitch(p, key, "major").letter);
  ok(new Set(letters).size === 7,
     `${key} major scale spells ${letters.join(" ")} — reuses a letter`);
}

console.log(problems.length === 0
  ? "OK - the notation code agrees with independently written key signatures"
  : `FAIL - ${problems.length} problems:`);
problems.forEach((p) => console.log("  -", p));
process.exit(problems.length ? 1 : 0);
