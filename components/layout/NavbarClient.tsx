// components/layout/NavbarClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Menu, X, ArrowUpRight, LayoutDashboard, LogOut,
  KeyRound, User, Sparkles, Layers, FileCode2,
  Receipt, MessageSquare, Headphones, ShoppingBag,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserNavDropdown } from "@/components/layout/UserNavDropdown";
import { CartNavButton } from "@/components/cart/CartNavButton";

interface NavbarClientProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin?: boolean;
    role?: "customer" | "solution_partner" | "admin";
    partnerStatus?: "pending" | "approved" | "rejected" | "suspended" | "deactivated" | null;
    partnerId?: string | null;
  } | null;
  signOutAction: () => Promise<void>;
}

// ──────────────────────────────────────────────
// Nav link definitions per persona
// ──────────────────────────────────────────────

const PUBLIC_NAV = [
  { label: "Browse Projects", href: "/projects" },
  { label: "Categories",      href: "/#categories" },
  { label: "Partners",        href: "/become-a-partner" },
  { label: "How It Works",    href: "/#how-it-works" },
  { label: "Why Us",          href: "/#why-us" },
];

const CUSTOMER_NAV = [
  { label: "Browse Projects", href: "/projects" },
  { label: "Categories",      href: "/#categories" },
  { label: "How It Works",    href: "/#how-it-works" },
  { label: "Partners",        href: "/become-a-partner" },
];

const PARTNER_NAV = [
  { label: "Browse Projects", href: "/projects" },
  { label: "Partner Portal",  href: "/partner/dashboard" },
  { label: "My Solutions",    href: "/partner/solutions" },
  { label: "Revenue",         href: "/partner/revenue" },
  { label: "Support",         href: "/partner/support" },
];

const ADMIN_NAV = [
  { label: "Browse Projects", href: "/projects" },
  { label: "Dashboard",       href: "/admin" },
  { label: "Users",           href: "/admin/users" },
  { label: "Projects",        href: "/admin/projects" },
  { label: "Support",         href: "/admin/support" },
];

