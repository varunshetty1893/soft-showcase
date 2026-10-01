// components/partner/PartnerHeader.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  ExternalLink,
  ShieldCheck,
  LogOut,
  Sparkles,
  Layers,
  CheckCircle2,
  Menu,
  X,
  LayoutDashboard,
  Receipt,
  Headphones,
  Users,
  Settings,
} from "lucide-react";
import { APP_NAME } from "@/config/constants";

interface PartnerHeaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin?: boolean;
  };
  partner: {
    id: string;
    displayName: string;
    verificationStatus?: string | null;
    applicationStatus?: string | null;
    avatarUrl?: string | null;
  } | null;
  isDemoGuest?: boolean;
}

export function PartnerHeader({ user, partner, isDemoGuest }: PartnerHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isVerified = partner?.verificationStatus === "verified";

  return (
    <header className="w-full bg-white border-b border-[#D9E2E4] sticky top-0 z-30 shadow-xs">
      <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Portal Tag */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center group py-1">
            <Image
              src="/logo.png"
              alt={APP_NAME}
              width={130}
              height={27}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>
          <div className="h-5 w-px bg-[#D9E2E4] hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DDF4EC] text-[#2F7D78] text-xs font-bold">
            <Sparkles className="w-3 h-3" />
            <span>Partner Workspace</span>
          </div>
          {isDemoGuest && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Interactive Preview
            </span>
          )}
        </div>

        {/* Center / Right Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Verification Badge */}
          {partner && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium bg-[#F8FAFA] border-[#D9E2E4]">
              {isVerified ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7D78]" />
                  <span className="text-[#2F7D78] font-semibold">Verified Partner</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#526267]" />
                  <span className="text-[#526267]">Partner Studio</span>
                </>
              )}
            </div>
          )}

          {/* Switch to Public Site */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526267] hover:text-[#155761] hover:bg-[#F3F7F7] border border-transparent hover:border-[#D9E2E4] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Showcase</span>
          </Link>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#D9E2E4]">
            {partner?.avatarUrl || user.image ? (
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#D9E2E4] shrink-0">
                <Image
                  src={partner?.avatarUrl || user.image || ""}
                  alt={partner?.displayName || user.name || "Partner"}
                  fill
                  sizes="32px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  unoptimized={Boolean(partner?.avatarUrl?.startsWith("data:") || user.image?.startsWith("data:"))}
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#155761] text-white flex items-center justify-center text-xs font-bold">
                {(partner?.displayName || user.name || "P")[0].toUpperCase()}
              </div>
            )}
            <div className="hidden lg:block text-left text-xs">
              <p className="font-semibold text-[#102124] truncate max-w-[130px]">
                {partner?.displayName || user.name}
              </p>
              <p className="text-[10px] text-[#526267]">Solution Partner</p>
            </div>
          </div>

          {/* Sign In / Sign Out Button */}
          {isDemoGuest ? (
            <Link
              href="/login?callbackUrl=/partner"
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#155761] text-white hover:bg-[#10474F] transition-colors shadow-xs"
            >
              Sign In
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 text-[#526267] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#526267] hover:text-[#102124] md:hidden focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#D9E2E4] bg-white px-4 py-3 space-y-2">
          <Link
            href="/partner/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#102124] hover:bg-[#F3F7F7]"
          >
            <LayoutDashboard className="w-4 h-4 text-[#155761]" />
            <span>Dashboard Overview</span>
          </Link>
          <Link
            href="/partner/solutions"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#102124] hover:bg-[#F3F7F7]"
          >
            <Layers className="w-4 h-4 text-[#155761]" />
            <span>My Solutions</span>
          </Link>
          <Link
            href="/partner/inquiries"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#102124] hover:bg-[#F3F7F7]"
          >
            <Users className="w-4 h-4 text-[#155761]" />
            <span>Customer Enquiries</span>
          </Link>
          <Link
            href="/partner/transactions"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#102124] hover:bg-[#F3F7F7]"
          >
            <Receipt className="w-4 h-4 text-[#155761]" />
            <span>Transactions &amp; Evidence</span>
          </Link>
          <Link
            href="/partner/support"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#102124] hover:bg-[#F3F7F7]"
          >
            <Headphones className="w-4 h-4 text-[#155761]" />
            <span>Support Desk</span>
          </Link>
          <Link
            href="/partner/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#102124] hover:bg-[#F3F7F7]"
          >
            <Settings className="w-4 h-4 text-[#155761]" />
            <span>Profile &amp; Studio Settings</span>
          </Link>
        </div>
      )}
    </header>
  );
}
