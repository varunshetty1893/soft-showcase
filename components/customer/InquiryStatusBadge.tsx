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
    bg: "bg-[#F3F7F7] border-[#D9E2E4]",
    text: "text-[#155761]",
    dot: "bg-[#155761]",
  },
  CONTACTED: {
    label: "Contacted",
    bg: "bg-[#DDF4EC] border-[#2F7D78]/25",
    text: "text-[#155761]",
    dot: "bg-[#2F7D78]",
  },
  DISCUSSING: {
    label: "In Discussion",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  QUOTED: {
    label: "Quoted",
    bg: "bg-[#DDF4EC] border-[#2F7D78]/25",
    text: "text-[#2F7D78]",
    dot: "bg-[#2F7D78]",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-[#F3F7F7] border-[#D9E2E4]",
    text: "text-[#526267]",
    dot: "bg-[#526267]",
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
