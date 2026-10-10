/**
 * Puts one account at max level.
 *
 *   npx tsx scripts/grant-level.ts someone@example.com
 *   npx tsx scripts/grant-level.ts Torchfire --skills
 *
 * Takes either the address the account was created with or its display name --
 * the name is what a player actually knows, the address is what is unique. A
 * name that belongs to two accounts is therefore a refusal, not a guess.
 *
 * Needs DATABASE_URL pointing at the database the site serves.
 *
 * ONE account, named exactly. Not a pattern, not "the newest", not everyone
 * over a threshold. If the address does not match exactly one account it
 * changes nothing and says so, because the failure mode of a bulk progression
 * edit is that every player's save is rewritten and no backup was taken first.
 *
 * The level is not typed in here. 200 is the ceiling both curves in
 * src/lib/xp.ts stop at, and the XP for it comes from cumulativeXpForLevel, so
 * if that curve is ever retuned this script follows it instead of writing a
 * total that no longer means level 200.
 */
import { PrismaClient } from "@prisma/client";
import {
  cumulativeXpForLevel,
  levelFromXp,
  skillXpToNextLevel,
} from "../src/lib/xp";

/** Both loops in src/lib/xp.ts stop climbing here, so this is the ceiling. */
const MAX_LEVEL = 200;

const args = process.argv.slice(2);
const who = args.find((a) => !a.startsWith("--"))?.trim();
const alsoSkills = args.includes("--skills");

if (!who) {
  console.error("usage: npx tsx scripts/grant-level.ts <email or display name> [--skills]");
  process.exit(1);
}

// A throwaway from the smoke test or the guild report must never be the target
// of this. Those use the reserved .invalid TLD precisely so they are
// recognisable, and the whole point of this script is that it hits one real
// account on purpose.
const byEmail = who.includes("@");

if (/\.invalid$/i.test(who)) {
  console.error(
    `Refusing: ${who} is a throwaway test address (.invalid), not a real account.`
  );
  process.exit(1);
}

// The accounts this repository's own scripts create, by the names they use.
// Asked for "my account", handing back a maxed smoke-test player would be both
// useless and easy not to notice.
if (/^(Demo Composer|Smoke Test .*)$/i.test(who)) {
  console.error(`Refusing: "${who}" is an account created by this repository's test scripts.`);
  process.exit(1);
}

const db = new PrismaClient();

// tsx compiles this to CommonJS, which has no top-level await.
async function main() {

  try {
    // findMany, not findUnique: the count is the safety check. email is unique
    // in the schema, so more than one would mean the schema is not what this
    // script believes, and that is a stop rather than a shrug.
    const matches = await db.user.findMany({
      where: byEmail ? { email: who } : { profile: { displayName: who } },
      select: { id: true, email: true, profile: { select: { displayName: true, level: true, totalXp: true } } },
    });

    if (matches.length !== 1) {
      console.error(
        `Expected exactly 1 account for ${byEmail ? who : `"${who}"`}, found ${matches.length}.`
      );
      if (matches.length > 1) {
        console.error("");
        console.error("A display name is not unique. Re-run with the address instead:");
        for (const m of matches) console.error(`  ${m.email}`);
      }
      if (matches.length === 0) {
        console.error("");
        console.error("Nothing was changed. Either the name or address differs from the");
        console.error("one the account was created with, or the account is not in THIS");
        console.error("database — an account made while the app was in its offline");
        console.error("fallback lives in the SQLite file on that PC and nowhere else.");
        console.error(`accounts in this database: ${await db.user.count()}`);
      }
      process.exit(1);
    }

    const user = matches[0];
    if (!user.profile) {
      console.error(`${who} has no profile row, so there is no level to set.`);
      process.exit(1);
    }

    const targetXp = cumulativeXpForLevel(MAX_LEVEL);
    // Prove the pair agrees before writing it: storing a total the app would
    // read back as a different level is the one way to make this look applied
    // and behave as though it was not.
    const derived = levelFromXp(targetXp);
    if (derived.level !== MAX_LEVEL) {
      console.error(
        `Refusing: ${targetXp} XP derives level ${derived.level}, not ${MAX_LEVEL}. The curve changed.`
      );
      process.exit(1);
    }

    console.log(`account:  ${user.profile.displayName} <${user.email}>`);
    console.log(`before:   level ${user.profile.level}, ${user.profile.totalXp.toLocaleString()} XP`);

    await db.userProfile.update({
      where: { userId: user.id },
      data: { level: MAX_LEVEL, totalXp: targetXp },
    });

    console.log(`after:    level ${MAX_LEVEL}, ${targetXp.toLocaleString()} XP`);

    if (alsoSkills) {
      // Every skill the game defines, not only the ones already started: a skill
      // with no row reads as zero, so leaving those out would cap the account's
      // level while leaving half its craft at nothing.
      const skills = await db.skill.findMany({ select: { id: true, key: true } });
      let skillXp = 0;
      for (let l = 1; l < MAX_LEVEL; l++) skillXp += skillXpToNextLevel(l);

      for (const s of skills) {
        await db.userSkill.upsert({
          where: { userId_skillId: { userId: user.id, skillId: s.id } },
          update: { level: MAX_LEVEL, xp: skillXp },
          create: { userId: user.id, skillId: s.id, level: MAX_LEVEL, xp: skillXp },
        });
      }
      console.log(`skills:   ${skills.length} set to level ${MAX_LEVEL} (${skillXp.toLocaleString()} XP each)`);
    } else {
      console.log("skills:   left alone (pass --skills to max those too)");
    }

    // Read it back. The verdict is what the database holds now, not what the
    // update call returned.
    const after = await db.userProfile.findUnique({
      where: { userId: user.id },
      select: { level: true, totalXp: true },
    });
    const check = after && after.level === MAX_LEVEL && after.totalXp === targetXp;
    console.log("");
    console.log(
      check
        ? `OK - ${user.profile.displayName} <${user.email}> is level ${MAX_LEVEL}`
        : "FAILED - the profile did not take the change"
    );

    const others = await db.userProfile.count({ where: { level: MAX_LEVEL } });
    console.log(`accounts at level ${MAX_LEVEL} in this database: ${others}`);

    if (!check) process.exit(1);
  } finally {
    await db.$disconnect().catch(() => {});
  }
}

main();
