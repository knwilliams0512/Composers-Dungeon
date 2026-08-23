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
const appDir = path.join(root, "app");
const dbPath = path.join(root, "data", "dungeon.db");

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

async function main() {
  const applied = await migrate();
  console.log(`${applied} migration(s) applied.`);

  // The seed is idempotent: it upserts reference content and leaves player
  // data alone, so running it after every update is how new content lands.
  const seedPath = path.join(appDir, "seed-runner.js");
  if (fs.existsSync(seedPath)) {
    await db.$disconnect();
    const { seed } = require(seedPath);
    await seed();
    console.log("content refreshed.");
    return;
  }
  await db.$disconnect();
}

main().catch(async (err) => {
  console.error("upgrade failed:", err && err.message ? err.message : err);
  try {
    await db.$disconnect();
  } catch {}
  process.exit(1);
});
