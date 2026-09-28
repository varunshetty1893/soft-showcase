// components/layout/UserNavDropdown.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  MessageSquare,
  FileCode2,
  KeyRound,
  LogOut,
} from "lucide-react";

interface UserNavDropdownProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin?: boolean;
  };
  onSignOut: () => void;
}

export function UserNavDropdown({ user, onSignOut }: UserNavDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F3F7F7] border border-transparent hover:border-[#D9E2E4] transition-colors cursor-pointer"
        aria-expanded={open}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-8 h-8 rounded-full border border-[#D9E2E4] object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#155761] text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
          </div>
        )}

        <div className="hidden lg:block text-left">
          <div className="text-xs font-semibold text-[#102124] flex items-center gap-1">
            <span className="truncate max-w-[110px]">{user.name || "Account"}</span>
            {user.isAdmin && <ShieldCheck className="w-3 h-3 text-[#2F7D78]" />}
          </div>
          <div className="text-[10px] text-[#526267] truncate max-w-[110px]">
            {user.isAdmin ? "Administrator" : "User"}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#526267] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#D9E2E4] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* User Header */}
          <div className="px-4 py-2.5 border-b border-[#F3F7F7]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#102124] truncate">
                {user.name || "My Account"}
              </span>
              {user.isAdmin && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#DDF4EC] text-[#155761]">
                  Admin
                </span>
              )}
            </div>
            <div className="text-xs text-[#526267] truncate mt-0.5 font-mono">
              {user.email}
            </div>
          </div>

          <div className="py-1.5">
            {user.isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#155761] hover:bg-[#F3F7F7] transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-[#155761]" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            {user.isAdmin ? (
              <Link
                href="/admin/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#102124] hover:bg-[#F3F7F7] transition-colors"
              >
                <User className="w-4 h-4 text-[#526267]" />
                <span>Admin Profile</span>
              </Link>
            ) : (
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#102124] hover:bg-[#F3F7F7] transition-colors"
              >
                <User className="w-4 h-4 text-[#526267]" />
                <span>Profile Settings</span>
              </Link>
            )}

            <Link
              href="/my-inquiries"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#102124] hover:bg-[#F3F7F7] transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[#526267]" />
              <span>My Inquiries</span>
            </Link>

            <Link
              href="/my-requests"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#102124] hover:bg-[#F3F7F7] transition-colors"
            >
              <FileCode2 className="w-4 h-4 text-[#526267]" />
              <span>Custom Requests</span>
            </Link>

            {user.isAdmin ? (
              <Link
                href="/admin/profile?tab=password"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#102124] hover:bg-[#F3F7F7] transition-colors"
              >
                <KeyRound className="w-4 h-4 text-[#2F7D78]" />
                <span>Change / Reset Password</span>
              </Link>
            ) : (
              <Link
                href="/profile#password"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#102124] hover:bg-[#F3F7F7] transition-colors"
              >
                <KeyRound className="w-4 h-4 text-[#2F7D78]" />
                <span>Change Password</span>
              </Link>
            )}
          </div>

          <div className="pt-1.5 border-t border-[#F3F7F7]">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
