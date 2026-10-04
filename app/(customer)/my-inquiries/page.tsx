// app/(customer)/my-inquiries/page.tsx
// Customer inquiries history page with search and pagination.
// Source of truth: docs/25-inquiry-system.md & docs/36-development-roadmap.md

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCustomerInquiries } from "@/lib/db/queries/customer";
import { buttonVariants } from "@/components/ui/button";
import { Layers, MessageSquare } from "lucide-react";
import { CustomerInquiriesList } from "@/components/customer/CustomerInquiriesList";

export const metadata: Metadata = {
  title: "My Inquiries — Soft Showcase",
  description: "Track your project inquiries and provider correspondence.",
};

export default async function MyInquiriesPage() {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    redirect("/login");
  }

  const rawInquiries = await getCustomerInquiries(session.user.id);

  const serializedInquiries = rawInquiries.map((inq: any) => ({
    id: inq.id,
    status: inq.status,
    message: inq.message,
    contactMethod: inq.contactMethod,
    createdAt: inq.createdAt instanceof Date ? inq.createdAt.toISOString() : inq.createdAt,
    project: inq.project
      ? {
          id: inq.project.id,
          title: inq.project.title,
          slug: inq.project.slug,
          images: inq.project.images,
        }
      : null,
    provider: {
      id: inq.provider.id,
      displayName: inq.provider.displayName,
      email: inq.provider.email,
    },
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#102124]">
            Project Inquiries
          </h2>
          <p className="text-sm text-[#526267] mt-1">
            Track inquiries you have sent to software providers.
          </p>
        </div>

        <Link href="/projects" className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 text-xs" })}>
          <Layers className="w-3.5 h-3.5 text-[#155761]" />
          Explore More Projects
        </Link>
      </div>

      {serializedInquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#102124] mb-1">
            No inquiries submitted yet
          </h3>
          <p className="text-sm text-[#526267] max-w-md mx-auto mb-6">
            Found a software project you are interested in? Inquire directly from any
            project detail page to discuss details and pricing with the verified builder.
          </p>
          <Link href="/projects" className={buttonVariants({ variant: "primary", size: "md" })}>
            Browse Available Projects
          </Link>
        </div>
      ) : (
        <CustomerInquiriesList initialInquiries={serializedInquiries} />
      )}
    </div>
  );
}
