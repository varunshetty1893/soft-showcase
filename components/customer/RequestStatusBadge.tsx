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
    bg: "bg-[#F3F7F7] border-[#D9E2E4]",
    text: "text-[#155761]",
    dot: "bg-[#155761]",
  },
  REVIEWING: {
    label: "Under Review",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  CONTACTED: {
    label: "Contacted",
    bg: "bg-[#DDF4EC] border-[#2F7D78]/25",
    text: "text-[#155761]",
    dot: "bg-[#2F7D78]",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-[#DDF4EC] border-[#2F7D78]/25",
    text: "text-[#2F7D78]",
    dot: "bg-[#2F7D78]",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-[#DDF4EC] border-[#2F7D78]/25",
    text: "text-[#155761]",
    dot: "bg-[#2F7D78]",
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
