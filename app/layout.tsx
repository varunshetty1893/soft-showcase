// app/layout.tsx
// Root layout for Soft Showcase — applies to all pages.

import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_URL } from "@/config/constants";
import { AppProviders } from "@/components/providers/AppProviders";

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

export const viewport: Viewport = {
  themeColor: "#155761",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Soft Showcase - Discover Software Projects",
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Explore curated software projects, developer tools, and web applications built by verified creators. Connect directly with builders via WhatsApp and email.",
  keywords: [
    "software projects",
    "web applications",
    "mobile apps",
    "custom software",
    "software showcase",
    "developer tools",
    "software discovery",
  ],
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  alternates: {
    canonical: `${APP_URL}/`,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${APP_URL}/`,
    siteName: APP_NAME,
    title: "Soft Showcase - Discover Software Projects",
    description:
      "Explore curated software projects, developer tools, and web applications built by verified creators. Connect directly with builders via WhatsApp and email.",
    images: [
      {
        url: `${APP_URL}/logo.png`,
        width: 800,
        height: 600,
        alt: `${APP_NAME} — Software Discovery Platform`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Soft Showcase - Discover Software Projects",
    description:
      "Explore curated software projects, developer tools, and web applications built by verified creators. Connect directly with builders via WhatsApp and email.",
    images: [`${APP_URL}/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "H-ApiXzSdJL2QT8oYgA5nCkeket1TKISTftArJVJEgM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <head>
        <meta
          name="google-site-verification"
          content="H-ApiXzSdJL2QT8oYgA5nCkeket1TKISTftArJVJEgM"
        />
      </head>
      <body className="antialiased font-sans bg-[#F8FAFA] text-[#102124]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
