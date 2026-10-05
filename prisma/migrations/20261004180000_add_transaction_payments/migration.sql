-- Installment payments: parent transaction keeps the agreed total, each customer
-- payment is its own row (max 3 active payments enforced by the API under a row lock).

-- Columns that earlier work-in-progress code relied on (idempotent, safe if already present)
ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "utrNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "paymentEvidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Agreed (total deal) amount
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "agreedAmount" DECIMAL(12,2);

-- Payments table
CREATE TABLE IF NOT EXISTS "transaction_payments" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "paymentMethod" TEXT NOT NULL DEFAULT 'UPI',
  "utrNumber" TEXT,
  "evidenceUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),
  "verifiedBy" TEXT,
  "rejectionReason" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transaction_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "transaction_payments_transactionId_sequence_key"
  ON "transaction_payments"("transactionId", "sequence");
CREATE INDEX IF NOT EXISTS "transaction_payments_transactionId_idx" ON "transaction_payments"("transactionId");
CREATE INDEX IF NOT EXISTS "transaction_payments_utrNumber_idx" ON "transaction_payments"("utrNumber");
CREATE INDEX IF NOT EXISTS "transaction_payments_status_idx" ON "transaction_payments"("status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_payments_transactionId_fkey') THEN
    ALTER TABLE "transaction_payments"
      ADD CONSTRAINT "transaction_payments_transactionId_fkey"
      FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill: every existing transaction becomes a transaction with exactly one payment.
INSERT INTO "transaction_payments"
  ("id", "transactionId", "sequence", "amount", "currency", "paymentMethod", "utrNumber",
   "evidenceUrl", "status", "paidAt", "verifiedAt", "verifiedBy", "createdAt", "updatedAt")
SELECT
  'tp_' || t."id", t."id", 1, t."amount", t."currency", t."paymentMethod",
  NULLIF(TRIM(t."utrNumber"), ''), t."paymentEvidenceUrl",
  CASE
    WHEN t."paymentStatus"::text IN ('VERIFIED', 'COMPLETED', 'REFUNDED') THEN 'VERIFIED'
    WHEN t."paymentStatus"::text = 'REJECTED' THEN 'REJECTED'
    ELSE 'PENDING_REVIEW'
  END,
  t."transactionDate",
  CASE WHEN t."paymentStatus"::text IN ('VERIFIED', 'COMPLETED', 'REFUNDED') THEN COALESCE(t."verifiedAt", t."updatedAt") END,
  CASE WHEN t."paymentStatus"::text IN ('VERIFIED', 'COMPLETED', 'REFUNDED') THEN t."verifiedBy" END,
  t."createdAt", CURRENT_TIMESTAMP
FROM "transactions" t
WHERE NOT EXISTS (SELECT 1 FROM "transaction_payments" p WHERE p."transactionId" = t."id");

-- Existing deals were single full payments, so agreed total = what was paid.
UPDATE "transactions" SET "agreedAmount" = "amount" WHERE "agreedAmount" IS NULL;

-- Never allow zero / negative payment amounts at the database level (new writes only).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_payments_amount_positive') THEN
    ALTER TABLE "transaction_payments"
      ADD CONSTRAINT "transaction_payments_amount_positive" CHECK ("amount" > 0) NOT VALID;
  END IF;
END $$;
