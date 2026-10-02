-- Migration: 20261001120000_add_user_contact_and_custom_request_customer
-- AlterTable: Add whatsapp and contactEmail to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;

-- AlterTable: Add customerId and linkedAt to custom_project_requests
ALTER TABLE "custom_project_requests" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "custom_project_requests" ADD COLUMN IF NOT EXISTS "linkedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "custom_project_requests_customerId_idx" ON "custom_project_requests"("customerId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_project_requests_customerId_fkey'
  ) THEN
    ALTER TABLE "custom_project_requests"
      ADD CONSTRAINT "custom_project_requests_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
