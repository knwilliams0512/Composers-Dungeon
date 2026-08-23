-- Adds the optional depth columns introduced with the detail pass.
-- SQLite only supports additive ALTERs, which is exactly what an in-place
-- app update should be doing anyway.

ALTER TABLE "Lesson" ADD COLUMN "summary" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "estimatedMinutes" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "Lesson" ADD COLUMN "keyTerms" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "commonMistakes" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "listening" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "practiceRoutine" TEXT;

ALTER TABLE "DungeonArea" ADD COLUMN "lore" TEXT;
ALTER TABLE "DungeonArea" ADD COLUMN "dangerRating" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "DungeonArea" ADD COLUMN "survivalTips" TEXT;

ALTER TABLE "Boss" ADD COLUMN "lore" TEXT;
ALTER TABLE "Boss" ADD COLUMN "tactics" TEXT;
