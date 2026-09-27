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
    default: "bg-[#eefcfe] text-[#00373f] border-[#d8e5e7]",
    mint: "bg-[#8cf7ce]/25 text-[#006c50] border-[#8cf7ce]/60 font-semibold",
    secondary: "bg-[#e9f6f8] text-[#00373f] border-[#d8e5e7]",
    outline: "text-[#40484a] border-[#d8e5e7] bg-white",
    success: "bg-[#8cf7ce]/20 text-[#006c50] border-[#8cf7ce]/50",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    destructive: "bg-red-50 text-red-700 border-red-200",
    tech: "bg-[#e9f6f8] text-[#184e58] border-[#d8e5e7] font-mono text-xs",
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
