/**
 * Smoke test for a live hosted instance: proves two different people can share
 * a guild, which is the whole point of putting this online.
 *
 *   node scripts/verify-online.mjs https://your-app.vercel.app
 *
 * Needs a browser (CHROME_PATH) and DATABASE_URL pointing at the same database
 * the site is using.
 *
 * It creates two throwaway accounts and deletes them again, so a real database
 * is not left holding smoke-test players. The addresses use .invalid, a
 * reserved TLD that can never belong to anyone, so a stray signup could not
 * mail a stranger.
 *
 * Every assertion here has to be able to FAIL. Two could not, and both read as
 * passes for weeks: one tested for a string the app never renders, and one
 * asked "did we leave /signup", which is true of the login page too.
 */
import puppeteer from "puppeteer-core";
import { PrismaClient } from "@prisma/client";

const BASE = (process.argv[2] || "").replace(/\/+$/, "");
if (!BASE) {
  console.error("usage: node scripts/verify-online.mjs <url>");
  process.exit(1);
}

const STAMP = Date.now();
const PLAYERS = [
  { name: "Smoke Test Aria", email: `cd-smoke-${STAMP}-a@example.invalid` },
  { name: "Smoke Test Zephyr", email: `cd-smoke-${STAMP}-b@example.invalid` },
];
const EMAILS = PLAYERS.map((p) => p.email);
const PASSWORD = `smoke-${STAMP}-password`;
const MESSAGE = `smoke test ${STAMP}: a cadence only lands if the line earns it`;

const db = new PrismaClient();
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
/** Where a page is, relative to the site. Absolute if it left the site. */
const pathOf = (page) => {
  const u = page.url();
  return u.startsWith(BASE) ? u.slice(BASE.length) || "/" : u;
};

const failures = [];
// stdout, not stderr: the workflow pipes only stdout into the job summary, so
// anything written to stderr never reaches the one artifact this produces.
const ok = (label, pass) => {
  console.log(`${pass ? "  ok  " : "  FAIL"}  ${label}`);
  if (!pass) failures.push(label);
};
const note = (text) => console.log(`        ${text}`);

/**
 * Whether this browser context holds a real session.
 *
 * Asked positively, by reading the session endpoint, rather than by checking
 * the URL is not one of a couple of known signed-out pages. There are many
 * signed-out destinations — /login, /api/auth/signin, /api/auth/error when
 * NEXTAUTH_SECRET is missing, the landing page, an error page — and a denylist
 * of two reports success for all the others.
 */
