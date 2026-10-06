import Link from "next/link";
import { FadeUp } from "@/components/ui/fade-up";

export function PartnerTeaserSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
      <FadeUp>
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2F7D78]">
              For Developers, Agencies &amp; Creators
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#102124]">
              Are you building production-grade software?
            </h3>
            <p className="text-xs sm:text-sm text-[#526267] max-w-xl leading-relaxed">
              Showcase your applications, receive direct customer enquiries, record transactions, and build a verified client base on Soft Showcase.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/become-a-partner"
              className="px-5 py-2.5 rounded-xl bg-[#155761] hover:bg-[#10474F] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer inline-block"
            >
              Become a Solution Partner
            </Link>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
