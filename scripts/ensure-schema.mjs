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
