"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ShieldCheck, Mail, Lock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/inquiry/WhatsAppButton";
import { InquiryModal } from "@/components/inquiry/InquiryModal";

interface ProviderData {
  id: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  showWhatsapp?: boolean;
}

interface ProviderCardProps {
  provider: ProviderData;
  projectTitle?: string;
  projectId?: string;
  projectSlug: string;
}

export function ProviderCard({
  provider,
  projectTitle = "Project",
  projectId,
  projectSlug,
}: ProviderCardProps) {
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const hasWhatsApp = Boolean(provider.whatsappNumber && provider.showWhatsapp !== false);

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          {provider.avatarUrl ? (
            <div className="relative w-14 h-14 rounded-full overflow-hidden border border-[#D9E2E4] shrink-0">
              <Image
                src={provider.avatarUrl}
                alt={provider.displayName}
                fill
                sizes="56px"
                className="object-cover"
                referrerPolicy="no-referrer"
                unoptimized={provider.avatarUrl.startsWith("data:")}
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center font-bold text-lg">
              {provider.displayName[0]?.toUpperCase() || "P"}
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-[#102124]">{provider.displayName}</h3>
              <span title="Verified Solution Partner">
                <ShieldCheck className="w-4 h-4 text-[#2F7D78]" />
              </span>
            </div>
            <span className="text-xs text-[#2F7D78] font-medium">Verified Solution Partner</span>
          </div>
        </div>

        {provider.bio && (
          <p className="text-xs text-[#526267] leading-relaxed border-t border-[#F3F7F7] pt-3">
            {provider.bio}
          </p>
        )}

        {/* Action buttons */}
        {!session?.user ? (
          <div className="space-y-3 pt-2">
            <div className="p-3.5 bg-[#F8FAFA] rounded-xl border border-[#D9E2E4] text-xs text-[#526267] text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 font-bold text-[#102124]">
                <Lock className="w-3.5 h-3.5 text-[#155761]" />
                <span>Sign In to Communicate</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#526267]">
                Sign in to your account to chat on WhatsApp or send an inquiry to this Solution Partner.
              </p>
              <Link
                href={`/login?callbackUrl=/projects/${projectSlug}`}
                className={buttonVariants({
                  variant: "primary",
                  size: "md",
                  className: "w-full text-xs font-bold gap-1.5 shadow-xs block text-center mt-1",
                })}
              >
                Sign In to Inquire
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 pt-2">
            {hasWhatsApp && (
              <WhatsAppButton projectSlug={projectSlug} projectId={projectId} />
            )}

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setIsModalOpen(true)}
              className="w-full gap-2 text-sm font-semibold cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[#155761]" />
              Send Email Inquiry
            </Button>
          </div>
        )}

        <p className="text-[11px] text-[#526267] text-center leading-normal">
          Direct partner communication. Inquiries are delivered directly to {provider.displayName}.
        </p>
      </div>

      {projectId && session?.user && (
        <InquiryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          projectId={projectId}
          projectTitle={projectTitle}
        />
      )}
    </>
  );
}
