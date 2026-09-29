import Link from "next/link";
import { ArrowRight, Check, Rocket } from "lucide-react";

export function CtaBannerSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 w-full">
      <div className="relative rounded-3xl bg-[#155761] text-white overflow-hidden p-8 sm:p-12 md:p-16 shadow-xl">
        {/* Subtle Depth Accents */}
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-[#10474F] opacity-40 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-[#2F7D78] opacity-20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#DDF4EC] text-xs font-semibold mb-4 backdrop-blur-xs border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#DDF4EC]" />
            <span>Join Verified Builders &amp; Innovators</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
            Ready to showcase your software or discover your next build?
          </h2>

          <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8 max-w-2xl">
            Join our vetted community of independent engineers, product designers, and technical founders. Connect directly with makers or request custom architecture tailored to your specifications.
          </p>

          {/* CTA Actions */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#155761] font-bold text-sm shadow-md hover:bg-[#F3F7F7] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Rocket className="w-4 h-4 text-[#155761]" />
              <span>Explore All Projects</span>
            </Link>
            <Link
              href="/custom-project"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-white/15"
            >
              <span>Request Custom Software</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-white/80 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#DDF4EC]" />
              Direct developer routing
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#DDF4EC]" />
              Verified production repositories
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#DDF4EC]" />
              Zero buyer commission
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
