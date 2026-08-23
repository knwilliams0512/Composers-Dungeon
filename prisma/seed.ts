import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { beginnerLessons } from "./seed-data/lessons-beginner";
import { advancedLessons } from "./seed-data/lessons-advanced";
import { lessonDetail } from "./seed-data/lesson-detail";
import { areaDetail, bossDetail } from "./seed-data/world-detail";
import {
  artifacts,
  bosses,
  dungeonAreas,
  curatedRoomChallenges,
  achievements,
  specializations,
  challengeComponents,
  placementQuestions,
} from "./seed-data/world";
import type { SeedLesson } from "./seed-data/types";

const db = new PrismaClient();

const SKILLS = [
  { key: "MELODY", name: "Melody", description: "Shaping memorable, singable lines.", icon: "🎵", order: 1 },
  { key: "HARMONY", name: "Harmony", description: "Chords, progressions, and tonal color.", icon: "🎹", order: 2 },
  { key: "RHYTHM", name: "Rhythm", description: "Meter, groove, and rhythmic invention.", icon: "🥁", order: 3 },
  { key: "FORM", name: "Form", description: "Musical architecture from phrase to symphony.", icon: "🏛️", order: 4 },
  { key: "TECHNIQUE", name: "Technique", description: "Idiomatic, playable, demanding writing.", icon: "⚡", order: 5 },
  { key: "EXPRESSION", name: "Expression", description: "Mood, color, atmosphere, and meaning.", icon: "🌙", order: 6 },
  { key: "INSTRUMENTATION", name: "Instrumentation", description: "Knowing instruments and writing for them.", icon: "🎻", order: 7 },
  { key: "COUNTERPOINT", name: "Counterpoint", description: "Independent voices in conversation.", icon: "🪞", order: 8 },
  { key: "ORCHESTRATION", name: "Orchestration", description: "Combining instruments into ensembles.", icon: "🎼", order: 9 },
];

async function seedSkills() {
  for (const s of SKILLS) {
    await db.skill.upsert({ where: { key: s.key }, create: s, update: s });
  }
  console.log(`✔ ${SKILLS.length} skills`);
}

async function seedLessons() {
  const lessons: SeedLesson[] = [...beginnerLessons, ...advancedLessons];
  const skillByKey = new Map(
    (await db.skill.findMany()).map((s) => [s.key, s.id])
  );

  for (const l of lessons) {
    // Depth from lesson-detail.ts is merged in here so both create and update
    // paths carry it — an existing install picks it up on the next seed.
    const detail = lessonDetail[l.slug] ?? {};
    const sections = [...l.content, ...(detail.extraSections ?? [])];
    const detailFields = {
      content: JSON.stringify(sections),
      summary: detail.summary ?? null,
      estimatedMinutes: detail.estimatedMinutes ?? 12,
      keyTerms: detail.keyTerms ? JSON.stringify(detail.keyTerms) : null,
      commonMistakes: detail.commonMistakes ? JSON.stringify(detail.commonMistakes) : null,
      listening: detail.listening ? JSON.stringify(detail.listening) : null,
      practiceRoutine: detail.practiceRoutine ? JSON.stringify(detail.practiceRoutine) : null,
    };

    const lesson = await db.lesson.upsert({
      where: { slug: l.slug },
      create: {
        slug: l.slug,
        title: l.title,
        description: l.description,
        category: l.category,
        difficulty: l.difficulty,
        tierRequirement: l.tierRequirement,
        levelRequirement: l.levelRequirement ?? 1,
        order: l.order,
        xpReward: l.xpReward,
        ...detailFields,
      },
      update: {
        title: l.title,
        description: l.description,
        order: l.order,
        ...detailFields,
      },
    });

    // Quiz
    const quiz = await db.quiz.upsert({
      where: { lessonId: lesson.id },
      create: { lessonId: lesson.id, title: `${l.title} — Quiz` },
      update: {},
    });
    const existingQ = await db.quizQuestion.count({ where: { quizId: quiz.id } });
    if (existingQ === 0) {
      for (const q of l.quiz) {
        await db.quizQuestion.create({
          data: {
            quizId: quiz.id,
            subject: q.subject,
            difficulty: q.difficulty,
            prompt: q.prompt,
            choices: JSON.stringify(q.choices),
            answerIndex: q.answerIndex,
            explanation: q.explanation,
            placement: true,
          },
        });
      }
    }

    // Exercises
    const existingE = await db.exercise.count({ where: { lessonId: lesson.id } });
    if (existingE === 0) {
      let order = 0;
      for (const e of l.exercises) {
        await db.exercise.create({
          data: {
            lessonId: lesson.id,
            type: e.type,
            title: e.title,
            prompt: e.prompt,
            hint: e.hint ?? "",
            order: order++,
          },
        });
      }
    }

    // Skill rewards
    for (const [skillKey, xp] of Object.entries(l.skillRewards)) {
      const skillId = skillByKey.get(skillKey);
      if (!skillId) continue;
      await db.lessonSkillReward.upsert({
        where: { lessonId_skillId: { lessonId: lesson.id, skillId } },
        create: { lessonId: lesson.id, skillId, xp },
        update: { xp },
      });
    }
  }

  // Wire prerequisites in a second pass.
  for (const l of lessons) {
    if (!l.prerequisiteSlug) continue;
    const prereq = await db.lesson.findUnique({ where: { slug: l.prerequisiteSlug } });
    if (prereq) {
      await db.lesson.update({
        where: { slug: l.slug },
        data: { prerequisiteId: prereq.id },
      });
    }
  }
  console.log(`✔ ${lessons.length} lessons with quizzes & exercises`);
}

