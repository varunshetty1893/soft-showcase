// components/partner/PartnerSolutionForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code2,
  Star,
  Upload,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Info,
  X,
  ExternalLink,
  FileCode,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Category {
  id: string;
  name: string;
}

interface Technology {
  id: string;
  name: string;
}

export interface PhotoItem {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  storageKey?: string;
}

export interface SolutionErrorItem {
  field: string;
  title: string;
  message: string;
  currentCount?: number;
  maxLimit?: number;
  canTrim?: boolean;
}

function parseSolutionErrors(
  errorData: any,
  counts: {
    whatsIncluded: number;
    features: number;
    specifications: number;
    faqs: number;
    technologies: number;
  }
): SolutionErrorItem[] {
  const items: SolutionErrorItem[] = [];
  const rawFieldErrors = errorData?.details?.fieldErrors || {};
  const processed = new Set<string>();

  const fieldDefinitions: Record<
    string,
    { title: string; maxLimit?: number; canTrim?: boolean; getSimpleMsg: (count?: number) => string }
  > = {
    whatsIncluded: {
      title: "What's Included",
      maxLimit: 20,
      canTrim: counts.whatsIncluded > 20,
      getSimpleMsg: (c = counts.whatsIncluded) =>
        `Too many items in What's Included. Please limit to 20 items (you currently have ${c} items).`,
    },
    features: {
      title: "Key Features",
      maxLimit: 25,
      canTrim: counts.features > 25,
      getSimpleMsg: (c = counts.features) =>
        `Too many features listed. Please limit to 25 features (you currently have ${c} features).`,
    },
    specifications: {
      title: "Technical Specifications",
      maxLimit: 25,
      canTrim: counts.specifications > 25,
      getSimpleMsg: (c = counts.specifications) =>
        `Too many specifications. Please limit to 25 items (you currently have ${c}).`,
    },
    faqs: {
      title: "Frequently Asked Questions",
      maxLimit: 20,
      canTrim: counts.faqs > 20,
      getSimpleMsg: (c = counts.faqs) =>
        `Too many FAQs. Please limit to 20 questions (you currently have ${c}).`,
    },
    technologies: {
      title: "Technologies",
      maxLimit: 20,
      getSimpleMsg: () => "Please select no more than 20 technologies.",
    },
    images: {
      title: "Screenshots & Images",
      maxLimit: 15,
      getSimpleMsg: () => "Please upload at most 15 screenshots.",
    },
    title: {
      title: "Solution Title",
      getSimpleMsg: () => "Please enter a valid title (between 3 and 150 characters).",
    },
    shortDescription: {
      title: "Short Description",
      getSimpleMsg: () => "Please enter a short description between 10 and 300 characters.",
    },
    fullDescription: {
      title: "Comprehensive Overview",
      getSimpleMsg: () => "Please enter a detailed overview description of at least 50 characters.",
    },
    categoryId: {
      title: "Architecture Category",
      getSimpleMsg: () => "Please select a category for this solution.",
    },
    price: {
      title: "Pricing",
      getSimpleMsg: () => "Please provide a valid price amount.",
    },
    demoUrl: {
      title: "Demo URL",
      getSimpleMsg: () => "Please provide a valid URL for the live demo.",
    },
  };

  for (const [key, errs] of Object.entries(rawFieldErrors)) {
    processed.add(key);
    const def = fieldDefinitions[key];
    if (def) {
      items.push({
        field: key,
        title: def.title,
        message: def.getSimpleMsg(),
        currentCount:
          key === "whatsIncluded"
            ? counts.whatsIncluded
            : key === "features"
            ? counts.features
            : undefined,
        maxLimit: def.maxLimit,
        canTrim: def.canTrim,
      });
    } else {
      const errText = Array.isArray(errs) ? errs.join(", ") : String(errs);
      items.push({
        field: key,
        title: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
        message: errText,
      });
    }
  }

  // Fallback if no structured field errors
  if (items.length === 0 && errorData?.error) {
    const rawError = String(errorData.error);
    if (rawError.includes("whatsIncluded") || rawError.toLowerCase().includes("what's included")) {
      items.push({
        field: "whatsIncluded",
        title: "What's Included",
        message: `Too many items in What's Included. Please limit to 20 items (you currently have ${counts.whatsIncluded} items).`,
        currentCount: counts.whatsIncluded,
        maxLimit: 20,
        canTrim: counts.whatsIncluded > 20,
      });
    }
    if (rawError.includes("features") || rawError.toLowerCase().includes("feature")) {
      items.push({
        field: "features",
        title: "Key Features",
        message: `Too many features listed. Please limit to 25 features (you currently have ${counts.features} features).`,
        currentCount: counts.features,
        maxLimit: 25,
        canTrim: counts.features > 25,
      });
    }
    if (items.length === 0) {
      items.push({
        field: "general",
        title: "Submission Issue",
        message: rawError.replace(/\(.*?\)/g, "").trim(),
      });
    }
  }

  return items;
}

interface PartnerSolutionFormProps {
  initialData?: any;
  categories: Category[];
  technologies: Technology[];
  isEditing?: boolean;
}

