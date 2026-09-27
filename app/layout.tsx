// app/layout.tsx
// Root layout for Soft Showcase — applies to all pages.

import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_URL } from "@/config/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Discover Software Projects`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Browse and connect with quality software projects. Find web apps, mobile apps, e-commerce solutions, and more — or request a custom build.",
  keywords: [
    "software projects",
    "web applications",
    "mobile apps",
    "custom software",
    "freelance developers",
    "software marketplace",
  ],
  authors: [{ name: APP_NAME }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Discover Software Projects`,
    description:
      "Browse and connect with quality software projects. Find web apps, mobile apps, e-commerce solutions, and more.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: `${APP_NAME} — Software Project Discovery Platform`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Discover Software Projects`,
    description:
      "Browse and connect with quality software projects.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <body className="antialiased font-sans bg-[#F8FAFA] text-[#102124]">
        {children}
      </body>
    </html>
  );
}
