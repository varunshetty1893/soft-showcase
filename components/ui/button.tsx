// components/ui/button.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "whatsapp" | "mint";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.99]";

    const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-[#155761] text-white hover:bg-[#10474F] shadow-xs hover:shadow focus-visible:ring-[#155761]",
      mint:
        "bg-[#DDF4EC] text-[#155761] hover:bg-[#cbf0e3] font-semibold border border-[#2F7D78]/25 focus-visible:ring-[#2F7D78]",
      secondary:
        "bg-[#F3F7F7] text-[#155761] hover:bg-[#EEF3F4] border border-[#D9E2E4] focus-visible:ring-[#155761]",
      outline:
        "border border-[#D9E2E4] bg-white text-[#102124] hover:bg-[#F3F7F7] hover:text-[#155761] hover:border-[#155761]/40 shadow-xs focus-visible:ring-[#155761]",
      ghost:
        "text-[#526267] hover:bg-[#F3F7F7] hover:text-[#155761] focus-visible:ring-[#155761]",
      danger:
        "bg-[#ba1a1a] text-white hover:bg-[#93000a] shadow-sm focus-visible:ring-red-500",
      whatsapp:
        "bg-[#25D366] text-white hover:bg-[#20ba59] shadow-sm focus-visible:ring-[#25D366]",
    };

    // Minimum 40px desktop / 44px mobile touch targets per guidelines
    const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm: "h-9 px-3 text-xs md:text-sm min-h-[36px]",
      md: "h-11 md:h-10 px-4 py-2 text-sm min-h-[44px] md:min-h-[40px]",
      lg: "h-12 px-6 text-base min-h-[48px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
