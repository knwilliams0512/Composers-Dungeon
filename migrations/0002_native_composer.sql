-- The in-app composer: pieces are now written in the app, so a composition
-- carries its score, and a challenge carries the standard that score must meet.

ALTER TABLE "Composition" ADD COLUMN "score" TEXT;

ALTER TABLE "Challenge" ADD COLUMN "checks" TEXT;
ALTER TABLE "Challenge" ADD COLUMN "freedomCap" INTEGER;

ALTER TABLE "Exercise" ADD COLUMN "checks" TEXT;
ALTER TABLE "Exercise" ADD COLUMN "scoreSetup" TEXT;
ALTER TABLE "Exercise" ADD COLUMN "freedomCap" INTEGER;
