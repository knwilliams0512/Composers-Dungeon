/**
 * Every export from a "use server" file is an endpoint the browser can call.
 *
 * That is easy to forget when adding a helper beside the actions it serves: a
 * plain function taking a userId, exported for tidiness, becomes a way to ask
 * the server about any account. isAreaUnlocked was exactly that.
 *
 * So: every server action must authenticate, and the only exceptions are the
 * ones that cannot — signing up and resetting a forgotten password.
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

  const starts = [];
  const re = /export async function (\w+)/g;
  let m;
  while ((m = re.exec(src))) starts.push([m[1], m.index]);

  for (let i = 0; i < starts.length; i++) {
    const [name, at] = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1][1] : src.length;
    const body = src.slice(at, end);
    checked++;
    const authenticates = /requireUserId|getSessionUserId/.test(body);
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
