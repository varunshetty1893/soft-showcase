// types/auth.ts
// Shared TypeScript types for authentication and sessions.

import type { User } from "@prisma/client";
import type { Session } from "next-auth";

// Extend NextAuth session type to include isAdmin and id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin: boolean;
    };
  }

  interface User {
    isAdmin?: boolean;
  }
}

// Auth user type (safe subset — no sessions/accounts)
export type AuthUser = Pick<
  User,
  "id" | "name" | "email" | "image" | "isAdmin"
>;
