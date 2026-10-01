// config/constants.ts
// Application-wide constants for Soft Showcase.

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Soft Showcase";
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "https://softshowcase.vercel.app"
).replace(/\/$/, "");

// Image upload limits
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const MAX_IMAGES_PER_PROJECT = 10;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Rate limiting (requests per window)
export const RATE_LIMIT_INQUIRY = 5; // per 15 minutes per IP
export const RATE_LIMIT_WHATSAPP = 10; // per 15 minutes per IP
export const RATE_LIMIT_CUSTOM_REQUEST = 3; // per 60 minutes per IP

// Pagination
export const DEFAULT_PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 20;

// Inquiry status labels (for UI display)
export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  DISCUSSING: "Discussing",
  QUOTED: "Quoted",
  CLOSED: "Closed",
};

// Custom request status labels
export const CUSTOM_REQUEST_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  REVIEWING: "Reviewing",
  CONTACTED: "Contacted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DECLINED: "Declined",
};

// Project status labels
export const PROJECT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const PRICE_MODE_LABELS: Record<string, string> = {
  CONTACT: "Contact for Price",
  FIXED: "Fixed Price",
  STARTING_FROM: "Starting From",
  FREE: "Free",
};

export const DEFAULT_CURRENCY = "INR";
