-- Additive migration for Phase 2 (Provider soft removal), Phase 3 (Project moderation), and Phase 4 (Pricing offers)

ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "removedAt" TIMESTAMP(3);
ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "removedById" TEXT;
ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "removalReason" TEXT;
CREATE INDEX IF NOT EXISTS "project_providers_removedAt_idx" ON "project_providers"("removedAt");

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "featuredOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "moderatedById" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DealType') THEN
    CREATE TYPE "DealType" AS ENUM ('NONE', 'LIMITED_DEAL', 'LAUNCH_OFFER', 'FESTIVE_SALE', 'EARLY_BIRD', 'CLEARANCE', 'CUSTOM');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PriceQualifier') THEN
    CREATE TYPE "PriceQualifier" AS ENUM ('NONE', 'STARTING_FROM', 'NEGOTIABLE');
  END IF;
END $$;

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "priceQualifier" "PriceQualifier" NOT NULL DEFAULT 'NONE';
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "dealType" "DealType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "dealLabel" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "dealStartsAt" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "dealEndsAt" TIMESTAMP(3);
