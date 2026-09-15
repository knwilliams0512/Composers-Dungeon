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

  // 2. The real updater, laid out the way an install is. No seed-runner, so
  //    this measures the schema step alone.
  symlinkSync(join(ROOT, "node_modules"), join(appDir, "node_modules"));
  writeFileSync(join(appDir, "schema.sql"), expected);
  try { run("cp", ["-r", join(ROOT, "migrations"), join(appDir, "migrations")]); } catch {}
  try {
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
  if (missing === 0) tested++;
}

rmSync(work, { recursive: true, force: true });
console.log(`upgrade: ${tested} of ${history.length} historical database shape(s) brought fully up to the current schema`);
if (problems.length === 0) console.log("OK - no upgrade problems");
else { console.log(`FAIL - ${problems.length} problems:`); problems.forEach((p) => console.log("  -", p)); }
process.exit(problems.length ? 1 : 0);
