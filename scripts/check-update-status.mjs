/**
 * The updater and the screen that watches it must agree.
 *
 * The update progress is reported across a language boundary: PowerShell
 * writes a phase name into a JSON file, TypeScript reads it and draws a step
 * for it. Nothing connects the two, so a renamed phase in the script would
 * leave the panel showing a step that never lights up, and a new step in the
 * panel would wait for a phase that is never written — both of which look
 * exactly like the hang this reporting was added to cure.
 *
 *   node scripts/check-update-status.mjs
 */
import { readFileSync } from "fs";

const UPDATER = "installer/apply-update.ps1";
const PANEL = "src/components/settings/UpdatePanel.tsx";
const READER = "src/lib/update-status.ts";

const problems = [];

const updater = readFileSync(UPDATER, "utf8");
const panel = readFileSync(PANEL, "utf8");
const reader = readFileSync(READER, "utf8");

const emitted = new Set(
  [...updater.matchAll(/Set-Status\s+-Phase\s+"([a-z]+)"/g)].map((m) => m[1])
);
const known = new Set(
  [...reader.matchAll(/^\s*\|\s*"([a-z]+)"/gm)].map((m) => m[1])
);
const shown = [...panel.matchAll(/\{\s*phase:\s*"([a-z]+)"/g)].map((m) => m[1]);

for (const phase of emitted) {
  if (!known.has(phase)) {
    problems.push(`${UPDATER} writes phase "${phase}", which ${READER} does not accept`);
  }
}
for (const phase of shown) {
  if (!emitted.has(phase)) {
    problems.push(`${PANEL} shows a step for "${phase}", which ${UPDATER} never writes`);
  }
}
// The two outcomes the panel branches on must both be reachable.
for (const phase of ["done", "failed"]) {
  if (!emitted.has(phase)) {
    problems.push(`${UPDATER} never writes "${phase}", so the panel can never stop waiting`);
  }
}
// Every failure path has to say so, or the panel spins through a failed update.
if (!/function Fail\([\s\S]{0,200}Set-Status -Phase "failed"/.test(updater)) {
  problems.push(`${UPDATER}: Fail() must write the "failed" status before it exits`);
}

if (problems.length) {
  console.error("update status problems:\n  - " + problems.join("\n  - "));
  process.exit(1);
}
console.log(
  `update status: ${emitted.size} phases written, ${shown.length} shown, all agreed`
);
console.log("OK - the updater and the update screen agree on their phases");
