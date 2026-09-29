import Image from "next/image";
import { Ban, FileCode2, Handshake, Sparkles } from "lucide-react";

export function ValuePropsSection() {
  return (
    <section id="why-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full scroll-mt-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Narrative */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <span className="text-xs font-bold text-[#155761] uppercase tracking-wider">
            Uncompromising Principles
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#102124] leading-tight">
            Built for clarity and direct connection.
          </h2>
          <p className="text-base sm:text-lg text-[#526267] leading-relaxed">
            Traditional discovery marketplaces take massive commissions and lock down conversations. Soft Showcase is calibrated exclusively for engineering fidelity and transparent peer validation.
          </p>

          {/* Brand Accent Fragment with real Logo */}
          <div className="p-4 rounded-xl bg-white border border-[#D9E2E4] flex items-center gap-4 mt-2 shadow-xs">
            <Image
              src="/logo.png"
              alt="Soft Showcase"
              width={110}
              height={23}
              className="h-6 w-auto object-contain shrink-0"
            />
            <div>
              <span className="text-xs font-bold text-[#102124] block">
                The Independent Standard
              </span>
              <span className="text-xs text-[#526267]">
                Connecting verified software creators and buyers
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 2x2 Feature Bento Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-white border border-[#D9E2E4] shadow-xs hover:shadow-sm hover:border-[#155761]/30 transition-all h-full">
            <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-[#155761] mb-4">
              <Ban className="w-5 h-5 text-[#155761]" />
            </div>
            <h3 className="font-bold text-[#102124] text-base mb-2">
              Zero Sponsored Noise
            </h3>
            <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
              Strict editorial standards where no provider can pay for algorithm promotion or featured slots.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-white border border-[#D9E2E4] shadow-xs hover:shadow-sm hover:border-[#155761]/30 transition-all h-full">
            <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-[#2F7D78] mb-4">
              <Handshake className="w-5 h-5 text-[#2F7D78]" />
            </div>
            <h3 className="font-bold text-[#102124] text-base mb-2">
              Direct Maker Channels
            </h3>
            <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
              Reach creators directly via encrypted WhatsApp and authenticated email without commission fees.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-white border border-[#D9E2E4] shadow-xs hover:shadow-sm hover:border-[#155761]/30 transition-all h-full">
            <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-[#2F7D78] mb-4">
              <FileCode2 className="w-5 h-5 text-[#2F7D78]" />
            </div>
            <h3 className="font-bold text-[#102124] text-base mb-2">
              Technical Deep-Dives
            </h3>
            <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
              Inspect stack details, database schemas, changelogs, and live interactive demos at a single glance.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-white border border-[#D9E2E4] shadow-xs hover:shadow-sm hover:border-[#155761]/30 transition-all h-full">
            <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-[#155761] mb-4">
              <Sparkles className="w-5 h-5 text-[#155761]" />
            </div>
            <h3 className="font-bold text-[#102124] text-base mb-2">
              Custom Builds on Demand
            </h3>
            <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
              Need tailored architecture? Submit your specifications and our team pairs you with a verified developer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
