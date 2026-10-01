// components/projects/PriceBadge.tsx
// Pricing component for Soft Showcase with honest pricing discipline.
// Shows strikethrough and discount percentage ONLY when verified originalPrice is present.
// Zero fabricated MRP or fake urgency countdowns.

import * as React from "react";
import { formatPrice, calculateDiscountPercent } from "@/lib/utils/format";
import { Tag } from "lucide-react";

interface PriceBadgeProps {
  priceMode: string;
  price?: { toString(): string } | number | string | null;
  originalPrice?: { toString(): string } | number | string | null;
  variant?: "card" | "detail" | "compact";
  showTaxNotice?: boolean;
}

export function PriceBadge({
  priceMode,
  price,
  originalPrice,
  variant = "card",
  showTaxNotice = false,
}: PriceBadgeProps) {
  const priceStr = price ? price.toString() : null;
  const numPrice = priceStr ? parseFloat(priceStr) : null;

  const originalStr = originalPrice ? originalPrice.toString() : null;
  const numOriginal = originalStr ? parseFloat(originalStr) : null;

  const hasValidOriginal =
    Boolean(numPrice && numOriginal && numOriginal > numPrice && priceMode === "FIXED");
  const discountPercent = hasValidOriginal
    ? calculateDiscountPercent(numPrice, numOriginal)
    : 0;

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
    if (variant === "detail") {
      return (
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-xs">
            Free
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight">
              Free
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
        <span className="text-base font-extrabold text-emerald-700">Free</span>
      </div>
    );
  }

  // ── 3. Detail View (Clean, Honest Pricing) ─────────────────────────────────
  if (variant === "detail" && numPrice !== null) {
    return (
      <div className="space-y-2 bg-[#F8FAFA] sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-[#D9E2E4]">
        {priceMode === "STARTING_FROM" && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761]">
              Starting Price
            </span>
          </div>
        )}

        {/* Pricing Row */}
        <div className="flex items-baseline gap-3 flex-wrap pt-1">
          {hasValidOriginal && discountPercent > 0 && (
            <span className="text-2xl sm:text-3xl font-semibold text-emerald-700">
              -{discountPercent}%
            </span>
          )}

          <div className="flex items-start">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#102124] tracking-tight">
              {formatPrice(numPrice)}
            </span>
          </div>

          {hasValidOriginal && numOriginal !== null && (
            <span className="text-sm sm:text-base text-gray-500 font-medium">
              Originally:{" "}
              <del className="line-through text-gray-400">
                {formatPrice(numOriginal)}
              </del>
            </span>
          )}
        </div>

        {/* Tax Notice */}
        {showTaxNotice && (
          <div className="text-[11px] text-[#526267] pt-0.5">
            Inclusive of all taxes • No buyer platform fees
          </div>
        )}
      </div>
    );
  }

  // ── 4. Card View (Search Result / Grid Item) ─────────────────────────────
  if (numPrice !== null) {
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

          {/* Strikethrough Original Price only when real original price exists */}
          {hasValidOriginal && numOriginal !== null && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(numOriginal)}
            </span>
          )}

          {hasValidOriginal && discountPercent > 0 && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded">
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
