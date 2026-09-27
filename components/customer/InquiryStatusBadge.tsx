// components/customer/InquiryStatusBadge.tsx
import * as React from "react";
import type { InquiryStatus } from "@prisma/client";

interface InquiryStatusBadgeProps {
  status: InquiryStatus;
}

const STATUS_CONFIG: Record<
  InquiryStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  NEW: {
    label: "New",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  CONTACTED: {
    label: "Contacted",
    bg: "bg-purple-50 border-purple-200",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  DISCUSSING: {
    label: "In Discussion",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  QUOTED: {
    label: "Quoted",
    bg: "bg-indigo-50 border-indigo-200",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-gray-100 border-gray-200",
    text: "text-gray-700",
    dot: "bg-gray-400",
  },
};

export function InquiryStatusBadge({ status }: InquiryStatusBadgeProps) {
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
