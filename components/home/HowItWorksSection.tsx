import { MessageCircle, Rocket, Search, ShieldCheck, Terminal, Zap } from "lucide-react";
import { FadeUp } from "@/components/ui/fade-up";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full bg-[#F8FAFA] py-20 px-4 sm:px-6 lg:px-8 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#155761] uppercase tracking-wider">
              Methodology
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#102124] mt-1">
              How Soft Showcase Works
            </h2>
            <p className="text-sm sm:text-base text-[#526267] mt-2 leading-relaxed">
              From technical inspection to production adoption, discovery is engineered to be frictionless and reliable.
            </p>
          </div>
        </FadeUp>

        {/* 3 Steps Connected Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <FadeUp delay={0} className="h-full">
            <div className="rounded-2xl bg-white p-8 border border-[#D9E2E4] shadow-xs flex flex-col justify-between group hover:shadow-md hover:border-[#155761]/30 transition-all duration-200 h-full">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-sm font-bold text-[#155761]">
                    01
                  </span>
                  <Search className="w-5 h-5 text-[#2F7D78]" />
                </div>
                <h3 className="text-lg font-bold text-[#102124] mb-3">
                  Discover &amp; Evaluate
                </h3>
                <p className="text-sm text-[#526267] leading-relaxed mb-6">
                  Browse verified software with unfiltered metrics, technical architecture breakdowns, and direct demo access.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#2F7D78] shrink-0" />
                <span className="text-xs text-[#102124] font-medium">
                  Strict sanity check on code &amp; uptime
                </span>
              </div>
            </div>
          </FadeUp>

          {/* Step 2 */}
          <FadeUp delay={0.1} className="h-full">
            <div className="rounded-2xl bg-white p-8 border border-[#D9E2E4] shadow-xs flex flex-col justify-between group hover:shadow-md hover:border-[#155761]/30 transition-all duration-200 h-full">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-sm font-bold text-[#155761]">
                    02
                  </span>
                  <MessageCircle className="w-5 h-5 text-[#2F7D78]" />
                </div>
                <h3 className="text-lg font-bold text-[#102124] mb-3">
                  Connect with Makers
                </h3>
                <p className="text-sm text-[#526267] leading-relaxed mb-6">
                  Direct communication channels with verified builders and lead engineers without middleman friction or fee markups.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center gap-3">
                <Zap className="w-4 h-4 text-[#2F7D78] shrink-0" />
                <span className="text-xs text-[#102124] font-medium">
                  Encrypted WhatsApp &amp; direct email
                </span>
              </div>
            </div>
          </FadeUp>

          {/* Step 3 */}
          <FadeUp delay={0.2} className="h-full">
            <div className="rounded-2xl bg-white p-8 border border-[#D9E2E4] shadow-xs flex flex-col justify-between group hover:shadow-md hover:border-[#155761]/30 transition-all duration-200 h-full">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-sm font-bold text-[#155761]">
                    03
                  </span>
                  <Rocket className="w-5 h-5 text-[#2F7D78]" />
                </div>
                <h3 className="text-lg font-bold text-[#102124] mb-3">
                  Ship &amp; Integrate
                </h3>
                <p className="text-sm text-[#526267] leading-relaxed mb-6">
                  Acquire the codebase directly, hire the provider for customized adaptations, or kickstart your own production rollout.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center gap-3">
                <Terminal className="w-4 h-4 text-[#2F7D78] shrink-0" />
                <span className="text-xs text-[#102124] font-medium">
                  Repository handover or custom engineering
                </span>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
