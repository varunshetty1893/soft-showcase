// components/customer/CustomerHeader.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, FileText, UserCheck, Shield, ShoppingCart, Receipt, Headphones } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";

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
  const { totalCount } = useCart();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
      label: "Orders & Transactions",
      href: "/my-transactions",
      icon: Receipt,
    },
    {
      label: "Help & Support",
      href: "/my-support",
      icon: Headphones,
    },
    {
      label: "Saved Projects & Cart",
      href: "/cart",
      icon: ShoppingCart,
      badge: mounted && totalCount > 0 ? totalCount : undefined,
    },
    {
      label: "Profile & WhatsApp",
      href: "/profile",
      icon: UserCheck,
    },
  ];

  return (
    <div className="mb-8">
      {/* Top Banner with User Greeting */}
      <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User Avatar"}
                className="w-16 h-16 rounded-full border-2 border-[#D9E2E4] object-cover shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center text-xl font-bold shadow-xs">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#102124]">
                  {user.name || "Customer Dashboard"}
                </h1>
                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761]">
                    <Shield className="w-3 h-3 text-[#155761]" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-[#526267] mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#155761] bg-[#DDF4EC] hover:bg-[#c9ede2] border border-[#2F7D78]/25 transition-colors shadow-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Cart ({mounted ? totalCount : 0})</span>
            </Link>

            <Link
              href="/projects"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-medium text-[#102124] bg-white hover:bg-[#F3F7F7] border border-[#D9E2E4] transition-colors shadow-xs"
            >
              Browse Projects
            </Link>

            <Link
              href="/custom-project"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#155761] hover:bg-[#10474F] shadow-xs transition-colors"
            >
              Request Custom Build
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D9E2E4] pb-px overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-[#155761] text-[#155761] font-semibold"
                  : "border-transparent text-[#526267] hover:text-[#102124] hover:border-[#D9E2E4]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#155761]" : "text-[#526267]"}`} />
              <span>{tab.label}</span>
              {typeof tab.badge === "number" && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
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
