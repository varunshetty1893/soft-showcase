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
  UploadCloud,
  ExternalLink,
  History,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Projects", href: "/admin/projects", icon: FolderGit2 },
  { label: "Providers", href: "/admin/providers", icon: Users },
  { label: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
  { label: "Custom Requests", href: "/admin/custom-requests", icon: FileQuestion },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
  { label: "Import Projects", href: "/admin/projects/import", icon: UploadCloud },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-[#D9E2E4] bg-white min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 shrink-0 hidden md:flex">
      <div className="space-y-6 px-4">
        <div className="px-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#526267]">
            Platform Management
          </span>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
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

      {/* Public site link */}
      <div className="px-4 pt-6 border-t border-[#F3F7F7]">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#526267] hover:bg-[#F3F7F7] hover:text-[#102124] transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-[#526267]" />
            <span>Open Public Website</span>
          </div>
          <span className="text-[10px] bg-[#DDF4EC] text-[#155761] font-bold px-1.5 py-0.5 rounded">
            Live
          </span>
        </Link>
      </div>
    </aside>
  );
}