export function PartnerSolutionForm({
  initialData,
  categories,
  technologies,
  isEditing = false,
}: PartnerSolutionFormProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState(initialData?.title || "");
  const [categoryId, setCategoryId] = React.useState(
    initialData?.categoryId || (categories[0]?.id ?? "")
  );
  const [shortDescription, setShortDescription] = React.useState(
    initialData?.shortDescription || ""
  );
  const [fullDescription, setFullDescription] = React.useState(
    initialData?.fullDescription || ""
  );
  const [priceMode, setPriceMode] = React.useState<"FIXED" | "STARTING_FROM" | "CONTACT">(
    initialData?.priceMode || "FIXED"
  );
  const [price, setPrice] = React.useState(initialData?.price ? String(initialData.price) : "");
  const [demoUrl, setDemoUrl] = React.useState(initialData?.demoUrl || "");
  const [projectType, setProjectType] = React.useState(initialData?.projectType || "");
  const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED">(
    initialData?.status || "PUBLISHED"
  );
  const [featured, setFeatured] = React.useState<boolean>(
    Boolean(initialData?.featured)
  );

  // Deliverables (what's included - starts empty, no automatic pre-filling)
  const [whatsIncluded, setWhatsIncluded] = React.useState<string[]>(
    initialData?.whatsIncluded?.length ? initialData.whatsIncluded : []
  );
  const [newDeliverable, setNewDeliverable] = React.useState("");

  // Features list - normalize string or object format (starts empty if new)
  const [features, setFeatures] = React.useState<{ feature: string }[]>(() => {
    if (initialData?.features?.length) {
      const items = initialData.features
        .map((f: any) => {
          const text = typeof f === "string" ? f : f?.feature || f?.name || f?.title || "";
          return typeof text === "string" ? text.trim() : "";
        })
        .filter((text: string) => text.length >= 2)
        .map((text: string) => ({ feature: text }));
      if (items.length > 0) return items;
    }
    return [];
  });
  const [newFeature, setNewFeature] = React.useState("");

  // Specifications (starts empty if new)
  const [specifications, setSpecifications] = React.useState<{ key: string; value: string }[]>(
    initialData?.specifications?.length
      ? initialData.specifications.map((s: any) => ({ key: s.key, value: s.value }))
      : []
  );
  const [specKey, setSpecKey] = React.useState("");
  const [specVal, setSpecVal] = React.useState("");

  // FAQs (starts empty if new)
  const [faqs, setFaqs] = React.useState<{ question: string; answer: string }[]>(
    initialData?.faqs?.length
      ? initialData.faqs.map((faq: any) => ({ question: faq.question, answer: faq.answer }))
      : []
  );
  const [faqQ, setFaqQ] = React.useState("");
  const [faqA, setFaqA] = React.useState("");

  // ── Tech stack list + custom tags ──────────────────────────────────────────
  const [allTechs, setAllTechs] = React.useState<Technology[]>(() => {
    const list = [...technologies];
    if (initialData?.technologies) {
      initialData.technologies.forEach((pt: any) => {
        const t = pt.technology || pt;
        const id = t?.id || pt?.technologyId;
        const name = t?.name || t?.id || pt?.technologyId;
        if (id && !list.some((existing) => existing.id === id)) {
          list.push({ id, name });
        }
      });
    }
    return list;
  });

  const [selectedTechs, setSelectedTechs] = React.useState<string[]>(() => {
    if (initialData?.technologies?.length) {
      const extracted = initialData.technologies
        .map((t: any) => {
          if (typeof t === "string" && t.trim()) return t.trim();
          return t?.technologyId || t?.technology?.id || t?.id || null;
        })
        .filter((id: any): id is string => Boolean(id && typeof id === "string"));
      if (extracted.length > 0) return extracted;
    }
    return [];
  });

  const [customTagInput, setCustomTagInput] = React.useState("");

  // ── Photos and Screenshots Gallery (Starts empty - no unwanted default cover) ──
  const [photos, setPhotos] = React.useState<PhotoItem[]>(() => {
    if (initialData?.images?.length) {
      return initialData.images.map((img: any, idx: number) => ({
        id: img.id || `img-${idx}-${Date.now()}`,
        url: img.url,
        altText: img.altText || "",
        isPrimary: img.isPrimary ?? (idx === 0),
        storageKey: img.storageKey,
      }));
    }
    return [];
  });

  const [newPhotoUrl, setNewPhotoUrl] = React.useState("");
  const [newPhotoCaption, setNewPhotoCaption] = React.useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [errorItems, setErrorItems] = React.useState<SolutionErrorItem[]>([]);
  const [showErrorModal, setShowErrorModal] = React.useState(false);
  const [successNotice, setSuccessNotice] = React.useState<string | null>(null);

  // ── Trimming & Auto-Fix Helpers ───────────────────────────────────────────
  const handleTrimField = (field: string) => {
    if (field === "whatsIncluded") {
      setWhatsIncluded((prev) => prev.slice(0, 20));
      setSuccessNotice("What's Included has been trimmed to 20 items.");
    } else if (field === "features") {
      setFeatures((prev) => prev.slice(0, 25));
      setSuccessNotice("Key Features has been trimmed to 25 features.");
    } else if (field === "specifications") {
      setSpecifications((prev) => prev.slice(0, 25));
      setSuccessNotice("Technical specifications trimmed to 25 items.");
    } else if (field === "faqs") {
      setFaqs((prev) => prev.slice(0, 20));
      setSuccessNotice("FAQs trimmed to 20 questions.");
    }

    setErrorItems((prev) => {
      const remaining = prev.filter((item) => item.field !== field);
      if (remaining.length === 0) {
        setShowErrorModal(false);
        setError(null);
      }
      return remaining;
    });
  };

  const handleAutoTrimAll = () => {
    if (whatsIncluded.length > 20) {
      setWhatsIncluded((prev) => prev.slice(0, 20));
    }
    if (features.length > 25) {
      setFeatures((prev) => prev.slice(0, 25));
    }
    if (specifications.length > 25) {
      setSpecifications((prev) => prev.slice(0, 25));
    }
    if (faqs.length > 20) {
      setFaqs((prev) => prev.slice(0, 20));
    }

    setErrorItems([]);
    setError(null);
    setShowErrorModal(false);
    setSuccessNotice("All items have been trimmed to platform limits. You can now save your solution!");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAutoTrimAndSave = async () => {
    const trimmedWhatsIncluded = whatsIncluded.length > 20 ? whatsIncluded.slice(0, 20) : whatsIncluded;
    const trimmedFeatures = features.length > 25 ? features.slice(0, 25) : features;
    const trimmedSpecs = specifications.length > 25 ? specifications.slice(0, 25) : specifications;
    const trimmedFaqs = faqs.length > 20 ? faqs.slice(0, 20) : faqs;

    setWhatsIncluded(trimmedWhatsIncluded);
    setFeatures(trimmedFeatures);
    setSpecifications(trimmedSpecs);
    setFaqs(trimmedFaqs);
    setErrorItems([]);
    setError(null);
    setShowErrorModal(false);

    await executeSavePayload({
      whatsIncluded: trimmedWhatsIncluded,
      features: trimmedFeatures,
      specifications: trimmedSpecs,
      faqs: trimmedFaqs,
    });
  };

  // ── Tech Tag Handlers ──────────────────────────────────────────────────────
  const handleToggleTech = (id: string) => {
    setSelectedTechs((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customTagInput.trim();
    if (!trimmed) return;

    // Check if tag already exists in allTechs (case-insensitive)
    const existing = allTechs.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      if (!selectedTechs.includes(existing.id)) {
        setSelectedTechs((prev) => [...prev, existing.id]);
      }
    } else {
      const newTech: Technology = {
        id: trimmed,
        name: trimmed,
      };
      setAllTechs((prev) => [...prev, newTech]);
      setSelectedTechs((prev) => [...prev, newTech.id]);
    }
    setCustomTagInput("");
  };

  const handleRemoveTech = (id: string) => {
    setSelectedTechs((prev) => prev.filter((t) => t !== id));
  };

  // ── Photo Gallery Handlers ─────────────────────────────────────────────────
  const handleAddPhotoByUrl = () => {
    const trimmed = newPhotoUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setError("Please provide a valid image URL starting with http:// or https://");
      return;
    }
    const isFirst = photos.length === 0;
    const newPhoto: PhotoItem = {
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: trimmed,
      altText: newPhotoCaption.trim() || title.trim() || "Project Screenshot",
      isPrimary: isFirst,
    };
    setPhotos((prev) => [...prev, newPhoto]);
    setNewPhotoUrl("");
    setNewPhotoCaption("");
    setError(null);
  };

  const processFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    setUploadProgress(`Preparing ${files.length} photo(s)...`);
    setError(null);

    try {
      const addedPhotos: PhotoItem[] = [];
      const total = files.length;

      for (let i = 0; i < total; i++) {
        const file = files[i];
        setUploadProgress(`Uploading photo ${i + 1} of ${total} (${file.name})...`);

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/partner/uploads", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (res.ok && data.url) {
            addedPhotos.push({
              id: `photo-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
              url: data.url,
              storageKey: data.storageKey,
              altText: file.name.replace(/\.[^/.]+$/, ""),
              isPrimary: photos.length === 0 && addedPhotos.length === 0,
            });
            continue;
          }
        } catch {
          // Fall through to local reader fallback
        }

        // Local Data URL fallback so the image is previewable and persists
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        addedPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          url: dataUrl,
          altText: file.name.replace(/\.[^/.]+$/, ""),
          isPrimary: photos.length === 0 && addedPhotos.length === 0,
        });
      }

      setPhotos((prev) => [...prev, ...addedPhotos]);
      setUploadProgress(null);
    } catch (err: any) {
      setError(err?.message || "Failed to upload image file");
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFilesUpload(e.target.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFilesUpload(e.dataTransfer.files);
    }
  };

  const handleSetPrimaryPhoto = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isPrimary: p.id === id,
      }))
    );
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0 && !filtered.some((p) => p.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleUpdatePhotoAlt = (id: string, altText: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, altText } : p))
    );
  };

  const handleMovePhoto = (index: number, direction: "left" | "right" | "up" | "down") => {
    let newIdx = index;
    if (direction === "left") {
      newIdx = index - 1;
    } else if (direction === "right") {
      newIdx = index + 1;
    } else if (direction === "up") {
      newIdx = index >= 3 ? index - 3 : index - 1;
    } else if (direction === "down") {
      newIdx = index + 3 < photos.length ? index + 3 : index + 1;
    }

    if (newIdx < 0 || newIdx >= photos.length || newIdx === index) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(newIdx, 0, moved);
      return copy;
    });
  };

  // ── Other Handlers ─────────────────────────────────────────────────────────
  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setWhatsIncluded((prev) => [...prev, newDeliverable.trim()]);
    setNewDeliverable("");
  };

  const handleRemoveDeliverable = (idx: number) => {
    setWhatsIncluded((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setFeatures((prev) => [...prev, { feature: newFeature.trim() }]);
    setNewFeature("");
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddSpec = () => {
    if (!specKey.trim() || !specVal.trim()) return;
    setSpecifications((prev) => [...prev, { key: specKey.trim(), value: specVal.trim() }]);
    setSpecKey("");
    setSpecVal("");
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddFaq = () => {
    if (!faqQ.trim() || !faqA.trim()) return;
    setFaqs((prev) => [...prev, { question: faqQ.trim(), answer: faqA.trim() }]);
    setFaqQ("");
    setFaqA("");
  };

  const handleRemoveFaq = (idx: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Save & Submit Logic ───────────────────────────────────────────────────
  const executeSavePayload = async (overrides?: {
    whatsIncluded?: string[];
    features?: { feature: string }[];
    specifications?: { key: string; value: string }[];
    faqs?: { question: string; answer: string }[];
  }) => {
    setError(null);
    setLoading(true);

    const activeWhatsIncluded = (overrides?.whatsIncluded ?? whatsIncluded).filter((w) => w && w.trim());
    const activeFeatures = (overrides?.features ?? features)
      .map((f) => (typeof f === "string" ? f : f?.feature || ""))
      .filter((feat) => typeof feat === "string" && feat.trim().length >= 2)
      .map((feat, i) => ({ feature: feat.trim(), sortOrder: i + 1 }));
    const activeSpecs = (overrides?.specifications ?? specifications)
      .filter((s) => s.key && s.key.trim() && s.value && s.value.trim())
      .map((s, i) => ({ key: s.key.trim(), value: s.value.trim(), sortOrder: i + 1 }));
    const activeFaqs = (overrides?.faqs ?? faqs)
      .filter((faq) => faq.question && faq.question.trim() && faq.answer && faq.answer.trim())
      .map((faq, i) => ({ question: faq.question.trim(), answer: faq.answer.trim(), sortOrder: i + 1 }));

    // ── Client-side Validations with instant Scroll-to-Top and Friendly Modal ──
    const clientErrors: SolutionErrorItem[] = [];

    if (!title.trim() || title.trim().length < 3) {
      clientErrors.push({
        field: "title",
        title: "Solution Title Too Short",
        message: "Please enter a solution title with at least 3 characters.",
      });
    }

    if (!shortDescription.trim() || shortDescription.trim().length < 10) {
      clientErrors.push({
        field: "shortDescription",
        title: "Short Description Needed",
        message: "Please enter a short description of at least 10 characters.",
      });
    }

    if (!fullDescription.trim() || fullDescription.trim().length < 50) {
      clientErrors.push({
        field: "fullDescription",
        title: "Overview Description Too Short",
        message: `Please enter an overview description of at least 50 characters (currently ${fullDescription.trim().length} characters).`,
      });
    }

    if (priceMode === "FIXED" || priceMode === "STARTING_FROM") {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        clientErrors.push({
          field: "price",
          title: "Valid Price Required",
          message: "Please enter a valid price amount greater than zero.",
        });
      }
    }

    if (photos.length === 0) {
      clientErrors.push({
        field: "photos",
        title: "Cover Photo Required",
        message: "Please add or upload at least one image or screenshot of your solution.",
      });
    }

    if (activeWhatsIncluded.length > 20) {
      clientErrors.push({
        field: "whatsIncluded",
        title: "Too Many Items in What's Included",
        message: `You currently have ${activeWhatsIncluded.length} items. The system limit is 20. Please keep your top 20 main deliverables.`,
        currentCount: activeWhatsIncluded.length,
        maxLimit: 20,
        canTrim: true,
      });
    }

    if (activeFeatures.length > 25) {
      clientErrors.push({
        field: "features",
        title: "Too Many Key Features",
        message: `You currently have ${activeFeatures.length} features. The system limit is 25. Please keep your top 25 most important features.`,
        currentCount: activeFeatures.length,
        maxLimit: 25,
        canTrim: true,
      });
    }

    if (activeSpecs.length > 25) {
      clientErrors.push({
        field: "specifications",
        title: "Too Many Technical Specifications",
        message: `You have ${activeSpecs.length} specifications. The system limit is 25 items.`,
        currentCount: activeSpecs.length,
        maxLimit: 25,
        canTrim: true,
      });
    }

    if (activeFaqs.length > 20) {
      clientErrors.push({
        field: "faqs",
        title: "Too Many FAQs",
        message: `You have ${activeFaqs.length} FAQs. The system limit is 20 questions.`,
        currentCount: activeFaqs.length,
        maxLimit: 20,
        canTrim: true,
      });
    }

    if (clientErrors.length > 0) {
      setErrorItems(clientErrors);
      setError("Please review and adjust the highlighted items below before saving.");
      setShowErrorModal(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setLoading(false);
      return;
    }

    try {
      const computedPrice =
        priceMode === "CONTACT"
          ? null
          : Number(price) > 0
          ? Number(price)
          : null;

      let formattedDemoUrl: string | null = null;
      if (demoUrl.trim()) {
        const trimmed = demoUrl.trim();
        formattedDemoUrl =
          trimmed.startsWith("http://") || trimmed.startsWith("https://")
            ? trimmed
            : `https://${trimmed}`;
      }

      const validTechIds = selectedTechs.filter((id): id is string => Boolean(id && typeof id === "string" && id.trim()));
      const cleanedTechNames = validTechIds
        .map((id) => {
          const tech = allTechs.find((t) => t && t.id === id);
          const name = tech?.name || id;
          return typeof name === "string" && name.trim() ? name.trim() : null;
        })
        .filter((name): name is string => Boolean(name));

      const payload = {
        title: title.trim(),
        slug: initialData?.slug || undefined,
        categoryId,
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim(),
        priceMode,
        price: computedPrice,
        demoUrl: formattedDemoUrl,
        projectType: projectType.trim() ? projectType.trim() : null,
        status,
        featured: Boolean(featured),
        whatsIncluded: activeWhatsIncluded,
        features: activeFeatures,
        specifications: activeSpecs,
        faqs: activeFaqs,
        technologyIds: validTechIds,
        technologies: cleanedTechNames,
        images: photos.map((p, i) => ({
          url: p.url.trim(),
          storageKey: p.storageKey || `partner-sol-${Date.now()}-${i}`,
          altText: p.altText.trim() || title.trim(),
          isPrimary: p.isPrimary,
          sortOrder: i + 1,
        })),
      };

      const url = isEditing
        ? `/api/partner/solutions/${initialData.id}`
        : `/api/partner/solutions`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        const parsed = parseSolutionErrors(resData, {
          whatsIncluded: activeWhatsIncluded.length,
          features: activeFeatures.length,
          specifications: activeSpecs.length,
          faqs: activeFaqs.length,
          technologies: validTechIds.length,
        });

        setErrorItems(parsed);
        setError("Please review and adjust the highlighted items below before saving.");
        setShowErrorModal(true);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      router.push("/partner/solutions");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred while saving.";
      setError(msg);
      setErrorItems([
        {
          field: "general",
          title: "Submission Error",
          message: msg,
        },
      ]);
      setShowErrorModal(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSavePayload();
  };

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleDeleteSolution = async () => {
    if (!initialData.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/partner/solutions/${initialData.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete solution");
      }
      router.push("/partner/solutions");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to delete solution. Please try again.");
      setShowDeleteModal(false);
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* ── Success Notice Banner ────────────────────────────────────── */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold px-2 py-1 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────────────────── */}
      {error && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm shadow-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-rose-200/60">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold text-sm text-rose-900">Please review solution details</p>
                <p className="text-xs text-rose-700">
                  {errorItems.length === 1
                    ? "1 item needs your attention before saving:"
                    : `${errorItems.length} items need your attention before saving:`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowErrorModal(true)}
                className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-100/50 text-rose-900 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                View Popup Guide
              </button>
              {errorItems.some((e) => e.canTrim) && (
                <button
                  type="button"
                  onClick={handleAutoTrimAll}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Auto-Trim to Limits
                </button>
              )}
            </div>
          </div>

          {errorItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {errorItems.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-white rounded-xl border border-rose-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      {item.title}
                    </span>
                    {item.canTrim && item.maxLimit && (
                      <button
                        type="button"
                        onClick={() => handleTrimField(item.field)}
                        className="text-[11px] font-bold text-[#155761] hover:text-[#0E3E45] underline cursor-pointer"
                      >
                        Trim to {item.maxLimit}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#526267] leading-relaxed">{item.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-rose-700">{error}</p>
          )}
        </div>
      )}

      {/* ── Quick JSON Import Bar ──────────────────────────────────────── */}
      {!isEditing && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#F0F9F8] to-[#E6F4F1] border border-[#BEDEE1] shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#155761] text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileCode className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#102124]">
                Want to pre-fill all fields in 1 click?
              </p>
              <p className="text-[11px] text-[#526267]">
                Import from an AI-generated or exported project JSON file instead of typing manually.
              </p>
            </div>
          </div>
          <Link
            href="/partner/solutions/import"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs font-bold shadow-xs transition shrink-0 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Import via JSON</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-80" />
          </Link>
        </div>
      )}

      {/* ── 1. Core Solution Overview ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#155761]" />
          1. Basic Solution Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-[#102124]">Solution Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI Resume & ATS Optimizer Platform"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">Architecture Category *</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">Project Deliverable Type (Optional)</Label>
            <Input
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="e.g. Full-Stack Web App, Microservice, Boilerplate (Optional)"
              className="mt-1"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-[#102124]">
              Short Teaser Description (Max 160 characters) *
            </Label>
            <Input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A high-level 1-sentence summary displayed in search and catalog cards."
              maxLength={180}
              required
              className="mt-1"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-[#102124]">
              Comprehensive Architecture &amp; System Overview *
            </Label>
            <Textarea
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Explain how the application works, setup requirements, data models, third-party services, and deployment architecture..."
              rows={6}
              required
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* ── 2. Pricing & Visibility ───────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          2. Commercial Pricing &amp; Visibility Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Pricing Mode</Label>
            <select
              value={priceMode}
              onChange={(e) => setPriceMode(e.target.value as any)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
            >
              <option value="FIXED">Fixed Price (INR)</option>
              <option value="STARTING_FROM">Starting From (INR)</option>
              <option value="CONTACT">Contact for Quote</option>
            </select>
          </div>

          {priceMode !== "CONTACT" && (
            <div>
              <Label className="text-xs font-semibold text-[#102124]">Price (INR) *</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="24999"
                required
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold text-[#102124]">Publishing Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
            >
              <option value="PUBLISHED">Published (Visible on Showcase)</option>
              <option value="DRAFT">Draft (Internal Architecture Only)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <Label className="text-xs font-semibold text-[#102124]">Live Demo URL (Optional)</Label>
            <Input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://demo.yourdomain.com"
              className="mt-1"
            />
          </div>

          {/* Featured Solution Toggle */}
          <div className="sm:col-span-6 pt-1">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#D9E2E4] bg-[#F8FAFA] hover:bg-white transition-colors">
              <input
                id="solution-featured"
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-[#D9E2E4] text-[#155761] focus:ring-[#155761] cursor-pointer"
              />
              <label htmlFor="solution-featured" className="text-xs font-semibold text-[#102124] flex items-center gap-2 cursor-pointer select-none">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                <span>Mark as Featured Solution (highlighted in catalog top recommendations and homepage)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Project Photos & Screenshots Gallery ─────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-[#F3F7F7] pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#102124] flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#155761]" />
              3. Project Photos &amp; Screenshots Gallery
            </h2>
            <span className="text-xs font-medium text-[#526267]">
              {photos.length} {photos.length === 1 ? "photo" : "photos"} added
            </span>
          </div>

          {/* Explanation Banner */}
          <div className="mt-3 p-3.5 rounded-2xl bg-[#E8F3F4]/80 border border-[#BEDEE1] text-xs text-[#155761] flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#155761]" />
            <div>
              <p className="font-semibold">Why is there a Primary Image?</p>
              <p className="mt-0.5 text-[#2D5B60] leading-relaxed">
                The <strong>Primary Cover Image</strong> is the main card thumbnail displayed across the catalog listing (<code>/projects</code>), home page cards, and search results.
                All other images become <strong>Gallery Screenshots</strong> on your solution&apos;s detail page, allowing buyers to see your dashboards, mobile views, and feature walkthroughs.
                Use the <strong>★ Set as Primary</strong> button on any photo to choose your cover image!
              </p>
            </div>
          </div>

          {/* Sizing Guide Banner */}
          <div className="mt-3 p-3.5 rounded-2xl bg-[#DDF4EC]/80 border border-[#2F7D78]/25 text-xs text-[#155761] flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#2F7D78]" />
            <div>
              <p className="font-bold">Recommended Image Dimensions:</p>
              <p className="mt-0.5 text-[#10474F] leading-relaxed">
                <strong>1200 × 675 px</strong> (exact 16:9 aspect ratio) or <strong>1600 × 900 px</strong> (HiDPI / Retina).
                All catalog listing cards and project detail showcases are designed around 16:9. Using 16:9 ensures your screenshots display edge-to-edge without any cropping or black letterboxing. Max 5MB per file (PNG, JPG, WebP).
              </p>
            </div>
          </div>
        </div>

        {/* Active Uploading Banner */}
        {isUploadingPhoto && (
          <div className="flex items-center gap-3 p-4 bg-[#DDF4EC] border border-[#2F7D78]/40 rounded-2xl text-xs text-[#155761] font-semibold animate-pulse shadow-xs">
            <Loader2 className="w-5 h-5 animate-spin shrink-0 text-[#2F7D78]" />
            <div className="space-y-0.5">
              <p className="font-bold">{uploadProgress || "Uploading & Optimizing Photo(s)..."}</p>
              <p className="text-[11px] text-[#2D5B60] font-normal">
                Transferring screenshots to secure storage and generating gallery thumbnails. Please wait a moment.
              </p>
            </div>
          </div>
        )}

        {/* Adding New Photos: File Upload, Drag & Drop, or Image URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F8FAFA] border border-[#D9E2E4]">
          {/* Method A: Upload Image Files & Drag/Drop */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`space-y-3 p-4 rounded-xl border-2 border-dashed transition-all ${
              dragActive
                ? "border-[#155761] bg-[#F3F7F7]"
                : "border-[#D9E2E4] bg-white hover:border-[#BEDEE1]"
            }`}
          >
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-[#102124] flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#155761]" />
                Upload Photos from Device
              </Label>
              {isUploadingPhoto && (
                <span className="text-[11px] font-bold text-[#155761] flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#526267]">
              Drag &amp; drop screenshots here or click to browse (PNG, JPG, WebP up to 5MB each). Recommended 1200×675 px (16:9).
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              disabled={isUploadingPhoto}
              isLoading={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border border-[#D9E2E4] bg-[#F8FAFA] hover:bg-[#F3F7F7] text-xs font-semibold text-[#102124] h-11 gap-2 cursor-pointer shadow-xs transition-all"
            >
              {isUploadingPhoto ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#155761]" />
                  <span>{uploadProgress || "Uploading Photo(s)... Please wait"}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-[#155761]" />
                  <span>Choose Photo Files to Upload</span>
                </>
              )}
            </Button>
          </div>

          {/* Method B: Paste Image URL */}
          <div className="space-y-3 p-4 rounded-xl border border-[#D9E2E4] bg-white flex flex-col justify-between">
            <div>
              <Label className="text-xs font-semibold text-[#102124] flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-[#155761]" />
                Add via Image URL
              </Label>
              <p className="text-[11px] text-[#526267] mt-1 mb-2">
                Paste an image link from GitHub, Unsplash, or your hosted web CDN.
              </p>
              <div className="space-y-2">
                <Input
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or GitHub raw URL"
                  className="text-xs"
                />
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    placeholder="Caption (e.g. Analytics Dashboard)"
                    className="text-xs flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddPhotoByUrl}
                    disabled={!newPhotoUrl.trim() || isUploadingPhoto}
                    className="rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs px-3.5 h-9 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Photo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Grid & Uploading Skeleton Cards */}
        {photos.length === 0 && !isUploadingPhoto ? (
          <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-[#D9E2E4] bg-[#F8FAFA]">
            <ImageIcon className="w-8 h-8 text-[#526267] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#102124]">No photos added yet</p>
            <p className="text-xs text-[#526267] mt-1 max-w-sm mx-auto">
              Add at least one screenshot or mockup photo so customers can preview your solution in the catalog.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isUploadingPhoto && (
              <div className="relative aspect-video rounded-2xl border-2 border-dashed border-[#155761] bg-[#F3F7F7] flex flex-col items-center justify-center gap-2 p-4 text-center shadow-xs">
                <Loader2 className="w-7 h-7 animate-spin text-[#155761]" />
                <span className="text-xs font-bold text-[#155761]">
                  {uploadProgress || "Uploading screenshot..."}
                </span>
                <span className="text-[11px] text-[#526267]">
                  Optimizing and linking image to gallery
                </span>
              </div>
            )}
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                className={`relative rounded-2xl border transition-all overflow-hidden flex flex-col justify-between bg-white ${
                  photo.isPrimary
                    ? "border-[#155761] ring-2 ring-[#155761]/30 shadow-md"
                    : "border-[#D9E2E4] shadow-2xs hover:border-[#BEDEE1]"
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.altText || "Project photo"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Primary Cover Badge */}
                  {photo.isPrimary ? (
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-[#155761] text-white text-[11px] font-bold shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
                      Primary Cover
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryPhoto(photo.id)}
                      className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 hover:bg-[#155761] text-white text-[11px] font-medium shadow-xs transition-colors flex items-center gap-1 backdrop-blur-xs cursor-pointer opacity-90 hover:opacity-100"
                    >
                      <Star className="w-3 h-3" />
                      Make Primary
                    </button>
                  )}

                  {/* 4-Way Reorder Controls */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-xl shadow-xs">
                    {/* Move 1 step left */}
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, "left")}
                        title="Move 1 step left (←)"
                        className="w-6 h-6 rounded-md hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Move earlier / Up */}
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, "up")}
                        title="Move earlier / Up (↑)"
                        className="w-6 h-6 rounded-md hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Move later / Down */}
                    {idx < photos.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, "down")}
                        title="Move later / Down (↓)"
                        className="w-6 h-6 rounded-md hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Move 1 step right */}
                    {idx < photos.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, "right")}
                        title="Move 1 step right (→)"
                        className="w-6 h-6 rounded-md hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Photo Details & Actions */}
                <div className="p-3.5 space-y-2.5">
                  <div>
                    <Label className="text-[11px] font-semibold text-[#526267]">
                      Caption / Alt Text
                    </Label>
                    <Input
                      type="text"
                      value={photo.altText}
                      onChange={(e) => handleUpdatePhotoAlt(photo.id, e.target.value)}
                      placeholder="e.g. Dashboard Analytics"
                      className="mt-1 h-8 text-xs rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#F3F7F7]">
                    <span className="text-[11px] text-[#526267]">
                      {photo.isPrimary ? "Card Thumbnail" : `Gallery Photo #${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Tech Stack Tags ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="border-b border-[#F3F7F7] pb-3">
          <h2 className="text-base font-bold text-[#102124] flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#155761]" />
            4. Tech Stack Tags
          </h2>
          <p className="text-xs text-[#526267] mt-0.5">
            Select popular technologies or type custom tags to describe your stack.
          </p>
        </div>

        {/* Custom Tag Input */}
        <div className="p-4 rounded-2xl bg-[#F8FAFA] border border-[#D9E2E4] space-y-2">
          <Label className="text-xs font-semibold text-[#102124]">
            Add Custom Tech Tag
          </Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomTag();
                }
              }}
              placeholder="Type any technology (e.g. PyTorch, Kubernetes, LangChain, Solidity, Tailwind v4...)"
              className="text-xs flex-1 bg-white"
            />
            <Button
              type="button"
              onClick={handleAddCustomTag}
              disabled={!customTagInput.trim()}
              className="rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs px-4 h-10 gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Tag
            </Button>
          </div>
        </div>

        {/* Selected Tags Display */}
        {selectedTechs.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#102124] flex items-center justify-between">
              <span>Selected Tech Tags ({selectedTechs.length})</span>
              <button
                type="button"
                onClick={() => setSelectedTechs([])}
                className="text-[11px] text-[#526267] hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            </Label>
            <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-white border border-[#D9E2E4]">
              {selectedTechs.map((id) => {
                const tech = allTechs.find((t) => t.id === id);
                const tagName = tech ? tech.name : id;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#155761] text-white shadow-2xs"
                  >
                    <span>{tagName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(id)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer"
                      title="Remove tag"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Select Popular Technologies */}
        <div className="space-y-2 pt-1">
          <Label className="text-xs font-semibold text-[#526267]">
            Popular / Suggested Technologies
          </Label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {allTechs.map((t) => {
              const isSelected = selectedTechs.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleToggleTech(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#155761] text-white shadow-xs"
                      : "bg-[#F3F7F7] text-[#526267] hover:bg-[#E5EEEE] border border-[#D9E2E4]"
                  }`}
                >
                  {t.name}
                  {isSelected && <span className="ml-1 opacity-70">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 5. Deliverables ("What's Included") ───────────────────────── */}
      {/* ── 5. Deliverables ("What's Included") ───────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4" id="section-whats-included">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3F7F7] pb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#102124]">
              5. Deliverables (&quot;What&apos;s Included&quot;)
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold transition-colors ${
                whatsIncluded.length > 20
                  ? "bg-rose-100 text-rose-700 border border-rose-300"
                  : "bg-[#F3F7F7] text-[#526267] border border-[#D9E2E4]"
              }`}
            >
              {whatsIncluded.length} / 20 max
            </span>
          </div>

          {whatsIncluded.length > 20 && (
            <button
              type="button"
              onClick={() => {
                setWhatsIncluded((prev) => prev.slice(0, 20));
                setSuccessNotice("What's Included has been trimmed to 20 items.");
                setErrorItems((prev) => prev.filter((item) => item.field !== "whatsIncluded"));
              }}
              className="text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 px-3 py-1 rounded-xl transition cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              Trim to 20 items
            </button>
          )}
        </div>

        <div className="space-y-2">
          {whatsIncluded.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs font-medium text-[#102124]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#155761] shrink-0" />
                <span>{item}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDeliverable(idx)}
                className="text-rose-500 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Input
            value={newDeliverable}
            onChange={(e) => setNewDeliverable(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddDeliverable();
              }
            }}
            placeholder="e.g. Docker container compose configuration"
            className="text-xs"
          />
          <Button
            type="button"
            onClick={handleAddDeliverable}
            className="rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs px-4 h-10 gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Deliverable
          </Button>
        </div>
      </div>

      {/* ── 6. Key Features ───────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4" id="section-features">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3F7F7] pb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#102124]">
              6. Key Architectural Features
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold transition-colors ${
                features.length > 25
                  ? "bg-rose-100 text-rose-700 border border-rose-300"
                  : "bg-[#F3F7F7] text-[#526267] border border-[#D9E2E4]"
              }`}
            >
              {features.length} / 25 max
            </span>
          </div>

          {features.length > 25 && (
            <button
              type="button"
              onClick={() => {
                setFeatures((prev) => prev.slice(0, 25));
                setSuccessNotice("Key Features has been trimmed to 25 features.");
                setErrorItems((prev) => prev.filter((item) => item.field !== "features"));
              }}
              className="text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 px-3 py-1 rounded-xl transition cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              Trim to 25 features
            </button>
          )}
        </div>

        <div className="space-y-2">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs font-medium text-[#102124]"
            >
              <span>{f.feature}</span>
              <button
                type="button"
                onClick={() => handleRemoveFeature(idx)}
                className="text-rose-500 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddFeature();
              }
            }}
            placeholder="e.g. Automated PDF invoice generation using Headless Chromium"
            className="text-xs"
          />
          <Button
            type="button"
            onClick={handleAddFeature}
            className="rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs px-4 h-10 gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Feature
          </Button>
        </div>
      </div>

      {/* ── 7. Technical Specifications ───────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          7. Technical Specifications (Key-Value)
        </h2>

        <div className="space-y-2">
          {specifications.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs font-medium text-[#102124]"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#155761]">{s.key}:</span>
                <span>{s.value}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSpec(idx)}
                className="text-rose-500 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          <Input
            value={specKey}
            onChange={(e) => setSpecKey(e.target.value)}
            placeholder="Key (e.g. Memory)"
            className="text-xs"
          />
          <Input
            value={specVal}
            onChange={(e) => setSpecVal(e.target.value)}
            placeholder="Value (e.g. 512MB RAM minimum)"
            className="text-xs"
          />
          <Button
            type="button"
            onClick={handleAddSpec}
            className="rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs px-4 h-10 gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Spec
          </Button>
        </div>
      </div>

      {/* ── 8. FAQs ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#155761]" />
          8. Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs space-y-1 relative pr-10"
            >
              <p className="font-bold text-[#102124]">Q: {faq.question}</p>
              <p className="text-[#526267] leading-relaxed">A: {faq.answer}</p>
              <button
                type="button"
                onClick={() => handleRemoveFaq(idx)}
                className="absolute top-3 right-3 text-rose-500 hover:text-rose-700 p-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2">
          <Input
            value={faqQ}
            onChange={(e) => setFaqQ(e.target.value)}
            placeholder="Question: e.g. Does it include automated deployment scripts?"
            className="text-xs"
          />
          <Textarea
            value={faqA}
            onChange={(e) => setFaqA(e.target.value)}
            placeholder="Answer: e.g. Yes, GitHub Actions CI/CD workflows are provided for AWS and Vercel."
            rows={2}
            className="text-xs"
          />
          <Button
            type="button"
            onClick={handleAddFaq}
            className="rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs px-4 h-10 gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add FAQ
          </Button>
        </div>
      </div>

      {/* ── Submit / Cancel Footer ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/solutions"
            className="text-xs font-semibold text-[#526267] hover:text-[#102124] transition-colors"
          >
            Cancel and return to Solutions
          </Link>

          {isEditing && initialData.id && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-2 text-xs font-medium text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 hover:bg-rose-600 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Solution
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            {loading ? "Saving Solution..." : isEditing ? "Save & Update Solution" : "Publish Solution"}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#D9E2E4] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-bold text-rose-700 mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Delete Solution
            </h3>
            <p className="text-xs text-[#526267] mb-6 leading-relaxed">
              Are you sure you want to permanently delete this solution? This will remove all associated screenshots, specifications, features, and inquiries. This action cannot be undone.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-3.5 py-1.5 rounded-xl border border-[#D9E2E4] text-xs font-medium text-[#526267] hover:bg-[#F3F7F7] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSolution}
                disabled={deleting}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                {deleting ? "Deleting…" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Popup Modal ─────────────────────────────────────────── */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#D9E2E4] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#102124]">
                    Please Review Solution Details
                  </h3>
                  <p className="text-xs text-[#526267] mt-0.5">
                    {errorItems.length === 1
                      ? "1 item needs your attention before saving:"
                      : `${errorItems.length} items need your attention before saving:`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="text-[#526267] hover:text-[#102124] p-1.5 rounded-xl hover:bg-[#F3F7F7] transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Simple Friendly Errors */}
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {errorItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#F8FAFA] border border-[#D9E2E4] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-[#102124] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      {item.title}
                    </span>
                    {item.maxLimit && (
                      <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        Max Allowed: {item.maxLimit}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#526267] leading-relaxed">
                    {item.message}
                  </p>

                  {item.canTrim && item.maxLimit && (
                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleTrimField(item.field)}
                        className="px-3 py-1.5 bg-[#155761] hover:bg-[#0E3E45] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Trim to {item.maxLimit}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#D9E2E4]">
              <button
                type="button"
                onClick={() => {
                  setShowErrorModal(false);
                  const firstField = errorItems[0]?.field;
                  if (firstField === "whatsIncluded") {
                    document.getElementById("section-whats-included")?.scrollIntoView({ behavior: "smooth" });
                  } else if (firstField === "features") {
                    document.getElementById("section-features")?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#D9E2E4] text-xs font-semibold text-[#526267] hover:bg-[#F3F7F7] hover:text-[#102124] transition cursor-pointer text-center"
              >
                Close & Review Manually
              </button>

              {errorItems.some((e) => e.canTrim) && (
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAutoTrimAll}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Trim to Limits</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoTrimAndSave}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>Auto-Fix & Save Now</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
