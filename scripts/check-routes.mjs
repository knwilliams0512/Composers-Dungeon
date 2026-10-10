/**
 * Route protection check.
 *
 * src/middleware.ts lists the paths that require a session. A route group
 * added under src/app/(app) without being added there does not become public —
 * the layout still redirects — it becomes slower and stranger: the middleware
 * would have redirected before anything rendered, whereas the layout only
 * redirects once the shell has begun streaming, so the visitor watches
 * "Lighting the torches…" and is then thrown to the sign-in page.
 *
 * Four routes drifted out of that list before anyone noticed, which is exactly
 * the kind of thing a person reports as "it sends me to the wrong page".
 *
 *   node scripts/check-routes.mjs
 */
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const problems = [];
const fail = (m) => problems.push(m);

const APP_DIR = "src/app/(app)";
const groups = readdirSync(APP_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("[") && !d.name.startsWith("("))
  .map((d) => d.name);

const middleware = readFileSync("src/middleware.ts", "utf8");
const listed = Array.from(middleware.matchAll(/"\/([a-z-]+)\/:path\*"/g)).map((m) => m[1]);

for (const g of groups) {
  if (!listed.includes(g))
    fail(`"/${g}" is a route under ${APP_DIR} but is not in the middleware matcher`);
}
// Onboarding lives outside (app) but is just as much a signed-in route.
if (existsSync("src/app/onboarding") && !listed.includes("onboarding"))
  fail('"/onboarding" exists but is not in the middleware matcher');
// And the reverse: a matcher entry for a route that no longer exists is dead
// weight that quietly stops meaning anything.
for (const l of listed) {
  if (l === "onboarding") continue;
  if (!groups.includes(l)) fail(`the middleware matcher lists "/${l}", which is not a route`);
}

// Every one of those pages must also check for itself, since middleware can be
// bypassed by a direct server render in dev and is not a substitute for the
// page knowing who is asking.
for (const g of groups) {
  const page = join(APP_DIR, g, "page.tsx");
  if (!existsSync(page)) continue;
  const src = readFileSync(page, "utf8");
  if (!/getSessionUserId|requireUserId/.test(src))
    fail(`${page} never establishes who is signed in`);
}

// The middleware answers before any page renders, so the sign-in path IT knows
// is the one signed-out visitors actually reach. authOptions names the same
// path for the API route, but the middleware cannot import it — authOptions
// pulls in bcryptjs and Prisma, which do not run in the edge runtime. Two
// copies of one value, so they are checked against each other: when they
// disagree, visitors land on next-auth's generic provider page instead of this
// app's login screen, and nothing else in the build notices.
const mw = readFileSync("src/middleware.ts", "utf8");
const authSrc = readFileSync("src/lib/auth.ts", "utf8");
const mwSignIn = mw.match(/signIn:\s*"([^"]+)"/)?.[1];
const authSignIn = authSrc.match(/pages:\s*\{[^}]*signIn:\s*"([^"]+)"/s)?.[1];
if (!mwSignIn) {
  fail(
    'src/middleware.ts does not name a signIn page. Without one, withAuth sends ' +
      "signed-out visitors to next-auth's own /api/auth/signin instead of this app's login screen."
  );
} else if (!authSignIn) {
  fail("src/lib/auth.ts does not set pages.signIn");
} else if (mwSignIn !== authSignIn) {
  fail(
    `the middleware signs in at "${mwSignIn}" but authOptions says "${authSignIn}" — ` +
      "signed-out visitors and the API route would disagree about where login lives"
  );
}
if (!/withAuth\s*\(/.test(mw)) {
  fail(
    'src/middleware.ts must call withAuth({...}) rather than re-exporting its default: ' +
      "the bare re-export receives Next's fetch event as its options and silently ignores every setting."
  );
}

console.log(
  `routes: ${groups.length} app routes, all named in the middleware matcher; ` +
    `sign-in path "${mwSignIn ?? "?"}" agrees with authOptions`
);
if (problems.length === 0) console.log("OK - no route problems");
else { console.log(`FAIL - ${problems.length} problems:`); problems.forEach((p) => console.log("  -", p)); }
process.exit(problems.length ? 1 : 0);
