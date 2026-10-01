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
 * Safely compare a user-supplied code against stored hashed token in constant time.
 * Uses crypto.timingSafeEqual on equal-length SHA-256 buffers to prevent timing side-channels.
 * Plaintext comparison has been removed for strict security.
 */
export function verifySecretToken(inputCode: string, storedToken: string): boolean {
  if (!inputCode || !storedToken) {
    return false;
  }

  const trimmed = inputCode.trim();
  const inputHashBuffer = crypto.createHash("sha256").update(trimmed).digest();

  // Stored token must be a 64-character hex string representing a SHA-256 hash
  const normalizedStored = storedToken.trim();
  if (normalizedStored.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(normalizedStored)) {
    return false;
  }

  const storedHashBuffer = Buffer.from(normalizedStored, "hex");

  if (inputHashBuffer.length !== storedHashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputHashBuffer, storedHashBuffer);
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
