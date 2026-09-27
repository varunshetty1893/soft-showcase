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
 * Formats a price value with currency symbol.
 * Returns null if value is null/undefined.
 */
export function formatPrice(
  value: number | string | null | undefined,
  currency = "INR"
): string | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Truncates text to a maximum length, appending "..." if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
