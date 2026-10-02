// lib/utils/pricing.ts
// Shared single source of truth for effective pricing, time-windowed deals/offers,
// price qualifiers, and validation (Phase 4).
// Used everywhere: project cards, project detail page, JSON-LD, shortlist/cart totals,
// partner and admin project lists, and unit tests.

export const DEAL_TYPES = [
  "NONE",
  "LIMITED_DEAL",
  "LAUNCH_OFFER",
  "FESTIVE_SALE",
  "EARLY_BIRD",
  "CLEARANCE",
  "CUSTOM",
] as const;

export type DealTypeValue = (typeof DEAL_TYPES)[number];

export const PRICE_QUALIFIERS = ["NONE", "STARTING_FROM", "NEGOTIABLE"] as const;

export type PriceQualifierValue = (typeof PRICE_QUALIFIERS)[number];

/**
 * Offer types that strictly require a future dealEndsAt timestamp at save time.
 * ("LIMITED_DEAL", "LAUNCH_OFFER", "FESTIVE_SALE", "EARLY_BIRD" require an end date in the future;
 * "CLEARANCE" and "CUSTOM" may omit it.)
 */
export const TIME_LIMITED_DEAL_TYPES = new Set<DealTypeValue>([
  "LIMITED_DEAL",
  "LAUNCH_OFFER",
  "FESTIVE_SALE",
  "EARLY_BIRD",
]);

export type OfferLifecycleStatus = "NONE" | "SCHEDULED" | "ACTIVE" | "ENDED";

