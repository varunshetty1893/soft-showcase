// components/layout/Navbar.tsx
// Server component wrapper for Navbar — fetches session and provides server action for signOut.

import { auth, signOut } from "@/lib/auth/auth";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const session = await auth();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <NavbarClient
      user={session?.user ?? null}
      signOutAction={handleSignOut}
    />
  );
}
