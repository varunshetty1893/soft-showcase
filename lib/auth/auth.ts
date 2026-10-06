// lib/auth/auth.ts
// NextAuth v5 (Auth.js) configuration for Soft Showcase.
// - Providers: Google OAuth + Email/Password (Credentials)
// - Session strategy: JWT (supports both Credentials and OAuth)
// - Database: PrismaAdapter for OAuth accounts, users, and tokens
// - isAdmin is read from the users table and propagated to the session.

import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { LoginSchema } from "@/lib/validation/auth.schema";
import { authLoginLimiter, getRequestIp } from "@/lib/utils/rate-limit";
import { getEnv } from "@/lib/config/env";
import { bootstrapAdminOnVerification } from "@/lib/auth/admin-bootstrap";
import { linkVerifiedUserRecords } from "@/lib/db/queries/customer";
import { getSafeCallbackUrl } from "@/lib/utils/safe-redirect";

export class LoginRateLimitError extends CredentialsSignin {
  code = "TOO_MANY_ATTEMPTS";
}

export class EmailNotVerifiedError extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED";
}

// Module-level cost-10 bcrypt dummy hash to equalize timing when user does not exist (N8)
const DUMMY_PASSWORD_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
  const envUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (envUrl) {
    process.env.AUTH_URL = envUrl;
    process.env.NEXTAUTH_URL = envUrl;
  }
}

const authSecret = getEnv().AUTH_SECRET;

