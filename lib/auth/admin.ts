// lib/auth/admin.ts
// Security-hardened admin authorization utilities.
// Enforces that request paths trust ONLY the DB-backed flag carried in token/session,
// with zero email comparison in request authorization paths.
// Pure and Edge-safe (zero imports of database or Node.js modules).

export interface AdminSubject {
  isAdmin?: boolean | null;
  role?: string | null;
}

/**
 * Trust ONLY the DB-backed flag carried in the session or JWT token.
 * Never performs string email comparisons for route access.
 */
export function isAdminUser(subject?: AdminSubject | null): boolean {
  if (!subject) return false;
  return Boolean(subject.isAdmin === true || subject.role === "admin");
}

/**
 * Parses configured bootstrap admin emails from environment.
 * Accepts comma-separated emails from ADMIN_EMAILS or single ADMIN_EMAIL.
 */
export function getBootstrapAdminEmails(): string[] {
  const emails = [
    ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",") : []),
    ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []),
  ];

  return emails
    .map((e) => e.trim().toLowerCase())
    .filter((e) => Boolean(e) && e.includes("@"));
}

/**
 * Checks if an email is listed in the configured bootstrap admin emails.
 */
export function isConfiguredAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const configured = getBootstrapAdminEmails();
  return configured.includes(normalized);
}
