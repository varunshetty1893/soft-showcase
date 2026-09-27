// components/layout/NavbarClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, ArrowUpRight, LogOut, LayoutDashboard, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarClientProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin?: boolean;
  } | null;
  signOutAction: () => Promise<void>;
}

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

  const navLinks = [
    { label: "Browse Projects", href: "/projects" },
    { label: "Categories", href: "/#categories" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Why Us", href: "/#why-us" },
  ];

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D9E2E4] bg-white/95 backdrop-blur-md shadow-[0_1px_4px_rgba(16,33,36,0.02)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 relative">
        {/* Brand: Real Soft Showcase Logo */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center group py-1"
          >
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

        {/* Desktop Navigation Links — Centered */}
        <nav className="hidden md:flex items-center justify-center gap-1 lg:gap-2 md:relative lg:absolute lg:left-1/2 lg:-translate-x-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive(link.href)
                  ? "bg-[#F3F7F7] text-[#155761] font-semibold"
                  : "text-[#526267] hover:text-[#102124] hover:bg-[#F3F7F7]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth & CTAs */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              {user.isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs text-[#102124]">
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#155761]" />
                    Admin Panel
                  </Button>
                </Link>
              )}

              <Link href="/my-inquiries">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-[#526267] hover:text-[#155761]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  My Inquiries
                </Button>
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-[#D9E2E4]">
                <Link
                  href="/profile"
                  title="Profile Settings"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="w-8 h-8 rounded-full border border-[#D9E2E4] object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center text-xs font-semibold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-xs font-medium text-[#102124] max-w-[120px] truncate hover:text-[#155761] transition-colors">
                    {user.name || user.email}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-1.5 text-[#526267] hover:text-[#102124] hover:bg-[#F3F7F7] rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link href="/login">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm font-medium px-4">
                  Sign In
                </Button>
              </Link>
              <Link href="/custom-project">
                <Button variant="primary" size="sm" className="text-xs sm:text-sm gap-1 shadow-xs font-semibold">
                  Request Software
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
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
          <nav className="flex flex-col space-y-2">
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

          <div className="pt-4 border-t border-[#D9E2E4]">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="w-9 h-9 rounded-full border border-[#D9E2E4]"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center text-sm font-semibold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-[#102124]">
                      {user.name || "Authenticated User"}
                    </div>
                    <div className="text-xs text-[#526267] truncate">{user.email}</div>
                  </div>
                </div>

                {user.isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#526267] hover:bg-[#F3F7F7] hover:text-[#155761]"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#155761]" />
                    Admin Panel
                  </Link>
                )}

                <Link
                  href="/my-inquiries"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#526267] hover:bg-[#F3F7F7] hover:text-[#155761]"
                >
                  <MessageSquare className="w-4 h-4 text-[#155761]" />
                  My Inquiries
                </Link>

                <Link
                  href="/my-requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#526267] hover:bg-[#F3F7F7] hover:text-[#155761]"
                >
                  <ArrowUpRight className="w-4 h-4 text-[#155761]" />
                  Custom Requests
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#526267] hover:bg-[#F3F7F7] hover:text-[#155761]"
                >
                  Profile Settings
                </Link>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full gap-2 text-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="md" className="w-full text-sm font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link href="/custom-project" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full text-sm font-semibold gap-1.5">
                    Request Custom Software
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
