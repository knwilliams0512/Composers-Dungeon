/**
 * Derives `prisma/schema.postgres.prisma` from `prisma/schema.prisma`.
 *
 * Prisma refuses env() in a datasource provider — "A datasource must not use
 * the env() function in the provider argument" — so one schema file cannot
 * serve both the desktop app's SQLite file and a hosted Postgres. Rather than
 * maintain two schemas that drift, the SQLite one stays the single source of
 * truth and this rewrites its datasource block.
 *
 * The desktop app is therefore untouched by anything the hosted build does,
 * which is the point: the installer that is already in players' hands keeps
 * reading exactly the schema it shipped with.
 *
 * scripts/check-schemas.mjs proves the two files differ in nothing else.
 *
 *   node scripts/make-postgres-schema.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const SOURCE = "prisma/schema.prisma";
export const DERIVED = "prisma/schema.postgres.prisma";

export const HEADER = `// GENERATED FILE — DO NOT EDIT.
//
// Derived from prisma/schema.prisma by scripts/make-postgres-schema.mjs.
// Edit the SQLite schema and re-run \`npm run make:pg-schema\`; editing this
// file directly will be overwritten and scripts/check-schemas.mjs will fail.
`;

const SQLITE_DATASOURCE = `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`;

export const POSTGRES_DATASOURCE = `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // Migrations run through this rather than through url. Hosts that put a
  // connection pooler in front of Postgres — Neon and Supabase both do — serve
  // a pooled URL that cannot run DDL, so without this a deploy fails at the
  // migration step. Prisma REQUIRES the variable to exist once it is named
  // here, so set it to the same value as DATABASE_URL when there is no pooler.
  directUrl = env("DIRECT_DATABASE_URL")
}`;

/** The derived schema, as a string. Exported so the checker can re-derive it. */
export function derive(source) {
  if (!source.includes(SQLITE_DATASOURCE)) {
    throw new Error(
      `${SOURCE} no longer contains the datasource block this script rewrites. ` +
        `Update scripts/make-postgres-schema.mjs to match it.`
    );
  }
  return HEADER + source.replace(SQLITE_DATASOURCE, POSTGRES_DATASOURCE);
}

// pathToFileURL rather than a hand-built "file://" string: a path that needs
// percent-encoding, or any Windows path, never matches the naive form, and this
// script would then silently write nothing and exit 0 — leaving check-schemas
// failing with no way to satisfy it.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(DERIVED, derive(readFileSync(SOURCE, "utf8")));
  console.log(`${DERIVED} written from ${SOURCE}`);
}
