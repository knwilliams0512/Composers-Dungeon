/**
 * Reports what guilds really exist in the live world, and optionally joins a
 * player-founded one with a demo account.
 *
 *   node scripts/guild-report.mjs https://your-app.vercel.app
 *   node scripts/guild-report.mjs https://your-app.vercel.app --join
 *
 * Needs DATABASE_URL pointing at the same database the site serves, and for
 * --join a browser at CHROME_PATH.
 *
 * Why this is the right place to ask "is the guild I made in the app there?":
 * the installed Windows app opens the hosted site in its own window, so the
 * app and the browser are one world and one database. A guild founded in the
 * app lands here. If it does NOT, the app was almost certainly in its offline
 * fallback, writing to the SQLite file on that machine instead — which looks
 * identical from inside the app and is the single most likely explanation for
 * a guild that "exists" but cannot be found.
 *
 * The demo account is deliberately NOT deleted afterwards. The point of
 * joining is to leave a member behind; a throwaway that cleans itself up would
 * prove the click worked and then undo the only thing that was asked for.
 */
import puppeteer from "puppeteer-core";
import { PrismaClient } from "@prisma/client";

const BASE = (process.argv[2] || "").replace(/\/+$/, "");
const DO_JOIN = process.argv.includes("--join");
if (!BASE) {
  console.error("usage: node scripts/guild-report.mjs <url> [--join]");
  process.exit(1);
}

const db = new PrismaClient();
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const ok = (label, pass) => {
  console.log(`${pass ? "  ok  " : "  FAIL"}  ${label}`);
  if (!pass) failures.push(label);
};
const note = (text) => console.log(`        ${text}`);

