// types/provider.ts
// Shared TypeScript types for provider-related data.

import type { ProjectProvider } from "@prisma/client";

// Provider with safe public-facing fields (no private data)
export type ProviderPublic = Pick<
  ProjectProvider,
  | "id"
  | "displayName"
  | "bio"
  | "avatarUrl"
  | "showEmail"
  | "showWhatsapp"
  | "isActive"
> & {
  // Contact details are only included when the provider has opted in
  email: string | null;
  whatsappNumber: string | null;
};

// Full provider record for admin views
export type ProviderAdmin = ProjectProvider;

// Form data for creating/editing a provider
export type ProviderFormData = {
  displayName: string;
  email: string;
  whatsappNumber: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  showEmail: boolean;
  showWhatsapp: boolean;
  providerConsentConfirmed: boolean;
};
