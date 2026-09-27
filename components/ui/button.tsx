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
        "bg-[#00373f] text-white hover:bg-[#184e58] shadow-[0_4px_16px_rgba(0,55,63,0.18)] hover:shadow-[0_6px_20px_rgba(0,55,63,0.25)] focus-visible:ring-[#006c50]",
      mint:
        "bg-[#8cf7ce] text-[#002116] hover:bg-[#6fdab3] font-bold shadow-[0_4px_16px_rgba(140,247,206,0.3)] hover:shadow-[0_6px_20px_rgba(111,218,179,0.4)] focus-visible:ring-[#006c50]",
      secondary:
        "bg-[#e9f6f8] text-[#00373f] hover:bg-[#ddebed] focus-visible:ring-[#006c50]",
      outline:
        "border border-[#d8e5e7] bg-white text-[#111d1f] hover:bg-[#e9f6f8] hover:text-[#00373f] hover:border-[#8cf7ce] shadow-xs focus-visible:ring-[#006c50]",
      ghost:
        "text-[#40484a] hover:bg-[#e9f6f8] hover:text-[#00373f] focus-visible:ring-[#006c50]",
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
