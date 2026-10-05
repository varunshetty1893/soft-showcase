// Shared provider checks used before a solution is made public.
// Approval, activation, consent, and removal are separate business concerns.

export type PublicationProvider = {
  isActive: boolean;
  applicationStatus: string | null;
  providerConsentConfirmed: boolean;
  removedAt?: Date | null;
};

export function canPublishForProvider(provider: PublicationProvider | null | undefined) {
  return Boolean(
    provider &&
      provider.isActive &&
      provider.applicationStatus === "approved" &&
      provider.providerConsentConfirmed &&
      !provider.removedAt
  );
}

export const providerPublicationError =
  "A solution can be published only for an active, approved provider with confirmed consent.";
