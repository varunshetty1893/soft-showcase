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
  `ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "partnerApplication" JSONB;`,

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

  // 11. Transaction enums and table
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionPaymentStatus') THEN
      CREATE TYPE "TransactionPaymentStatus" AS ENUM ('PENDING', 'EVIDENCE_SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REFUNDED', 'DISPUTED', 'COMPLETED');
    END IF;
  END $$;`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionProjectType') THEN
      CREATE TYPE "TransactionProjectType" AS ENUM ('EXISTING_SOLUTION', 'CUSTOMIZED_EXISTING_SOLUTION', 'NEW_SOLUTION_FOR_CUSTOMER');
    END IF;
  END $$;`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionDeliveryStatus') THEN
      CREATE TYPE "TransactionDeliveryStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED');
    END IF;
  END $$;`,
  `CREATE TABLE IF NOT EXISTS "transactions" (
    "id" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "enquiryId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerWhatsapp" TEXT,
    "partnerId" TEXT NOT NULL,
    "solutionId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL DEFAULT 'UPI',
    "utrNumber" TEXT,
    "paymentStatus" "TransactionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentEvidenceUrl" TEXT,
    "paymentEvidenceNotes" TEXT,
    "projectType" "TransactionProjectType" NOT NULL DEFAULT 'EXISTING_SOLUTION',
    "description" TEXT,
    "deliveryStatus" "TransactionDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "adminNotes" TEXT,
    "verificationSource" TEXT NOT NULL DEFAULT 'manual_provider_submission',
    "gateway" TEXT,
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewaySignature" TEXT,
    "gatewayVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "transactions_transactionNumber_key" ON "transactions"("transactionNumber");`,
  `CREATE INDEX IF NOT EXISTS "transactions_partnerId_idx" ON "transactions"("partnerId");`,
  `CREATE INDEX IF NOT EXISTS "transactions_customerId_idx" ON "transactions"("customerId");`,
  `CREATE INDEX IF NOT EXISTS "transactions_paymentStatus_idx" ON "transactions"("paymentStatus");`,

  // 12. SupportTicket enums and tables
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketStatus') THEN
      CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_ADMIN', 'RESOLVED', 'CLOSED');
    END IF;
  END $$;`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketPriority') THEN
      CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
    END IF;
  END $$;`,
  `CREATE TABLE IF NOT EXISTS "support_tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterRole" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedAdminId" TEXT,
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "support_tickets_ticketNumber_key" ON "support_tickets"("ticketNumber");`,
  `CREATE INDEX IF NOT EXISTS "support_tickets_requesterId_idx" ON "support_tickets"("requesterId");`,
  `CREATE INDEX IF NOT EXISTS "support_tickets_status_idx" ON "support_tickets"("status");`,
  `CREATE TABLE IF NOT EXISTS "support_messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE INDEX IF NOT EXISTS "support_messages_ticketId_idx" ON "support_messages"("ticketId");`,
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
