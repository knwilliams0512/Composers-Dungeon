/*
 * Post-update database work, run by the bundled Node runtime.
 *
 *   node upgrade.js <installRoot>
 *
 * Two jobs, in order:
 *   1. apply any migrations the player's database hasn't seen yet
 *   2. re-run the seed so new lessons, areas, bosses and achievements appear
 *
 * Both are additive and idempotent. Player rows — profiles, compositions,
 * progress, streaks — are never touched.
 */

const fs = require("node:fs");
const path = require("node:path");

const root = process.argv[2] || path.join(__dirname, "..");
// `node upgrade.js <root> --schema-only` does the schema work and stops, and
// the launcher runs that on every start: relying on the update step alone
// means a player whose update never ran, or ran and rolled back, stays broken
// with no way out but a reinstall — which is exactly the state the missing
// migrations left people in, with the one component that could have repaired
// it being the one that had failed. It also finishes a content seed that a
// previous run left undone.
const schemaOnly = process.argv.includes("--schema-only");
const appDir = path.join(root, "app");
const dbPath = path.join(root, "data", "dungeon.db");
// Left behind when the content seed does not finish, so the next launch
// retries it rather than the player quietly missing a version of content.
const seedMarker = path.join(root, "data", "seed-pending");

if (!fs.existsSync(dbPath)) {
  console.log("No database yet — nothing to upgrade.");
  process.exit(0);
}

process.env.DATABASE_URL = "file:" + dbPath.replace(/\\/g, "/");

const { PrismaClient } = require(path.join(appDir, "node_modules", "@prisma", "client"));
const db = new PrismaClient();

/** Splits a .sql file into statements, ignoring comments and blank lines. */
function statements(sql) {
  return sql
    .split(/;\s*$/m)
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter(Boolean);
}

async function migrate() {
  await db.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "_app_migrations" (
       "id" TEXT PRIMARY KEY NOT NULL,
       "appliedAt" TEXT NOT NULL
     )`
  );

  const applied = new Set(
    (await db.$queryRawUnsafe('SELECT "id" FROM "_app_migrations"')).map((r) => r.id)
  );

  const dir = path.join(appDir, "migrations");
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    for (const stmt of statements(sql)) {
      try {
        await db.$executeRawUnsafe(stmt);
      } catch (err) {
        // A column that already exists means a previous run got part way, or
        // the database was created fresh from a newer schema. Both are fine.
        const message = String(err && err.message);
        if (/duplicate column name|already exists/i.test(message)) continue;
        throw new Error(`${file}: ${message}`);
      }
    }
    await db.$executeRawUnsafe(
      'INSERT INTO "_app_migrations" ("id", "appliedAt") VALUES (?, ?)',
      file,
      new Date().toISOString()
    );
    console.log("applied " + file);
    count++;
  }
  return count;
}

/**
 * Brings the player's database up to the schema this build expects.
 *
 * The numbered migrations above are hand-written, and four schema changes
 * shipped without one — guilds, the freedom switch, secret rooms and the
 * accessibility settings. An installed copy that updated across those was left
 * without the columns, so every page that read a profile died on
 * "The column `fullFreedom` does not exist in the current database", and the
 * re-seed itself failed halfway through on `DungeonRoom.secret`, leaving the
 * content half-written.
 *
 * So this no longer depends on anyone remembering. app/schema.sql is generated
 * from prisma/schema.prisma at build time and describes the whole schema; this
 * compares it against what the database actually has and adds whatever is
 * missing. Additive only: it creates absent tables and indexes and appends
 * absent columns, and never drops or rewrites anything a player's rows live in.
 */
async function reconcileSchema() {
  const file = path.join(appDir, "schema.sql");
  if (!fs.existsSync(file)) return 0;
  const ddl = fs.readFileSync(file, "utf8");

  const have = new Set(
    (await db.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type IN ('table','index')"
    )).map((r) => r.name)
  );

  let changes = 0;

  // 1. Tables. A missing one is created outright, with its columns.
  const tables = [...ddl.matchAll(/CREATE TABLE "([^"]+)" \(([\s\S]*?)\n\);/g)];
  for (const [statement, table, body] of tables) {
    if (!have.has(table)) {
      await db.$executeRawUnsafe(statement.replace(/;$/, ""));
      console.log("created table " + table);
      changes++;
      continue;
    }
    // 2. Columns. SQLite can only append, which is all an additive schema
    //    change needs.
    const present = new Set(
      (await db.$queryRawUnsafe(`PRAGMA table_info("${table}")`)).map((c) => c.name)
    );
    for (const line of body.split("\n")) {
      const def = line.trim().replace(/,$/, "");
      const name = (def.match(/^"([^"]+)"/) || [])[1];
      if (!name || present.has(name)) continue;
      // A primary key or a unique column cannot be appended to a table that
      // already has rows; those only appear on a table we would have created
      // whole above, so skip rather than fail the upgrade.
      if (/PRIMARY KEY|UNIQUE/i.test(def)) continue;
      let sql = def;
      // NOT NULL needs something to put in the rows that already exist.
      if (/NOT NULL/i.test(def) && !/DEFAULT/i.test(def)) {
        const fallback = /\b(INTEGER|REAL|BOOLEAN)\b/i.test(def)
          ? "0"
          : /\bDATETIME\b/i.test(def)
            ? "CURRENT_TIMESTAMP"
            : "''";
        sql += ` DEFAULT ${fallback}`;
      }
      await db.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN ${sql}`);
      console.log(`added ${table}.${name}`);
      changes++;
    }
  }

  // 3. Indexes, including the unique ones the app's upserts rely on.
  for (const [statement, index] of ddl.matchAll(
    /CREATE (?:UNIQUE )?INDEX "([^"]+)"[^;]*;/g
  )) {
    if (have.has(index)) continue;
    try {
      await db.$executeRawUnsafe(statement.replace(/;$/, ""));
      console.log("created index " + index);
      changes++;
    } catch (err) {
      // A unique index can legitimately fail on existing duplicate rows. That
      // is worth saying out loud, but not worth refusing to start over.
      console.log(`could not create index ${index}: ${err && err.message}`);
    }
  }

  return changes;
}

