// lib/email/templates/inquiry-status-update.ts
// Email sent to customer when partner moves their inquiry to a notable status.

import { escapeHtml } from "@/lib/email/escape";
import { APP_URL } from "@/config/constants";

export interface InquiryStatusUpdateEmailData {
  customerName: string;
  projectTitle: string;
  projectSlug: string;
  providerName: string;
  newStatus: "DISCUSSING" | "QUOTED" | "CONTACTED" | "CLOSED";
}

const STATUS_COPY: Record<string, { headline: string; body: string; badge: string; color: string }> = {
  CONTACTED: {
    headline: "Your inquiry has been acknowledged",
    body: "The solution provider has noted your inquiry and will reach out to you shortly.",
    badge: "Contacted",
    color: "#2F7D78",
  },
  DISCUSSING: {
    headline: "Your inquiry is under active discussion",
    body: "Great news! The solution provider is reviewing your requirements and would like to discuss further. Check your email or WhatsApp for their message.",
    badge: "In Discussion",
    color: "#1d6fb5",
  },
  QUOTED: {
    headline: "You have received a quote",
    body: "The solution provider has prepared a quote based on your requirements. Check your email or WhatsApp for the details.",
    badge: "Quoted",
    color: "#7c3aed",
  },
  CLOSED: {
    headline: "Your inquiry has been closed",
    body: "This inquiry has been marked as closed. If you have further questions, feel free to submit a new inquiry from the project page.",
    badge: "Closed",
    color: "#6b7280",
  },
};

export function renderInquiryStatusUpdateEmail(data: InquiryStatusUpdateEmailData) {
  const copy = STATUS_COPY[data.newStatus] ?? STATUS_COPY.CONTACTED;
  const customerName = escapeHtml(data.customerName);
  const projectTitle = escapeHtml(data.projectTitle);
  const providerName = escapeHtml(data.providerName);
  const portalUrl = `${APP_URL}/my-inquiries`;
  const projectUrl = `${APP_URL}/projects/${encodeURIComponent(data.projectSlug)}`;
  const safeColor = copy.color;
  const subject = `Update on Your Inquiry: ${data.projectTitle} \u2014 Soft Showcase`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.6;color:#1f2937;margin:0;padding:20px;background:#f3f4f6}
.w{max-width:600px;margin:0 auto}.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden}
.hdr{background:#102124;padding:24px 32px}.hdr h1{color:#fff;margin:0;font-size:18px;font-weight:700}.hdr p{color:#9ca3af;margin:4px 0 0;font-size:13px}
.bd{padding:32px}.badge{display:inline-block;background:${safeColor}1a;color:${safeColor};border:1px solid ${safeColor}40;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;margin-bottom:16px}
.hl{font-size:18px;font-weight:800;color:#111827;margin:0 0 10px}.msg{font-size:14px;color:#374151;margin:0 0 24px}
.box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 18px;margin:20px 0}
.box .lbl{font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;margin:0 0 3px}
.box .ttl{font-size:14px;font-weight:700;color:#111827;margin:0}.box .pvd{font-size:12px;color:#6b7280;margin:2px 0 0}
.btn{display:inline-block;background:#155761;color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700}
.sl{display:block;margin-top:12px;font-size:13px;color:#6b7280;text-decoration:none}
.ft{padding:20px 32px;border-top:1px solid #f3f4f6;background:#fafafa}.ft p{font-size:12px;color:#9ca3af;margin:0}
</style></head><body><div class="w"><div class="card">
<div class="hdr"><h1>Soft Showcase</h1><p>Inquiry Status Update</p></div>
<div class="bd">
<span class="badge">${escapeHtml(copy.badge)}</span>
<h2 class="hl">${escapeHtml(copy.headline)}</h2>
<p class="msg">Hi <strong>${customerName}</strong>, ${escapeHtml(copy.body)}</p>
<div class="box">
  <p class="lbl">Your Inquiry For</p>
  <p class="ttl"><a href="${projectUrl}" style="color:#155761;text-decoration:none">${projectTitle}</a></p>
  <p class="pvd">Provider: ${providerName}</p>
</div>
<a href="${portalUrl}" class="btn">View My Inquiries</a>
<a href="${projectUrl}" class="sl">View project page \u2192</a>
</div>
<div class="ft"><p>You received this because you submitted an inquiry on Soft Showcase. If this was not you, please ignore.</p></div>
</div></div></body></html>`;

  const text = `Soft Showcase \u2014 Inquiry Status Update\n\nStatus: ${copy.badge}\n${copy.headline}\n\nHi ${data.customerName},\n${copy.body}\n\nProject: ${data.projectTitle}\nProvider: ${data.providerName}\n\nView inquiries: ${portalUrl}\n\n\u2014 The Soft Showcase Team`;

  return { subject, html, text };
}
