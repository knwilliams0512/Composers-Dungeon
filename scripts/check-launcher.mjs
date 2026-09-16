/**
 * Launcher sanity check.
 *
 * The Windows launcher and updater are PowerShell, and nothing in this repo
 * can run PowerShell — there is no interpreter on the build machine and none
 * in CI. That gap has already cost real time: a `Set-Content -Encoding UTF8`
 * that would have written a BOM Chrome rejects, and a function returning an
 * empty array whose caller then read `.Count` off `$null`.
 *
 * This cannot replace running them. What it can do is catch the structural
 * mistakes that turn a diagnostic aid into a new crash, and the specific
 * traps already hit once.
 *
 *   node scripts/check-launcher.mjs
 */
import { readFileSync, existsSync } from "fs";

const FILES = [
  "installer/app-launcher.ps1",
  "installer/apply-update.ps1",
];

const problems = [];
const fail = (f, m) => problems.push(`${f}: ${m}`);

for (const file of FILES) {
  if (!existsSync(file)) { fail(file, "missing"); continue; }
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");

  // --- Structure ----------------------------------------------------------
  // Strings and comments have to come out before counting, and a chain of
  // regexes cannot do it: stripping single-quoted strings first makes the
  // apostrophe in "Composer's Dungeon" open a string that swallows the code
  // after it. (That is not hypothetical — this check reported two phantom
  // unbalanced parens until it walked the file properly.) So walk it once,
  // tracking what we are inside. PowerShell escapes with a backtick.
  const stripped = (() => {
    let out = "";
    let i = 0;
    let mode = "code"; // code | single | double | line | block
    while (i < src.length) {
      const c = src[i];
      const next = src[i + 1];
      if (mode === "code") {
        if (c === "<" && next === "#") { mode = "block"; i += 2; continue; }
        if (c === "#") { mode = "line"; i += 1; continue; }
        if (c === "'") { mode = "single"; i += 1; continue; }
        if (c === '"') { mode = "double"; i += 1; continue; }
        out += c; i += 1; continue;
      }
      if (mode === "block") { if (c === "#" && next === ">") { mode = "code"; i += 2; } else i += 1; continue; }
      if (mode === "line") { if (c === "\n") { mode = "code"; out += "\n"; } i += 1; continue; }
      if (mode === "single") {
        // '' is an escaped quote inside a single-quoted string.
        if (c === "'" && next === "'") { i += 2; continue; }
        if (c === "'") { mode = "code"; }
        i += 1; continue;
      }
      // double
      if (c === "`") { i += 2; continue; }        // backtick escape
      if (c === '"' && next === '"') { i += 2; continue; }
      if (c === '"') { mode = "code"; }
      i += 1; continue;
    }
    return out;
  })();

  for (const [open, close, name] of [["{", "}", "braces"], ["(", ")", "parentheses"], ["[", "]", "brackets"]]) {
    const o = (stripped.match(new RegExp(`\\${open}`, "g")) ?? []).length;
    const c = (stripped.match(new RegExp(`\\${close}`, "g")) ?? []).length;
    if (o !== c) fail(file, `unbalanced ${name}: ${o} ${open} against ${c} ${close}`);
  }

  // Every function must be called with space-separated arguments. PowerShell
  // accepts `F($a, $b)` and silently passes ONE argument: an array.
  const declared = Array.from(src.matchAll(/^function\s+([A-Za-z-]+)\s*\(([^)]*)\)/gm))
    .map((m) => ({ name: m[1], arity: m[2].trim() ? m[2].split(",").length : 0 }));
  for (const fn of declared) {
    if (fn.arity < 2) continue;
    const bad = new RegExp(`(?<!function\\s)\\b${fn.name}\\s*\\([^)]*,`, "g");
    if (bad.test(src))
      fail(file, `${fn.name} takes ${fn.arity} arguments but is called like a method — PowerShell would pass one array`);
  }

  // --- Traps already hit once ---------------------------------------------
  lines.forEach((line, i) => {
    const at = `line ${i + 1}`;
    // A BOM breaks the JSON files this script rewrites.
    if (/^\s*#/.test(line)) return; // a comment explaining a trap is not the trap
    if (/Set-Content[^#]*-Encoding\s+UTF8/i.test(line) && !/NoBOM/i.test(line))
      fail(file, `${at}: Set-Content -Encoding UTF8 writes a BOM on Windows PowerShell; use [System.IO.File]::WriteAllText`);
    // -like treats [ ] as wildcards, and install paths can contain them.
    if (/-like\s+"\*\$(profileDir|Root|AppDir|DataDir)/.test(line))
      fail(file, `${at}: -like against a path treats [ ] as wildcards; use .Contains()`);
  });

  // A function must be defined before the first line that calls it: this file
  // runs top to bottom, not as a module.
  for (const fn of declared) {
    const defLine = lines.findIndex((l) => new RegExp(`^function\\s+${fn.name}\\b`).test(l));
    const callLine = lines.findIndex(
      (l, n) => n !== defLine && new RegExp(`(^|[^-\\w])${fn.name}\\s`).test(l) && !/^\s*#/.test(l) && !/^function\s/.test(l)
    );
    if (callLine >= 0 && callLine < defLine)
      fail(file, `${fn.name} is called on line ${callLine + 1} but not defined until line ${defLine + 1}`);
  }

  // Anything that stops the app must say why. A bare path is what sent a
  // player hunting through AppData for a three-line error.
  // Each script reports failure its own way: the launcher pops a dialog, the
  // updater logs and pops through Fail().
  const reports = /Show-Problem|function Fail\(/.test(src);
  if (!reports) fail(file, "no way to report a failure — it would fail silently");
}

// The launcher has to keep repairing the database on every start; that is the
// only route a broken install has back to working.
const launcher = readFileSync("installer/app-launcher.ps1", "utf8");
if (!/--schema-only/.test(launcher))
  fail("installer/app-launcher.ps1", "no longer runs the startup schema repair");
if (!/Test-Install/.test(launcher))
  fail("installer/app-launcher.ps1", "no longer checks the install before starting");

console.log(`launcher: ${FILES.length} PowerShell files checked for structure and known traps`);
if (problems.length === 0) console.log("OK - no launcher problems");
else { console.log(`FAIL - ${problems.length} problems:`); problems.forEach((p) => console.log("  -", p)); }
process.exit(problems.length ? 1 : 0);
