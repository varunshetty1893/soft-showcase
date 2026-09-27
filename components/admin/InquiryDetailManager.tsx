// components/admin/InquiryDetailManager.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InquiryStatusBadge } from "@/components/customer/InquiryStatusBadge";
import type { InquiryStatus, NotificationStatus } from "@prisma/client";
import {
  Save,
  RotateCw,
  CheckCircle2,
  AlertCircle,
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
  const [status, setStatus] = React.useState<InquiryStatus>(inquiry.status);
  const [adminNotes, setAdminNotes] = React.useState(inquiry.adminNotes || "");
  const [saving, setSaving] = React.useState(false);
  const [retryingEmail, setRetryingEmail] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

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

      setFeedback({ type: "success", text: "Inquiry status and notes saved." });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleRetryEmail = async () => {
    setRetryingEmail(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retryNotification: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to trigger email retry");
      }

      setFeedback({
        type: "success",
        text: "Provider notification email retry dispatched.",
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Retry failed";
      setFeedback({ type: "error", text: msg });
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

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 text-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <p>{feedback.text}</p>
        </div>
      )}

      {/* Status Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
          Update Workflow Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as InquiryStatus)}
          className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
          Internal Admin Notes
        </label>
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Private notes on provider response, quotes sent, negotiations, etc. (Not visible to customer)"
          rows={4}
          className="text-sm bg-gray-50/50"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
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
          <span className="text-xs text-gray-400">
            Email Delivery:{" "}
            <strong
              className={`font-semibold ${
                inquiry.notificationStatus === "SENT"
                  ? "text-emerald-600"
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
              <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
            )}
            Retry Email
          </Button>
        </div>
      </div>
    </div>
  );
}
