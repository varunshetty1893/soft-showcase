"use client";
// components/projects/PricingOffersFields.tsx
// Shared Pricing & Promotional Offers form section used by both PartnerSolutionForm
// and Admin ProjectForm (for admin-managed projects per Phase 3).
// Includes: priceMode, selling price, regular price with helper text, price qualifier,
// offer type, custom label (when CUSTOM), start and end date-time with timezone shown (IST),
// inline validation messages, and a live preview of the badge and PriceBlock.

import * as React from "react";
import { Tag, Clock, Sparkles } from "lucide-react";
import { PriceBlock } from "./PriceBlock";
import {
  TIME_LIMITED_DEAL_TYPES,
  validatePricingOfferInput,
  toIstDatetimeLocal,
  fromIstDatetimeLocal,
  type DealTypeValue,
  type PriceQualifierValue,
} from "@/lib/utils/pricing";

export interface PricingOffersFormState {
  priceMode: "FIXED" | "STARTING_FROM" | "CONTACT" | "FREE";
  price: string;
  originalPrice: string;
  priceQualifier: PriceQualifierValue;
  dealType: DealTypeValue;
  dealLabel: string;
  dealStartsAt: string; // IST datetime-local or ISO
  dealEndsAt: string;   // IST datetime-local or ISO
}

interface PricingOffersFieldsProps {
  value: PricingOffersFormState;
  onChange: (patch: Partial<PricingOffersFormState>) => void;
  serverErrors?: Record<string, string[] | string | undefined>;
}

const DEAL_TYPE_OPTIONS: { value: DealTypeValue; label: string; hint: string }[] = [
  { value: "NONE", label: "No Promotional Tag (Standard / Permanent Reference)", hint: "No time-limited offer badge" },
  { value: "LIMITED_DEAL", label: "Limited Deal", hint: "Requires a future end date" },
  { value: "LAUNCH_OFFER", label: "Launch Offer", hint: "Requires a future end date" },
  { value: "FESTIVE_SALE", label: "Festive Sale", hint: "Requires a future end date" },
  { value: "EARLY_BIRD", label: "Early Bird", hint: "Requires a future end date" },
  { value: "CLEARANCE", label: "Clearance", hint: "Optional end date" },
  { value: "CUSTOM", label: "Custom Offer Label…", hint: "Custom badge (max 24 chars), optional end date" },
];

