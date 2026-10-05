-- AlterTable
ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "utrNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "paymentEvidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
