/**
 * Holds every number the app says about itself to what the seed actually
 * contains.
 *
 * This exists because hand-written counts rot silently and nobody notices
 * until a player does. The download page advertised 25 lessons, 9 areas and 4
 * bosses for several releases after all three had stopped being true, and the
 * README still said nine areas and four bosses while the game shipped sixteen
 * and ten. Nothing failed. Nothing could: a number in prose is not checked by
 * a type system, a test, or a build.
 *
 * So every claim is written down here next to the thing that makes it true. A
 * claim with no matching number in the file fails, which is the case that
 * matters: it means the copy was reworded and the count quietly dropped out.
 *
 *   npx tsx scripts/check-claims.ts
 */
import { readFileSync } from "node:fs";
import {
  artifacts,
  bosses,
  dungeonAreas,
  achievements,
  specializations,
} from "../prisma/seed-data/world";
import {
  expansionArtifacts,
  expansionBosses,
  expansionAreas,
  secretRoomsByArea,
} from "../prisma/seed-data/world-expansion";
import {
  orchestralArtifacts,
  orchestralBosses,
  orchestralArea,
} from "../prisma/seed-data/world-orchestral";
import { collabBosses } from "../prisma/seed-data/world-collab";
import { beginnerLessons } from "../prisma/seed-data/lessons-beginner";
import { advancedLessons } from "../prisma/seed-data/lessons-advanced";
import { curriculumLessons } from "../prisma/seed-data/lessons-curriculum";
import { orchestralLessons } from "../prisma/seed-data/lessons-orchestral";
import { lessonDetail } from "../prisma/seed-data/lesson-detail";
import { INSTRUMENTS, ENSEMBLES } from "../src/lib/studio/instruments";
import { DRILL_KEYS } from "../src/lib/drills";

// Combined exactly the way prisma/seed.ts combines them, so the truth here is
// the truth the database gets.
const allBosses = [...bosses, ...expansionBosses, ...orchestralBosses, ...collabBosses];
// Only the collaboration bosses carry `collab`, so the field is absent from
// the other seed types rather than false. Narrow by presence, not by value.
const isGuildBoss = (b: unknown): boolean =>
  typeof b === "object" && b !== null && "collab" in b && Boolean((b as { collab?: boolean }).collab);
const guildBosses = allBosses.filter(isGuildBoss);
const soloBosses = allBosses.filter((b) => !isGuildBoss(b));
const allAreas = [...dungeonAreas, ...expansionAreas, orchestralArea];
const allArtifacts = [...artifacts, ...expansionArtifacts, ...orchestralArtifacts];
const allLessons = [
  ...beginnerLessons,
  ...advancedLessons,
  ...curriculumLessons,
  ...orchestralLessons,
];

/**
 * The two counts below were claimed in user-facing copy and checked by nothing.
 *
 * The landing page and the download page both said "133 sections", which was
 * true until twenty more were written, and this script passed the whole time
 * because sections were not in the table. A claim nobody checks is a claim
 * that goes stale the first time the thing it counts changes.
 *
 * Sections include the ones layered on in lesson-detail.ts, because a reader
 * cannot tell which file a section came from — and check:figures counts them
 * the same way, so the two numbers agree by construction.
 */
const sectionCount = allLessons.reduce(
  (n, l) => n + l.content.length + (lessonDetail[l.slug]?.extraSections?.length ?? 0),
  0
);

const roomCount =
  allAreas.reduce((n, a) => n + ((a as { rooms?: unknown[] }).rooms?.length ?? 0), 0) +
  Object.values(secretRoomsByArea).reduce((n, rooms) => n + rooms.length, 0);

const TRUTH: Record<string, number> = {
  lessons: allLessons.length,
  sections: sectionCount,
  rooms: roomCount,
  areas: allAreas.length,
  bosses: allBosses.length,
  soloBosses: soloBosses.length,
  guildBosses: guildBosses.length,
  artifacts: allArtifacts.length,
  achievements: achievements.length,
  specializations: specializations.length,
  instruments: INSTRUMENTS.length,
  ensembles: ENSEMBLES.length,
  drills: DRILL_KEYS.length,
};

