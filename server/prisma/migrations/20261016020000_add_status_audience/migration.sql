CREATE TYPE "StatusAudience" AS ENUM ('FRIENDS', 'ONLY_ME');

ALTER TABLE "Status"
ADD COLUMN "audience" "StatusAudience" NOT NULL DEFAULT 'FRIENDS';
