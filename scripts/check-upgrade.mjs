/**
 * Upgrade integrity check.
 *
 * An installed copy updates itself in place: it swaps the app, then runs
 * installer/upgrade.js to bring the player's own database up to the schema the
 * new build expects. That step used to rely on a hand-written migration for
 * every schema change, and four shipped without one — guilds, the freedom
 * switch, secret rooms, the accessibility settings. Updated installs were left
 * without those columns, so the re-seed died partway through on
 * `DungeonRoom.secret`, and every page that read a profile died on
 * `The column fullFreedom does not exist in the current database`. The app
 * opened straight onto its own error page.
 *
 * Nothing about that failed at build time, and nothing failed in development,
 * where the database is always created fresh from the current schema. It only
 * appeared on a machine that had the app before.
 *
 * So this runs the real installer/upgrade.js — not a copy of its logic —
 * against databases built from the schema as it stood at each commit that
 * changed it, and then checks, column by column, that the result matches what
 * this build actually queries.
 *
 * It runs the real seed too, which for a long time it did not. The schema step
 * alone was measured, so the half of the upgrade that writes every lesson,
 * area and boss into a database that already has some of them was never
 * exercised here at all — and a seed that throws is the one thing the updater
 * reads as "this version does not work". So: the content this build ships has
 * to land in every historical database, and a seed that fails must cost the
 * new content and nothing else.
 *
 *   node scripts/check-upgrade.mjs
 */
import { execFileSync } from "child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync, symlinkSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { PrismaClient } from "@prisma/client";

const problems = [];
const fail = (m) => problems.push(m);
const run = (cmd, args, env) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env } });

const ROOT = process.cwd();
const expected = run("npx", ["prisma", "migrate", "diff", "--from-empty",
  "--to-schema-datamodel", "prisma/schema.prisma", "--script"]);

/** tableName -> Set(columns), read out of a CREATE TABLE script. */
function shapeOf(ddl) {
  const shape = new Map();
  for (const [, table, body] of ddl.matchAll(/CREATE TABLE "([^"]+)" \(([\s\S]*?)\n\);/g)) {
    const cols = new Set();
    for (const line of body.split("\n")) {
      const name = (line.trim().match(/^"([^"]+)"/) || [])[1];
      if (name) cols.add(name);
    }
    shape.set(table, cols);
  }
  return shape;
}
const want = shapeOf(expected);

// The shipped DDL has to BE the current schema, or the updater brings players
// up to a schema the app no longer queries.
if (!existsSync("prisma/schema.sql")) {
  fail("prisma/schema.sql is missing — the updater has nothing to reconcile against");
} else if (readFileSync("prisma/schema.sql", "utf8").trim() !== expected.trim()) {
  fail("prisma/schema.sql is out of date with prisma/schema.prisma — run: npm run schema:sql");
}

// Every commit that changed the schema is a shape some player's database is
// still in. The oldest alone is not enough — a later one can add a column the
// reconciler mishandles.
const history = run("git", ["log", "--format=%H", "--", "prisma/schema.prisma"])
  .split("\n").filter(Boolean);
if (history.length === 0) fail("no history for prisma/schema.prisma");

const work = mkdtempSync(join(tmpdir(), "cd-upgrade-"));
let tested = 0;

// The seed as an installed copy runs it: bundled to plain CommonJS, with only
// @prisma/client left external. Running prisma/seed.ts through tsx instead
// would test something the updater never executes.
const seedRunner = join(work, "seed-runner.js");
run("npx", ["esbuild", "prisma/seed.ts", "--bundle", "--platform=node",
  "--format=cjs", "--target=node18", "--external:@prisma/client",
  `--outfile=${seedRunner}`, "--log-level=warning"]);

/** The content keys a database holds, as the app looks them up. */
async function contentOf(dbFile) {
  const c = new PrismaClient({ datasources: { db: { url: `file:${dbFile}` } } });
  try {
    const keys = async (model, field) =>
      (await c[model].findMany({ select: { [field]: true } })).map((r) => r[field]).sort();
    return {
      lessons: await keys("lesson", "slug"),
      areas: await keys("dungeonArea", "key"),
      bosses: await keys("boss", "key"),
      achievements: await keys("achievement", "key"),
    };
  } finally {
    await c.$disconnect();
  }
}

/** An install laid out the way the updater expects to find one. */
function installAt(root, schema, withSeed = true) {
  const appDir = join(root, "app");
  const dataDir = join(root, "data");
  mkdirSync(appDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });
  const db = join(dataDir, "dungeon.db");
  run("npx", ["prisma", "db", "push", "--schema", schema, "--skip-generate"], { DATABASE_URL: `file:${db}` });
  symlinkSync(join(ROOT, "node_modules"), join(appDir, "node_modules"));
  writeFileSync(join(appDir, "schema.sql"), expected);
  try { run("cp", ["-r", join(ROOT, "migrations"), join(appDir, "migrations")]); } catch {}
  if (withSeed) run("cp", [seedRunner, join(appDir, "seed-runner.js")]);
  return { appDir, dataDir, db };
}

// What a database that has been through this build's seed looks like. Built
// from the current schema, so it measures the seed rather than the upgrade.
const refRoot = join(work, "reference");
const currentSchema = join(work, "current.prisma");
writeFileSync(currentSchema, readFileSync("prisma/schema.prisma", "utf8"));
const reference = installAt(refRoot, currentSchema);
run("node", [join(ROOT, "installer", "upgrade.js"), refRoot]);
const wantContent = await contentOf(reference.db);
for (const [kind, list] of Object.entries(wantContent)) {
  if (list.length === 0) fail(`the seed produced no ${kind} at all — nothing below can mean much`);
}

