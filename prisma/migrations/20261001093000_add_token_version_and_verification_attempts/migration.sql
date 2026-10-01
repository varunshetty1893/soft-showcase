-- AlterTable
ALTER TABLE "users" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "verification_tokens" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
