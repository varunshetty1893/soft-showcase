// lib/auth/auth.ts
// NextAuth v5 (Auth.js) configuration for Soft Showcase.
// - Providers: Google OAuth + Email/Password (Credentials)
// - Session strategy: JWT (supports both Credentials and OAuth)
// - Database: PrismaAdapter for OAuth accounts, users, and tokens
// - isAdmin is read from the users table and propagated to the session.

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { LoginSchema } from "@/lib/validation/auth.schema";

const authSecret =
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build"
    ? undefined
    : "development-and-build-secret-soft-showcase-fallback-key-32-chars");

if (!authSecret) {
  throw new Error("AUTH_SECRET environment variable is required and must be configured.");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: true,

  // ── Adapter ──────────────────────────────────────────────────────────────
  adapter: PrismaAdapter(db),

  // ── Providers ────────────────────────────────────────────────────────────
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) {
          console.warn("[Auth] Invalid login credentials format");
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.trim().toLowerCase();

        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.passwordHash) {
          console.warn(`[Auth] User not found or has no password set: ${normalizedEmail}`);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          console.warn(`[Auth] Password mismatch for user: ${normalizedEmail}`);
          return null;
        }

        if (!user.emailVerified) {
          console.warn(`[Auth] User email not verified: ${normalizedEmail}`);
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        const userRole = (user as { role?: "admin" | "customer" | "solution_partner" }).role;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isAdmin: user.isAdmin,
          role: userRole || (user.isAdmin ? "admin" : "customer"),
        };
      },
    }),
  ],

  // ── Session (JWT strategy required for Credentials provider) ─────────────
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ── Pages ─────────────────────────────────────────────────────────────────
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // ── Callbacks ─────────────────────────────────────────────────────────────
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.role = (user as { role?: string }).role || (token.isAdmin ? "admin" : "customer");
        token.lastChecked = Date.now();
      }

      // Check against ADMIN_EMAIL env var or database
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      if (token.email && adminEmail && (token.email as string).toLowerCase() === adminEmail) {
        token.isAdmin = true;
        token.role = "admin";
      }

      // Keep user info, role and partner status up-to-date with 60-second caching to avoid DB lag on every click
      const now = Date.now();
      const lastChecked = (token.lastChecked as number) || 0;
      const shouldRefreshFromDb = Boolean(user) || (now - lastChecked > 60_000);

      if (token.id && shouldRefreshFromDb) {
        token.lastChecked = now;
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, isAdmin: true, email: true, role: true },
          });

          if (dbUser) {
            const isEnvAdmin = adminEmail && dbUser.email.toLowerCase() === adminEmail;
            token.isAdmin = Boolean(dbUser.isAdmin || isEnvAdmin);
            token.role = token.isAdmin ? "admin" : (dbUser.role || "customer");

            // Look up partner profile strictly by stable user relationship (userId)
            let partnerProfile = await db.projectProvider.findFirst({
              where: { userId: dbUser.id },
              select: { id: true, applicationStatus: true },
            }).catch(() => null);

            // One-time fallback: If legacy unlinked record exists for email, associate it
            if (!partnerProfile && dbUser.email) {
              const unlinked = await db.projectProvider.findFirst({
                where: { email: dbUser.email, userId: null },
                select: { id: true, applicationStatus: true },
              }).catch(() => null);
              if (unlinked) {
                await db.projectProvider.update({
                  where: { id: unlinked.id },
                  data: { userId: dbUser.id },
                }).catch(() => null);
                partnerProfile = unlinked;
              }
            }

            if (partnerProfile) {
              token.partnerId = partnerProfile.id;
              token.partnerStatus = partnerProfile.applicationStatus;
              if (token.role !== "admin") {
                token.role = "solution_partner";
              }
            } else {
              token.partnerId = null;
              token.partnerStatus = null;
            }
          }
        } catch (e) {
          console.warn("[Auth] Failed to refresh token from db:", e);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.isAdmin = (token.isAdmin as boolean) ?? false;
        session.user.role = (token.role as "customer" | "solution_partner" | "admin") || (token.isAdmin ? "admin" : "customer");
        session.user.partnerStatus = (token.partnerStatus as "pending" | "approved" | "rejected" | "suspended" | "deactivated" | null) ?? null;
        session.user.partnerId = (token.partnerId as string | null) ?? null;
      }
      return session;
    },
  },
});
