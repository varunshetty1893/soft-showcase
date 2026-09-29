// components/partner/PartnerSidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Users,
  Receipt,
  Headphones,
  Settings,
  ChevronRight,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";

interface PartnerSidebarProps {
  partner: {
    id: string;
    displayName: string;
    verificationStatus?: string | null;
  } | null;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard },
  { label: "My Solutions", href: "/partner/solutions", icon: Layers },
  { label: "Customer Enquiries", href: "/partner/inquiries", icon: Users },
  { label: "Transactions & Evidence", href: "/partner/transactions", icon: Receipt },
  { label: "Support Desk", href: "/partner/support", icon: Headphones },
  { label: "Studio Settings", href: "/partner/profile", icon: Settings },
];

export function PartnerSidebar({ partner }: PartnerSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/partner/dashboard" || href === "/partner") {
      return pathname === "/partner" || pathname === "/partner/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-[#D9E2E4] bg-white min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 shrink-0 hidden md:flex">
      <div className="space-y-6 px-4">
        {/* Workspace Brand / Partner Title */}
        <div className="px-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267]">
            Solution Partner Portal
          </span>
          <div className="text-xs font-semibold text-[#102124] truncate mt-0.5">
            {partner?.displayName || "My Studio"}
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="px-1">
          <Link href="/partner/solutions/new">
            <button className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#155761] hover:bg-[#10474F] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer">
              <PlusCircle className="w-4 h-4" />
              <span>Add New Solution</span>
            </button>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#F3F7F7] text-[#155761] font-semibold border border-[#D9E2E4]"
                    : "text-[#526267] hover:bg-[#F3F7F7] hover:text-[#102124]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-[#155761]" : "text-[#526267]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight className="w-4 h-4 text-[#155761]" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Trust & Policy Footnote */}
      <div className="px-4 pt-6 border-t border-[#F3F7F7]">
        <div className="bg-[#F8FAFA] rounded-xl p-3 border border-[#D9E2E4] text-[11px] text-[#526267] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[#102124]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2F7D78]" />
            <span>Isolated Workspace</span>
          </div>
          <p className="leading-relaxed">
            Your client data and transactions are strictly confidential and isolated.
          </p>
        </div>
      </div>
    </aside>
  );
}
