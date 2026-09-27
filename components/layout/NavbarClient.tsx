// components/layout/NavbarClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

  const navLinks = [
    { label: "Browse Projects", href: "/projects" },
    { label: "Request Custom Software", href: "/custom-project" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#d8e5e7]/80 bg-white/90 backdrop-blur-md shadow-[0_1px_8px_rgba(24,78,88,0.04)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#00373f] hover:opacity-90 transition-opacity"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#00373f] text-[#8cf7ce] font-extrabold text-sm shadow-sm border border-[#184e58]">
              SS
            </span>
            <span className="font-extrabold tracking-tight">Soft Showcase</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  isActive(link.href)
                    ? "bg-[#e9f6f8] text-[#00373f]"
                    : "text-[#40484a] hover:text-[#00373f] hover:bg-[#e9f6f8]/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop Auth & CTAs */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {user.isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Admin Panel
                  </Button>
                </Link>
              )}

              <Link href="/my-inquiries">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <MessageSquare className="w-3.5 h-3.5" />
                  My Inquiries
                </Button>
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <Link
                  href="/profile"
                  title="Profile Settings"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-700 max-w-[120px] truncate hover:text-indigo-600 transition-colors">
                    {user.name || user.email}
                  </span>
                </Link>

                <form action={signOutAction}>
                  <button
                    type="submit"
                    title="Sign Out"
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="sm">
                  Register
                </Button>
              </Link>
              <Link href="/custom-project">
                <Button variant="primary" size="sm" className="gap-1 shadow-sm">
                  Custom Build
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
            className="p-2 text-gray-600 hover:text-gray-950 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-6 space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-base font-medium ${
                  isActive(link.href)
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-gray-100">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="w-9 h-9 rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {user.name || "Authenticated User"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                </div>

                {user.isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                    Admin Panel
                  </Link>
                )}

                <Link
                  href="/my-inquiries"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  My Inquiries
                </Link>

                <Link
                  href="/my-requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ArrowUpRight className="w-4 h-4 text-indigo-600" />
                  Custom Requests
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-200 rounded-full">
                    P
                  </span>
                  Profile Settings
                </Link>

                <form action={signOutAction} className="pt-2">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="md" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="md" className="w-full">
                      Register
                    </Button>
                  </Link>
                </div>
                <Link href="/custom-project" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full">
                    Request Custom Software
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
