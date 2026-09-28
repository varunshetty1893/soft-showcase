// lib/utils/format.ts
// Date and number formatting helpers.

/**
 * Formats a date into a human-readable string.
 * Example: 2024-01-15T10:30:00Z → "15 Jan 2024"
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats a date with time.
 * Example: "15 Jan 2024, 10:30 AM"
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a currency amount into a readable string (defaults to INR ₹).
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency = "INR"
): string {
  const formatted = formatPrice(value, currency);
  return formatted || "₹0";
}

/**
 * Formats a price value with the Indian Rupee (₹) currency symbol and Indian grouping.
 * Returns null if value is null/undefined.
 * Example: 24999 -> "₹24,999"
 */
export function formatPrice(
  value: number | string | null | undefined,
  currency = "INR"
): string | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return null;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Calculates a realistic Amazon/Flipkart style original M.R.P. for a given selling price.
 * Provides standard 30% to 55% discount psychology ending in 999 or 499.
 */
export function calculateMrp(price: number | string | null | undefined): number | null {
  if (price === null || price === undefined) return null;
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num) || num <= 0) return null;

  // Scale factor between 1.5x and 1.8x (approx 33% to 45% discount)
  const multiplier = num > 50000 ? 1.5 : num > 10000 ? 1.65 : 1.8;
  const rawMrp = num * multiplier;

  if (rawMrp > 10000) {
    return Math.ceil(rawMrp / 1000) * 1000 - 1; // e.g. 49,999, 99,999
  }
  if (rawMrp > 1000) {
    return Math.ceil(rawMrp / 500) * 500 - 1; // e.g. 4,999, 7,499
  }
  return Math.ceil(rawMrp / 100) * 100 - 1; // e.g. 999, 1,499
}

/**
 * Calculates the discount percentage between price and MRP.
 * Example: price=24999, mrp=49999 -> 50
 */
export function calculateDiscountPercent(
  price: number | string | null | undefined,
  mrp: number | string | null | undefined
): number {
  if (!price || !mrp) return 0;
  const p = typeof price === "string" ? parseFloat(price) : price;
  const m = typeof mrp === "string" ? parseFloat(mrp) : mrp;
  if (isNaN(p) || isNaN(m) || m <= p || p <= 0) return 0;
  return Math.round(((m - p) / m) * 100);
}

/**
 * Truncates text to a maximum length, appending "..." if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

