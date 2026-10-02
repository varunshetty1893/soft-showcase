-- AlterEnum: Add THROTTLED to NotificationStatus (additive, backward compatible)
ALTER TYPE "NotificationStatus" ADD VALUE IF NOT EXISTS 'THROTTLED';

-- AlterTable: Add notificationStatus to custom_project_requests (additive, defaulted)
ALTER TABLE "custom_project_requests" ADD COLUMN IF NOT EXISTS "notificationStatus" "NotificationStatus" NOT NULL DEFAULT 'PENDING';