async function hasSession(page) {
  try {
    return await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/auth/session`, { credentials: "include" });
      if (!r.ok) return false;
      const s = await r.json().catch(() => null);
      return Boolean(s && s.user);
    }, BASE);
  } catch {
    return false;
  }
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const pages = [];
  for (const p of PLAYERS) {
    // Each player gets its own browser context: two cookie jars, so these are
    // genuinely two people rather than one session visiting twice.
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/signup`, { waitUntil: "networkidle0", timeout: 60000 });
    await page.type("#displayName", p.name);
    await page.type("#email", p.email);
    await page.type("#password", PASSWORD);
    await page.click('button[type="submit"]');

    // Poll for the session rather than sleeping. Signing up on a cold
    // deployment wakes a serverless function and a scale-to-zero database
    // together, and it can also redirect more than once, so any fixed wait is
    // either a flake or a lie.
    let signedIn = false;
    for (let i = 0; i < 20 && !signedIn; i++) {
      await pause(1500);
      signedIn = await hasSession(page);
    }
    ok(`${p.name} signed up and holds a session`, signedIn);
    if (!signedIn) {
      note(`last seen at ${pathOf(page)}`);
      const err = await page
        .evaluate(() => document.body.innerText.slice(0, 300))
        .catch(() => "");
      if (err) note(`page said: ${err.replace(/\s+/g, " ").trim()}`);
      note("A missing NEXTAUTH_SECRET on the deployment does exactly this: the");
      note("account is written, but nothing can sign a session cookie.");
    }
    pages.push({ page, signedIn, who: p });
  }

  // Stop here rather than reporting five more failures with one cause. Every
  // check below needs a session, so without one they describe the symptom and
  // name the wrong culprit — including telling the operator to set CD_HOSTED
  // on a deployment where it may be perfectly fine.
  if (!pages.every((p) => p.signedIn)) {
    note("");
    note("Skipping the guild checks: they all need a signed-in player.");
    throw new Error("no session");
  }

  const accounts = await db.user.count({ where: { email: { in: EMAILS } } });
  ok("both accounts exist in the live database", accounts === 2);

  // The Placement Trial gates the rest of the app. Skipping it is legitimate:
  // this tests whether two accounts can reach each other, and driving twenty
  // questions would make it brittle without testing anything it is here for.
  await db.userProfile.updateMany({
    where: { user: { email: { in: EMAILS } } },
    data: { onboardingComplete: true },
  });

  for (const { page, who } of pages) {
    await page.goto(`${BASE}/guild`, { waitUntil: "networkidle0", timeout: 60000 });
    const heading = await page.evaluate(
      () => document.querySelector("h1, h2")?.textContent?.trim() ?? "(no heading)"
    );
    const buttons = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button"))
        .map((b) => `${b.textContent.trim()}${b.disabled ? " [disabled]" : ""}`)
        .filter((t) => t && t !== "[disabled]")
        .slice(0, 12)
    );
    note(`${who.name}: /guild -> ${pathOf(page)} — "${heading}"`);
    note(`buttons: ${JSON.stringify(buttons)}`);

    const result = await page.evaluate(() => {
      // "Switch" is this same control for a guild you are already in, so it
      // must not be matched.
      const btn = Array.from(document.querySelectorAll("button")).find((b) => {
        const t = b.textContent.trim();
        return t === "Join" || (t.includes("Join") && !t.includes("Switch"));
      });
      if (!btn) return "missing";
      // A browser ignores .click() on a disabled button and fires no event, so
      // clicking one and returning true reports a join that never happened.
      if (btn.disabled) return "disabled";
      btn.click();
      return "clicked";
    });
    ok(`${who.name} could click Join (${result})`, result === "clicked");
  }

  let memberships = [];
  for (let i = 0; i < 20; i++) {
    memberships = await db.guildMember.findMany({
      where: { user: { email: { in: EMAILS } } },
      select: { guildId: true },
    });
    if (memberships.length === 2) break;
    await pause(3000);
  }
  ok("both joined a guild", memberships.length === 2);
  ok(
    "both joined the SAME guild",
    memberships.length === 2 && memberships[0].guildId === memberships[1].guildId
  );

  const first = pages[0].page;
  await first.goto(`${BASE}/guild`, { waitUntil: "networkidle0", timeout: 60000 });
  const box = await first.$("textarea");
  ok("the guild has somewhere to post", Boolean(box));
  if (box) {
    await box.type(MESSAGE);
    const posted = await first.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent.trim().includes("Post to the Guild")
      );
      if (!btn || btn.disabled) return false;
      btn.click();
      return true;
    });
    // Asserted, not swallowed: without this, a renamed button looks like a
    // post that was written and not delivered.
    ok("the post button could be pressed", posted);

    if (posted) {
      const second = pages[1].page;
      let seen = "";
      for (let i = 0; i < 10; i++) {
        await pause(3000);
        await second.goto(`${BASE}/guild`, { waitUntil: "networkidle0", timeout: 60000 });
        seen = await second.evaluate(() => document.body.innerText);
        if (seen.includes(MESSAGE)) break;
      }
      ok("the second player sees the first player's post", seen.includes(MESSAGE));
      ok("and sees who wrote it", seen.includes(PLAYERS[0].name));
    }
  }

  await first.goto(`${BASE}/settings`, { waitUntil: "networkidle0", timeout: 60000 });
  const settings = await first.evaluate(() => document.body.innerText);
  // Assert on text the panel actually renders. The previous check looked for
  // "Check for updates", which appears nowhere in the app, so it could only
  // ever pass — including on a page the browser never reached.
  ok("the settings page was reached", /Your Data|Composer Tools/i.test(settings));
  ok(
    "the updater is hidden on a hosted instance",
    !/Check now|Installed version/i.test(settings)
  );
  const hosted = /not optional/i.test(settings);
  ok("CD_HOSTED is set on the deployment (Email panel says a sender is required)", hosted);
  if (!hosted) {
    note("^ set CD_HOSTED=1 in the project's environment variables and redeploy.");
    note("  Without it the app offers the desktop password-reset hand-over on a");
    note("  public server, which behind a proxy is an account takeover.");
  }
} catch (e) {
  if (e?.message !== "no session") {
    console.log(`\n  FAIL  the test itself threw: ${e?.message ?? e}`);
    failures.push("the test itself threw");
  }
} finally {
  // Close the browser FIRST. When cleanup ran first, a database hiccup threw
  // out of the finally block and left a headless Chrome behind on the runner
  // while discarding every result the run had already produced.
  await browser.close().catch(() => {});
  try {
    const removed = await db.user.deleteMany({ where: { email: { in: EMAILS } } });
    console.log(`\ncleaned up ${removed.count} test account(s)`);
  } catch (e) {
    console.log(`\ncould not clean up the test accounts: ${e?.message ?? e}`);
    console.log(`remove them by hand: ${EMAILS.join(", ")}`);
  }
  await db.$disconnect().catch(() => {});
}

if (failures.length) {
  console.log(`\n${failures.length} check(s) failed:`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("\nThe online guild works: two separate accounts, one shared guild.");
