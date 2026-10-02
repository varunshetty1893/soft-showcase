// scripts/ensure-schema.mjs
// Idempotently applies all additive schema migrations (tables, columns, indexes, enum values)
// to the target PostgreSQL database before `next build` static page generation.
// Safe to run repeatedly on existing production/Neon databases (uses IF NOT EXISTS).

import { PrismaClient } from "@prisma/client";

const DDL_STATEMENTS = [
  // 1. PendingRegistration staging table (H3 / N5 / N6)
  `CREATE TABLE IF NOT EXISTS "pending_registrations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "pending_registrations_email_key" ON "pending_registrations"("email");`,

  // 2. User tokenVersion & contact profile fields (M6 / B9)
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;`,

  // 3. VerificationToken attempts counter (M5 / N6)
  `ALTER TABLE "verification_tokens" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;`,

  // 4. Project originalPrice (B1)
  `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "originalPrice" DECIMAL(10,2);`,

  // 5. NotificationStatus THROTTLED enum value (N2 / N3)
  `ALTER TYPE "NotificationStatus" ADD VALUE IF NOT EXISTS 'THROTTLED';`,

  // 6. CustomProjectRequest customer linking & notificationStatus (B5 / N2 / N3)
  `ALTER TABLE "custom_project_requests" ADD COLUMN IF NOT EXISTS "customerId" TEXT;`,
  `ALTER TABLE "custom_project_requests" ADD COLUMN IF NOT EXISTS "linkedAt" TIMESTAMP(3);`,
  `ALTER TABLE "custom_project_requests" ADD COLUMN IF NOT EXISTS "notificationStatus" "NotificationStatus" NOT NULL DEFAULT 'PENDING';`,
  `CREATE INDEX IF NOT EXISTS "custom_project_requests_customerId_idx" ON "custom_project_requests"("customerId");`,
  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'custom_project_requests_customerId_fkey'
    ) THEN
      ALTER TABLE "custom_project_requests"
        ADD CONSTRAINT "custom_project_requests_customerId_fkey"
        FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$;`,

  // 7. Provider soft removal columns (Phase 2B)
  `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "removedAt" TIMESTAMP(3);`,
  `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "removedById" TEXT;`,
  `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "removalReason" TEXT;`,
  `CREATE INDEX IF NOT EXISTS "project_providers_removedAt_idx" ON "project_providers"("removedAt");`,

  // 8. Project moderation & display order columns (Phase 3)
  `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "featuredOrder" INTEGER NOT NULL DEFAULT 0;`,
  `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;`,
  `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3);`,
  `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "moderatedById" TEXT;`,

  // 9. Pricing offers / DealType & PriceQualifier enums and columns (Phase 4)
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DealType') THEN
      CREATE TYPE "DealType" AS ENUM ('NONE', 'LIMITED_DEAL', 'LAUNCH_OFFER', 'FESTIVE_SALE', 'EARLY_BIRD', 'CLEARANCE', 'CUSTOM');
    END IF;
  END $$;`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PriceQualifier') THEN
      CREATE TYPE "PriceQualifier" AS ENUM ('NONE', 'STARTING_FROM', 'NEGOTIABLE');
    END IF;
  END $$;`,
  `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "priceQualifier" "PriceQualifier" NOT NULL DEFAULT 'NONE';`,
  `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "dealType" "DealType" NOT NULL DEFAULT 'NONE';`,
  `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "dealLabel" TEXT;`,
  `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "dealStartsAt" TIMESTAMP(3);`,
  `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "dealEndsAt" TIMESTAMP(3);`,

  // 10. AuditLog searchText column & indexes (Phase 5)
  `ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "searchText" TEXT;`,
  `CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");`,
  `CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");`,
  `CREATE INDEX IF NOT EXISTS "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");`,
  `CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");`,
  // One-time idempotent backfill for existing audit_logs rows where searchText is NULL
  `UPDATE "audit_logs"
   SET "searchText" = LOWER(
     CONCAT_WS(
       ' ',
       COALESCE("action", ''),
       COALESCE("entityType", ''),
       COALESCE("entityId", ''),
       COALESCE("userId", 'system'),
       COALESCE("details"::text, '')
     )
   )
   WHERE "searchText" IS NULL;`,
];

async function main() {
  const dbUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim();

  if (
    !dbUrl ||
    process.env.USE_MOCK_DB === "true" ||
    dbUrl.includes("localhost:5432/build") ||
    dbUrl.includes("localhost:5432/mock")
  ) {
    console.log("[EnsureSchema] Skipping schema sync (no live PostgreSQL DATABASE_URL configured).");
    return;
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    console.log("[EnsureSchema] Ensuring additive database schema columns and tables exist...");
    for (const sql of DDL_STATEMENTS) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log("[EnsureSchema] Database schema is up to date.");
  } catch (err) {
    console.warn("[EnsureSchema] Warning: Could not apply additive schema sync during build:", err?.message || err);
  } finally {
    await prisma.$disconnect().catch(() => null);
  }
}

main();
