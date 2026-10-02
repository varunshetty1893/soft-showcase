// components/admin/InquiryDetailManager.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { InquiryStatusBadge } from "@/components/customer/InquiryStatusBadge";
import type { InquiryStatus, NotificationStatus } from "@prisma/client";
import {
  Save,
  RotateCw,
  Loader2,
} from "lucide-react";

interface InquiryDetailManagerProps {
  inquiry: {
    id: string;
    status: InquiryStatus;
    notificationStatus: NotificationStatus;
    adminNotes: string | null;
  };
}

const ALL_STATUSES: InquiryStatus[] = [
  "NEW",
  "CONTACTED",
  "DISCUSSING",
  "QUOTED",
  "CLOSED",
];

export function InquiryDetailManager({ inquiry }: InquiryDetailManagerProps) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = React.useState<InquiryStatus>(inquiry.status);
  const [adminNotes, setAdminNotes] = React.useState(inquiry.adminNotes || "");
  const [saving, setSaving] = React.useState(false);
  const [retryingEmail, setRetryingEmail] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update inquiry");
      }

      toast.success("Inquiry status and notes saved.");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRetryEmail = async () => {
    setRetryingEmail(true);

    try {
      const res = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retryNotification: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to trigger email retry");
      }

      toast.success("Provider notification email retry dispatched.");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Retry failed";
      toast.error(msg);
    } finally {
      setRetryingEmail(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-950">
          Inquiry Status & Operations
        </h3>
        <InquiryStatusBadge status={status} />
      </div>

      {/* Status Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
          Update Workflow Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as InquiryStatus)}
          className="w-full bg-white border border-[#D9E2E4] text-[#102124] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#155761] focus:border-[#155761]"
        >
          {ALL_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Internal Admin Notes */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#102124] mb-2">
          Internal Admin Notes
        </label>
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Private notes on provider response, quotes sent, negotiations, etc. (Not visible to customer)"
          rows={4}
          className="text-sm bg-white"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F3F7F7]">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Retry Notification Email */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#526267]">
            Email Delivery:{" "}
            <strong
              className={`font-semibold ${
                inquiry.notificationStatus === "SENT"
                  ? "text-[#2F7D78]"
                  : inquiry.notificationStatus === "FAILED"
                  ? "text-rose-600"
                  : "text-amber-600"
              }`}
            >
              {inquiry.notificationStatus}
            </strong>
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetryEmail}
            disabled={retryingEmail}
            className="gap-1.5 text-xs"
          >
            {retryingEmail ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCw className="w-3.5 h-3.5 text-[#155761]" />
            )}
            Retry Email
          </Button>
        </div>
      </div>
    </div>
  );
}
