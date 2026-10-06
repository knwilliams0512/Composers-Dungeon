/**
 * Proves prisma/schema.postgres.prisma is exactly what prisma/schema.prisma
 * derives to, and that the two differ in nothing but the datasource block.
 *
 * The hosted build and the desktop app read different schema files. If they
 * ever describe different tables, a player's account works in one and not the
 * other, and nothing would say so until someone hit it. This is the only thing
 * standing between "one source of truth" and two files that quietly diverge.
 *
 *   node scripts/check-schemas.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { SOURCE, DERIVED, HEADER, POSTGRES_DATASOURCE, derive } from "./make-postgres-schema.mjs";

const problems = [];

if (!existsSync(DERIVED)) {
  problems.push(`${DERIVED} is missing — run \`npm run make:pg-schema\`.`);
} else {
  const source = readFileSync(SOURCE, "utf8");
  const actual = readFileSync(DERIVED, "utf8");
  const expected = derive(source);

  if (actual !== expected) {
    problems.push(
      `${DERIVED} is not what ${SOURCE} derives to. Someone edited the generated ` +
        `file, or changed the schema without re-running \`npm run make:pg-schema\`.`
    );
  }

  // Belt and braces: compare the two model-by-model, so a future change to the
  // derivation that quietly dropped or rewrote a model could not pass just by
  // being self-consistent.
  const bodies = (text) =>
    text
      .replace(HEADER, "")
      .replace(POSTGRES_DATASOURCE, "")
      .replace(/datasource db \{[\s\S]*?\n\}/, "")
      .trim();

  const a = bodies(source);
  const b = bodies(actual);
  if (a !== b) {
    const aLines = a.split("\n");
    const bLines = b.split("\n");
    // findIndex returns -1 when one file is a prefix of the other, in which
    // case there is no differing line to point at — only a differing length.
    const at = aLines.findIndex((l, i) => l !== bLines[i]);
    problems.push(
      at === -1
        ? `outside the datasource block the two schemas differ in length: ` +
          `${SOURCE} has ${aLines.length} lines, ${DERIVED} has ${bLines.length}. ` +
          `The longer one carries ${Math.abs(aLines.length - bLines.length)} line(s) ` +
          `the other does not.`
        : `outside the datasource block the two schemas differ, first at line ${at + 1}:\n` +
          `  ${SOURCE}: ${aLines[at] ?? "(end of file)"}\n` +
          `  ${DERIVED}: ${bLines[at] ?? "(end of file)"}`
    );
  }

  const models = (text) => (text.match(/^model \w+/gm) ?? []).length;
  if (models(source) !== models(actual)) {
    problems.push(
      `${SOURCE} declares ${models(source)} models but ${DERIVED} declares ${models(actual)}.`
    );
  }
  if (!actual.startsWith(HEADER)) {
    problems.push(`${DERIVED} has lost its "do not edit" header.`);
  }
  if (!actual.includes('provider  = "postgresql"')) {
    problems.push(`${DERIVED} does not select the postgresql provider.`);
  }
  if (!source.includes('provider = "sqlite"')) {
    problems.push(`${SOURCE} is no longer the SQLite schema the desktop app ships.`);
  }
}

if (problems.length) {
  console.error("schemas: " + problems.length + " problem(s)\n");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(
  `schemas: ${DERIVED} matches ${SOURCE} model for model, differing only in the datasource`
);
console.log("OK - the desktop and hosted schemas cannot drift");
