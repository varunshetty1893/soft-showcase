import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, Rocket, ShieldCheck } from "lucide-react";
import { FadeUp } from "@/components/ui/fade-up";

export function HeroSection() {
  return (
    <div className="relative w-full overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24">
      {/* Subtle Technical Dot Pattern */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#52626712_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Subtle Ambient Depth */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#155761]/5 via-[#F3F7F7]/60 to-transparent blur-3xl rounded-full z-0" />

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* Top Badge */}
        <FadeUp delay={0} y={20}>
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white shadow-xs border border-[#D9E2E4] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F7D78] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2F7D78]" />
            </span>
            <span className="text-xs font-semibold text-[#102124] tracking-wide uppercase">
              Curated Software Discovery
            </span>
            <span className="w-1 h-1 rounded-full bg-[#D9E2E4]" />
            <span className="text-xs font-semibold text-[#155761]">
              Verified Direct Routing
            </span>
          </div>
        </FadeUp>

        {/* Hero Headline */}
        <FadeUp delay={0.08} y={24}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[62px] font-bold tracking-tight text-[#102124] max-w-4xl mx-auto leading-[1.12] mb-6">
            Discover exceptional software crafted with{" "}
            <span className="text-[#155761]">precision and purpose.</span>
          </h1>
        </FadeUp>

        {/* Subtitle */}
        <FadeUp delay={0.16} y={24}>
          <p className="text-base sm:text-lg md:text-xl text-[#526267] max-w-2xl mx-auto mb-10 leading-relaxed">
            Explore handpicked software solutions, developer toolkits, and production-ready applications built by verified creators worldwide. Connect directly via WhatsApp or email with zero middleman fees.
          </p>
        </FadeUp>

        {/* CTA Action Buttons (Valid HTML: standard styled Links, no nested buttons) */}
        <FadeUp delay={0.24} y={24}>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#155761] text-white font-semibold text-sm shadow-xs hover:bg-[#10474F] hover:shadow transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Explore Showcase</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/custom-project"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[#102124] font-semibold text-sm shadow-xs border border-[#D9E2E4] hover:bg-[#F3F7F7] hover:border-[#155761]/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Rocket className="w-4 h-4 text-[#155761]" />
              <span>Request Custom Build</span>
            </Link>
          </div>
        </FadeUp>

        {/* Live Metric Chips */}
        <FadeUp delay={0.32} y={20}>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#526267] mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#D9E2E4] shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-[#2F7D78]" />
              <span>
                <strong className="text-[#102124] font-semibold">Verified</strong> Independent Providers
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#D9E2E4] shadow-xs">
              <MessageCircle className="w-4 h-4 text-[#2F7D78]" />
              <span>
                <strong className="text-[#102124] font-semibold">Direct</strong> WhatsApp &amp; Email Routing
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#D9E2E4] shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#2F7D78]" />
              <span>
                <strong className="text-[#102124] font-semibold">100%</strong> Zero Middleman Fees
              </span>
            </div>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
