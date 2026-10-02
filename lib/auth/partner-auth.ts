// lib/auth/partner-auth.ts
// Resolves the authenticated partner and user session for the Partner Portal.
// Strict access control: requires active login, verifies approved/active partner status (or admin),
// and eliminates any demo guest or other partner data fallbacks.

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { AuthError } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin";

export interface EffectivePartnerContext {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin?: boolean;
    role?: string;
  };
  partner: {
    id: string;
    displayName: string;
    email?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    verificationStatus?: string | null;
    applicationStatus?: string | null;
    whatsappNumber?: string | null;
    location?: string | null;
    skills?: string[] | null;
    technologies?: string[] | null;
    portfolioUrl?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    solutionsOffered?: string | null;
  };
  isDemoGuest: false;
}

/**
 * Require an authenticated partner (or admin) for the Partner Portal.
 *
 * @param useRedirect - When true (in Server Components/Pages), redirects unauthenticated
 *                      users to /login and unapproved users to /partner/status.
 *                      When false (in API routes), throws AuthError.
 */
export async function requirePartner(useRedirect = true): Promise<EffectivePartnerContext> {
  const session = await auth();

  // 1. Check authentication
  if (!session?.user?.id) {
    if (useRedirect) {
      redirect("/login?callbackUrl=/partner");
    }
    throw new AuthError("UNAUTHORIZED", "Authentication required");
  }

  const user = session.user;
  const userEmail = (user.email || "").toLowerCase().trim();
  const isAdmin = isAdminUser(user);

  // 2. Query partner profile for this user
  let partner: Awaited<ReturnType<typeof db.projectProvider.findFirst>> = null;
  try {
    partner = await db.projectProvider.findFirst({
      where: { userId: user.id },
    });

    // Fallback: If legacy unlinked record exists for this email, link it permanently
    if (!partner && userEmail) {
      const unlinked = await db.projectProvider.findFirst({
        where: { email: userEmail, userId: null },
      });
      if (unlinked) {
        partner = await db.projectProvider
          .update({
            where: { id: unlinked.id },
            data: { userId: user.id },
          })
          .catch(() => unlinked);
      }
    }
  } catch (e) {
    console.error("Failed to query partner profile:", e);
  }

  // 3. Admin access bypass: Admins are allowed
  if (isAdmin) {
    if (!partner) {
      partner = await db.projectProvider
        .create({
          data: {
            userId: user.id,
            displayName: user.name || "Platform Administrator",
            email: userEmail || `admin-${user.id}@softshowcase.local`,
            bio: "Platform Administrator with full oversight.",
            avatarUrl: user.image || null,
            verificationStatus: "verified",
            applicationStatus: "approved",
            isActive: true,
            skills: ["Administration", "Full Oversight"],
            technologies: ["Next.js", "Prisma", "PostgreSQL"],
            solutionsOffered: "Platform Management",
          },
        })
        .catch(() => null);
    } else if (partner.applicationStatus !== "approved" || !partner.isActive) {
      partner = await db.projectProvider
        .update({
          where: { id: partner.id },
          data: { applicationStatus: "approved", isActive: true },
        })
        .catch(() => partner);
    }

    if (partner) {
      return {
        user,
        partner: {
          ...partner,
          skills: partner.skills as string[] | null,
          technologies: partner.technologies as string[] | null,
        },
        isDemoGuest: false,
      };
    }

    // Admin without dedicated provider profile: provide an admin partner context
    return {
      user,
      partner: {
        id: `admin-${user.id}`,
        displayName: user.name || "Platform Administrator",
        email: user.email || "",
        bio: "Platform Administrator with full oversight.",
        avatarUrl: user.image || null,
        verificationStatus: "verified",
        applicationStatus: "approved",
        whatsappNumber: null,
        location: null,
        skills: ["Administration", "Full Oversight"],
        technologies: ["Next.js", "Prisma", "PostgreSQL"],
        portfolioUrl: null,
        githubUrl: null,
        linkedinUrl: null,
        solutionsOffered: "Platform Management",
      },
      isDemoGuest: false,
    };
  }

  // 4. Partner profile must exist, not be removed, be approved, and be active
  if (!partner) {
    if (useRedirect) {
      redirect("/partner/status");
    }
    throw new AuthError("FORBIDDEN", "No partner profile found for this account.");
  }

  if ((partner as any).removedAt) {
    if (useRedirect) {
      redirect("/partner/status?status=removed");
    }
    throw new AuthError("FORBIDDEN", "Partner profile has been removed from the platform.");
  }

  const isApproved = partner.applicationStatus === "approved";
  const isActive = partner.isActive !== false; // Active by default unless explicitly disabled

  if (!isApproved || !isActive) {
    if (useRedirect) {
      redirect(`/partner/status?status=${encodeURIComponent(partner.isActive === false ? "deactivated" : partner.applicationStatus || "pending")}`);
    }
    throw new AuthError("FORBIDDEN", "Partner profile is not approved or active.");
  }

  return {
    user,
    partner: {
      ...partner,
      skills: partner.skills as string[] | null,
      technologies: partner.technologies as string[] | null,
    },
    isDemoGuest: false,
  };
}

/**
 * Backward-compatible alias for requirePartner().
 * Always enforces active session and approved partner profile.
 */
export async function getEffectivePartnerContext(): Promise<EffectivePartnerContext> {
  return requirePartner(true);
}

/**
 * Resolves the partner record for API routes without redirecting.
 * Links legacy unlinked provider records by email if applicable, and for admins
 * resolves or creates the admin's own dedicated ProjectProvider record (never
 * selecting a random third-party partner via bare findFirst()).
 */
export async function resolvePartnerForUser(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean;
  role?: string;
}) {
  const userEmail = (user.email || "").toLowerCase().trim();
  const isAdmin = isAdminUser(user);

  let partner = await db.projectProvider.findFirst({
    where: { userId: user.id },
  });

  if (!partner && userEmail) {
    const unlinked = await db.projectProvider.findFirst({
      where: { email: userEmail, userId: null },
    });
    if (unlinked) {
      partner = await db.projectProvider
        .update({
          where: { id: unlinked.id },
          data: { userId: user.id },
        })
        .catch(() => unlinked);
    }
  }

  if (!partner && isAdmin) {
    partner = await db.projectProvider
      .create({
        data: {
          userId: user.id,
          displayName: user.name || "Platform Administrator",
          email: userEmail || `admin-${user.id}@softshowcase.local`,
          bio: "Platform Administrator with full oversight.",
          avatarUrl: user.image || null,
          verificationStatus: "verified",
          applicationStatus: "approved",
          isActive: true,
          skills: ["Administration", "Full Oversight"],
          technologies: ["Next.js", "Prisma", "PostgreSQL"],
          solutionsOffered: "Platform Management",
        },
      })
      .catch(() => null);
  }

  if (!isAdmin && partner && (partner as any).removedAt) {
    return null;
  }

  return partner;
}

