/**
 * Nothing may reward a player in silence.
 *
 *   node scripts/check-awards.mjs
 *
 * awardProgress() returns an AwardResult: the XP it really granted after any
 * flame bonus, whether the composer levelled, which skills levelled, where the
 * streak now stands, and every achievement that unlocked. All of that is the
 * reward. The XP number on its own is the receipt.
 *
 * Seven call sites awaited it and threw the whole thing away:
 *
 *   submitLessonQuiz            30% of a lesson's XP
 *   completePracticeExercise    20% of a lesson's XP
 *   submitUnitExam              60-180 XP, the largest moment on the roadmap
 *   createComposition           60-90 XP and two skill levels
 *   submitPart                  70 XP
 *   completeCollabProject       150 XP to every writer
 *   giveBoost                   XP to somebody else (the one honest case)
 *
 * So a learner could pass a quiz, finish the practice, pass the unit exam and
 * save a piece — four rewarded acts — and watch the app acknowledge none of
 * them, while their level silently changed underneath. "It feels like homework"
 * is the correct reading of an app that pays you and does not say so.
 *
 * That bug is invisible to the type checker, because dropping a return value
 * is legal TypeScript. It needs a rule, so here it is, in two parts:
 *
 *   1. Every awardProgress() call binds its result, or states in a comment why
 *      it cannot. Exactly one case genuinely cannot: a guild boost pays the
 *      person being praised, who is not the person on the screen.
 *
 *   2. Every server action that hands an award back has it rendered. An action
 *      that returns an award no component reads is the same silence one layer
 *      up, and it looks fixed, which is worse.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const problems = [];
const fail = (m) => problems.push(m);

/** Every .ts/.tsx file under a directory. */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

const SRC = "src";
const files = walk(SRC);
const read = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

/* -------------------------------------------------------------------------- */
/* Rule 1: no award is granted without being bound or explained               */
/* -------------------------------------------------------------------------- */

/** The marker a call site uses to say the award cannot be shown to anyone. */
const EXCUSE = /award-not-surfaced:\s*(.+)/;

let calls = 0;
let bound = 0;
let excused = 0;

for (const [file, src] of read) {
  // progression.ts defines awardProgress; it does not call it.
  if (file === join("src", "lib", "progression.ts")) continue;
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    if (!/\bawardProgress\s*\(/.test(line)) return;
    if (/^\s*(\*|\/\/)/.test(line)) return; // a mention in prose
    if (/\bimport\b/.test(line)) return;
    calls++;
    const where = `${file}:${i + 1}`;

    // Bound: `const x = await awardProgress(`, `award = await awardProgress(`,
    // `award ??= await awardProgress(`, `return await awardProgress(`.
    if (/(=|\breturn\b)\s*(await\s+)?awardProgress\s*\(/.test(line)) {
      bound++;
      return;
    }

    // Or excused, in the eight lines above it.
    const above = lines.slice(Math.max(0, i - 8), i).join("\n");
    const excuse = EXCUSE.exec(above);
    if (!excuse) {
      fail(
        `${where} awaits awardProgress and drops the result, so the XP, any level-up, ` +
          `any skill level and any achievement it granted are invisible. Bind it and return ` +
          `it, or write "award-not-surfaced: <reason>" above it if there is genuinely nobody ` +
          `to show it to.`
      );
      return;
    }
    if (excuse[1].trim().length < 25)
      fail(`${where} is excused with "${excuse[1].trim()}", which is not a reason`);
    excused++;
  });
}

if (calls === 0) fail("no awardProgress call sites found at all, so this checker is checking nothing");

/* -------------------------------------------------------------------------- */
/* Rule 2: an award that is returned is an award that is shown                */
/* -------------------------------------------------------------------------- */

const ACTIONS = "src/server/actions";
const actionFiles = readdirSync(ACTIONS).filter((f) => f.endsWith(".ts"));

/**
 * `award` as a property of a type, wherever it sits.
 *
 * Anchoring this to the start of a line is how the first version of this
 * checker quietly missed both CollabResult and completePracticeExercise's
 * inline `Promise<{ ok: boolean; award?: AwardResult }>` — it passed, and it
 * was checking half of what it claimed.
 */
const AWARD_PROP = /(^|[{;,\s])award\??\s*:/;

/** Types declared in a file that carry an award. */
function awardingTypes(src) {
  const names = new Set();
  // A declaration runs to the first line that closes a brace at column 0,
  // which is how this file formats every type it declares.
  const re = /^(?:export\s+)?(?:interface|type)\s+(\w+)[^\n]*\{[\s\S]*?^\}/gm;
  for (const m of src.matchAll(re)) {
    if (AWARD_PROP.test(m[0])) names.add(m[1]);
  }
  return names;
}

/** Exported actions that hand an award back to the caller. */
const awarding = new Map(); // module name -> Set<function name>

for (const f of actionFiles) {
  const src = readFileSync(join(ACTIONS, f), "utf8");
  const types = awardingTypes(src);
  const found = new Set();

  // `export async function name(...): Promise<T>` where T carries an award,
  // or whose inline return type object declares one.
  const re = /export\s+async\s+function\s+(\w+)\s*\(([\s\S]*?)\)\s*:\s*Promise<([\s\S]*?)>\s*\{/g;
  for (const m of src.matchAll(re)) {
    const [, name, , ret] = m;
    const retType = ret.trim();
    if (AWARD_PROP.test(retType)) found.add(name);
    else if (types.has(retType)) found.add(name);
  }
  if (found.size > 0) awarding.set(f.replace(/\.ts$/, ""), found);
}

if (awarding.size === 0) fail("no server action appears to return an award, which cannot be right");

// Who imports them, and does that file render a banner?
const clientFiles = files.filter((f) => f.startsWith(join("src", "components")) || f.startsWith(join("src", "app")));

for (const [mod, fns] of awarding) {
  for (const file of clientFiles) {
    const src = read.get(file);
    const imp = new RegExp(`import\\s*\\{([\\s\\S]*?)\\}\\s*from\\s*"@/server/actions/${mod}"`);
    const m = imp.exec(src);
    if (!m) continue;
    const imported = m[1]
      .split(",")
      .map((s) => s.replace(/\btype\b/, "").trim())
      .filter(Boolean);
    const awardingImports = imported.filter((n) => fns.has(n));
    if (awardingImports.length === 0) continue;
    if (!/AwardBanner/.test(src)) {
      fail(
        `${file} calls ${awardingImports.join(", ")} from ${mod}, which returns an award, ` +
          `but renders no AwardBanner — so the award is handed back and dropped on the floor ` +
          `here instead of in the action, which is the same silence one layer up`
      );
    }
  }
}

/* -------------------------------------------------------------------------- */

const total = Array.from(awarding.values()).reduce((n, s) => n + s.size, 0);
console.log(
  `awards: ${calls} awardProgress call sites, ${bound} binding their result and ` +
    `${excused} stating why they cannot; ${total} actions across ${awarding.size} modules return ` +
    `an award, and every component that calls one renders it`
);
if (problems.length === 0) console.log("OK - nothing rewards a player in silence");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
