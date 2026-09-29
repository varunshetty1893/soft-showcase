// lib/utils/crypto.ts
// Cryptographically secure token, OTP, and identifier generation utilities.

import crypto from "crypto";

/**
 * Generate a cryptographically secure 6-digit numeric OTP code.
 * Replaces insecure Math.random() for authentication and verification codes.
 */
export function generateSecureOtp(): string {
  // randomInt generates an integer in [min, max) using a cryptographically secure PRNG
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash a sensitive verification or password reset code using SHA-256.
 * Protects stored codes in database against direct leakage.
 */
export function hashSecretToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Safely compare a user-supplied code against stored plain or hashed token.
 * Supports legacy plain token during transition.
 */
export function verifySecretToken(inputCode: string, storedToken: string): boolean {
  const trimmed = inputCode.trim();
  const hashedInput = hashSecretToken(trimmed);

  // Check against SHA-256 hash first
  if (hashedInput === storedToken) {
    return true;
  }

  // Fallback check against plaintext for legacy tokens
  if (trimmed === storedToken) {
    return true;
  }

  return false;
}

/**
 * Generate a cryptographically secure, collision-resistant transaction number.
 * Format: TXN-YYYYMMDD-XXXXXXXX (e.g. TXN-20260929-A7F29C3B)
 */
export function generateSecureTransactionNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `TXN-${dateStr}-${randomHex}`;
}
