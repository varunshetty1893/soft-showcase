import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password — Soft Showcase",
  description: "Reset your Soft Showcase account password via email verification code.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