/** The words each count is allowed to be written next to. */
const NOUNS: Record<string, string> = {
  lessons: "lessons?",
  sections: "sections?",
  rooms: "rooms?",
  areas: "(dungeon )?areas?",
  bosses: "bosses|boss",
  soloBosses: "bosses|boss",
  guildBosses: "(are )?fought by|guild bosses?|collaboration bosses?",
  artifacts: "artifacts?",
  achievements: "achievements?",
  specializations: "specializations?|specialisations?",
  instruments: "instruments?",
  ensembles: "ensembles?|ensemble templates?",
  drills: "drills?",
};

const WORDS: Record<number, string[]> = {
  // 4, 8, 15 and 25 are the launch counts. They are listed only so that a file
  // still advertising them is told which stale number it is holding, rather
  // than being told it merely fails to state the right one.
  3: ["three"], 4: ["four"], 5: ["five"], 6: ["six"], 8: ["eight"],
  9: ["nine"], 10: ["ten"], 15: ["fifteen"], 25: ["twenty-five"],
  12: ["twelve"], 16: ["sixteen"], 21: ["twenty-one"], 46: ["forty-six"],
  58: ["fifty-eight"], 73: ["seventy-three"], 93: ["ninety-three"],
  // 133 is here only so that a page still claiming it gets named in the error
  // rather than reported as merely "does not say 153".
  133: ["a hundred and thirty-three"], 153: ["a hundred and fifty-three"],
};

/** Every number a file is required to state, and never to state wrongly. */
const CLAIMS: { file: string; needs: (keyof typeof TRUTH)[] }[] = [
  { file: "README.md", needs: ["areas", "bosses", "achievements", "artifacts", "specializations"] },
  { file: "src/app/page.tsx", needs: ["areas", "bosses", "artifacts", "achievements", "instruments", "ensembles", "drills", "sections", "rooms"] },
  { file: "site/index.html", needs: ["lessons", "areas", "bosses", "instruments", "ensembles", "guildBosses", "sections", "rooms"] },
  // INSTALL.md is linked from the public download page as the full install
  // guide, and was the last user-facing file whose counts nothing checked: it
  // still advertised the launch numbers (25 lessons, 9 areas, 4 bosses) long
  // after every one of them had changed, and described the app as local-only
  // for a month after it started joining the shared world.
  { file: "INSTALL.md", needs: ["lessons", "areas", "bosses", "artifacts", "achievements"] },
];

const problems: string[] = [];

/**
 * Does this file state this number AS the count of this thing?
 *
 * Adjacency is the whole point. A first attempt only asked whether the number
 * appeared anywhere, and README passed the areas check because some unrelated
 * 16 was present while the sentence about areas still said nine. A count is
 * only a claim when it sits next to the noun it counts.
 */
function states(text: string, n: number, key: string): boolean {
  const forms = [String(n), ...(WORDS[n] ?? [])];
  const noun = NOUNS[key];
  // Up to a few words between the number and the noun, but not across a
  // sentence or a line, so "nine areas ... 16 rooms" cannot satisfy areas=16.
  return forms.some((f) =>
    new RegExp(`\\b${f}\\b[^.\\n]{0,24}?\\b(${noun})\\b`, "i").test(text)
  );
}

for (const { file, needs } of CLAIMS) {
  const text = readFileSync(file, "utf8");
  for (const key of needs) {
    const want = TRUTH[key];
    if (!states(text, want, key)) {
      // Name a plausible stale value when one is present, because "says 9
      // where it should say 16" is actionable and "does not say 16" is not.
      const near = Object.keys(WORDS)
        .map(Number)
        .filter((n) => n !== want && states(text, n, key))
        .slice(0, 4);
      problems.push(
        `${file} never states the ${key} count (${want})` +
          (near.length
            ? ` — it says ${near.join(" and ")} instead`
            : " — the count may have been reworded away entirely")
      );
    }
  }
}

if (problems.length) {
  console.log(`claims: ${problems.length} problem(s)\n`);
  for (const p of problems) console.log("  - " + p);
  console.log("\nFAIL - the app states something about itself that is not true");
  process.exit(1);
}

console.log(
  `claims: ${allLessons.length} lessons in ${sectionCount} sections, ` +
    `${allAreas.length} areas of ${roomCount} rooms, ` +
    `${allBosses.length} bosses (${soloBosses.length} solo, ${guildBosses.length} fought by a guild), ` +
    `${allArtifacts.length} artifacts, ${achievements.length} achievements, ` +
    `${INSTRUMENTS.length} instruments, ${ENSEMBLES.length} ensembles, ${DRILL_KEYS.length} drills`
);
console.log("OK - every number the app states about itself is true");
