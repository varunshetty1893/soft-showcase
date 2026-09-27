# 11 — Folder Structure

## Complete Project Structure

```
soft-showcase/
│
├── app/
│   │
│   ├── (public)/                         ← Public route group (no auth)
│   │   ├── page.tsx                      ← Homepage (/)
│   │   ├── projects/
│   │   │   ├── page.tsx                  ← Project catalog (/projects)
│   │   │   └── [slug]/
│   │   │       └── page.tsx              ← Project detail (/projects/[slug])
│   │   └── custom-project/
│   │       └── page.tsx                  ← Custom project request
│   │
│   ├── (auth)/                           ← Auth route group
│   │   └── login/
│   │       └── page.tsx                  ← Sign in page (/login)
│   │
│   ├── (customer)/                       ← Authenticated customer route group
│   │   ├── layout.tsx                    ← Customer layout (auth guard)
│   │   ├── profile/
│   │   │   └── page.tsx                  ← Profile settings (/profile)
│   │   ├── my-inquiries/
│   │   │   └── page.tsx                  ← My inquiries (/my-inquiries)
│   │   └── my-requests/
│   │       └── page.tsx                  ← My custom requests (/my-requests)
│   │
│   ├── admin/                            ← Admin route group
│   │   ├── layout.tsx                    ← Admin layout (sidebar, auth guard)
│   │   ├── page.tsx                      ← Admin dashboard (/admin)
│   │   ├── projects/
│   │   │   ├── page.tsx                  ← Project list
│   │   │   ├── new/
│   │   │   │   └── page.tsx              ← Create project
│   │   │   ├── import/
│   │   │   │   └── page.tsx              ← Import project
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx          ← Edit project
│   │   ├── providers/
│   │   │   ├── page.tsx                  ← Provider list
│   │   │   ├── new/
│   │   │   │   └── page.tsx              ← Create provider
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx          ← Edit provider
│   │   ├── categories/
│   │   │   └── page.tsx                  ← Category management (/admin/categories)
│   │   ├── technologies/
│   │   │   └── page.tsx                  ← Technology management (/admin/technologies)
│   │   ├── users/
│   │   │   └── page.tsx                  ← User management (/admin/users)
│   │   ├── inquiries/
│   │   │   ├── page.tsx                  ← All inquiries (/admin/inquiries)
│   │   │   └── [id]/
│   │   │       └── page.tsx              ← Inquiry detail
│   │   ├── custom-requests/
│   │   │   ├── page.tsx                  ← Custom requests list (/admin/custom-requests)
│   │   │   └── [id]/
│   │   │       └── page.tsx              ← Request detail
│   │   ├── settings/
│   │   │   └── page.tsx                  ← Site settings (/admin/settings)
│   │   └── audit-logs/
│   │       └── page.tsx                  ← Audit log (/admin/audit-logs)
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts              ← NextAuth handler
│   │   ├── projects/
│   │   │   ├── route.ts                  ← GET /api/projects
│   │   │   └── [slug]/
│   │   │       ├── route.ts              ← GET /api/projects/[slug]
│   │   │       └── whatsapp/
│   │   │           └── route.ts          ← GET /api/projects/[slug]/whatsapp
│   │   ├── inquiries/
│   │   │   └── route.ts                  ← POST /api/inquiries
│   │   ├── custom-requests/
│   │   │   └── route.ts                  ← POST /api/custom-requests
│   │   └── admin/
│   │       ├── projects/
│   │       │   ├── route.ts
│   │       │   ├── import/
│   │       │   │   └── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── providers/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── inquiries/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       └── uploads/
│   │           └── route.ts              ← Image upload handler
│   │
│   ├── layout.tsx                        ← Root layout
│   ├── not-found.tsx                     ← 404 page
│   ├── error.tsx                         ← Global error boundary
│   ├── loading.tsx                       ← Global loading state
│   ├── sitemap.ts                        ← Auto-generated sitemap
│   └── robots.ts                         ← robots.txt config
│
├── components/
│   │
│   ├── ui/                               ← Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx
│   │   ├── skeleton.tsx
│   │   ├── tabs.tsx
│   │   ├── toggle.tsx
│   │   ├── accordion.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminLayout.tsx
│   │   └── PageHeader.tsx
│   │
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectGrid.tsx
│   │   ├── ProjectFilters.tsx
│   │   ├── ProjectSearch.tsx
│   │   ├── ProjectGallery.tsx
│   │   ├── ProjectFeatures.tsx
│   │   ├── ProjectSpecs.tsx
│   │   ├── ProjectFAQ.tsx
│   │   ├── RelatedProjects.tsx
│   │   └── TechBadge.tsx
│   │
│   ├── providers/
│   │   ├── ProviderCard.tsx
│   │   ├── ProviderContactButtons.tsx
│   │   └── ProviderBadge.tsx
│   │
│   ├── inquiry/
│   │   ├── InquiryForm.tsx
│   │   ├── InquiryModal.tsx
│   │   ├── WhatsAppButton.tsx
│   │   └── EmailInquiryButton.tsx
│   │
│   ├── admin/
│   │   ├── ProjectTable.tsx
│   │   ├── ProviderTable.tsx
│   │   ├── InquiryTable.tsx
│   │   ├── ProjectImportForm.tsx
│   │   ├── ProjectImportPreview.tsx
│   │   ├── ProviderSelector.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── StatusBadge.tsx
│   │   └── StatsCard.tsx
│   │
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       ├── EmptyState.tsx
│       ├── ConfirmDialog.tsx
│       └── Pagination.tsx
│
├── lib/
│   │
│   ├── auth/
│   │   ├── auth.ts                       ← NextAuth config
│   │   └── session.ts                    ← Session helpers
│   │
│   ├── db/
│   │   ├── client.ts                     ← Prisma client singleton
│   │   └── queries/
│   │       ├── projects.ts
│   │       ├── providers.ts
│   │       ├── inquiries.ts
│   │       └── categories.ts
│   │
│   ├── email/
│   │   ├── email-service.ts              ← Main email sending service
│   │   ├── templates/
│   │   │   ├── provider-inquiry.ts       ← Email to provider
│   │   │   ├── customer-confirmation.ts  ← Confirmation to customer
│   │   │   └── admin-notification.ts     ← Admin notifications
│   │   └── providers/
│   │       └── email-provider.ts         ← Abstracted email provider
│   │
│   ├── storage/
│   │   ├── storage-service.ts            ← Main upload service
│   │   └── providers/
│   │       └── cloudinary.ts             ← Cloudinary implementation
│   │
│   ├── whatsapp/
│   │   └── whatsapp.ts                   ← WhatsApp URL generator
│   │
│   ├── validation/
│   │   ├── inquiry.schema.ts
│   │   ├── provider.schema.ts
│   │   ├── project.schema.ts
│   │   ├── project-import.schema.ts
│   │   └── custom-request.schema.ts
│   │
│   └── utils/
│       ├── slug.ts                       ← Slug generation
│       ├── format.ts                     ← Date/number formatting
│       └── rate-limit.ts                 ← In-memory rate limiter
│
├── prisma/
│   ├── schema.prisma                     ← Database schema
│   ├── seed.ts                           ← Database seeder
│   └── migrations/                       ← Auto-generated migrations
│
├── types/
│   ├── project.ts
│   ├── provider.ts
│   ├── inquiry.ts
│   └── auth.ts
│
├── config/
│   ├── constants.ts                      ← App-wide constants
│   ├── categories.ts                     ← Default category list
│   └── technologies.ts                   ← Default technology list
│
├── docs/                                 ← Platform documentation
│
├── public/
│   ├── logo.svg
│   ├── favicon.ico
│   └── og-default.png                    ← Default OG image
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── README.md
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
