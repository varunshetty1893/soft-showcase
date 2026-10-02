"use client";
// components/projects/PriceBlock.tsx
// Shared client component (variants "compact" and "hero") so the sidebar price,
// card price, and large price banner on the project page are always identical (Phase 4).
// Automatically switches to the regular price when dealEndsAt passes so cached pages
// never show an expired offer. Never invents, loops, or resets countdown timers.

import * as React from "react";
import { Clock, Tag } from "lucide-react";
import {
  getEffectivePricing,
  DEAL_BADGE_META,
  type ProjectPricingInput,
  type DealTypeValue,
} from "@/lib/utils/pricing";

export interface PriceBlockProps extends ProjectPricingInput {
  project?: ProjectPricingInput;
  variant?: "compact" | "hero" | "card";
  /** When true (e.g. for the top hero offer banner), renders nothing unless an offer/discount is currently active */
  onlyWhenDiscounted?: boolean;
  /** Optional override timestamp for deterministic tests */
  now?: Date | number;
  className?: string;
}

export function PriceBlock({
  project,
  priceMode,
  price,
  originalPrice,
  priceQualifier,
  dealType,
  dealLabel,
  dealStartsAt,
  dealEndsAt,
  variant = "compact",
  onlyWhenDiscounted = false,
  now: nowProp,
  className = "",
}: PriceBlockProps) {
  const input: ProjectPricingInput = React.useMemo(
    () =>
      project ?? {
        priceMode,
        price,
        originalPrice,
        priceQualifier,
        dealType,
        dealLabel,
        dealStartsAt,
        dealEndsAt,
      },
    [
      project,
      priceMode,
      price,
      originalPrice,
      priceQualifier,
      dealType,
      dealLabel,
      dealStartsAt,
      dealEndsAt,
    ]
  );

  const [currentNow, setCurrentNow] = React.useState<Date | number>(
    () => nowProp ?? new Date()
  );

  React.useEffect(() => {
    if (nowProp !== undefined) {
      setCurrentNow(nowProp);
      return;
    }

    const rawEnds = input.dealEndsAt ? new Date(input.dealEndsAt as string) : null;
    const rawStarts = input.dealStartsAt ? new Date(input.dealStartsAt as string) : null;
    const nowMs = Date.now();

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Schedule exact transition when dealStartsAt arrives
    if (rawStarts && !Number.isNaN(rawStarts.getTime()) && rawStarts.getTime() > nowMs) {
      const delay = Math.min(rawStarts.getTime() - nowMs + 50, 2_147_483_647);
      timers.push(setTimeout(() => setCurrentNow(new Date()), delay));
    }

    // Schedule exact transition when dealEndsAt passes so expired offers disappear immediately
    if (rawEnds && !Number.isNaN(rawEnds.getTime()) && rawEnds.getTime() > nowMs) {
      const delay = Math.min(rawEnds.getTime() - nowMs + 50, 2_147_483_647);
      timers.push(setTimeout(() => setCurrentNow(new Date()), delay));

      // Also refresh remaining countdown text once per minute while active
      const interval = setInterval(() => {
        setCurrentNow(new Date());
      }, 60_000);
      timers.push(interval as unknown as ReturnType<typeof setTimeout>);
    }

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [input.dealEndsAt, input.dealStartsAt, nowProp]);

  const resolved = React.useMemo(
    () => getEffectivePricing(input, currentNow),
    [input, currentNow]
  );

  if (onlyWhenDiscounted && !resolved.isDiscounted) {
    return null;
  }

  const badgeColors =
    resolved.dealType !== "NONE"
      ? DEAL_BADGE_META[resolved.dealType as Exclude<DealTypeValue, "NONE">]
      : {
          label: "Special Offer",
          bgClass: "bg-[#155761]",
          textClass: "text-white",
          borderClass: "border-[#0F3F47]",
        };

  // ── Variant: Card (used on ProjectCard) ───────────────────────────────────
  if (variant === "card") {
    if (resolved.priceMode === "FREE") {
      return (
        <span className={`text-sm font-bold text-[#2F7D78] ${className}`}>
          Free
        </span>
      );
    }

    if (resolved.effectivePrice === null) {
      return (
        <span className={`text-xs font-semibold text-[#526267] ${className}`}>
          Contact for Price
        </span>
      );
    }

    if (resolved.isDiscounted && resolved.formattedRegularPrice) {
      return (
        <div className={`flex flex-col leading-tight ${className}`}>
          <div className="flex items-center gap-1.5 flex-wrap">
            {resolved.badgeLabel && (
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeColors.bgClass} ${badgeColors.textClass}`}
              >
                {resolved.badgeLabel}
              </span>
            )}
            <span className="text-[11px] text-[#526267] line-through font-medium">
              {resolved.formattedRegularPrice}
            </span>
            {resolved.discountPercent && (
              <span className="text-[10px] font-bold text-[#2F7D78] bg-[#DDF4EC] px-1.5 py-0.5 rounded">
                -{resolved.discountPercent}%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
            <span className="text-sm font-extrabold text-[#102124]">
              {resolved.formattedPrice}
            </span>
            {resolved.priceQualifier === "NEGOTIABLE" && (
              <span className="text-[10px] font-semibold text-[#526267]">
                • Price negotiable
              </span>
            )}
            {resolved.countdownText && (
              <span className="text-[10px] font-semibold text-rose-600 inline-flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {resolved.countdownText}
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={`flex items-baseline gap-1.5 flex-wrap ${className}`}>
        <span className="text-sm font-bold text-[#102124]">
          {resolved.formattedPrice}
        </span>
        {resolved.priceQualifier === "NEGOTIABLE" && (
          <span className="text-[10px] font-semibold text-[#526267]">
            • Price negotiable
          </span>
        )}
      </div>
    );
  }

  // ── Variant: Hero (large promotional price block on project detail page) ──
  if (variant === "hero") {
    return (
      <div
        data-testid="price-block-hero"
        className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#DDF4EC]/60 via-[#F3F7F7] to-white border border-[#2F7D78]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${className}`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {resolved.badgeLabel && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${badgeColors.bgClass} ${badgeColors.textClass}`}
              >
                <Tag className="w-3 h-3" />
                <span>{resolved.badgeLabel}</span>
              </span>
            )}
            {resolved.discountPercent && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-extrabold uppercase tracking-wider">
                {resolved.discountPercent}% OFF
              </span>
            )}
            {resolved.countdownText && (
              <span
                data-testid="offer-countdown"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold"
              >
                <Clock className="w-3 h-3 text-amber-700" />
                <span>{resolved.countdownText}</span>
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-3 flex-wrap pt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#102124] tracking-tight">
              {resolved.formattedPrice}
            </span>
            {resolved.formattedRegularPrice && (
              <span className="text-base sm:text-lg text-[#526267] line-through font-medium">
                {resolved.formattedRegularPrice}
              </span>
            )}
            {resolved.priceQualifier === "NEGOTIABLE" && (
              <span className="text-xs font-semibold text-[#155761] bg-white px-2.5 py-0.5 rounded-full border border-[#D9E2E4]">
                Price negotiable
              </span>
            )}
          </div>
        </div>

        {resolved.formattedSavings && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#2F7D78]/20 text-xs font-bold text-[#155761] shrink-0 self-start sm:self-center shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#2F7D78]" />
            <span>You save {resolved.formattedSavings} on this build</span>
          </div>
        )}
      </div>
    );
  }

  // ── Variant: Compact (sidebar price block & live form preview) ────────────
  if (resolved.priceMode === "FREE") {
    return (
      <div data-testid="price-block-compact" className={`inline-flex items-center gap-2 ${className}`}>
        <span className="text-2xl font-extrabold text-[#2F7D78] tracking-tight">
          Free
        </span>
      </div>
    );
  }

  if (resolved.effectivePrice === null) {
    return (
      <div data-testid="price-block-compact" className={`space-y-1 ${className}`}>
        <span className="text-xl font-bold text-[#102124]">Contact for Price</span>
        {resolved.priceQualifier === "NEGOTIABLE" && (
          <span className="block text-xs font-semibold text-[#526267]">
            Price negotiable
          </span>
        )}
      </div>
    );
  }

  return (
    <div data-testid="price-block-compact" className={`flex flex-col gap-1.5 ${className}`}>
      {resolved.isDiscounted && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {resolved.badgeLabel && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${badgeColors.bgClass} ${badgeColors.textClass}`}
            >
              <Tag className="w-3 h-3" />
              <span>{resolved.badgeLabel}</span>
            </span>
          )}
          {resolved.discountPercent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-extrabold uppercase tracking-wider">
              {resolved.discountPercent}% OFF
            </span>
          )}
          {resolved.countdownText && (
            <span
              data-testid="offer-countdown"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold"
            >
              <Clock className="w-3 h-3 text-amber-700" />
              <span>{resolved.countdownText}</span>
            </span>
          )}
        </div>
      )}

      <div className="flex items-baseline gap-2.5 flex-wrap">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#102124] tracking-tight">
          {resolved.formattedPrice}
        </span>
        {resolved.isDiscounted && resolved.formattedRegularPrice && (
          <span className="text-sm sm:text-base font-medium text-[#526267] line-through">
            {resolved.formattedRegularPrice}
          </span>
        )}
      </div>

      {resolved.priceQualifier === "NEGOTIABLE" && (
        <span className="text-xs font-semibold text-[#155761]">
          Price negotiable
        </span>
      )}

      {resolved.isDiscounted && resolved.formattedSavings && (
        <span className="text-xs font-semibold text-[#2F7D78]">
          Save {resolved.formattedSavings}
        </span>
      )}
    </div>
  );
}