/**
 * Re-runs the seed so new lessons, areas, bosses and achievements appear.
 *
 * This is not allowed to fail the upgrade, and that distinction matters more
 * than it looks. The updater treats a non-zero exit here as "the new version
 * does not work, put the old one back" — which is right when the schema could
 * not be brought up to date, because then every page that reads a profile
 * dies. It is badly wrong for the seed. The seed writes reference content;
 * the app runs perfectly well without the newest of it, and something as
 * ordinary as antivirus holding the database open for a second is enough to
 * stop it. Rolling a whole install back over that is how one player ended up
 * with no app at all.
 *
 * So a seed that fails leaves a marker instead. The launcher runs this script
 * on every start, sees the marker, and tries the content again — on a machine
 * that is no longer mid-update, with nothing else touching the database.
 */
async function refreshContent() {
  const seedPath = path.join(appDir, "seed-runner.js");
  if (!fs.existsSync(seedPath)) return;
  try {
    const { seed } = require(seedPath);
    await seed();
    console.log("content refreshed.");
    fs.rmSync(seedMarker, { force: true });
  } catch (err) {
    const why = (err && err.message) || String(err);
    console.log("content refresh failed, will retry at next launch: " + why);
    try {
      fs.writeFileSync(seedMarker, why);
    } catch {}
  }
}

async function main() {
  const applied = await migrate();
  if (!schemaOnly || applied > 0) console.log(`${applied} migration(s) applied.`);

  const reconciled = await reconcileSchema();
  console.log(`${reconciled} schema change(s) reconciled.`);
  await db.$disconnect();

  // On a normal launch there is nothing to seed. Only an update, or a seed
  // that did not finish last time, calls for it.
  if (schemaOnly && !fs.existsSync(seedMarker)) return;
  await refreshContent();
}

main().catch(async (err) => {
  console.error("upgrade failed:", err && err.message ? err.message : err);
  try {
    await db.$disconnect();
  } catch {}
  process.exit(1);
});
