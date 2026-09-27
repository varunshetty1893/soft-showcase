// app/admin/custom-requests/[id]/page.tsx
// Admin custom project request detail and workflow management page.
// Source of truth: docs/26-custom-project-system.md & docs/08-page-specifications.md

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCustomRequestById } from "@/lib/db/queries/custom-requests";
import { CustomRequestDetailManager } from "@/components/admin/CustomRequestDetailManager";
import {
  ChevronLeft,
  User,
  Calendar,
  Wallet,
  Tag,
  FileCode2,
  ListChecks,
  PlusCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Manage Custom Request — Admin | Soft Showcase",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = await getAdminCustomRequestById(id);

  if (!request) {
    notFound();
  }

  const formattedDate = new Date(request.createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/custom-requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Custom Requests
        </Link>
        <span className="text-xs text-gray-400 font-mono">ID: {request.id}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-950">
          {request.projectTitle}
        </h1>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>Submitted by {request.name} on {formattedDate}</span>
        </p>
      </div>

      {/* 2-column Grid: Info & Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scope Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#155761]" />
              Customer Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Contact Name</span>
                <span className="font-bold text-gray-900 text-sm">
                  {request.name}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Email Address</span>
                <a
                  href={`mailto:${request.email}`}
                  className="font-semibold text-[#155761] hover:underline text-sm truncate block"
                >
                  {request.email}
                </a>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">WhatsApp Number</span>
                {request.whatsapp ? (
                  <a
                    href={`https://wa.me/${request.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-emerald-700 hover:underline text-sm block"
                  >
                    {request.whatsapp}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Project Parameters Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-[#155761]" />
              Project Parameters
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-1">Category</span>
                <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
                  <Tag className="w-3.5 h-3.5 text-[#155761]" />
                  {request.category || "Unspecified"}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-1">Budget</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  {request.budget || "Flexible"}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-1">Target Deadline</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  {request.deadline || "Flexible"}
                </span>
              </div>
            </div>

            {request.technologyPreferences && request.technologyPreferences.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Requested Technologies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {request.technologyPreferences.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description & Scope Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-[#155761]" />
                Detailed Project Description
              </h2>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {request.description}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#155761]" />
                Required Must-Have Features
              </h2>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {request.requiredFeatures}
              </div>
            </div>

            {request.additionalRequirements && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-[#155761]" />
                  Additional Requirements
                </h2>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {request.additionalRequirements}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workflow & Notes (1 col) */}
        <div className="space-y-6">
          <CustomRequestDetailManager
            request={{
              id: request.id,
              status: request.status,
              adminNotes: request.adminNotes,
            }}
          />
        </div>
      </div>
    </div>
  );
}
