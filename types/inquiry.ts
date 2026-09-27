// types/inquiry.ts
// Shared TypeScript types for inquiries and custom project requests.

import type {
  Inquiry,
  CustomProjectRequest,
  InquiryStatus,
  NotificationStatus,
  ContactMethod,
  CustomRequestStatus,
} from "@prisma/client";

// Inquiry with project and provider details (for admin views)
export type InquiryWithRelations = Inquiry & {
  project: { id: string; title: string; slug: string };
  provider: { id: string; displayName: string; email: string };
  customer: { id: string; name: string | null; email: string } | null;
};

// Form data for submitting a new inquiry
export type InquiryFormData = {
  name: string;
  email: string;
  whatsapp?: string;
  message: string;
  contactMethod: ContactMethod;
};

// Form data for submitting a custom project request
export type CustomRequestFormData = {
  name: string;
  email: string;
  whatsapp?: string;
  projectTitle: string;
  category?: string;
  technologyPreferences: string[];
  description: string;
  requiredFeatures: string;
  deadline?: string;
  budget?: string;
  additionalRequirements?: string;
};

export type {
  Inquiry,
  CustomProjectRequest,
  InquiryStatus,
  NotificationStatus,
  ContactMethod,
  CustomRequestStatus,
};
