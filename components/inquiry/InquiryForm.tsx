// components/inquiry/InquiryForm.tsx
// Form component for sending project inquiries to providers.
// Source of truth: docs/25-inquiry-system.md & docs/12-component-architecture.md

"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface InquiryFormProps {
  projectId: string;
  projectTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InquiryForm({
  projectId,
  projectTitle,
  onSuccess,
  onCancel,
}: InquiryFormProps) {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    whatsapp: "",
    contactMethod: "EMAIL" as "EMAIL" | "WHATSAPP",
    message: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [isSuccess, setIsSuccess] = React.useState(false);

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
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

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Inquiry submission error:", err);
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Inquiry Sent Successfully!</h3>
        <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
          Your inquiry for <strong className="text-gray-900">{projectTitle}</strong> has been
          forwarded to the project provider. They will contact you shortly via {formData.contactMethod.toLowerCase()}.
        </p>
        <div className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsSuccess(false);
              setFormData({
                name: "",
                email: "",
                whatsapp: "",
                contactMethod: "EMAIL",
                message: "",
              });
              if (onCancel) onCancel();
            }}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="inquiry-name" className="text-xs font-semibold text-gray-700">
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
          <Label htmlFor="inquiry-email" className="text-xs font-semibold text-gray-700">
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
          <Label htmlFor="inquiry-whatsapp" className="text-xs font-semibold text-gray-700">
            WhatsApp Number <span className="text-gray-400 font-normal">(Optional)</span>
          </Label>
          <Input
            id="inquiry-whatsapp"
            name="whatsapp"
            type="tel"
            placeholder="+1 234 567 8900"
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
        <Label className="text-xs font-semibold text-gray-700">
          Preferred Contact Method
        </Label>
        <div className="flex gap-4 pt-1">
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="contactMethod"
              value="EMAIL"
              checked={formData.contactMethod === "EMAIL"}
              onChange={() => setFormData((p) => ({ ...p, contactMethod: "EMAIL" }))}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            Email
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="contactMethod"
              value="WHATSAPP"
              checked={formData.contactMethod === "WHATSAPP"}
              onChange={() => setFormData((p) => ({ ...p, contactMethod: "WHATSAPP" }))}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            WhatsApp
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="inquiry-message" className="text-xs font-semibold text-gray-700">
            Message <span className="text-red-500">*</span>
          </Label>
          <span className="text-[10px] text-gray-400">
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

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
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
          disabled={loading}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          {loading ? "Sending..." : "Submit Inquiry"}
        </Button>
      </div>
    </form>
  );
}