export interface DealBadgeMeta {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const DEAL_BADGE_META: Record<Exclude<DealTypeValue, "NONE">, DealBadgeMeta> = {
  LIMITED_DEAL: {
    label: "Limited Deal",
    bgClass: "bg-rose-600",
    textClass: "text-white",
    borderClass: "border-rose-700",
  },
  LAUNCH_OFFER: {
    label: "Launch Offer",
    bgClass: "bg-[#155761]",
    textClass: "text-white",
    borderClass: "border-[#0F3F47]",
  },
  FESTIVE_SALE: {
    label: "Festive Sale",
    bgClass: "bg-amber-600",
    textClass: "text-white",
    borderClass: "border-amber-700",
  },
  EARLY_BIRD: {
    label: "Early Bird",
    bgClass: "bg-emerald-600",
    textClass: "text-white",
    borderClass: "border-emerald-700",
  },
  CLEARANCE: {
    label: "Clearance",
    bgClass: "bg-purple-600",
    textClass: "text-white",
    borderClass: "border-purple-700",
  },
  CUSTOM: {
    label: "Special Offer",
    bgClass: "bg-indigo-600",
    textClass: "text-white",
    borderClass: "border-indigo-700",
  },
};

export interface ProjectPricingInput {
  priceMode?: string | null;
  price?: number | string | { toNumber?: () => number } | null;
  originalPrice?: number | string | { toNumber?: () => number } | null;
  priceQualifier?: string | null;
  dealType?: string | null;
  dealLabel?: string | null;
  dealStartsAt?: Date | string | null;
  dealEndsAt?: Date | string | null;
}

export interface EffectivePricingResult {
  priceMode: "FIXED" | "STARTING_FROM" | "CONTACT" | "FREE";
  /** The effective price to charge / display right now */
  effectivePrice: number | null;
  /** Alias for effectivePrice */
  currentPrice: number | null;
  /** The regular reference price (only shown struck-through when isDiscounted is true) */
  regularPrice: number | null;
  /** Alias for regularPrice when discounted, null otherwise */
  strikeThroughPrice: number | null;
  /** True when a valid discount/reference price is currently active */
  isDiscounted: boolean;
  /** True when a named promotional deal (dealType !== NONE) is currently active */
  isOfferActive: boolean;
  /** Current lifecycle state of the promotional deal */
  offerStatus: OfferLifecycleStatus;
  dealType: DealTypeValue;
  /** Badge text for the active offer (e.g. "Limited Deal", or custom label) */
  badgeLabel: string | null;
  /** Savings amount in INR when discounted */
  savingsAmount: number | null;
  /** Rounded percentage saved (1..99) when discounted */
  discountPercent: number | null;
  /** Alias for discountPercent */
  savingsPercent: number | null;
  /** Price qualifier enum */
  priceQualifier: PriceQualifierValue;
  /** Human-readable qualifier text ("Starting from" | "Price negotiable" | null) */
  qualifierText: string | null;
  /** Formatted effective price (e.g. "₹4,999", "Starting from ₹4,999", "Free", "Contact for Price") */
  formattedPrice: string;
  /** Formatted regular price when discounted */
  formattedRegularPrice: string | null;
  /** Formatted savings amount (e.g. "₹3,000") */
  formattedSavings: string | null;
  /** Real end timestamp (ISO) ONLY when an active offer has a real dealEndsAt */
  dealEndsAtIso: string | null;
  /** Real start timestamp (ISO) if configured */
  dealStartsAtIso: string | null;
  /** Remaining milliseconds until dealEndsAt (only when active and dealEndsAt is set) */
  remainingMs: number | null;
  /** Formatted countdown string (e.g. "Ends in 2d 4h") ONLY when dealEndsAt exists */
  countdownText: string | null;
}

function toFiniteNumber(
  value: number | string | { toNumber?: () => number } | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "object" && typeof value.toNumber === "function") {
    const n = value.toNumber();
    return Number.isFinite(n) ? n : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toValidDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatInrAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Format remaining milliseconds into a concise human countdown (e.g. "Ends in 2d 4h", "Ends in 3h 15m", "Ends in 12m").
 * Never invents or loops timers. Returns null if remainingMs <= 0.
 */
export function formatOfferRemaining(remainingMs: number | null | undefined): string | null {
  if (remainingMs === null || remainingMs === undefined || remainingMs <= 0) {
    return null;
  }
  const totalMinutes = Math.max(1, Math.floor(remainingMs / (1000 * 60)));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `Ends in ${days}d ${hours}h` : `Ends in ${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `Ends in ${hours}h ${minutes}m` : `Ends in ${hours}h`;
  }
  return `Ends in ${minutes}m`;
}

/**
 * Convert a UTC Date or ISO string into an IST ("Asia/Kolkata", UTC+05:30) `YYYY-MM-DDTHH:mm` string
 * suitable for `<input type="datetime-local" />`.
 */
export function toIstDatetimeLocal(val: Date | string | null | undefined): string {
  const d = toValidDate(val);
  if (!d) return "";
  // IST is UTC + 5h 30m (330 minutes)
  const istMs = d.getTime() + 330 * 60 * 1000;
  const istDate = new Date(istMs);
  const yyyy = istDate.getUTCFullYear();
  const mm = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(istDate.getUTCDate()).padStart(2, "0");
  const hh = String(istDate.getUTCHours()).padStart(2, "0");
  const min = String(istDate.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

/**
 * Convert an IST `YYYY-MM-DDTHH:mm` datetime-local input string (or ISO string) into a UTC ISO string.
 */
export function fromIstDatetimeLocal(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();
  // If already contains Z or explicit offset, parse directly
  if (trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  // Treat YYYY-MM-DDTHH:mm as IST (+05:30)
  const withOffset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)
    ? `${trimmed}:00+05:30`
    : `${trimmed}+05:30`;
  const d = new Date(withOffset);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Single shared pricing resolver used everywhere (Phase 4):
 * - Cards, detail page, JSON-LD, shortlist/cart totals, partner/admin lists.
 * - Before dealStartsAt -> returns regular price (originalPrice), offer hidden.
 * - During the offer -> returns selling price with badge, struck-through regular price, saving amount and %.
 * - After dealEndsAt -> returns regular price (originalPrice) automatically, offer hidden.
 * - Existing projects with originalPrice > price and dealType = NONE continue working as permanent reference price.
 */
export function getEffectivePricing(
  project: ProjectPricingInput,
  now: Date | number = new Date()
): EffectivePricingResult {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const rawMode = (project.priceMode || "CONTACT").toUpperCase();
  const priceMode: "FIXED" | "STARTING_FROM" | "CONTACT" | "FREE" =
    rawMode === "FIXED" ||
    rawMode === "STARTING_FROM" ||
    rawMode === "FREE" ||
    rawMode === "CONTACT"
      ? (rawMode as "FIXED" | "STARTING_FROM" | "CONTACT" | "FREE")
      : "CONTACT";

  const rawPrice = toFiniteNumber(project.price);
  const rawOriginalPrice = toFiniteNumber(project.originalPrice);

  const rawDealType: DealTypeValue = DEAL_TYPES.includes(
    (project.dealType || "NONE") as DealTypeValue
  )
    ? ((project.dealType || "NONE") as DealTypeValue)
    : "NONE";

  const priceQualifier: PriceQualifierValue = PRICE_QUALIFIERS.includes(
    (project.priceQualifier || "NONE") as PriceQualifierValue
  )
    ? ((project.priceQualifier || "NONE") as PriceQualifierValue)
    : "NONE";

  const startsAt = toValidDate(project.dealStartsAt);
  const endsAt = toValidDate(project.dealEndsAt);

  if (priceMode === "FREE") {
    return {
      priceMode,
      effectivePrice: 0,
      currentPrice: 0,
      regularPrice: null,
      strikeThroughPrice: null,
      isDiscounted: false,
      isOfferActive: false,
      offerStatus: "NONE",
      dealType: "NONE",
      badgeLabel: null,
      savingsAmount: null,
      discountPercent: null,
      savingsPercent: null,
      priceQualifier: "NONE",
      qualifierText: null,
      formattedPrice: "Free",
      formattedRegularPrice: null,
      formattedSavings: null,
      dealEndsAtIso: null,
      dealStartsAtIso: null,
      remainingMs: null,
      countdownText: null,
    };
  }

  if (priceMode === "CONTACT" || rawPrice === null || rawPrice <= 0) {
    return {
      priceMode: priceMode === "STARTING_FROM" ? "STARTING_FROM" : "CONTACT",
      effectivePrice: null,
      currentPrice: null,
      regularPrice: null,
      strikeThroughPrice: null,
      isDiscounted: false,
      isOfferActive: false,
      offerStatus: "NONE",
      dealType: "NONE",
      badgeLabel: null,
      savingsAmount: null,
      discountPercent: null,
      savingsPercent: null,
      priceQualifier,
      qualifierText:
        priceQualifier === "NEGOTIABLE" ? "Price negotiable" : null,
      formattedPrice: "Contact for Price",
      formattedRegularPrice: null,
      formattedSavings: null,
      dealEndsAtIso: null,
      dealStartsAtIso: null,
      remainingMs: null,
      countdownText: null,
    };
  }

  // Legacy STARTING_FROM priceMode maps cleanly to qualifier STARTING_FROM
  if (priceMode === "STARTING_FROM") {
    const formattedAmount = formatInrAmount(rawPrice);
    return {
      priceMode,
      effectivePrice: rawPrice,
      currentPrice: rawPrice,
      regularPrice: null,
      strikeThroughPrice: null,
      isDiscounted: false,
      isOfferActive: false,
      offerStatus: "NONE",
      dealType: "NONE",
      badgeLabel: null,
      savingsAmount: null,
      discountPercent: null,
      savingsPercent: null,
      priceQualifier: "STARTING_FROM",
      qualifierText: "Starting from",
      formattedPrice: `Starting from ${formattedAmount}`,
      formattedRegularPrice: null,
      formattedSavings: null,
      dealEndsAtIso: null,
      dealStartsAtIso: null,
      remainingMs: null,
      countdownText: null,
    };
  }

  // FIXED price mode: evaluate reference price and time-windowed deals
  const hasValidReferencePrice =
    rawOriginalPrice !== null && rawOriginalPrice > rawPrice;

  const qualifierText =
    priceQualifier === "STARTING_FROM"
      ? "Starting from"
      : priceQualifier === "NEGOTIABLE"
      ? "Price negotiable"
      : null;

  // Determine offer lifecycle status
  let offerStatus: OfferLifecycleStatus = "NONE";
  if (hasValidReferencePrice && (rawDealType !== "NONE" || startsAt || endsAt)) {
    if (startsAt && nowMs < startsAt.getTime()) {
      offerStatus = "SCHEDULED";
    } else if (endsAt && nowMs >= endsAt.getTime()) {
      offerStatus = "ENDED";
    } else {
      offerStatus = "ACTIVE";
    }
  }

  // Before dealStartsAt or After dealEndsAt -> automatic switch to regular price (originalPrice), offer hidden!
  if (offerStatus === "SCHEDULED" || offerStatus === "ENDED") {
    const regularAsEffective = rawOriginalPrice!;
    const baseFormatted = formatInrAmount(regularAsEffective);
    const formattedPrice =
      priceQualifier === "STARTING_FROM"
        ? `Starting from ${baseFormatted}`
        : baseFormatted;

    return {
      priceMode,
      effectivePrice: regularAsEffective,
      currentPrice: regularAsEffective,
      regularPrice: null,
      strikeThroughPrice: null,
      isDiscounted: false,
      isOfferActive: false,
      offerStatus,
      dealType: rawDealType,
      badgeLabel: null,
      savingsAmount: null,
      discountPercent: null,
      savingsPercent: null,
      priceQualifier,
      qualifierText,
      formattedPrice,
      formattedRegularPrice: null,
      formattedSavings: null,
      dealEndsAtIso: endsAt ? endsAt.toISOString() : null,
      dealStartsAtIso: startsAt ? startsAt.toISOString() : null,
      remainingMs: null,
      countdownText: null,
    };
  }

  // Either an active named offer (offerStatus === "ACTIVE") or a permanent reference price (dealType === "NONE" && hasValidReferencePrice)
  if (hasValidReferencePrice) {
    const savingsAmount = rawOriginalPrice! - rawPrice;
    const rawPct = Math.round((savingsAmount / rawOriginalPrice!) * 100);
    const discountPercent = Math.min(99, Math.max(1, rawPct));
    const isOfferActive = rawDealType !== "NONE";

    let badgeLabel: string | null = null;
    if (rawDealType === "CUSTOM") {
      badgeLabel = project.dealLabel?.trim() || "Special Offer";
    } else if (rawDealType !== "NONE") {
      badgeLabel = DEAL_BADGE_META[rawDealType].label;
    }

    const remainingMs =
      endsAt && endsAt.getTime() > nowMs ? endsAt.getTime() - nowMs : null;
    const countdownText =
      remainingMs !== null ? formatOfferRemaining(remainingMs) : null;

    const baseFormatted = formatInrAmount(rawPrice);
    const formattedPrice =
      priceQualifier === "STARTING_FROM"
        ? `Starting from ${baseFormatted}`
        : baseFormatted;

    return {
      priceMode,
      effectivePrice: rawPrice,
      currentPrice: rawPrice,
      regularPrice: rawOriginalPrice!,
      strikeThroughPrice: rawOriginalPrice!,
      isDiscounted: true,
      isOfferActive,
      offerStatus: isOfferActive || startsAt || endsAt ? "ACTIVE" : "NONE",
      dealType: rawDealType,
      badgeLabel,
      savingsAmount,
      discountPercent,
      savingsPercent: discountPercent,
      priceQualifier,
      qualifierText,
      formattedPrice,
      formattedRegularPrice: formatInrAmount(rawOriginalPrice!),
      formattedSavings: formatInrAmount(savingsAmount),
      dealEndsAtIso: endsAt ? endsAt.toISOString() : null,
      dealStartsAtIso: startsAt ? startsAt.toISOString() : null,
      remainingMs,
      countdownText,
    };
  }

  // Standard fixed price without discount
  const baseFormatted = formatInrAmount(rawPrice);
  const formattedPrice =
    priceQualifier === "STARTING_FROM"
      ? `Starting from ${baseFormatted}`
      : baseFormatted;

  return {
    priceMode,
    effectivePrice: rawPrice,
    currentPrice: rawPrice,
    regularPrice: null,
    strikeThroughPrice: null,
    isDiscounted: false,
    isOfferActive: false,
    offerStatus: "NONE",
    dealType: "NONE",
    badgeLabel: null,
    savingsAmount: null,
    discountPercent: null,
    savingsPercent: null,
    priceQualifier,
    qualifierText,
    formattedPrice,
    formattedRegularPrice: null,
    formattedSavings: null,
    dealEndsAtIso: null,
    dealStartsAtIso: null,
    remainingMs: null,
    countdownText: null,
  };
}

/**
 * Validate pricing & offer fields (shared between Zod server schema and form validation).
 * Returns field errors keyed by field name.
 */
export function validatePricingOfferInput(
  input: ProjectPricingInput,
  now: Date = new Date()
): Record<string, string> {
  const errors: Record<string, string> = {};
  const mode = (input.priceMode || "CONTACT").toUpperCase();
  const price = toFiniteNumber(input.price);
  const originalPrice = toFiniteNumber(input.originalPrice);
  const dealType = ((input.dealType || "NONE") as string).toUpperCase() as DealTypeValue;
  const dealLabel = (input.dealLabel || "").trim();
  const startsAt = toValidDate(input.dealStartsAt);
  const endsAt = toValidDate(input.dealEndsAt);

  if (mode !== "FIXED") {
    if (dealType && dealType !== "NONE") {
      errors.dealType = "Promotional offers are only available when Price Mode is Fixed.";
    }
    return errors;
  }

  if (price === null || price <= 0) {
    errors.price = "Selling price is required and must be greater than 0.";
    return errors;
  }

  if (originalPrice !== null && originalPrice <= price) {
    errors.originalPrice = `Regular price (₹${originalPrice}) must be greater than the selling price (₹${price}).`;
  }

  if (dealType !== "NONE") {
    if (originalPrice === null || originalPrice <= price) {
      errors.originalPrice =
        "A regular price greater than the selling price is required when an offer is active.";
    }

    if (dealType === "CUSTOM") {
      if (!dealLabel) {
        errors.dealLabel = "Custom offer label is required (max 24 characters).";
      } else if (dealLabel.length > 24) {
        errors.dealLabel = "Custom offer label cannot exceed 24 characters.";
      }
    }

    if (TIME_LIMITED_DEAL_TYPES.has(dealType)) {
      if (!endsAt) {
        errors.dealEndsAt = "An end date and time in the future is required for this limited offer.";
      } else if (endsAt.getTime() <= now.getTime()) {
        errors.dealEndsAt = "Offer end date and time must be in the future.";
      }
    } else if (endsAt && endsAt.getTime() <= now.getTime()) {
      errors.dealEndsAt = "Offer end date and time must be in the future.";
    }

    if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) {
      errors.dealEndsAt = "Offer end time must be after the start time.";
    }
  }

  return errors;
}

// ── Backward-compatible helpers used by tests/unit/pricing.test.ts ────────────

export function getDiscountPercentage(
  price?: number | string | null,
  originalPrice?: number | string | null
): number | null {
  const p = toFiniteNumber(price);
  const orig = toFiniteNumber(originalPrice);
  if (p === null || orig === null || p <= 0 || orig <= p) return null;
  const pct = Math.round(((orig - p) / orig) * 100);
  return Math.min(99, Math.max(1, pct));
}

export function getSavingsAmount(
  price?: number | string | null,
  originalPrice?: number | string | null
): number | null {
  const p = toFiniteNumber(price);
  const orig = toFiniteNumber(originalPrice);
  if (p === null || orig === null || p <= 0 || orig <= p) return null;
  return orig - p;
}

export function resolvePricing(
  priceMode: string,
  price?: number | string | null,
  originalPrice?: number | string | null
) {
  const res = getEffectivePricing({ priceMode, price, originalPrice });
  return {
    isDiscounted: res.isDiscounted,
    currentPrice: res.effectivePrice,
    originalPrice: res.regularPrice,
    discountPercent: res.discountPercent,
    savingsAmount: res.savingsAmount,
    formattedCurrentPrice: res.formattedPrice,
    formattedOriginalPrice: res.formattedRegularPrice,
    formattedSavings: res.formattedSavings,
  };
}
