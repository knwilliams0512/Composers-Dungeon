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
// Set when the exam tables first appear; cleared once the one-off credit of
// already-learned units has actually been written.
const creditMarker = path.join(root, "data", "credit-units-pending");

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
/**
 * Tables this run created.
 *
 * A table appearing for the first time is the one unambiguous signal that an
 * install is crossing the version that introduced it — which is exactly when
 * a one-off backfill should run, and never again.
 */
const createdTables = new Set();

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
  // Which ones were created is remembered: a table appearing for the first
  // time is the one unambiguous signal that this install is crossing the
  // version that introduced it, which is exactly when a one-off backfill
  // should run and never again.
  const tables = [...ddl.matchAll(/CREATE TABLE "([^"]+)" \(([\s\S]*?)\n\);/g)];
  for (const [statement, table, body] of tables) {
    if (!have.has(table)) {
      await db.$executeRawUnsafe(statement.replace(/;$/, ""));
      console.log("created table " + table);
      createdTables.add(table);
      // A table that did not exist a moment ago has no rows, and content
      // tables are filled by the seed. The launcher runs this script with
      // --schema-only on an ordinary start, which skips the seed — so without
      // this a release installed over an existing copy would create the exam
      // tables, never populate them, and leave every unit past 1.1 locked
      // forever behind exams that do not exist.
      try {
        fs.writeFileSync(seedMarker, "table " + table + " was created empty");
      } catch {
        // The launcher reports an unwritable data folder; this must not fail
        // the schema reconciliation.
      }
      // The credit below needs the exam rows the seed writes, so it cannot
      // run here. Its own marker records *when* the exams arrived, which is
      // what makes "completed before exams existed" a decidable question
      // however long the credit ends up deferred for.
      if (table === "UnitExamAttempt") {
        try {
          fs.writeFileSync(creditMarker, new Date().toISOString());
        } catch {
          // Same reasoning as above.
        }
      }
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
 * Credits units a player had already finished, once, when exams arrive.
 *
 * Unit exams gate the roadmap: pass one and the next unit opens, and
 * finishing a unit's lessons no longer does. Applied to an install that
 * predates them, that rule takes work away — somebody who had read all
 * forty-six lessons would find everything past unit 1.1 locked, which is a
 * punishment for having updated.
 *
 * So the first time this install gains the UnitExamAttempt table, every unit
 * whose lessons the player had already completed is recorded as passed. It
 * runs exactly once, because a table is created exactly once: on every later
 * launch the table already exists and this does nothing. That matters as much
 * as the credit itself — if it ran every time, a player could finish a unit's
 * lessons and have the exam waived, which is the thing the exams exist to
 * prevent.
 *
 * The unit-to-lesson map is read from the app's own curriculum rather than
 * duplicated here, so a unit that gains a lesson cannot silently start being
 * credited on incomplete work.
 */
async function creditUnitsAlreadyLearned() {
  if (!fs.existsSync(creditMarker)) return;

  // When the exams arrived. Everything credited must have been finished
  // before this instant, because the marker can legitimately outlive several
  // launches — a failed seed defers it — and in that window a player can
  // finish a unit the ordinary way. Crediting that would hand out the exact
  // waiver the exams exist to prevent.
  let arrivedAt = null;
  try {
    const stamp = fs.readFileSync(creditMarker, "utf8").trim();
    const parsed = new Date(stamp);
    if (!Number.isNaN(parsed.getTime())) arrivedAt = parsed;
  } catch {
    // Unreadable marker: fall back to the file's own mtime below.
  }
  if (!arrivedAt) {
    try {
      arrivedAt = fs.statSync(creditMarker).mtime;
    } catch {
      arrivedAt = new Date();
    }
  }

  // The attempts point at exam rows, so there must be exams to point at. If
  // the seed has not run yet the marker stays and this runs next launch —
  // and the cutoff above means the extra wait cannot change what qualifies.
  const exams = await db.unitExam.count().catch(() => 0);
  if (exams === 0) {
    console.log("exams not seeded yet - crediting already-learned units next launch");
    return;
  }

  let units;
  try {
    // Shipped beside the seed, compiled to plain JS for the bundled Node.
    ({ ALL_UNITS: units } = require(path.join(appDir, "seed-runner.js")));
  } catch {
    units = null;
  }
  if (!Array.isArray(units) || units.length === 0) {
    console.log("could not read the curriculum - no units credited");
    clearCreditMarker();
    return;
  }

  const users = await db.user.findMany({ select: { id: true } });
  if (users.length === 0) {
    // Nothing to credit and nothing to wait for. Leaving the marker would let
    // this fire after somebody signs up and finishes units properly, waiving
    // exams they were supposed to sit.
    clearCreditMarker();
    return;
  }

  const lessons = await db.lesson.findMany({ select: { id: true, slug: true } });
  const idBySlug = new Map(lessons.map((l) => [l.slug, l.id]));

  let credited = 0;
  let failures = 0;
  let lastError = "";
  for (const user of users) {
    const done = await db.lessonProgress.findMany({
      where: {
        userId: user.id,
        status: "COMPLETED",
        // Finished before the exams existed. A row with no completedAt is an
        // older record from before that column was filled in, which by
        // definition predates this, so it counts.
        OR: [{ completedAt: { lte: arrivedAt } }, { completedAt: null }],
      },
      select: { lessonId: true },
    });
    const doneIds = new Set(done.map((d) => d.lessonId));
    if (doneIds.size === 0) continue;

    for (const unit of units) {
      const ids = unit.slugs.map((s) => idBySlug.get(s)).filter(Boolean);
      // A unit whose lessons are not all present in this build cannot be
      // judged complete, so it is left for the player to sit.
      if (ids.length !== unit.slugs.length || ids.length === 0) continue;
      if (!ids.every((id) => doneIds.has(id))) continue;
      try {
        await db.unitExamAttempt.create({
          data: {
            userId: user.id,
            unit: unit.unit,
            score: 100,
            correct: 0,
            total: 0,
            passed: true,
            missed: JSON.stringify(["credited-for-lessons-completed-before-exams-existed"]),
          },
        });
        credited++;
      } catch (err) {
        // Worth saying out loud. A silent catch here is what hid the fact
        // that this ran before the exams existed and every insert was being
        // rejected by its own foreign key.
        failures++;
        lastError = (err && err.message) || String(err);
      }
    }
  }
  if (failures > 0) {
    console.log(`could not credit ${failures} unit(s): ${lastError}`);
  }
  console.log(`credited ${credited} unit(s) already learned before exams existed`);
  // Done, whatever the count: a player with no completed lessons legitimately
  // gets nothing, and the marker must not make this run again forever.
  clearCreditMarker();
}

function clearCreditMarker() {
  try {
    fs.rmSync(creditMarker, { force: true });
  } catch {
    // Leaving it costs one more harmless pass next launch.
  }
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

  // Released before the seed so the updater is not holding a second handle on
  // the database while the seed writes to it. Prisma reconnects by itself on
  // the next query, which is what the credit below relies on.
  await db.$disconnect();

  // On a normal launch there is nothing to seed. Only an update, or a seed
  // that did not finish last time, calls for it.
  const seeding = !schemaOnly || fs.existsSync(seedMarker);
  if (seeding) await refreshContent();

  // After the seed, because the rows this writes point at the exams the seed
  // creates. Running it first meant every insert was refused by its own
  // foreign key, silently.
  //
  // Wrapped for the same reason refreshContent is: the updater's exit code
  // decides whether apply-update.ps1 rolls the whole install back. A player
  // losing a working update over a bookkeeping credit would be a far worse
  // outcome than the credit not happening.
  try {
    await creditUnitsAlreadyLearned();
  } catch (err) {
    console.log(
      "could not credit already-learned units: " +
        ((err && err.message) || String(err))
    );
  }
  try {
    await db.$disconnect();
  } catch {
    // Already disconnected, or never reconnected because there was nothing
    // to credit. Either way there is nothing to do about it here.
  }
}

main().catch(async (err) => {
  console.error("upgrade failed:", err && err.message ? err.message : err);
  try {
    await db.$disconnect();
  } catch {}
  process.exit(1);
});
