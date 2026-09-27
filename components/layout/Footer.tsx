// components/layout/Footer.tsx
// Site-wide footer component with Teal Mint styling.
// Source of truth: docs/08-page-specifications.md

import Link from "next/link";
import { APP_NAME } from "@/config/constants";

export function Footer() {
  return (
    <footer className="border-t border-[#d8e5e7] bg-white text-[#40484a] shadow-[0_-1px_12px_rgba(24,78,88,0.03)]">
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#8cf7ce] to-transparent opacity-80" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#00373f]"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#00373f] text-[#8cf7ce] font-extrabold text-sm shadow-sm border border-[#184e58]">
                SS
              </span>
              <span className="font-extrabold tracking-tight">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-[#40484a] max-w-sm leading-relaxed">
              Curated software discovery and direct developer routing. Connect
              with verified creators, explore production-ready repositories, or request custom architecture.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e9f6f8] text-xs font-semibold text-[#00373f]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006c50] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006c50]"></span>
              </span>
              <span>Direct Routing Active</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#00373f] mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-[#40484a]">
              <li>
                <Link href="/projects" className="hover:text-[#006c50] transition-colors">
                  All Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/custom-project"
                  className="hover:text-[#006c50] transition-colors"
                >
                  Request Custom Software
                </Link>
              </li>
              <li>
                <Link
                  href="/projects?category=web-application"
                  className="hover:text-[#006c50] transition-colors"
                >
                  Web Applications
                </Link>
              </li>
              <li>
                <Link
                  href="/projects?category=mobile-app"
                  className="hover:text-[#006c50] transition-colors"
                >
                  Mobile Apps
                </Link>
              </li>
              <li>
                <Link
                  href="/projects?category=ai-ml"
                  className="hover:text-[#006c50] transition-colors"
                >
                  AI & Machine Learning
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#00373f] mb-4">
              Account & Access
            </h4>
            <ul className="space-y-2.5 text-sm text-[#40484a]">
              <li>
                <Link href="/login" className="hover:text-[#006c50] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#006c50] transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href="/my-inquiries"
                  className="hover:text-[#006c50] transition-colors"
                >
                  My Inquiries
                </Link>
              </li>
              <li>
                <Link
                  href="/my-requests"
                  className="hover:text-[#006c50] transition-colors"
                >
                  Custom Requests
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[#d8e5e7]/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#70787b]">
          <p>© {new Date().getFullYear()} {APP_NAME}. Crafted for digital creators & engineering teams.</p>
          <p className="flex items-center gap-1.5 font-medium text-[#40484a]">
            Direct maker connection • Zero buyer commission
          </p>
        </div>
      </div>
    </footer>
  );
}