async function seedPlacementQuestions() {
  const count = await db.quizQuestion.count({ where: { quizId: null } });
  if (count === 0) {
    for (const q of placementQuestions) {
      await db.quizQuestion.create({
        data: {
          subject: q.subject,
          difficulty: q.difficulty,
          prompt: q.prompt,
          choices: JSON.stringify(q.choices),
          answerIndex: q.answerIndex,
          explanation: q.explanation,
          placement: true,
        },
      });
    }
  }
  console.log(`✔ ${placementQuestions.length} placement questions`);
}

async function seedArtifacts() {
  for (const a of artifacts) {
    await db.artifact.upsert({ where: { key: a.key }, create: a, update: a });
  }
  console.log(`✔ ${artifacts.length} artifacts`);
}

async function seedBosses() {
  for (const b of bosses) {
    const rewardArtifact = b.rewardArtifactKey
      ? await db.artifact.findUnique({ where: { key: b.rewardArtifactKey } })
      : null;
    const boss = await db.boss.upsert({
      where: { key: b.key },
      create: {
        key: b.key,
        name: b.name,
        title: b.title,
        description: b.description,
        artwork: b.artwork,
        totalHp: b.totalHp,
        difficulty: b.difficulty,
        levelRequirement: b.levelRequirement,
        xpReward: b.xpReward,
        final: (b as { final?: boolean }).final ?? false,
        rewardArtifactId: rewardArtifact?.id ?? null,
        lore: bossDetail[b.key]?.lore ?? null,
        tactics: bossDetail[b.key]?.tactics ? JSON.stringify(bossDetail[b.key].tactics) : null,
      },
      update: {
        description: b.description,
        totalHp: b.totalHp,
        lore: bossDetail[b.key]?.lore ?? null,
        tactics: bossDetail[b.key]?.tactics ? JSON.stringify(bossDetail[b.key].tactics) : null,
      },
    });
    const phaseCount = await db.bossPhase.count({ where: { bossId: boss.id } });
    if (phaseCount === 0) {
      for (const p of b.phases) {
        await db.bossPhase.create({ data: { bossId: boss.id, ...p } });
      }
    }
    const objCount = await db.bossObjective.count({ where: { bossId: boss.id } });
    if (objCount === 0) {
      for (const o of b.objectives) {
        await db.bossObjective.create({ data: { bossId: boss.id, ...o } });
      }
    }
  }
  console.log(`✔ ${bosses.length} bosses with phases & objectives`);
}

async function seedDungeon() {
  for (const area of dungeonAreas) {
    const dbArea = await db.dungeonArea.upsert({
      where: { key: area.key },
      create: {
        key: area.key,
        name: area.name,
        description: area.description,
        theme: area.theme,
        icon: area.icon,
        levelRequirement: area.levelRequirement,
        tierRequirement: area.tierRequirement,
        skillKey: area.skillKey,
        order: area.order,
        special: area.special ?? false,
        lore: areaDetail[area.key]?.lore ?? null,
        dangerRating: areaDetail[area.key]?.dangerRating ?? 1,
        survivalTips: areaDetail[area.key]?.survivalTips
          ? JSON.stringify(areaDetail[area.key].survivalTips)
          : null,
      },
      update: {
        description: area.description,
        theme: area.theme,
        lore: areaDetail[area.key]?.lore ?? null,
        dangerRating: areaDetail[area.key]?.dangerRating ?? 1,
        survivalTips: areaDetail[area.key]?.survivalTips
          ? JSON.stringify(areaDetail[area.key].survivalTips)
          : null,
      },
    });

    for (const room of area.rooms) {
      const existing = await db.dungeonRoom.findFirst({
        where: { areaId: dbArea.id, name: room.name },
      });
      if (existing) continue;
      const boss = room.bossKey
        ? await db.boss.findUnique({ where: { key: room.bossKey } })
        : null;
      const artifact = room.artifactKey
        ? await db.artifact.findUnique({ where: { key: room.artifactKey } })
        : null;
      await db.dungeonRoom.create({
        data: {
          areaId: dbArea.id,
          name: room.name,
          description: room.description,
          type: room.type,
          order: room.order,
          levelRequirement: room.levelRequirement ?? area.levelRequirement,
          bossId: boss?.id ?? null,
          artifactId: artifact?.id ?? null,
          puzzleData: room.puzzleData ? JSON.stringify(room.puzzleData) : null,
        },
      });
    }
  }
  console.log(`✔ ${dungeonAreas.length} dungeon areas with rooms`);

  // Curated challenges attached to rooms.
  let curatedCount = 0;
  for (const entry of curatedRoomChallenges) {
    const area = await db.dungeonArea.findUnique({ where: { key: entry.areaKey } });
    if (!area) continue;
    const room = await db.dungeonRoom.findFirst({
      where: { areaId: area.id, name: entry.roomName },
    });
    if (!room) continue;
    const existing = await db.challenge.findFirst({
      where: { roomId: room.id, title: entry.challenge.title, curated: true },
    });
    if (existing) continue;
    await db.challenge.create({
      data: { roomId: room.id, curated: true, ...entry.challenge },
    });
    curatedCount++;
  }
  console.log(`✔ ${curatedCount} curated room challenges`);
}