export function NavbarClient({ user, signOutAction }: NavbarClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch {
      if (signOutAction) await signOutAction();
    }
  };

  const isPartner =
    user?.role === "solution_partner" ||
    user?.partnerStatus === "approved" ||
    Boolean(user?.partnerId);

  // Pick the right nav set
  const navLinks = user?.isAdmin
    ? ADMIN_NAV
    : isPartner
    ? PARTNER_NAV
    : user
    ? CUSTOMER_NAV
    : PUBLIC_NAV;

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    if (href === "/projects") return pathname.startsWith("/projects");
    if (href === "/partner/dashboard")
      return (
        pathname.startsWith("/partner") &&
        pathname !== "/partner/register" &&
        pathname !== "/partner/status" &&
        pathname !== "/partner-registration"
      );
    if (href === "/admin") return pathname.startsWith("/admin");
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Mobile customer quick-links (icons + labels shown in mobile drawer)
  const mobileCustomerLinks = [
    { label: "My Requests",      href: "/my-requests",       Icon: FileCode2 },
    { label: "My Inquiries",     href: "/my-inquiries",      Icon: MessageSquare },
    { label: "Orders & Receipts",href: "/my-transactions",   Icon: Receipt },
    { label: "Help & Support",   href: "/my-support",        Icon: Headphones },
    { label: "Profile Settings", href: "/profile",           Icon: User },
  ];


  const mobilePartnerLinks = [
    { label: "Partner Portal",  href: "/partner/dashboard",  Icon: Layers },
    { label: "My Solutions",    href: "/partner/solutions",   Icon: FileCode2 },
    { label: "Revenue",         href: "/partner/revenue",     Icon: Receipt },
    { label: "Support",         href: "/partner/support",     Icon: Headphones },
    { label: "Studio Settings", href: "/partner/profile",     Icon: User },
  ];

  const mobileAdminLinks = [
    { label: "Admin Dashboard", href: "/admin",              Icon: LayoutDashboard },
    { label: "Users",           href: "/admin/users",         Icon: User },
    { label: "Projects",        href: "/admin/projects",      Icon: FileCode2 },
    { label: "Support Tickets", href: "/admin/support",       Icon: Headphones },
    { label: "Admin Profile",   href: "/admin/profile",       Icon: User },
  ];

  const mobileAuthLinks = user?.isAdmin
    ? mobileAdminLinks
    : isPartner
    ? mobilePartnerLinks
    : mobileCustomerLinks;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D9E2E4] bg-white/95 backdrop-blur-md shadow-[0_1px_4px_rgba(16,33,36,0.02)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 relative">

        {/* Brand */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center group py-1">
            <Image
              src="/logo.png"
              alt="Soft Showcase"
              width={140}
              height={29}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive(link.href)
                  ? "bg-[#F3F7F7] text-[#155761] font-semibold"
                  : "text-[#526267] hover:text-[#102124] hover:bg-[#F3F7F7]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {user && <CartNavButton />}

          {user ? (
            <div className="flex items-center gap-2">
              {/* Contextual CTA per persona */}
              {!user.isAdmin && !isPartner && (
                <Link
                  href="/custom-project"
                  className={buttonVariants({
                    variant: "primary",
                    size: "sm",
                    className: "gap-1.5 text-xs font-semibold shadow-xs",
                  })}
                >
                  Custom Build
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {user.isAdmin && (
                <Link
                  href="/admin"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "gap-1.5 text-xs text-[#155761] font-semibold border-[#155761]/30 hover:bg-[#F3F7F7]",
                  })}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#155761]" />
                  Admin Panel
                </Link>
              )}

              <UserNavDropdown
                user={{
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  image: user.image,
                  isAdmin: user.isAdmin,
                  role: user.role,
                  partnerStatus: user.partnerStatus,
                  partnerId: user.partnerId,
                }}
                onSignOut={handleSignOut}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "text-xs sm:text-sm font-medium px-4",
                })}
              >
                Sign In
              </Link>
              <Link
                href="/login?callbackUrl=/custom-project"
                className={buttonVariants({
                  variant: "primary",
                  size: "sm",
                  className: "text-xs sm:text-sm gap-1 shadow-xs font-semibold",
                })}
              >
                Request Software
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 md:hidden">
          {user && <CartNavButton />}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#526267] hover:text-[#102124] focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#D9E2E4] bg-white px-4 pt-2 pb-6 space-y-4">

          {/* Contextual nav links (Browse, etc.) */}
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-[#F3F7F7] text-[#155761] font-semibold"
                    : "text-[#526267] hover:bg-[#F3F7F7] hover:text-[#102124]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-[#D9E2E4]">
            {user ? (
              <div className="space-y-2">
                {/* User identity strip */}
                <div className="flex items-center gap-3 px-3 py-2 bg-[#F3F7F7] rounded-xl mb-3">
                  {user.image ? (
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#D9E2E4] shrink-0">
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        fill
                        sizes="36px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#155761] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-[#102124]">
                      {user.name || "My Account"}
                    </div>
                    <div className="text-[11px] text-[#526267] truncate">
                      {user.isAdmin ? "Administrator" : isPartner ? "Solution Partner" : "Customer"}
                    </div>
                  </div>
                </div>

                {/* Contextual quick links */}
                {mobileAuthLinks.map(({ label, href, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      pathname === href || pathname.startsWith(href + "/")
                        ? "bg-[#F3F7F7] text-[#155761] font-semibold"
                        : "text-[#526267] hover:bg-[#F3F7F7] hover:text-[#102124]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                ))}

                {/* Customer CTA */}
                {!user.isAdmin && !isPartner && (
                  <Link
                    href="/custom-project"
                    onClick={() => setMobileMenuOpen(false)}
                    className={buttonVariants({
                      variant: "primary",
                      size: "md",
                      className: "w-full mt-2 gap-1.5 font-semibold",
                    })}
                  >
                    <FileCode2 className="w-4 h-4" />
                    Request a Custom Build
                  </Link>
                )}

                {/* Sign out */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full gap-2 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={buttonVariants({
                    variant: "outline",
                    size: "md",
                    className: "w-full text-sm font-medium",
                  })}
                >
                  Sign In
                </Link>
                <Link
                  href="/login?callbackUrl=/custom-project"
                  onClick={() => setMobileMenuOpen(false)}
                  className={buttonVariants({
                    variant: "primary",
                    size: "md",
                    className: "w-full text-sm font-semibold gap-1.5",
                  })}
                >
                  Request Custom Software
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <div className="pt-2 text-center border-t border-[#D9E2E4]/60">
                  <Link
                    href="/partner-registration"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#155761] hover:underline py-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#2F7D78]" />
                    <span>Register as a Solution Partner</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
