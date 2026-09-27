"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function AdminSignOutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut({ callbackUrl: "/" });
    } catch {
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      title="Sign Out"
      className="p-1.5 text-[#526267] hover:text-[#102124] hover:bg-[#F3F7F7] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
