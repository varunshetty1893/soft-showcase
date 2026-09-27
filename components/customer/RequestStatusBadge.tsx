// components/customer/RequestStatusBadge.tsx
import * as React from "react";
import type { CustomRequestStatus } from "@prisma/client";

interface RequestStatusBadgeProps {
  status: CustomRequestStatus;
}

const STATUS_CONFIG: Record<
  CustomRequestStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  NEW: {
    label: "Submitted",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  REVIEWING: {
    label: "Under Review",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  CONTACTED: {
    label: "Contacted",
    bg: "bg-purple-50 border-purple-200",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-indigo-50 border-indigo-200",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  DECLINED: {
    label: "Declined",
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
};

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
