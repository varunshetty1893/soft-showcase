// components/admin/CustomRequestDetailManager.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RequestStatusBadge } from "@/components/customer/RequestStatusBadge";
import type { CustomRequestStatus } from "@prisma/client";
import { Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface CustomRequestDetailManagerProps {
  request: {
    id: string;
    status: CustomRequestStatus;
    adminNotes: string | null;
  };
}

const ALL_STATUSES: CustomRequestStatus[] = [
  "NEW",
  "REVIEWING",
  "CONTACTED",
  "IN_PROGRESS",
  "COMPLETED",
  "DECLINED",
];

export function CustomRequestDetailManager({
  request,
}: CustomRequestDetailManagerProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<CustomRequestStatus>(request.status);
  const [adminNotes, setAdminNotes] = React.useState(request.adminNotes || "");
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/custom-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update custom request");
      }

      setFeedback({ type: "success", text: "Request status and notes saved." });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-950">
          Request Review & Workflow
        </h3>
        <RequestStatusBadge status={status} />
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
          onChange={(e) => setStatus(e.target.value as CustomRequestStatus)}
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
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
          Internal Admin Notes
        </label>
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Private notes on architectural evaluation, developer assignments, customer call notes, etc. (Not visible to customer)"
          rows={4}
          className="text-sm bg-gray-50/50"
        />
      </div>

      {/* Actions Bar */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
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
          Save Status & Notes
        </Button>
      </div>
    </div>
  );
}
