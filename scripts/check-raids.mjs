/**
 * The raids have to be impossible alone.
 *
 * That is the one claim the collaboration bosses make, it is made in prose on
 * the guild page, and it is enforced by arithmetic that lives in three
 * separate places: the objective damages in world-collab.ts, the boss's total
 * HP beside them, and the 15% unlock threshold in server/actions/raid.ts. Any
 * one of those drifting makes the claim false, and nothing about a damage
 * number being changed from 3000 to 5000 looks wrong on its own.
 *
 * So this works out, from the seed data, what one composer can actually do and
 * refuses the build if it is enough — and separately refuses a raid the
 * minimum guild could NOT finish, because a boss nobody can beat is the other
 * way to get this wrong.
 *
 *   node scripts/check-raids.mjs
 */
import { readFileSync } from "fs";

const SOURCE = "prisma/seed-data/world-collab.ts";
const RULES = "src/lib/guild-rules.ts";
const RAID_ACTION_FILE = "src/server/actions/raid.ts";

const problems = [];

// The threshold the server actually enforces, read rather than assumed.
const action = readFileSync(RULES, "utf8");
const action2 = readFileSync(RAID_ACTION_FILE, "utf8");
const thresholdMatch = action.match(/FINAL_BLOW_THRESHOLD\s*=\s*([0-9.]+)/);
if (!thresholdMatch) {
  console.error(`${RULES}: could not find FINAL_BLOW_THRESHOLD`);
  process.exit(1);
}
const threshold = Number.parseFloat(thresholdMatch[1]);

// The bosses, parsed out of the seed module rather than imported, so this
// stays a plain node script with no build step.
const src = readFileSync(SOURCE, "utf8");
const bosses = [];
for (const block of src.split(/\n  \{\n/).slice(1)) {
  const key = block.match(/key:\s*"([^"]+)"/)?.[1];
  if (!key) continue;
  const totalHp = Number(block.match(/totalHp:\s*(\d+)/)?.[1]);
  const minMembers = Number(block.match(/minMembers:\s*(\d+)/)?.[1]);
  const objectives = [];
  for (const o of block.split(/\n      \{\n/).slice(1)) {
    const damage = Number(o.match(/damage:\s*(\d+)/)?.[1]);
    if (!Number.isFinite(damage)) continue;
    objectives.push({
      damage,
      bonus: /bonus:\s*true/.test(o),
      finalBlow: /finalBlow:\s*true/.test(o),
    });
  }
  bosses.push({ key, totalHp, minMembers, objectives });
}

if (bosses.length === 0) {
  console.error(`${SOURCE}: no raid bosses parsed — has the file's shape changed?`);
  process.exit(1);
}

// Ordinary objectives must stop the boss at 1 HP, so that only the final
// blow — the one part of a raid that is actually a piece of music — can
// finish it. Without the floor a large enough guild grinds the boss to zero
// with objectives and never writes anything.
if (!/Math\.max\(1, current\.currentHp - objective\.damage\)/.test(action2)) {
  problems.push(
    `${RAID_ACTION_FILE}: ordinary objectives must floor the boss at 1 HP, so only the ` +
      `final blow can finish a raid`
  );
}

for (const boss of bosses) {
  const required = boss.objectives.filter((o) => !o.bonus && !o.finalBlow);
  const bonuses = boss.objectives.filter((o) => o.bonus);
  const final = boss.objectives.find((o) => o.finalBlow);
  const unlockAt = Math.ceil(boss.totalHp * threshold);

  if (!final) {
    problems.push(`${boss.key}: no final blow, so the raid can never end`);
    continue;
  }
  if (required.length === 0) {
    problems.push(`${boss.key}: no required objectives`);
    continue;
  }

  // 1. One composer, landing every single thing they are allowed to land.
  const solo = [...required, ...bonuses].reduce((n, o) => n + o.damage, 0);
  const soloLeaves = boss.totalHp - solo;
  if (soloLeaves <= unlockAt) {
    problems.push(
      `${boss.key}: one composer alone deals ${solo} of ${boss.totalHp}, leaving ${soloLeaves} ` +
        `which is at or below the ${Math.round(threshold * 100)}% unlock (${unlockAt}). ` +
        `A guild raid must not be soloable.`
    );
  }

  // 2. The minimum guild, all landing every required objective, must get there.
  const perMember = required.reduce((n, o) => n + o.damage, 0);
  const groupLeaves = boss.totalHp - perMember * boss.minMembers;
  if (groupLeaves > unlockAt) {
    problems.push(
      `${boss.key}: ${boss.minMembers} composers landing every required objective leave ` +
        `${groupLeaves}, still above the unlock at ${unlockAt}. The minimum guild could ` +
        `never finish it.`
    );
  }

  // 3. The final blow has to actually kill it from the unlock threshold.
  if (final.damage < unlockAt) {
    problems.push(
      `${boss.key}: the final blow deals ${final.damage} but the boss can have ${unlockAt} ` +
        `left when it unlocks, so striking would not finish it.`
    );
  }
}

if (problems.length) {
  console.error("raid problems:\n  - " + problems.join("\n  - "));
  process.exit(1);
}

console.log(
  `raids: ${bosses.length} collaboration bosses — none soloable, all finishable by ` +
    `their minimum guild, every final blow lethal from the ${Math.round(threshold * 100)}% unlock`
);
console.log("OK - no raid problems");
