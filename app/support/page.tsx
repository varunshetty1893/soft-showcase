// app/support/page.tsx
// Public Help Center and Support page for Soft Showcase.
// Explains the direct maker routing model, common questions, and links to customer ticket management.

import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import {
  HelpCircle,
  MessageSquare,
  FileCode,
  Headphones,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: `Help Center & Support — ${APP_NAME}`,
  description:
    "Find answers to frequently asked questions about project discovery, contacting verified software creators, custom requests, and support.",
};

const FAQS = [
  {
    category: "Platform & Business Model",
    questions: [
      {
        q: "What is Soft Showcase?",
        a: "Soft Showcase is a curated software discovery catalog and maker-routing platform. We showcase production-grade web applications, mobile apps, and machine learning architectures built by verified independent engineers and digital studios.",
      },
      {
        q: "Does Soft Showcase charge buyer commissions or platform fees?",
        a: "No. In V1, Soft Showcase charges zero buyer fees and zero transaction commissions. You explore projects freely, and all commercial arrangements or code handovers are agreed directly between you and the project creator.",
      },
      {
        q: "How does payment and project handover work?",
        a: "All negotiations, commercial terms, milestone payments, and code deliveries are conducted directly between you and the verified provider outside the platform. Soft Showcase does not hold funds or act as an escrow agent.",
      },
    ],
  },
  {
    category: "Contacting Creators",
    questions: [
      {
        q: "How do I reach a project creator?",
        a: "On every published project page, you can choose 'Discuss on WhatsApp' (which opens a pre-filled chat with the builder) or 'Send Email Inquiry' (which routes your query directly to the creator's inbox).",
      },
      {
        q: "Is my contact information safe?",
        a: "Yes. When you submit an inquiry, your contact details are forwarded solely to the specific project provider you chose to reach. We never sell or share contact details with third-party advertisers.",
      },
      {
        q: "Where can I see inquiries I have already submitted?",
        a: "When you sign in to your Soft Showcase account, all your submitted project inquiries are recorded in your dashboard under 'My Enquiries' (/my-inquiries).",
      },
    ],
  },
  {
    category: "Custom Software & Tickets",
    questions: [
      {
        q: "What if I need a tailored or custom software system?",
        a: "If your required solution is not in the catalog, submit a request via our 'Request Custom Software' page (/custom-project). You can specify tech stack preferences, budget ranges, and requirements.",
      },
      {
        q: "How do I get technical assistance from Soft Showcase?",
        a: "If you have an account or active customer profile, you can open and track technical support tickets directly in your Help & Support dashboard (/my-support).",
      },
    ],
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] text-[#102124]">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* ── Breadcrumb ──────────────────────────────────────────────── */}
          <nav className="flex items-center gap-2 text-xs text-[#526267]">
            <Link href="/" className="hover:text-[#155761] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-[#526267]" />
            <span className="text-[#102124] font-medium">Support &amp; Help Center</span>
          </nav>

          {/* ── Hero Banner ─────────────────────────────────────────────── */}
          <div className="rounded-3xl bg-white border border-[#D9E2E4] p-8 sm:p-12 shadow-xs space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-xs font-bold text-[#155761]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Customer Help &amp; Knowledge Base</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#102124] tracking-tight">
              How Can We Help You?
            </h1>
            <p className="text-sm sm:text-base text-[#526267] max-w-2xl leading-relaxed">
              Learn how Soft Showcase connects you directly with independent builders, how inquiries and custom requests work, and where to track your conversations.
            </p>
          </div>

          {/* ── Quick Action Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Link
              href="/projects"
              className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs hover:border-[#155761] hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] flex items-center justify-center text-[#155761] mb-4 group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-[#102124] mb-1">
                  Explore Software
                </h2>
                <p className="text-xs text-[#526267] leading-relaxed">
                  Browse vetted production applications, mobile platforms, and AI engines ready for deployment.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#155761]">
                <span>Browse Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/custom-project"
              className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs hover:border-[#155761] hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] flex items-center justify-center text-[#155761] mb-4 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-[#102124] mb-1">
                  Custom Builds
                </h2>
                <p className="text-xs text-[#526267] leading-relaxed">
                  Have unique requirements or need a bespoke stack? Submit a custom scope for review.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#155761]">
                <span>Request Custom Project</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/my-support"
              className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs hover:border-[#155761] hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#DDF4EC] flex items-center justify-center text-[#2F7D78] mb-4 group-hover:scale-105 transition-transform">
                  <Headphones className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-[#102124] mb-1">
                  Support Dashboard
                </h2>
                <p className="text-xs text-[#526267] leading-relaxed">
                  Sign in to view existing tickets, track resolution status, or submit a new inquiry.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#2F7D78]">
                <span>Open Support Tickets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>

          {/* ── FAQs Section ────────────────────────────────────────────── */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-[#102124] tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-[#526267] mt-1">
                Everything you need to know about the platform workflow.
              </p>
            </div>

            <div className="space-y-6">
              {FAQS.map((section) => (
                <div
                  key={section.category}
                  className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6"
                >
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#155761] border-b border-[#F3F7F7] pb-3">
                    {section.category}
                  </h3>
                  <div className="space-y-5">
                    {section.questions.map((faq) => (
                      <div key={faq.q} className="space-y-1.5">
                        <h4 className="text-sm sm:text-base font-bold text-[#102124]">
                          {faq.q}
                        </h4>
                        <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Partner & Maker CTA ─────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-[#D9E2E4] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
            <div className="space-y-1 max-w-xl">
              <h3 className="text-base font-bold text-[#102124]">
                Are you a software engineer or studio?
              </h3>
              <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
                Showcase your production-ready repositories and turnkey products to global founders and engineering teams with verified maker credentials.
              </p>
            </div>
            <Link
              href="/become-a-partner"
              className={buttonVariants({
                variant: "primary",
                size: "md",
                className: "shrink-0 text-xs font-semibold gap-1.5",
              })}
            >
              <span>Join as Solution Partner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
