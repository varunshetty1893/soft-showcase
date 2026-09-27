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

const isProduction = process.env.NODE_ENV === "production";
const useSecureCookies = isProduction && !process.env.NEXTAUTH_URL?.startsWith("http://localhost");

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "soft-showcase-fallback-auth-secret-key-32chars";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
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
          throw new Error("Invalid credentials format");
        }

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isAdmin: user.isAdmin,
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
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }

      // Keep isAdmin up-to-date directly from database
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { isAdmin: true },
        });
        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.isAdmin = (token.isAdmin as boolean) ?? false;
      }
      return session;
    },
  },
});
