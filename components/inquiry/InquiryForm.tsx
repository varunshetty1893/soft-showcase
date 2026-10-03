// components/inquiry/InquiryForm.tsx
// Form component for sending project inquiries to providers.
// Source of truth: docs/25-inquiry-system.md & docs/12-component-architecture.md

"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/security/TurnstileWidget";

interface InquiryFormProps {
  projectId: string;
  projectTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialContact?: {
    name?: string;
    email?: string;
    whatsapp?: string;
  };
}

export function InquiryForm({
  projectId,
  projectTitle,
  onSuccess,
  onCancel,
  initialContact,
}: InquiryFormProps) {
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const isVerifiedUser = Boolean(session?.user?.id && session?.user?.email);

  const [formData, setFormData] = React.useState({
    name: initialContact?.name || "",
    email: initialContact?.email || "",
    whatsapp: initialContact?.whatsapp || "",
    contactMethod: "EMAIL" as "EMAIL" | "WHATSAPP",
    message: "",
  });

  // Anti-spam fields (N1): honeypot, mount timestamp, and Turnstile token
  const [website, setWebsite] = React.useState("");
  const [formSubmittedAt] = React.useState<number>(() => Date.now());
  const [turnstileToken, setTurnstileToken] = React.useState<string>("");
  const turnstileRef = React.useRef<TurnstileWidgetHandle | null>(null);

  React.useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || session.user.name || "",
        email: prev.email || session.user.email || "",
      }));

      fetch("/api/user/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setFormData((prev) => ({
              ...prev,
              name: prev.name || data.user.name || session.user.name || "",
              email:
                prev.email === "" || prev.email === session.user.email
                  ? data.user.contactEmail || data.user.email || prev.email
                  : prev.email,
              whatsapp: prev.whatsapp || data.user.whatsapp || "",
            }));
          }
        })
        .catch(() => null);
    }
  }, [session]);

  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  function resetTurnstile() {
    setTurnstileToken("");
    turnstileRef.current?.reset();
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isVerifiedUser && !turnstileToken) {
      setErrorMessage("Please complete the security verification before submitting.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          whatsapp: formData.whatsapp.trim() || undefined,
          contactMethod: formData.contactMethod,
          message: formData.message.trim(),
          website,
          formSubmittedAt,
          turnstileToken: !isVerifiedUser ? turnstileToken : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        resetTurnstile();
        if (res.status === 429) {
          setErrorMessage("Too many inquiries sent. Please wait a few minutes before trying again.");
        } else if (data.details) {
          setFieldErrors(data.details);
          setErrorMessage("Please correct the errors in the form.");
        } else {
          setErrorMessage(data.error || "Failed to submit inquiry. Please try again.");
        }
        return;
      }

      setSuccessMessage(
        typeof data?.data?.message === "string"
          ? data.data.message
          : "Your inquiry has been saved for the project provider."
      );
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Inquiry submission error:", err);
      resetTurnstile();
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="w-12 h-12 bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/25 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-[#102124]">Inquiry Received</h3>
        <p className="text-sm text-[#526267] max-w-sm mx-auto leading-relaxed">
          <strong className="text-[#102124]">{projectTitle}:</strong>{" "}
          {successMessage || "Your inquiry has been saved for the project provider."}
        </p>
        <div className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsSuccess(false);
              setSuccessMessage(null);
              setFormData({
                name: initialContact?.name || session?.user?.name || "",
                email: initialContact?.email || session?.user?.email || "",
                whatsapp: initialContact?.whatsapp || "",
                contactMethod: "EMAIL",
                message: "",
              });
              resetTurnstile();
              if (onCancel) onCancel();
            }}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  const isSubmitDisabled = loading || (!isVerifiedUser && !turnstileToken);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Honeypot field: hidden from sighted users and assistive technologies */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden opacity-0 pointer-events-none"
      >
        <label htmlFor="inquiry-website">Website</label>
        <input
          id="inquiry-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inquiry-name" className="text-xs font-semibold text-[#102124]">
          Your Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="inquiry-name"
          name="name"
          type="text"
          required
          placeholder="e.g. Sarah Jenkins"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
        />
        {fieldErrors.name && (
          <p className="text-[11px] text-red-600">{fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="inquiry-email" className="text-xs font-semibold text-[#102124]">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="inquiry-email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />
          {fieldErrors.email && (
            <p className="text-[11px] text-red-600">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="inquiry-whatsapp" className="text-xs font-semibold text-[#102124]">
            WhatsApp Number{" "}
            {formData.contactMethod === "WHATSAPP" ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="text-[#526267] font-normal">(Optional)</span>
            )}
          </Label>
          <Input
            id="inquiry-whatsapp"
            name="whatsapp"
            type="tel"
            required={formData.contactMethod === "WHATSAPP"}
            placeholder="+91 98765 43210"
            value={formData.whatsapp}
            onChange={handleChange}
            disabled={loading}
          />
          {fieldErrors.whatsapp && (
            <p className="text-[11px] text-red-600">{fieldErrors.whatsapp[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-[#102124]">
          Preferred Contact Method
        </Label>
        <div className="flex gap-4 pt-1">
          <label className="flex items-center gap-2 text-xs text-[#102124] cursor-pointer">
            <input
              type="radio"
              name="contactMethod"
              value="EMAIL"
              checked={formData.contactMethod === "EMAIL"}
              onChange={() => setFormData((p) => ({ ...p, contactMethod: "EMAIL" }))}
              className="text-[#155761] focus:ring-[#155761]"
            />
            Email
          </label>
          <label className="flex items-center gap-2 text-xs text-[#102124] cursor-pointer">
            <input
              type="radio"
              name="contactMethod"
              value="WHATSAPP"
              checked={formData.contactMethod === "WHATSAPP"}
              onChange={() => setFormData((p) => ({ ...p, contactMethod: "WHATSAPP" }))}
              className="text-[#155761] focus:ring-[#155761]"
            />
            WhatsApp
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="inquiry-message" className="text-xs font-semibold text-[#102124]">
            Message <span className="text-red-500">*</span>
          </Label>
          <span className="text-[10px] text-[#526267]">
            {formData.message.length}/2000
          </span>
        </div>
        <Textarea
          id="inquiry-message"
          name="message"
          rows={4}
          required
          maxLength={2000}
          placeholder="Describe your requirements, questions about pricing, features, or timeline..."
          value={formData.message}
          onChange={handleChange}
          disabled={loading}
        />
        {fieldErrors.message && (
          <p className="text-[11px] text-red-600">{fieldErrors.message[0]}</p>
        )}
      </div>

      {/* Turnstile widget shown only to visitors not signed in with a verified email (N1) */}
      {!isVerifiedUser && (
        <div className="pt-1">
          <TurnstileWidget
            ref={turnstileRef}
            onVerify={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken("")}
            onError={() => setTurnstileToken("")}
            theme="light"
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E2E4]">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            size="sm"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          disabled={isSubmitDisabled}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          {loading ? "Sending..." : "Submit Inquiry"}
        </Button>
      </div>
    </form>
  );
}