export function PricingOffersFields({
  value,
  onChange,
  serverErrors = {},
}: PricingOffersFieldsProps) {
  const isFixed = value.priceMode === "FIXED";
  const isPaid = value.priceMode === "FIXED" || value.priceMode === "STARTING_FROM";
  const requiresEndDate = TIME_LIMITED_DEAL_TYPES.has(value.dealType);

  const startsAtLocal = React.useMemo(
    () =>
      value.dealStartsAt && value.dealStartsAt.includes("Z")
        ? toIstDatetimeLocal(value.dealStartsAt)
        : value.dealStartsAt || "",
    [value.dealStartsAt]
  );

  const endsAtLocal = React.useMemo(
    () =>
      value.dealEndsAt && value.dealEndsAt.includes("Z")
        ? toIstDatetimeLocal(value.dealEndsAt)
        : value.dealEndsAt || "",
    [value.dealEndsAt]
  );

  const startsAtUtc = React.useMemo(
    () => fromIstDatetimeLocal(startsAtLocal),
    [startsAtLocal]
  );
  const endsAtUtc = React.useMemo(
    () => fromIstDatetimeLocal(endsAtLocal),
    [endsAtLocal]
  );

  const inlineErrors = React.useMemo(() => {
    return validatePricingOfferInput({
      priceMode: value.priceMode,
      price: value.price ? Number(value.price) : null,
      originalPrice: value.originalPrice ? Number(value.originalPrice) : null,
      priceQualifier: value.priceQualifier,
      dealType: value.dealType,
      dealLabel: value.dealLabel,
      dealStartsAt: startsAtUtc,
      dealEndsAt: endsAtUtc,
    });
  }, [value, startsAtUtc, endsAtUtc]);

  const getFieldError = (field: string): string | null => {
    const srv = serverErrors[field];
    if (Array.isArray(srv) && srv.length > 0) return srv[0];
    if (typeof srv === "string" && srv) return srv;
    return inlineErrors[field] || null;
  };

  const fieldClass =
    "w-full h-10 bg-white border border-[#D9E2E4] text-[#102124] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#155761] focus:ring-1 focus:ring-[#155761] placeholder:text-[#526267]/60 shadow-xs";
  const labelClass =
    "block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5";
  const errorClass = "text-rose-600 text-xs mt-1 font-medium";

  return (
    <div className="space-y-5" data-testid="pricing-offers-fields">
      {/* Row 1: Price Mode & Price Qualifier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Price Mode *</label>
          <select
            value={value.priceMode}
            onChange={(e) => {
              const nextMode = e.target.value as PricingOffersFormState["priceMode"];
              onChange({
                priceMode: nextMode,
                ...(nextMode !== "FIXED"
                  ? {
                      originalPrice: "",
                      dealType: "NONE",
                      dealLabel: "",
                      dealStartsAt: "",
                      dealEndsAt: "",
                    }
                  : {}),
                ...(nextMode === "STARTING_FROM"
                  ? { priceQualifier: "STARTING_FROM" }
                  : {}),
              });
            }}
            className={fieldClass}
          >
            <option value="FIXED">Fixed Price (Supports Offers & Deals)</option>
            <option value="STARTING_FROM">Starting From</option>
            <option value="CONTACT">Contact for Price</option>
            <option value="FREE">Free / Open Source</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Price Qualifier</label>
          <select
            value={
              value.priceMode === "STARTING_FROM"
                ? "STARTING_FROM"
                : value.priceQualifier
            }
            disabled={value.priceMode === "FREE" || value.priceMode === "STARTING_FROM"}
            onChange={(e) =>
              onChange({ priceQualifier: e.target.value as PriceQualifierValue })
            }
            className={`${fieldClass} disabled:opacity-60`}
          >
            <option value="NONE">None (Exact Price)</option>
            <option value="STARTING_FROM">Starting from ₹X</option>
            <option value="NEGOTIABLE">Price negotiable</option>
          </select>
          <p className="text-[11px] text-[#526267] mt-1">
            Displays &ldquo;Starting from ₹X&rdquo; or &ldquo;Price negotiable&rdquo; next to the price.
          </p>
        </div>
      </div>

      {/* Row 2: Selling Price & Regular Price */}
      {isPaid && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              {isFixed ? "Current Selling Price (INR ₹) *" : "Starting Price (INR ₹) *"}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={value.price}
              onChange={(e) => onChange({ price: e.target.value })}
              placeholder="e.g. 4999"
              className={fieldClass}
              required
            />
            <p className="text-[11px] text-[#526267] mt-1">
              The effective price customers pay right now (or during an active offer).
            </p>
            {getFieldError("price") && (
              <p className={errorClass}>{getFieldError("price")}</p>
            )}
          </div>

          {isFixed && (
            <div>
              <label className={labelClass}>
                Regular Price Before Discount (INR ₹)
                {value.dealType !== "NONE" ? " *" : " (Optional)"}
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={value.originalPrice}
                onChange={(e) => onChange({ originalPrice: e.target.value })}
                placeholder="e.g. 7999"
                className={fieldClass}
              />
              <p className="text-[11px] text-[#526267] mt-1">
                Must be strictly greater than the selling price. Automatically becomes the active price before an offer starts or after it ends.
              </p>
              {getFieldError("originalPrice") && (
                <p className={errorClass}>{getFieldError("originalPrice")}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Row 3: Promotional Offer / Deal Configuration (Only for FIXED mode) */}
      {isFixed && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFA] border border-[#D9E2E4] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#155761]" />
              <h3 className="text-xs font-bold text-[#102124] uppercase tracking-wider">
                Promotional Offer &amp; Deal Schedule
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-[#526267] bg-white px-2.5 py-0.5 rounded-full border border-[#D9E2E4]">
              Timezone: IST (UTC+05:30)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Offer Type</label>
              <select
                value={value.dealType}
                onChange={(e) => {
                  const nextDeal = e.target.value as DealTypeValue;
                  onChange({
                    dealType: nextDeal,
                    ...(nextDeal !== "CUSTOM" ? { dealLabel: "" } : {}),
                  });
                }}
                className={fieldClass}
              >
                {DEAL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {getFieldError("dealType") && (
                <p className={errorClass}>{getFieldError("dealType")}</p>
              )}
            </div>

            {value.dealType === "CUSTOM" && (
              <div>
                <label className={labelClass}>
                  Custom Offer Badge Label * (max 24 chars)
                </label>
                <input
                  type="text"
                  maxLength={24}
                  value={value.dealLabel}
                  onChange={(e) => onChange({ dealLabel: e.target.value.slice(0, 24) })}
                  placeholder="e.g. Student Special"
                  className={fieldClass}
                />
                <p className="text-[11px] text-[#526267] mt-1">
                  {value.dealLabel.length}/24 characters
                </p>
                {getFieldError("dealLabel") && (
                  <p className={errorClass}>{getFieldError("dealLabel")}</p>
                )}
              </div>
            )}
          </div>

          {(value.dealType !== "NONE" || Boolean(value.originalPrice)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Offer Starts At (IST, Optional)
                </label>
                <input
                  type="datetime-local"
                  value={startsAtLocal}
                  onChange={(e) => onChange({ dealStartsAt: e.target.value })}
                  className={fieldClass}
                />
                <p className="text-[11px] text-[#526267] mt-1">
                  Before this time, the regular price is shown publicly.
                </p>
                {getFieldError("dealStartsAt") && (
                  <p className={errorClass}>{getFieldError("dealStartsAt")}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Offer Ends At (IST){requiresEndDate ? " *" : " (Optional)"}
                </label>
                <input
                  type="datetime-local"
                  value={endsAtLocal}
                  onChange={(e) => onChange({ dealEndsAt: e.target.value })}
                  className={fieldClass}
                  required={requiresEndDate}
                />
                <p className="text-[11px] text-[#526267] mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#155761]" />
                  <span>
                    {requiresEndDate
                      ? "Required for time-limited deals. Automatically reverts to regular price when passed."
                      : "Optional. A countdown timer is shown only when an end date is set."}
                  </span>
                </p>
                {getFieldError("dealEndsAt") && (
                  <p className={errorClass}>{getFieldError("dealEndsAt")}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Preview of PriceBlock */}
      <div className="p-4 rounded-2xl bg-white border border-[#D9E2E4] space-y-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#155761]">
          <Sparkles className="w-3.5 h-3.5 text-[#2F7D78]" />
          <span>Live Price Block Preview</span>
        </div>
        <PriceBlock
          priceMode={value.priceMode}
          price={value.price ? Number(value.price) : null}
          originalPrice={value.originalPrice ? Number(value.originalPrice) : null}
          priceQualifier={value.priceQualifier}
          dealType={value.dealType}
          dealLabel={value.dealLabel}
          dealStartsAt={startsAtUtc}
          dealEndsAt={endsAtUtc}
          variant="compact"
        />
      </div>
    </div>
  );
}