export const authConfig: NextAuthConfig = {
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
      async authorize(credentials, request) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) {
          console.warn("[Auth] Invalid login credentials format");
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.trim().toLowerCase();

        // ── N8: Three-Layer Login Brute-Force Rate Limiting ────────────────────
        // - Per IP: 30 / 15 min (prevents shared-IP lockout)
        // - Per Email+IP: 5 / 15 min (locks only the attacker's IP for that victim email)
        // - Per Email (global): 25 / 15 min (distributed credential-stuffing ceiling)
        const ip = await getRequestIp(request as Request);
        const ipKey = `ip:${ip}`;
        const emailIpKey = `email_ip:${normalizedEmail}:${ip}`;
        const emailKey = `email:${normalizedEmail}`;

        const [ipCheck, emailIpCheck, emailCheck] = await Promise.all([
          authLoginLimiter.check(ipKey),
          authLoginLimiter.check(emailIpKey),
          authLoginLimiter.check(emailKey),
        ]);

        if (!ipCheck.success || !emailIpCheck.success || !emailCheck.success) {
          console.warn(`[Auth] Credentials login rate limit exceeded (IP: ${ip})`);
          throw new LoginRateLimitError();
        }

        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.passwordHash) {
          // Always execute bcrypt.compare against dummy hash to prevent timing enumeration (N8)
          await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
          console.warn("[Auth] Invalid login attempt (user not found or no password)");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          console.warn("[Auth] Invalid login attempt (password mismatch)");
          return null;
        }

        if (!user.emailVerified) {
          console.warn("[Auth] User email not verified");
          throw new EmailNotVerifiedError();
        }

        // N7: Reset ONLY email-scoped keys on successful authentication — NEVER reset ipKey!
        await Promise.all([
          authLoginLimiter.reset(emailIpKey),
          authLoginLimiter.reset(emailKey),
        ]);

        const userRole = (user as { role?: "admin" | "customer" | "solution_partner" }).role;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isAdmin: user.isAdmin,
          role: userRole || (user.isAdmin ? "admin" : "customer"),
          tokenVersion: (user as { tokenVersion?: number }).tokenVersion ?? 0,
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

  // ── Events ────────────────────────────────────────────────────────────────
  events: {
    async createUser({ user }) {
      if (user.id && user.email) {
        const normalizedEmail = user.email.toLowerCase().trim();
        // Google OAuth signups are pre-verified by Google — immediately guarantee emailVerified
        const userVerified = (user as { emailVerified?: Date | null }).emailVerified;
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: userVerified || new Date() },
        }).catch((e: unknown) => console.error("[Auth] Error setting emailVerified on createUser:", e));
        await bootstrapAdminOnVerification(user.id, normalizedEmail);
        await linkVerifiedUserRecords(user.id, normalizedEmail);
      }
    },
  },

  // ── Callbacks ─────────────────────────────────────────────────────────────
  callbacks: {
    async signIn({ user, account, profile }) {
      // 1. Google OAuth security validation
      if (account?.provider === "google") {
        const isGoogleVerified = (profile as { email_verified?: boolean })?.email_verified;
        if (!isGoogleVerified) {
          console.warn(`[Auth] Blocked Google login: unverified Google email (${user.email})`);
          return false;
        }

        if (user.email) {
          const normalizedEmail = user.email.toLowerCase().trim();
          const existingUser = await db.user.findUnique({
            where: { email: normalizedEmail },
            include: { accounts: true },
          });

          if (existingUser) {
            // Allow user to log in through Google even if they previously registered with password.
            // Ensure Google account is linked to the existing user in database if not already linked.
            const hasGoogleAccount = Boolean(
              existingUser.accounts?.some(
                (acc: { provider: string }) => acc.provider === "google"
              )
            );
            if (!hasGoogleAccount && account?.providerAccountId) {
              await db.account
                .upsert({
                  where: {
                    provider_providerAccountId: {
                      provider: account.provider,
                      providerAccountId: account.providerAccountId,
                    },
                  },
                  update: {
                    userId: existingUser.id,
                  },
                  create: {
                    userId: existingUser.id,
                    type: account.type || "oauth",
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    refresh_token: account.refresh_token,
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    session_state: (account.session_state as string) || null,
                  },
                })
                .catch((err) => console.warn("[Auth] Failed to link Google account:", err));
            }

            // Auto-mark email as verified if they successfully sign in with verified Google
            if (!existingUser.emailVerified) {
              await db.user.update({
                where: { id: existingUser.id },
                data: { emailVerified: new Date() },
              });
            }

            // Clear login rate limiting for this email address now that identity is confirmed via Google
            const emailKey = `email:${normalizedEmail}`;
            await authLoginLimiter.reset(emailKey).catch(() => null);

            // Run verified-email admin bootstrap hook and guest record linking
            await bootstrapAdminOnVerification(existingUser.id, normalizedEmail);
            await linkVerifiedUserRecords(existingUser.id, normalizedEmail);
          }
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.role = (user as { role?: string }).role || (token.isAdmin ? "admin" : "customer");
        token.tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0;
        token.lastChecked = Date.now();

        // If user authenticated via OAuth, ensure token attributes match canonical DB user record
        if (user.email) {
          try {
            const dbUser = await db.user.findUnique({
              where: { email: user.email.toLowerCase().trim() },
              select: { id: true, isAdmin: true, role: true, tokenVersion: true },
            });
            if (dbUser) {
              token.id = dbUser.id;
              token.isAdmin = Boolean(dbUser.isAdmin);
              token.role = token.isAdmin ? "admin" : (dbUser.role || "customer");
              token.tokenVersion = dbUser.tokenVersion ?? 0;
            }
          } catch (e) {
            console.warn("[Auth] Error hydrating user in jwt callback:", e);
          }
        }
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
            select: { id: true, isAdmin: true, email: true, role: true, tokenVersion: true },
          });

          if (!dbUser) {
            return {};
          }

          // Session invalidation on tokenVersion mismatch (M6)
          const currentTokenVersion = dbUser.tokenVersion ?? 0;
          const sessionTokenVersion = (token.tokenVersion as number) ?? 0;
          if (currentTokenVersion !== sessionTokenVersion) {
            console.warn(
              `[Auth] Session invalidated for user ${token.id}: version mismatch (session: ${sessionTokenVersion}, db: ${currentTokenVersion})`
            );
            return {};
          }

          // Trusts ONLY DB-backed flag carried in database user record
          token.isAdmin = Boolean(dbUser.isAdmin);
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
        } catch (e) {
          console.warn("[Auth] Failed to refresh token from db:", e);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (!token?.id) {
        return null as any;
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = (token.isAdmin as boolean) ?? false;
        session.user.role = (token.role as "customer" | "solution_partner" | "admin") || (token.isAdmin ? "admin" : "customer");
        session.user.partnerStatus = (token.partnerStatus as "pending" | "approved" | "rejected" | "suspended" | "deactivated" | null) ?? null;
        session.user.partnerId = (token.partnerId as string | null) ?? null;
        session.user.tokenVersion = (token.tokenVersion as number) ?? 0;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      try {
        const baseOrigin = new URL(baseUrl).origin;
        if (url.startsWith("/")) {
          const safe = getSafeCallbackUrl(url, "/", baseOrigin);
          return `${baseOrigin}${safe}`;
        }
        const parsed = new URL(url);
        if (parsed.origin.toLowerCase() === baseOrigin.toLowerCase()) {
          const safe = getSafeCallbackUrl(parsed.pathname + parsed.search + parsed.hash, "/", baseOrigin);
          return `${baseOrigin}${safe}`;
        }
      } catch {
        // Fall back to baseUrl on any error
      }
      return baseUrl;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
