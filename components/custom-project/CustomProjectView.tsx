// components/custom-project/CustomProjectView.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  FileCode2,
  ShieldCheck,
  Clock,
  Users,
  PlusCircle,
  FolderOpen,
} from "lucide-react";
import {
  CustomProjectForm,
  type CustomProjectInitialContact,
} from "@/components/custom-project/CustomProjectForm";
import { CustomerRequestsList } from "@/components/customer/CustomerRequestsList";
import { Button } from "@/components/ui/button";

interface CustomerRequestItem {
  id: string;
  projectTitle: string;
  category?: string | null;
  budget?: string | null;
  deadline?: string | null;
  description: string;
  requiredFeatures?: string | null;
  technologyPreferences?: string[] | null;
  status: any;
  createdAt: string | Date;
}

interface CustomProjectViewProps {
  initialContact?: CustomProjectInitialContact;
  requests: CustomerRequestItem[];
  initialTab?: "new" | "requests";
}

export function CustomProjectView({
  initialContact,
  requests,
  initialTab = "new",
}: CustomProjectViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = React.useState<"new" | "requests">(() => {
    if (paramTab === "requests") return "requests";
    if (paramTab === "new") return "new";
    return initialTab;
  });

  const handleTabChange = (tab: "new" | "requests") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "requests") {
      params.set("tab", "requests");
    } else {
      params.delete("tab");
    }
    const query = params.toString();
    router.replace(query ? `/custom-project?${query}` : "/custom-project", {
      scroll: false,
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-xs font-semibold text-[#155761]">
          <Sparkles className="w-3.5 h-3.5 text-[#2F7D78]" />
          <span>Bespoke Engineering Services</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#102124]">
          Custom Software Projects
        </h1>
        <p className="text-sm sm:text-base text-[#526267] max-w-xl mx-auto leading-relaxed">
          Request a tailored software architecture built to your exact specifications, or track the review and development details of your submitted scopes.
        </p>
      </div>

      {/* Segmented Switcher Bar */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1 rounded-2xl bg-white border border-[#D9E2E4] shadow-xs gap-1">
          <button
            type="button"
            onClick={() => handleTabChange("new")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "new"
                ? "bg-[#155761] text-white shadow-xs"
                : "text-[#526267] hover:text-[#102124] hover:bg-[#F3F7F7]"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Request New Build</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("requests")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "requests"
                ? "bg-[#155761] text-white shadow-xs"
                : "text-[#526267] hover:text-[#102124] hover:bg-[#F3F7F7]"
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>My Custom Requests</span>
            {requests.length > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "requests"
                    ? "bg-white/20 text-white"
                    : "bg-[#DDF4EC] text-[#155761]"
                }`}
              >
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Submit Form */}
      {activeTab === "new" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Value Props Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#D9E2E4] flex items-center gap-3 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-[#155761] shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-[#102124] block">Verified Builders</span>
                <span className="text-[#526267]">Vetted engineering architects</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#D9E2E4] flex items-center gap-3 shadow-xs">
              <Clock className="w-5 h-5 text-[#2F7D78] shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-[#102124] block">24-48h Response</span>
                <span className="text-[#526267]">Rapid architectural review</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#D9E2E4] flex items-center gap-3 shadow-xs">
              <Users className="w-5 h-5 text-[#155761] shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-[#102124] block">Direct Collaboration</span>
                <span className="text-[#526267]">Transparent scope &amp; milestones</span>
              </div>
            </div>
          </div>

          <CustomProjectForm initialContact={initialContact} />
        </div>
      )}

      {/* Tab 2: Request Details & History */}
      {activeTab === "requests" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9E2E4]">
            <div>
              <h2 className="text-xl font-bold text-[#102124]">Submitted Project Scopes</h2>
              <p className="text-xs text-[#526267] mt-0.5">
                Review review statuses, timeline estimates, and specifications for your bespoke requests.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTabChange("new")}
              className="gap-1.5 text-xs text-[#155761] font-semibold border-[#155761]/30 hover:bg-[#F3F7F7] self-start sm:self-auto"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Request
            </Button>
          </div>

          {requests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#D9E2E4] p-12 text-center shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mx-auto">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#102124]">No Custom Requests Yet</h3>
                <p className="text-xs text-[#526267] max-w-md mx-auto">
                  You haven&apos;t submitted any custom software requests. Outline your project idea and our engineering team will evaluate it.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleTabChange("new")}
                className="gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Submit Your First Request
              </Button>
            </div>
          ) : (
            <CustomerRequestsList initialRequests={requests} />
          )}
        </div>
      )}
    </div>
  );
}
