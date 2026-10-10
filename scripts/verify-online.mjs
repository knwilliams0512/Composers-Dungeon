/**
 * Smoke test for a live hosted instance: proves two different people can share
 * a guild, which is the whole point of putting this online.
 *
 *   node scripts/verify-online.mjs https://your-app.vercel.app
 *
 * Needs a browser (CHROME_PATH) and DATABASE_URL pointing at the same database
 * the site is using.
 *
 * It creates two throwaway accounts and deletes them again in a finally block,
 * so a real database is not left holding smoke-test players. The addresses use
 * .invalid, a reserved TLD that can never belong to anyone, so a stray signup
 * could not mail a stranger.
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
const PASSWORD = `smoke-${STAMP}-password`;
const MESSAGE = `smoke test ${STAMP}: a cadence only lands if the line earns it`;

const db = new PrismaClient();
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const ok = (label, pass) => {
  console.log(`${pass ? "  ok  " : "  FAIL"}  ${label}`);
  if (!pass) failures.push(label);
};

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  // Each player gets its own browser context, so these are genuinely two
  // people with two cookie jars rather than one session visiting twice.
  const pages = [];
  for (const p of PLAYERS) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/signup`, { waitUntil: "networkidle0", timeout: 60000 });
    await page.type("#displayName", p.name);
    await page.type("#email", p.email);
    await page.type("#password", PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await pause(2000);

    // Not "did we leave /signup", which is true even when the account was
    // created and the session was not. A row in the database with no usable
    // session looks like success and then fails every later check for reasons
    // that have nothing to do with what those checks are testing — which is
    // exactly what happened on the first live run. Landing on /login means
    // the sign-in that follows signup did not take, and the usual cause is a
    // missing NEXTAUTH_SECRET on the deployment.
    const landed = page.url().replace(BASE, "") || "/";
    const signedIn = !/\/signup|\/login/.test(landed);
    ok(`${p.name} signed up AND has a session (landed on ${landed})`, signedIn);
    if (!signedIn && /\/login/.test(landed)) {
      console.log(
        "        ^ the account was created but signing in did not take.\n" +
          "          Check NEXTAUTH_SECRET is set on the deployment: without it\n" +
          "          NextAuth cannot sign a session, so every page needing one\n" +
          "          bounces back to /login."
      );
    }
    pages.push(page);
  }

  // The Placement Trial gates the rest of the app. Skipping it is legitimate
  // here: this is testing that two accounts can reach each other, not that the
  // trial works, and driving 20 questions would make the test brittle.
  const created = await db.userProfile.updateMany({
    where: { user: { email: { in: PLAYERS.map((p) => p.email) } } },
    data: { onboardingComplete: true },
  });
  ok("both accounts exist in the live database", created.count === 2);

  for (const page of pages) {
    await page.goto(`${BASE}/guild`, { waitUntil: "networkidle0", timeout: 60000 });

    // Say what is actually on screen before asserting about it. "No Join
    // button" has several very different causes — a redirect to the Placement
    // Trial, a signed-out session, an error page, or simply different button
    // text — and they are indistinguishable from the assertion alone.
    const seenAt = page.url().replace(BASE, "") || "/";
    const buttons = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button"))
        .map((b) => b.textContent.trim())
        .filter(Boolean)
        .slice(0, 12)
    );
    const heading = await page.evaluate(
      () => document.querySelector("h1, h2")?.textContent?.trim() ?? "(no heading)"
    );
    console.log(`        /guild landed on ${seenAt} — "${heading}"`);
    console.log(`        buttons: ${JSON.stringify(buttons)}`);

    const clicked = await page.evaluate(() => {
      // Tolerate an icon or whitespace inside the button rather than
      // demanding the text be exactly "Join". "Switch" is the same control
      // for a guild you are already in, so it must not be matched.
      const btn = Array.from(document.querySelectorAll("button")).find((b) => {
        const t = b.textContent.trim();
        return t === "Join" || (t.includes("Join") && !t.includes("Switch"));
      });
      if (!btn) return false;
      btn.click();
      return true;
    });
    ok("a guild offered a Join button", clicked);
  }

  // Poll rather than sleep. A fixed wait was the whole reason this reported a
  // failure the first time: the first hit on a serverless function wakes both
  // a cold lambda and a scale-to-zero database, which together take far longer
  // than any sleep worth writing.
  let memberships = [];
  for (let i = 0; i < 20; i++) {
    memberships = await db.guildMember.findMany({
      where: { user: { email: { in: PLAYERS.map((p) => p.email) } } },
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

  await pages[0].goto(`${BASE}/guild`, { waitUntil: "networkidle0", timeout: 60000 });
  const box = await pages[0].$("textarea");
  ok("the guild has somewhere to post", Boolean(box));
  if (box) {
    await box.type(MESSAGE);
    await pages[0].evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent.trim() === "Post to the Guild"
      );
      btn?.click();
    });
    let seen = "";
    for (let i = 0; i < 10; i++) {
      await pause(3000);
      await pages[1].goto(`${BASE}/guild`, { waitUntil: "networkidle0", timeout: 60000 });
      seen = await pages[1].evaluate(() => document.body.innerText);
      if (seen.includes(MESSAGE)) break;
    }
    ok("the second player sees the first player's post", seen.includes(MESSAGE));
    ok("and sees who wrote it", seen.includes(PLAYERS[0].name));
  }

  // Hosted-only behaviour: the updater cannot apply anything on a server.
  await pages[0].goto(`${BASE}/settings`, { waitUntil: "networkidle0", timeout: 60000 });
  const settings = await pages[0].evaluate(() => document.body.innerText);
  ok("the updater is hidden on a hosted instance", !/Check for updates/i.test(settings));
  // This copy only renders when CD_HOSTED=1, so it is the most direct read
  // available on whether that variable actually reached the deployment.
  const hosted = /not optional/i.test(settings);
  ok("CD_HOSTED is set on the deployment (Email panel says a sender is required)", hosted);
  if (!hosted) {
    console.log(
      "        ^ set CD_HOSTED=1 in the project's environment variables and redeploy.\n" +
        "          Without it the app still runs, but it offers the desktop password-reset\n" +
        "          hand-over on a public server, which is an account takeover."
    );
  }
} finally {
  // Always, even if an assertion threw: a real database should not be left
  // holding smoke-test players. Cascades clear memberships and posts.
  const removed = await db.user.deleteMany({
    where: { email: { in: PLAYERS.map((p) => p.email) } },
  });
  console.log(`\ncleaned up ${removed.count} test account(s)`);
  await db.$disconnect();
  await browser.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\nThe online guild works: two separate accounts, one shared guild.");
