// components/customer/CustomerHeader.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  FileText,
  UserCheck,
  Receipt,
  Headphones,
  Shield,
  PlusCircle,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface CustomerHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin?: boolean;
  };
  inquiryCount?: number;
  requestCount?: number;
}

export function CustomerHeader({
  user,
  inquiryCount,
  requestCount,
}: CustomerHeaderProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Custom Requests",
      href: "/my-requests",
      icon: FileText,
      badge: typeof requestCount === "number" && requestCount > 0 ? requestCount : undefined,
    },
    {
      label: "My Inquiries",
      href: "/my-inquiries",
      icon: MessageSquare,
      badge: typeof inquiryCount === "number" && inquiryCount > 0 ? inquiryCount : undefined,
    },
    {
      label: "Orders & Receipts",
      href: "/my-transactions",
      icon: Receipt,
    },
    {
      label: "Help & Support",
      href: "/my-support",
      icon: Headphones,
    },
    {
      label: "Profile & Settings",
      href: "/profile",
      icon: UserCheck,
    },
  ];

  return (
    <div className="mb-6">
      {/* Sleek, modern Portal Identity Bar */}
      <div className="bg-white rounded-2xl border border-[#D9E2E4] px-6 py-4 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {user.image ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#D9E2E4] shadow-xs shrink-0">
                <Image
                  src={user.image}
                  alt={user.name || "User Avatar"}
                  fill
                  sizes="48px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#155761] text-white flex items-center justify-center text-base font-bold shadow-xs shrink-0">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#102124]">
                  {user.name || "Customer Portal"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761]">
                  {user.isAdmin ? (
                    <>
                      <Shield className="w-3 h-3 text-[#155761]" />
                      Admin
                    </>
                  ) : (
                    "Customer Account"
                  )}
                </span>
              </div>
              <p className="text-xs text-[#526267] mt-0.5 font-mono">{user.email}</p>
            </div>
          </div>
        </div>
      </div>


      {/* Clean Navigation Tabs (No overflow, focused items) */}
      <div className="border-b border-[#D9E2E4] flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-[#155761] text-[#155761] font-semibold"
                  : "border-transparent text-[#526267] hover:text-[#102124] hover:border-[#D9E2E4]"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#155761]" : "text-[#526267]"}`} />
              <span>{tab.label}</span>
              {typeof tab.badge === "number" && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-[#DDF4EC] text-[#155761]"
                      : "bg-[#F3F7F7] text-[#526267]"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

