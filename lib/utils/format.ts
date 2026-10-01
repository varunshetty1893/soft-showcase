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
 * Calculates the discount percentage between selling price and verified original price.
 * Example: price=24999, originalPrice=49999 -> 50%
 * Returns 0 if originalPrice <= price or if values are invalid/missing.
 */
export function calculateDiscountPercent(
  price: number | string | null | undefined,
  originalPrice: number | string | null | undefined
): number {
  if (
    price === null ||
    price === undefined ||
    originalPrice === null ||
    originalPrice === undefined
  ) {
    return 0;
  }
  const p = typeof price === "string" ? parseFloat(price) : price;
  const orig =
    typeof originalPrice === "string" ? parseFloat(originalPrice) : originalPrice;
  if (isNaN(p) || isNaN(orig) || orig <= p || p <= 0) return 0;
  return Math.round(((orig - p) / orig) * 100);
}

/**
 * Truncates text to a maximum length, appending "..." if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