/** An address is identifying; a shape is enough to recognise your own account. */
const maskEmail = (e) => {
  if (!e) return "(none)";
  const [local, domain] = String(e).split("@");
  const head = local.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, local.length - 2))}@${domain ?? "?"}`;
};
const when = (d) => (d ? new Date(d).toISOString().replace("T", " ").slice(0, 16) : "?");

let browser;
try {
  // --- What is actually there ---------------------------------------------
  const guilds = await db.guild.findMany({
    orderBy: [{ official: "desc" }, { createdAt: "asc" }],
    include: {
      // displayName lives on UserProfile, not User.
      founder: { select: { profile: { select: { displayName: true } } } },
      _count: { select: { members: true } },
    },
  });

  console.log(`guilds in the live database: ${guilds.length}`);
  console.log("");
  for (const g of guilds) {
    const kind = g.official ? "shipped" : "PLAYER-FOUNDED";
    const members = `${g._count.members} member${g._count.members === 1 ? "" : "s"}`;
    console.log(
      `  ${g.emblem}  ${g.name}  [${kind}]  ${members}  key=${g.key}  made ${when(g.createdAt)}`
    );
    if (!g.official) {
      note(`founded by ${g.founder?.profile?.displayName ?? "(founder since deleted)"}`);
    }
  }
  console.log("");

  const shipped = guilds.filter((g) => g.official);
  const founded = guilds.filter((g) => !g.official);

  ok(`the ${shipped.length} shipped houses are present`, shipped.length === 6);
  ok("a player-founded guild exists", founded.length > 0);

  if (founded.length === 0) {
    // The useful part is not the failure, it is the reason.
    note("Nothing was founded in this database. The most likely cause is not a");
    note("bug in guild creation but WHERE the app was writing: if the launcher");
    note("could not reach the server it falls back to the local SQLite file,");
    note("and a guild made in that state lives only on that PC.");
    note("");
    const recent = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        email: true,
        createdAt: true,
        profile: { select: { displayName: true } },
      },
    });
    note(`accounts in this database: ${await db.user.count()}`);
    for (const u of recent) {
      const name = u.profile?.displayName ?? "(no profile)";
      note(`  ${name} — ${maskEmail(u.email)} — joined ${when(u.createdAt)}`);
    }
    note("");
    note("If your own account is not in that list, the app never signed in here,");
    note("which confirms the offline-fallback explanation.");
  }

  // --- Join one, if asked and if there is one ------------------------------
  if (DO_JOIN && founded.length > 0) {
    // The newest, since that is the one just made.
    const target = founded.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
    console.log("");
    console.log(`joining "${target.name}" with a demo account`);

    const stamp = Date.now();
    const demo = {
      name: "Demo Composer",
      email: `cd-demo-${stamp}@example.invalid`,
      // Random, and never printed. This account exists to be a guildmate, not
      // to be logged into; a password in a log is a password in a log.
      password: `demo-${stamp}-${Math.random().toString(36).slice(2, 12)}`,
    };

    browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();

    await page.goto(`${BASE}/signup`, { waitUntil: "networkidle0", timeout: 60000 });
    await page.type("#displayName", demo.name);
    await page.type("#email", demo.email);
    await page.type("#password", demo.password);
    await page.click('button[type="submit"]');

    // Poll for the session: a cold function and a scale-to-zero database wake
    // together, so any fixed wait is either a flake or a lie.
    let signedIn = false;
    for (let i = 0; i < 20 && !signedIn; i++) {
      await pause(1500);
      signedIn = await page
        .evaluate(async (base) => {
          const r = await fetch(`${base}/api/auth/session`, { credentials: "include" });
          if (!r.ok) return false;
          const s = await r.json().catch(() => null);
          return Boolean(s && s.user);
        }, BASE)
        .catch(() => false);
    }
    ok("the demo account signed up and holds a session", signedIn);

    if (signedIn) {
      await page.goto(`${BASE}/guild`, { waitUntil: "networkidle0", timeout: 60000 });

      // Click the Join on the card that names THIS guild. Clicking the first
      // Join on the page would join whichever house happens to render first
      // and then report success for the wrong one.
      const clicked = await page.evaluate((name) => {
        const buttons = Array.from(document.querySelectorAll("button"));
        for (const b of buttons) {
          if (!/^(Join|Switch)$/.test((b.textContent || "").trim())) continue;
          // Walk up until an ancestor also contains the guild's heading.
          let el = b;
          for (let depth = 0; depth < 6 && el; depth++) {
            el = el.parentElement;
            if (!el) break;
            const h = el.querySelector("h3");
            if (h && (h.textContent || "").trim() === name) {
              b.click();
              return true;
            }
          }
        }
        return false;
      }, target.name);
      ok(`found and pressed Join on "${target.name}"`, clicked);

      if (clicked) {
        // The database is the verdict, not the button's own appearance.
        let joined = false;
        for (let i = 0; i < 12 && !joined; i++) {
          await pause(1500);
          const m = await db.guildMember.findFirst({
            where: { guild: { id: target.id }, user: { email: demo.email } },
          });
          joined = Boolean(m);
        }
        ok(`the demo account is now a member of "${target.name}"`, joined);

        if (joined) {
          const after = await db.guild.findUnique({
            where: { id: target.id },
            include: { _count: { select: { members: true } } },
          });
          note(`"${target.name}" now has ${after?._count.members ?? "?"} member(s)`);
          note(`the demo account is ${maskEmail(demo.email)} (left in place on purpose)`);
        }
      }
    }
  } else if (DO_JOIN) {
    note("nothing to join: no player-founded guild in this database");
  }

  console.log("");
  if (failures.length) {
    console.log(`${failures.length} check(s) failed:`);
    for (const f of failures) console.log(`  - ${f}`);
  } else {
    console.log("All checks passed.");
  }
} finally {
  // Close the browser before the database: a hung browser must not strand the
  // connection, and the report above is already printed either way.
  if (browser) await browser.close().catch(() => {});
  await db.$disconnect().catch(() => {});
}

process.exit(failures.length ? 1 : 0);
