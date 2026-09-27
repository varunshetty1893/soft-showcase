// app/admin/inquiries/[id]/page.tsx
// Admin inquiry detail and management page.
// Source of truth: docs/25-inquiry-system.md & docs/08-page-specifications.md

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminInquiryById } from "@/lib/db/queries/inquiries";
import { InquiryDetailManager } from "@/components/admin/InquiryDetailManager";
import {
  ChevronLeft,
  User,
  Mail,
  Calendar,
  ExternalLink,
  Edit,
  FolderGit2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Manage Inquiry — Admin | Soft Showcase",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminInquiryDetailPage({ params }: Props) {
  const { id } = await params;
  const inquiry = await getAdminInquiryById(id);

  if (!inquiry) {
    notFound();
  }

  const formattedDate = new Date(inquiry.createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/inquiries"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Inquiries
        </Link>
        <span className="text-xs text-gray-400 font-mono">ID: {inquiry.id}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-950">
          Inquiry from {inquiry.name}
        </h1>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>Received on {formattedDate}</span>
        </p>
      </div>

      {/* 2-column Grid: Info & Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Project Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#155761]" />
              Customer Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Full Name</span>
                <span className="font-bold text-gray-900 text-sm">
                  {inquiry.name}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Email Address</span>
                <a
                  href={`mailto:${inquiry.email}`}
                  className="font-semibold text-[#155761] hover:underline text-sm truncate block"
                >
                  {inquiry.email}
                </a>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">WhatsApp Number</span>
                {inquiry.whatsapp ? (
                  <a
                    href={`https://wa.me/${inquiry.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-emerald-700 hover:underline text-sm block"
                  >
                    {inquiry.whatsapp}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Not provided</span>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Preferred Contact</span>
                <span className="font-semibold text-gray-900 text-sm">
                  {inquiry.contactMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Submitted Message Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#155761]" />
              Submitted Inquiry Message
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {inquiry.message}
            </div>
          </div>

          {/* Project & Provider Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-[#155761]" />
              Associated Project & Provider
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Project Card */}
              <div className="p-4 rounded-xl border border-gray-200/80 bg-white space-y-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Project
                </span>
                <div className="font-bold text-gray-950 text-sm">
                  {inquiry.project.title}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/projects/${inquiry.project.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-[#155761] hover:underline"
                  >
                    View Live <ExternalLink className="w-3 h-3" />
                  </Link>
                  <span className="text-gray-300">•</span>
                  <Link
                    href={`/admin/projects/${inquiry.project.id}/edit`}
                    className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                  >
                    Edit Project <Edit className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Provider Card */}
              <div className="p-4 rounded-xl border border-gray-200/80 bg-white space-y-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Assigned Provider
                </span>
                <div className="font-bold text-gray-950 text-sm">
                  {inquiry.provider.displayName}
                </div>
                <div className="text-gray-500 text-xs truncate">
                  {inquiry.provider.email}
                </div>
                <div className="pt-1">
                  <Link
                    href={`/admin/providers/${inquiry.provider.id}/edit`}
                    className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                  >
                    Edit Provider <Edit className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Notes Manager (1 col) */}
        <div className="space-y-6">
          <InquiryDetailManager
            inquiry={{
              id: inquiry.id,
              status: inquiry.status,
              notificationStatus: inquiry.notificationStatus,
              adminNotes: inquiry.adminNotes,
            }}
          />
        </div>
      </div>
    </div>
  );
}
