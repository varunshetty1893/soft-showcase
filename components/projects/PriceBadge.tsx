// components/projects/PriceBadge.tsx
// Amazon & Flipkart style pricing component with Indian Rupees (₹),
// strikethrough M.R.P., discount percentage badges, and tax/savings indicators.

import * as React from "react";
import {
  formatPrice,
  calculateMrp,
  calculateDiscountPercent,
} from "@/lib/utils/format";
import { Tag, Sparkles } from "lucide-react";

interface PriceBadgeProps {
  priceMode: string;
  price?: { toString(): string } | number | string | null;
  variant?: "card" | "detail" | "compact";
  showTaxNotice?: boolean;
}

export function PriceBadge({
  priceMode,
  price,
  variant = "card",
  showTaxNotice = false,
}: PriceBadgeProps) {
  const priceStr = price ? price.toString() : null;
  const numPrice = priceStr ? parseFloat(priceStr) : null;
  const mrp = numPrice ? calculateMrp(numPrice) : null;
  const discountPercent =
    numPrice && mrp ? calculateDiscountPercent(numPrice, mrp) : 0;
  const savings = numPrice && mrp ? mrp - numPrice : 0;

  // ── 1. Contact / Custom Quote Mode ───────────────────────────────────────
  if (priceMode === "CONTACT") {
    if (variant === "detail") {
      return (
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#F3F7F7] border border-[#D9E2E4] text-xs font-bold text-[#155761] uppercase tracking-wider">
            <Tag className="w-3 h-3 text-[#155761]" />
            Bespoke Pricing
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#102124] tracking-tight">
              Price on Request
            </span>
          </div>
          <p className="text-xs text-[#526267]">
            Contact provider directly for a customized proposal and scope estimate.
          </p>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        <span className="px-2.5 py-1 rounded-md bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] text-xs font-semibold">
          Price on Request
        </span>
      </div>
    );
  }

  // ── 2. Free / Open-Source Mode ───────────────────────────────────────────
  if (priceMode === "FREE") {
    const mockFreeMrp = 14999;
    if (variant === "detail") {
      return (
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3 h-3" />
            100% Free
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight">
              ₹0
            </span>
            <span className="text-sm sm:text-base text-gray-500 font-medium">
              M.R.P.:{" "}
              <del className="line-through text-gray-400">
                {formatPrice(mockFreeMrp)}
              </del>
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              100% off
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Open-source / Community license. No purchase required.
          </p>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-base font-extrabold text-emerald-700">₹0</span>
        <span className="text-[11px] text-gray-400 line-through">
          {formatPrice(mockFreeMrp)}
        </span>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
          100% off
        </span>
      </div>
    );
  }

  // ── 3. Detail View (Full Amazon & Flipkart Buybox Styling) ───────────────
  if (variant === "detail" && numPrice) {
    return (
      <div className="space-y-2 bg-[#F8FAFA] sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-[#D9E2E4]">
        {/* Deal Badge (Amazon / Flipkart style) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#CC0C39] text-white text-xs font-bold uppercase tracking-wide shadow-xs">
            Limited Time Deal
          </span>
          {priceMode === "STARTING_FROM" && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761]">
              Starting Price
            </span>
          )}
        </div>

        {/* Pricing Row */}
        <div className="flex items-baseline gap-3 flex-wrap pt-1">
          {/* Discount Percentage (Amazon style prominent red / emerald) */}
          {discountPercent > 0 && (
            <span className="text-2xl sm:text-3xl font-light text-[#CC0C39]">
              -{discountPercent}%
            </span>
          )}

          {/* Current Rupee Price */}
          <div className="flex items-start">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#102124] tracking-tight">
              {formatPrice(numPrice)}
            </span>
          </div>
        </div>

        {/* M.R.P. & Savings (Flipkart / Amazon style) */}
        {mrp && mrp > numPrice && (
          <div className="text-xs sm:text-sm text-[#526267] space-y-0.5">
            <div>
              M.R.P.:{" "}
              <del className="line-through text-gray-400 font-medium">
                {formatPrice(mrp)}
              </del>
              <span className="ml-2 font-semibold text-emerald-700">
                ({discountPercent}% off)
              </span>
            </div>
            <div className="text-xs font-medium text-emerald-800">
              You Save: {formatPrice(savings)} ({discountPercent}%)
            </div>
          </div>
        )}

        {/* Tax Notice */}
        <div className="text-[11px] text-[#526267] pt-0.5">
          Inclusive of all taxes • No buyer platform fees
        </div>
      </div>
    );
  }

  // ── 4. Card View (Amazon & Flipkart Search Result / Grid Item) ────────────
  if (numPrice) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        {priceMode === "STARTING_FROM" && (
          <span className="text-[10px] uppercase font-bold text-[#526267] tracking-wider">
            From
          </span>
        )}

        <div className="flex items-baseline gap-2 flex-wrap">
          {/* Selling Price */}
          <span className="text-lg font-bold text-[#102124] tracking-tight">
            {formatPrice(numPrice)}
          </span>

          {/* Strikethrough M.R.P. */}
          {mrp && mrp > numPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(mrp)}
            </span>
          )}

          {/* Flipkart-style Green Discount Badge */}
          {discountPercent > 0 && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded">
              {discountPercent}% off
            </span>
          )}
        </div>

        {showTaxNotice && (
          <span className="text-[10px] text-[#526267]">
            Inclusive of all taxes
          </span>
        )}
      </div>
    );
  }

  // ── 5. Compact Variant Fallback ──────────────────────────────────────────
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#F3F7F7] border border-[#D9E2E4] text-[#102124]">
      {priceMode === "STARTING_FROM" ? "Starting Price" : "Fixed Price"}
    </span>
  );
}