for (const commit of history) {
  const short = commit.slice(0, 8);
  const root = join(work, short);
  const appDir = join(root, "app");
  const dataDir = join(root, "data");
  const db = join(dataDir, "dungeon.db");
  mkdirSync(appDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });

  let oldSchema;
  try { oldSchema = run("git", ["show", `${commit}:prisma/schema.prisma`]); } catch { continue; }
  const schemaPath = join(root, "schema.prisma");
  writeFileSync(schemaPath, oldSchema);

  // 1. A database exactly as that version of the app created it.
  try {
    run("npx", ["prisma", "db", "push", "--schema", schemaPath, "--skip-generate"], { DATABASE_URL: `file:${db}` });
  } catch (e) {
    fail(`could not build a database from ${short}: ${String(e.stderr || e).slice(0, 160)}`);
    continue;
  }

  // 2. The real updater, laid out the way an install is — seed included.
  symlinkSync(join(ROOT, "node_modules"), join(appDir, "node_modules"));
  writeFileSync(join(appDir, "schema.sql"), expected);
  try { run("cp", ["-r", join(ROOT, "migrations"), join(appDir, "migrations")]); } catch {}
  run("cp", [seedRunner, join(appDir, "seed-runner.js")]);
  //    Twice. The first run writes the content into a database that has never
  //    seen it; the second writes it into one that already holds all of it,
  //    which is the case every player after their first update is actually in.
  try {
    run("node", [join(ROOT, "installer", "upgrade.js"), root]);
    run("node", [join(ROOT, "installer", "upgrade.js"), root]);
  } catch (e) {
    fail(`upgrade.js failed on a database from ${short}: ${String(e.stderr || e.stdout || e).slice(0, 220)}`);
    continue;
  }

  // 3. Everything this build queries must now exist.
  const client = new PrismaClient({ datasources: { db: { url: `file:${db}` } } });
  let missing = 0;
  try {
    const tables = new Set(
      (await client.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table'")).map((r) => r.name)
    );
    for (const [table, cols] of want) {
      if (!tables.has(table)) {
        fail(`${short}: table "${table}" is still missing after the upgrade`);
        missing++;
        continue;
      }
      const has = new Set(
        (await client.$queryRawUnsafe(`PRAGMA table_info("${table}")`)).map((c) => c.name)
      );
      for (const c of cols) {
        if (!has.has(c)) { fail(`${short}: column "${table}.${c}" is still missing after the upgrade`); missing++; }
      }
    }
  } finally {
    await client.$disconnect();
  }

  // 4. And the content this build ships has to be there. A schema that lines
  //    up is no use to a player whose Academy is still two versions old.
  const got = await contentOf(db);
  for (const [kind, listWanted] of Object.entries(wantContent)) {
    const has = new Set(got[kind]);
    const absent = listWanted.filter((k) => !has.has(k));
    if (absent.length) {
      fail(`${short}: ${absent.length} ${kind} never landed (${absent.slice(0, 3).join(", ")})`);
      missing++;
    }
  }
  if (missing === 0) tested++;
}

// A seed that throws must cost the new content and nothing else. This is the
// shape of the failure that took an install apart: upgrade.js exited non-zero,
// the updater read that as "the new version does not work", and its rollback —
// since rewritten — destroyed the app on the way back.
{
  const root = join(work, "broken-seed");
  const inst = installAt(root, currentSchema, false);
  writeFileSync(
    join(inst.appDir, "seed-runner.js"),
    'exports.seed = async () => { throw new Error("database is locked"); };\n'
  );
  let exit = 0;
  try {
    run("node", [join(ROOT, "installer", "upgrade.js"), root]);
  } catch (e) {
    exit = e.status ?? 1;
  }
  const marker = join(inst.dataDir, "seed-pending");
  if (exit !== 0) fail("a seed that throws still fails the whole upgrade — the updater will roll the app back over it");
  if (!existsSync(marker)) fail("a seed that failed left nothing behind, so no later launch will retry it");

  // The next launch is schema-only, and has to pick the content back up.
  run("cp", [seedRunner, join(inst.appDir, "seed-runner.js")]);
  try {
    run("node", [join(ROOT, "installer", "upgrade.js"), root, "--schema-only"]);
  } catch (e) {
    fail(`the launch after a failed seed itself failed: ${String(e.stderr || e.stdout || e).slice(0, 160)}`);
  }
  if (existsSync(marker)) fail("the retry ran but left the marker behind, so every launch will re-seed for ever");
  const recovered = await contentOf(inst.db);
  for (const [kind, listWanted] of Object.entries(wantContent)) {
    if (recovered[kind].length !== listWanted.length) {
      fail(`after a failed seed, the next launch left ${recovered[kind].length} of ${listWanted.length} ${kind}`);
    }
  }
}

rmSync(work, { recursive: true, force: true });
console.log(`upgrade: ${tested} of ${history.length} historical database shape(s) brought fully up to this build — schema and content`);
if (problems.length === 0) console.log("OK - no upgrade problems");
else { console.log(`FAIL - ${problems.length} problems:`); problems.forEach((p) => console.log("  -", p)); }
process.exit(problems.length ? 1 : 0);
