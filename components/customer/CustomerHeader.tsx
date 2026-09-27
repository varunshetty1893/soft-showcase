// components/customer/CustomerHeader.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, FileText, UserCheck, Shield } from "lucide-react";

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
      label: "My Inquiries",
      href: "/my-inquiries",
      icon: MessageSquare,
      badge: typeof inquiryCount === "number" ? inquiryCount : undefined,
    },
    {
      label: "Custom Requests",
      href: "/my-requests",
      icon: FileText,
      badge: typeof requestCount === "number" ? requestCount : undefined,
    },
    {
      label: "Profile Settings",
      href: "/profile",
      icon: UserCheck,
    },
  ];

  return (
    <div className="mb-8">
      {/* Top Banner with User Greeting */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User Avatar"}
                className="w-16 h-16 rounded-full border-2 border-indigo-100 object-cover shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-indigo-100">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950">
                  {user.name || "Customer Dashboard"}
                </h1>
                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              Browse Projects
            </Link>
            <Link
              href="/custom-project"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
            >
              Request Custom Build
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-px overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-indigo-600 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
              <span>{tab.label}</span>
              {typeof tab.badge === "number" && (
                <span
                  className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-600"
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
