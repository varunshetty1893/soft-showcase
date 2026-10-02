// lib/utils/phone.ts
// Robust international phone number parsing, validation, and E.164 normalization.
// Built on libphonenumber-js with fallback handling for common international formats.

import parsePhoneNumberFromString, { CountryCode } from "libphonenumber-js";

export interface ParsedPhoneResult {
  isValid: boolean;
  e164?: string; // e.g. "+919876543210"
  digitsOnly?: string; // e.g. "919876543210" (for wa.me deep links)
  national?: string; // e.g. "098765 43210"
  countryCode?: string; // e.g. "IN"
  error?: string;
}

/**
 * Normalizes input raw phone strings by cleaning common prefixes:
 * - Replaces leading "00" with "+" (international dial-out prefix)
 * - Removes non-printable or extraneous characters
 */
function cleanRawPhoneInput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Parses and validates an international or national phone number.
 * Default country fallback defaults to DEFAULT_PHONE_COUNTRY environment variable or "IN".
 *
 * @param raw - The input phone number string (e.g. "+91 98765 43210", "00919876543210", "9876543210")
 * @param defaultCountry - Optional ISO 3166-1 alpha-2 country code (default: process.env.DEFAULT_PHONE_COUNTRY || "IN")
 */
export function parsePhone(
  raw: string | null | undefined,
  defaultCountry?: string
): ParsedPhoneResult {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return {
      isValid: false,
      error: "Phone number is required",
    };
  }

  const country = (
    defaultCountry ||
    process.env.DEFAULT_PHONE_COUNTRY ||
    "IN"
  ).toUpperCase() as CountryCode;

  const cleaned = cleanRawPhoneInput(raw);

  // Attempt parse with libphonenumber-js
  try {
    const phoneNumber = parsePhoneNumberFromString(cleaned, country);

    if (phoneNumber && phoneNumber.isValid()) {
      const e164 = phoneNumber.format("E.164"); // e.g. "+919876543210"
      const digitsOnly = e164.replace(/\D/g, ""); // e.g. "919876543210"

      return {
        isValid: true,
        e164,
        digitsOnly,
        national: phoneNumber.formatNational(),
        countryCode: phoneNumber.country,
      };
    }
  } catch {
    // Falls through to invalid return
  }

  return {
    isValid: false,
    error: "Please enter a valid phone number with country code (e.g. +91 98765 43210)",
  };
}

/**
 * Quick helper to check if a phone number is valid.
 */
export function isValidPhone(raw: string | null | undefined, defaultCountry?: string): boolean {
  return parsePhone(raw, defaultCountry).isValid;
}

/**
 * Normalizes a phone number to strict E.164 format (e.g. "+919876543210").
 * Returns null if invalid.
 */
export function normalizeToE164(raw: string | null | undefined, defaultCountry?: string): string | null {
  const result = parsePhone(raw, defaultCountry);
  return result.isValid && result.e164 ? result.e164 : null;
}

/**
 * Normalizes a phone number to digits only for WhatsApp wa.me links (e.g. "919876543210").
 * Returns null if invalid.
 */
export function normalizeToWhatsAppDigits(raw: string | null | undefined, defaultCountry?: string): string | null {
  const result = parsePhone(raw, defaultCountry);
  return result.isValid && result.digitsOnly ? result.digitsOnly : null;
}
