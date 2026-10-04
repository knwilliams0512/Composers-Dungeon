/**
 * Every export from a "use server" file is an endpoint the browser can call.
 *
 * That is easy to forget when adding a helper beside the actions it serves: a
 * plain function taking a userId, exported for tidiness, becomes a way to ask
 * the server about any account. isAreaUnlocked was exactly that.
 *
 * So: every server action must authenticate, and the only exceptions are the
 * ones that cannot — signing up and resetting a forgotten password.
 *
 * Authenticating through a gate counts. Several actions check more than who is
 * calling — a guild action has to establish membership as well — and doing
 * that inline in every one of them is how the membership check eventually gets
 * left out of the tenth. Those files put the check in one local helper and
 * call it first. This finds such helpers (a non-exported function in the same
 * file that itself calls requireUserId) and treats calling one as
 * authenticating, so the pattern is allowed without the guarantee being
 * weakened: the helper still has to do the real check.
 */

import { readdirSync, readFileSync } from "node:fs";

const DIR = "src/server/actions";
const PUBLIC = new Set(["signup", "requestPasswordReset", "resetPassword"]);

let failures = 0;
const fail = (m) => {
  console.log(`  ${m}`);
  failures++;
};

let checked = 0;
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".ts"))) {
  const src = readFileSync(`${DIR}/${file}`, "utf8");
  if (!/^\s*["']use server["']/m.test(src)) continue;

  // Local helpers that authenticate. A call to one of these is as good as an
  // inline check, because the helper cannot return without having made it.
  // Every function in the file, exported or not, so a helper's body can be
  // bounded by whatever comes next. Bounding it by the next *helper* instead
  // lets the last one swallow every action below it, and then the file's own
  // actions make it look as though the helper authenticates.
  const allFns = [];
  const fnRe = /\n(?:export )?(?:async )?function (\w+)\s*\(/g;
  let f;
  while ((f = fnRe.exec(src))) {
    allFns.push({ name: f[1], at: f.index, exported: f[0].includes("export ") });
  }

  const gates = new Set();
  for (let i = 0; i < allFns.length; i++) {
    const fn = allFns[i];
    if (fn.exported) continue;
    const end = i + 1 < allFns.length ? allFns[i + 1].at : src.length;
    if (/requireUserId|getSessionUserId/.test(src.slice(fn.at, end))) gates.add(fn.name);
  }

  const starts = [];
  const re = /export async function (\w+)/g;
  let m;
  while ((m = re.exec(src))) starts.push([m[1], m.index]);

  for (let i = 0; i < starts.length; i++) {
    const [name, at] = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1][1] : src.length;
    const body = src.slice(at, end);
    checked++;
    const callsGate = [...gates].some((g) =>
      new RegExp(`\\b(?:await\\s+)?${g}\\s*\\(`).test(body)
    );
    const authenticates = /requireUserId|getSessionUserId/.test(body) || callsGate;
    if (!authenticates && !PUBLIC.has(name)) {
      fail(`${file}: ${name}() is callable from the browser and never checks who is calling`);
    }
    if (authenticates && PUBLIC.has(name)) {
      fail(`${file}: ${name}() is listed as public but does authenticate - update this list`);
    }
  }

  // A non-async export in a "use server" file is a build error in Next, but a
  // stray exported type or const is worth catching here with a clearer message.
  const stray = src.match(/^export (?!async function)(?!type )(?!interface )(?!default )\w+/gm);
  if (stray) fail(`${file}: exports something that is not an action: ${stray.join(", ")}`);
}

if (failures) {
  console.log(`\nFAIL - ${failures} problem(s) with server actions`);
  process.exit(1);
}
console.log(`actions: ${checked} server actions checked, all authenticated (${PUBLIC.size} public by design)`);
console.log("OK - no server action problems");
