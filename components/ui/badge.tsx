// components/ui/badge.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "destructive"
    | "tech"
    | "mint";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-[#F3F7F7] text-[#155761] border-[#D9E2E4]",
    mint: "bg-[#DDF4EC] text-[#155761] border-[#2F7D78]/25 font-semibold",
    secondary: "bg-[#F3F7F7] text-[#526267] border-[#D9E2E4]",
    outline: "text-[#526267] border-[#D9E2E4] bg-white",
    success: "bg-[#DDF4EC] text-[#2F7D78] border-[#2F7D78]/30 font-medium",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    destructive: "bg-red-50 text-red-700 border-red-200",
    tech: "bg-[#F3F7F7] text-[#155761] border-[#D9E2E4] font-mono text-xs",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
