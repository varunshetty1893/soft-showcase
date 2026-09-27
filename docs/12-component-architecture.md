# 12 — Component Architecture

## Component Design Principles

1. **Server Components by default** — Only use client components when interactivity is required.
2. **Single responsibility** — Each component does one thing well.
3. **Composition over configuration** — Build complex UIs from simple components.
4. **No data fetching in leaf components** — Data flows down from page/layout level.
5. **No business logic in UI components** — Business logic lives in `lib/`.

---

## Component Categories

### 1. UI Components (`components/ui/`)

Base-level, generic UI building blocks. Based on shadcn/ui.

These components have **no domain knowledge**. They accept props and render UI.

| Component | Description |
|---|---|
| `Button` | All button variants |
| `Card` | Card container |
| `Dialog` | Modal dialogs |
| `Form` | Form wrapper with validation |
| `Input` | Text input |
| `Textarea` | Multi-line text input |
| `Select` | Dropdown select |
| `Badge` | Small label chip |
| `Skeleton` | Loading placeholder |
| `Tabs` | Tab navigation |
| `Accordion` | Expand/collapse sections |
| `Toast` | Notification toasts |
| `Toggle` | On/off switch |
| `Label` | Form field label |

### 2. Layout Components (`components/layout/`)

Page structure and navigation components.

| Component | Type | Description |
|---|---|---|
| `Navbar` | Client | Main site navigation, auth state |
| `Footer` | Server | Site footer with links |
| `AdminSidebar` | Client | Admin navigation sidebar |
| `AdminLayout` | Server | Admin page wrapper |
| `PageHeader` | Server | Reusable page title + breadcrumb |

### 3. Project Components (`components/projects/`)

| Component | Type | Description |
|---|---|---|
| `ProjectCard` | Server | Project listing card |
| `ProjectGrid` | Server | Grid of ProjectCards |
| `ProjectFilters` | Client | Category/tech filter panel |
| `ProjectSearch` | Client | Search input with debounce |
| `ProjectGallery` | Client | Screenshot gallery with lightbox |
| `ProjectFeatures` | Server | Feature list section |
| `ProjectSpecs` | Server | Specifications table |
| `ProjectFAQ` | Client | Accordion FAQ section |
| `RelatedProjects` | Server | Related projects section |
| `TechBadge` | Server | Technology tag chip |
| `PriceBadge` | Server | Price mode badge |

### 4. Provider Components (`components/providers/`)

| Component | Type | Description |
|---|---|---|
| `ProviderCard` | Server | Provider info card on project page |
| `ProviderContactButtons` | Client | WhatsApp + Email buttons |
| `WhatsAppButton` | Client | WhatsApp CTA button |
| `EmailInquiryButton` | Client | Opens inquiry modal |
| `ProviderBadge` | Server | Small provider chip |

### 5. Inquiry Components (`components/inquiry/`)

| Component | Type | Description |
|---|---|---|
| `InquiryModal` | Client | Full inquiry form modal |
| `InquiryForm` | Client | The form inside the modal |

### 6. Admin Components (`components/admin/`)

| Component | Type | Description |
|---|---|---|
| `ProjectTable` | Client | Sortable project list table |
| `ProviderTable` | Client | Provider list table |
| `InquiryTable` | Client | Inquiry list table |
| `ProjectImportForm` | Client | JSON paste + validate |
| `ProjectImportPreview` | Server | Preview of parsed project |
| `ProviderSelector` | Client | Provider dropdown with info display |
| `ImageUploader` | Client | Drag-and-drop image upload |
| `StatusBadge` | Server | Colored status chip |
| `StatsCard` | Server | Dashboard metric card |

### 7. Common Components (`components/common/`)

| Component | Type | Description |
|---|---|---|
| `LoadingSpinner` | Server | Button/inline spinner |
| `ErrorMessage` | Server | Error display |
| `EmptyState` | Server | Empty list/page state |
| `ConfirmDialog` | Client | Destructive action confirmation |
| `Pagination` | Client | Page navigation |

---

## Data Flow Pattern

```
Page (Server Component)
  │
  ├── Fetches data (Prisma via lib/db/)
  │
  └── Passes data as props to:
        │
        ├── Server Components (pure display)
        │
        └── Client Components (interactive)
              │
              └── On user action → Server Action or API Route
                    │
                    └── Updates DB → Returns result → Updates UI
```

---

## Example: Project Detail Page

```
/projects/[slug]/page.tsx (Server Component)
  │
  ├── Fetches: project, provider, images, features, specs, FAQs
  │
  ├── <PageHeader /> (Server) ← breadcrumb
  ├── <ProjectGallery /> (Client) ← needs lightbox interaction
  ├── <ProjectFeatures /> (Server) ← static content
  ├── <ProjectSpecs /> (Server) ← static content
  ├── <ProjectFAQ /> (Client) ← accordion interaction
  ├── <ProviderCard /> (Server) ← displays provider name/bio
  └── <ProviderContactButtons /> (Client)
        │
        ├── <WhatsAppButton />
        │     └── onClick: fetch /api/projects/[slug]/whatsapp → open URL
        │
        └── <EmailInquiryButton />
              └── onClick: open <InquiryModal />
                    └── <InquiryForm />
                          └── onSubmit: POST /api/inquiries
```

---

## ProviderContactButtons Component Logic

```typescript
// components/providers/ProviderContactButtons.tsx
// This is a CLIENT component

interface Props {
  projectSlug: string;
  showWhatsapp: boolean;
  showEmail: boolean;
}

export function ProviderContactButtons({ projectSlug, showWhatsapp, showEmail }: Props) {
  if (!showWhatsapp && !showEmail) {
    return <ContactUnavailable />;
  }

  return (
    <div>
      {showWhatsapp && (
        <WhatsAppButton projectSlug={projectSlug} />
      )}
      {showEmail && (
        <EmailInquiryButton projectSlug={projectSlug} />
      )}
    </div>
  );
}
```

**Important:** The component only knows `showWhatsapp` and `showEmail` booleans. It does NOT receive the actual WhatsApp number or email address. Those are resolved server-side.

---

## ProviderSelector (Admin) Component Logic

When an admin selects a provider in the project form:

```typescript
// On provider selection change:
async function onProviderChange(providerId: string) {
  // Fetch provider details from server
  const provider = await getProviderById(providerId);
  
  // Display (read-only) in the form
  setDisplayEmail(provider.email);
  setDisplayWhatsapp(provider.whatsappNumber);
  setDisplayActive(provider.isActive);
}
```

The admin sees the provider's details automatically — they don't retype them.

---

## Component Naming Conventions

| Pattern | Example | Use Case |
|---|---|---|
| PascalCase | `ProjectCard.tsx` | All React components |
| Index exports | `components/ui/index.ts` | Re-export from category |
| `.tsx` extension | `Button.tsx` | All component files |
| Descriptive names | `InquiryModal.tsx` | Clear, no abbreviations |
