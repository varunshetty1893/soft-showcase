// components/admin/AdminSidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  Users,
  MessageSquare,
  FileQuestion,
  ExternalLink,
  History,
  ChevronRight,
  UserCheck,
  Receipt,
  Headphones,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Projects", href: "/admin/projects", icon: FolderGit2 },
  { label: "Partners & Providers", href: "/admin/providers", icon: Users },
  { label: "Transactions & Evidence", href: "/admin/transactions", icon: Receipt },
  { label: "Support Tickets", href: "/admin/support", icon: Headphones },
  { label: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
  { label: "Custom Requests", href: "/admin/custom-requests", icon: FileQuestion },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
  { label: "Admin Profile", href: "/admin/profile", icon: UserCheck },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-72 border-r border-[#D9E2E4] bg-white h-[calc(100vh-4rem)] sticky top-16 flex flex-col justify-between py-5 shrink-0 hidden md:flex overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="space-y-4 px-4">
        {/* Section Header */}
        <div className="px-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#526267]">
            Platform Management
          </span>
        </div>

        {/* Navigation items with comfortable spacing and size */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#F3F7F7] text-[#155761] font-semibold border border-[#D9E2E4] shadow-2xs"
                    : "text-[#526267] hover:bg-[#F3F7F7] hover:text-[#102124]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 ${
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

      {/* Public site link */}
      <div className="px-4 pt-4 border-t border-[#F3F7F7]">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#526267] hover:bg-[#F3F7F7] hover:text-[#102124] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-4 h-4 text-[#526267]" />
            <span>Open Public Website</span>
          </div>
          <span className="text-[10px] bg-[#DDF4EC] text-[#155761] font-bold px-2 py-0.5 rounded-md">
            Live
          </span>
        </Link>
      </div>
    </aside>
  );
}
