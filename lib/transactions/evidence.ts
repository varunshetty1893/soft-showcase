// lib/transactions/evidence.ts
// Shared guard for payment evidence (screenshot) URLs: only platform-controlled
// storage is accepted, never base64 blobs or arbitrary external hosts.

export function isValidEvidenceUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  // Never store base64 images in the database
  if (trimmed.startsWith("data:")) return false;
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/api/partner/uploads")) return true;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") return false;
    let appHost = "";
    try {
      appHost = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : "";
    } catch {
      appHost = "";
    }
    const trustedHosts = ["res.cloudinary.com", "images.unsplash.com", appHost, "localhost"].filter(Boolean);
    return trustedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
