// types/auth.ts
// Shared TypeScript types for authentication and sessions.

import type { User } from "@prisma/client";

// Extend NextAuth session type to include isAdmin, role, partnerStatus, partnerId, and id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin: boolean;
      role: "customer" | "solution_partner" | "admin";
      partnerStatus?: "pending" | "approved" | "rejected" | "suspended" | "deactivated" | null;
      partnerId?: string | null;
    };
  }

  interface User {
    isAdmin?: boolean;
    role?: "customer" | "solution_partner" | "admin";
    partnerStatus?: "pending" | "approved" | "rejected" | "suspended" | "deactivated" | null;
    partnerId?: string | null;
  }
}

// Auth user type (safe subset — no sessions/accounts)
export type AuthUser = Pick<
  User,
  "id" | "name" | "email" | "image" | "isAdmin" | "role"
>;

