/**
 * No JSON.parse on stored data without a guard.
 *
 * SQLite has no JSON type, so this app keeps lists, puzzles, quiz choices and
 * whole scores in text columns. A row that has been through an interrupted
 * upgrade, a partial restore or an older schema can hold something those
 * parsers were not written for — and an unguarded JSON.parse in a server
 * component throws before the page renders anything, which is what the player
 * sees as the app breaking rather than as one lesson or one puzzle being
 * unavailable.
 *
 * Every JSON.parse must sit inside a try, so the failure stays local.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

/** Is this line inside a try block that began earlier in the same function? */
function guarded(lines, at) {
  for (let j = at; j >= 0 && j > at - 60; j--) {
    if (/^\s*try\s*\{/.test(lines[j])) return true;
    // Stop at the start of the enclosing declaration.
    if (j < at && /^(export )?(async )?function |^const \w+ = (async )?[(<]/.test(lines[j])) return false;
  }
  return false;
}

const offenders = [];
for (const file of walk("src")) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (!line.includes("JSON.parse")) return;
    if (!guarded(lines, i)) offenders.push(`${file}:${i + 1}  ${line.trim().slice(0, 90)}`);
  });
}

if (offenders.length) {
  console.log("JSON.parse with nothing to catch a malformed row:");
  for (const o of offenders) console.log(`  ${o}`);
  console.log(`\nFAIL - ${offenders.length} unguarded JSON.parse call(s)`);
  process.exit(1);
}
console.log("OK - every JSON.parse of stored data is guarded");
