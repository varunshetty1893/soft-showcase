// components/layout/Footer.tsx
// Site-wide footer component with refined neutral palette and Soft Showcase brand accents.

import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/config/constants";

export function Footer() {
  return (
    <footer className="border-t border-[#D9E2E4] bg-white text-[#526267] shadow-[0_-1px_6px_rgba(16,33,36,0.02)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center group mb-1"
            >
              <Image
                src="/logo.png"
                alt={APP_NAME}
                width={150}
                height={31}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-[#526267] max-w-sm leading-relaxed">
              Curated software discovery and direct developer routing. Connect
              with verified creators, explore production-ready repositories, or request custom architecture.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-xs font-semibold text-[#155761]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F7D78] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2F7D78]"></span>
              </span>
              <span>Direct Routing Active</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102124] mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-[#526267]">
              <li>
                <Link href="/projects" className="hover:text-[#155761] transition-colors">
                  All Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/custom-project"
                  className="hover:text-[#155761] transition-colors"
                >
                  Request Custom Software
                </Link>
              </li>
              <li>
                <Link
                  href="/projects?category=web-application"
                  className="hover:text-[#155761] transition-colors"
                >
                  Web Applications
                </Link>
              </li>
              <li>
                <Link
                  href="/projects?category=mobile-app"
                  className="hover:text-[#155761] transition-colors"
                >
                  Mobile Apps
                </Link>
              </li>
              <li>
                <Link
                  href="/projects?category=ai-ml"
                  className="hover:text-[#155761] transition-colors"
                >
                  AI & Machine Learning
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102124] mb-4">
              Account & Access
            </h4>
            <ul className="space-y-2.5 text-sm text-[#526267]">
              <li>
                <Link href="/login" className="hover:text-[#155761] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#155761] transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href="/my-inquiries"
                  className="hover:text-[#155761] transition-colors"
                >
                  My Inquiries
                </Link>
              </li>
              <li>
                <Link
                  href="/my-requests"
                  className="hover:text-[#155761] transition-colors"
                >
                  Custom Requests
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[#D9E2E4] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#526267]">
          <p>© {new Date().getFullYear()} {APP_NAME}. Crafted for digital creators & engineering teams.</p>
          <p className="flex items-center gap-1.5 font-medium text-[#102124]">
            Direct maker connection • Zero buyer commission
          </p>
        </div>
      </div>
    </footer>
  );
}