async function seedComponents() {
  const count = await db.challengeComponent.count();
  if (count === 0) {
    for (const c of challengeComponents) {
      await db.challengeComponent.create({ data: c });
    }
  }
  console.log(`✔ ${challengeComponents.length} challenge components`);
}

async function seedAchievements() {
  for (const a of achievements) {
    await db.achievement.upsert({ where: { key: a.key }, create: a, update: a });
  }
  console.log(`✔ ${achievements.length} achievements`);
}

async function seedSpecializations() {
  for (const s of specializations) {
    const data = { ...s, focus: JSON.stringify(s.focus) };
    await db.specialization.upsert({ where: { key: s.key }, create: data, update: data });
  }
  console.log(`✔ ${specializations.length} specializations`);
}

async function seedDemoUser() {
  const email = "bard@composersdungeon.demo";
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log("✔ demo user exists");
    return;
  }
  const passwordHash = await bcrypt.hash("dungeon-demo-1", 10);
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: {
          displayName: "Aria the Wandering Bard",
          avatar: "lyre",
          bio: "A demo composer three floors into the Dungeon. Password: dungeon-demo-1",
          visibility: "PUBLIC",
          experienceTier: "KNOW_A_LITTLE",
          goals: JSON.stringify(["LEARN_COMPOSITION", "BETTER_MELODIES"]),
          interests: JSON.stringify(["CLASSICAL", "CINEMATIC"]),
          totalXp: 2350,
          level: 6,
          streakCount: 4,
          longestStreak: 9,
          lastActivityDate: new Date(),
          restDays: 2,
          onboardingComplete: true,
        },
      },
    },
  });

  // Some skill progress
  const skillXp: Record<string, number> = {
    MELODY: 900,
    HARMONY: 480,
    RHYTHM: 260,
    FORM: 150,
    EXPRESSION: 220,
  };
  for (const [key, xp] of Object.entries(skillXp)) {
    const skill = await db.skill.findUnique({ where: { key } });
    if (!skill) continue;
    let level = 1;
    let rem = xp;
    while (rem >= Math.round(60 * Math.pow(level, 1.3)) && level < 200) {
      rem -= Math.round(60 * Math.pow(level, 1.3));
      level++;
    }
    await db.userSkill.create({
      data: { userId: user.id, skillId: skill.id, xp, level },
    });
  }

  // Completed first lessons
  const doneLessons = await db.lesson.findMany({ orderBy: { order: "asc" }, take: 6 });
  for (const lesson of doneLessons) {
    await db.lessonProgress.create({
      data: {
        userId: user.id,
        lessonId: lesson.id,
        status: "COMPLETED",
        quizPassed: true,
        bestQuizScore: 100,
        practiceDone: true,
        compositionDone: true,
        completedAt: new Date(),
      },
    });
  }

  // A public composition + guild post
  const composition = await db.composition.create({
    data: {
      userId: user.id,
      title: "The Cavalier's Calling",
      description: "An eight-measure fanfare in G major from the Hall of Melody.",
      reflection: "First time the climax landed where I planned it.",
      scoreLink: "https://musescore.com/",
      visibility: "PUBLIC",
      source: "CHALLENGE",
    },
  });
  await db.guildPost.create({
    data: {
      userId: user.id,
      compositionId: composition.id,
      content:
        "Finally cleared the Echoing Steps! The climax-in-measure-six rule felt awkward at first, then suddenly the whole phrase made sense.",
    },
  });

  console.log("✔ demo user: bard@composersdungeon.demo / dungeon-demo-1");
}

/**
 * Idempotent: every step upserts reference content and never touches player
 * rows. Exported so the Windows updater can re-run it after an update to pull
 * in new lessons, areas and bosses without a reinstall.
 */
export async function seed() {
  console.log("Seeding Composer's Dungeon…");
  await seedSkills();
  await seedLessons();
  await seedPlacementQuestions();
  await seedArtifacts();
  await seedBosses();
  await seedDungeon();
  await seedComponents();
  await seedAchievements();
  await seedSpecializations();
  await seedDemoUser();
  console.log("Done.");
  await db.$disconnect();
}

// Running the file directly (npm run db:seed) seeds immediately; importing it
// (the updater) just gets the function.
if (require.main === module) {
  seed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
