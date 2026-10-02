# 13 — Database Design

## Database System

- **Database:** PostgreSQL 16 (hosted on Neon)
- **ORM:** Prisma 5.x
- **Connection:** Pooled via Neon's built-in connection pooler (for app), direct for migrations
- **Migrations:** Prisma Migrate (`prisma migrate dev` for development, `prisma migrate deploy` for production)

> **Workflow rule:** Use `prisma migrate dev` during development. Use `prisma migrate deploy` in CI/CD and production. Never use `prisma db push` in production — it bypasses migration history.

---

## Tables Overview

| Table | Purpose |
|---|---|
| `users` | Authenticated users (Google OAuth) |
| `accounts` | OAuth accounts (NextAuth) |
| `sessions` | User sessions (NextAuth, database-backed) |
| `project_providers` | Project providers (contact info, consent) |
| `categories` | Project categories |
| `technologies` | Technology tags |
| `projects` | Main project listings |
| `project_images` | Project screenshots |
| `project_features` | Project feature list |
| `project_specifications` | Project key-value specs |
| `project_faqs` | Project FAQ entries |
| `project_technologies` | Join table: project ↔ technology |
| `inquiries` | Email inquiries from customers |
| `custom_project_requests` | Custom project requests |
| `site_settings` | Platform configuration key-value pairs |
| `audit_logs` | Admin action audit trail |

> **V1 Note:** A `favorites` table is NOT part of V1. It is excluded from the schema to keep the system simple and avoid half-implemented features.

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// =============================================================================
// AUTH TABLES (NextAuth.js v5 — database session strategy)
// =============================================================================

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  isAdmin       Boolean   @default(false)

  accounts  Account[]
  sessions  Session[]
  inquiries Inquiry[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Account {
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// =============================================================================
// PROVIDER
// =============================================================================

model ProjectProvider {
  id             String   @id @default(cuid())
  displayName    String
  email          String   @unique
  whatsappNumber String?
  bio            String?
  avatarUrl      String?
  isActive       Boolean  @default(true)
  showEmail      Boolean  @default(false)
  showWhatsapp   Boolean  @default(true)

  // Provider consent: admin must confirm that permission was obtained
  // from the provider before publishing their projects on Soft Showcase.
  providerConsentConfirmed   Boolean   @default(false)
  providerConsentConfirmedAt DateTime?

  projects  Project[]
  inquiries Inquiry[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("project_providers")
}

// =============================================================================
// CATEGORIES & TECHNOLOGIES
// =============================================================================

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  iconName    String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)

  projects Project[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("categories")
}

model Technology {
  id       String  @id @default(cuid())
  name     String  @unique
  slug     String  @unique
  iconUrl  String?
  isActive Boolean @default(true)

  projects ProjectTechnology[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("technologies")
}

// =============================================================================
// PROJECTS
// =============================================================================

enum ProjectStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum PriceMode {
  CONTACT
  FIXED
  STARTING_FROM
  FREE
}

model Project {
  id               String        @id @default(cuid())
  title            String
  slug             String        @unique
  shortDescription String
  fullDescription  String        @db.Text
  status           ProjectStatus @default(DRAFT)
  featured         Boolean       @default(false)
  priceMode        PriceMode     @default(CONTACT)
  price            Decimal?      @db.Decimal(10, 2)
  demoUrl          String?
  projectType      String?
  whatsIncluded    String[]      @default([])

  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])

  providerId String
  provider   ProjectProvider @relation(fields: [providerId], references: [id])

  images         ProjectImage[]
  features       ProjectFeature[]
  specifications ProjectSpecification[]
  faqs           ProjectFaq[]
  technologies   ProjectTechnology[]
  inquiries      Inquiry[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([featured])
  @@index([categoryId])
  @@index([providerId])
  @@map("projects")
}

model ProjectImage {
  id         String  @id @default(cuid())
  projectId  String
  url        String          // CDN URL from storage provider
  storageKey String          // Storage provider's public_id / key — required for deletion
  altText    String?
  isPrimary  Boolean @default(false)
  sortOrder  Int     @default(0)

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@map("project_images")
}

model ProjectFeature {
  id        String @id @default(cuid())
  projectId String
  feature   String
  sortOrder Int    @default(0)

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("project_features")
}

model ProjectSpecification {
  id        String @id @default(cuid())
  projectId String
  key       String
  value     String
  sortOrder Int    @default(0)

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("project_specifications")
}

model ProjectFaq {
  id        String @id @default(cuid())
  projectId String
  question  String
  answer    String @db.Text
  sortOrder Int    @default(0)

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("project_faqs")
}

model ProjectTechnology {
  projectId    String
  technologyId String

  project    Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  technology Technology @relation(fields: [technologyId], references: [id])

  @@id([projectId, technologyId])
  @@map("project_technologies")
}

// =============================================================================
// INQUIRIES
// =============================================================================

enum InquiryStatus {
  NEW
  CONTACTED
  DISCUSSING
  QUOTED
  CLOSED
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}

enum ContactMethod {
  EMAIL
  WHATSAPP
}

model Inquiry {
  id            String             @id @default(cuid())
  projectId     String
  // providerId is captured at submission time. If the project is later
  // reassigned to a different provider, old inquiries still reference
  // the original provider — preserving historical accuracy.
  providerId    String
  customerId    String?
  name          String
  email         String
  whatsapp      String?
  message       String             @db.Text
  contactMethod ContactMethod      @default(EMAIL)
  status        InquiryStatus      @default(NEW)
  // notificationStatus tracks whether the email to the provider was sent.
  // An inquiry can be saved (NEW) even if the notification email fails (FAILED).
  notificationStatus NotificationStatus @default(PENDING)
  adminNotes    String?            @db.Text

  project  Project         @relation(fields: [projectId], references: [id])
  provider ProjectProvider @relation(fields: [providerId], references: [id])
  customer User?           @relation(fields: [customerId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([projectId])
  @@index([status])
  @@index([notificationStatus])
  @@index([createdAt])
  @@map("inquiries")
}

// =============================================================================
// CUSTOM PROJECT REQUESTS
// =============================================================================

enum CustomRequestStatus {
  NEW
  REVIEWING
  CONTACTED
  IN_PROGRESS
  COMPLETED
  DECLINED
}

model CustomProjectRequest {
  id                     String              @id @default(cuid())
  name                   String
  email                  String
  whatsapp               String?
  projectTitle           String
  category               String?
  technologyPreferences  String[]
  description            String              @db.Text
  requiredFeatures       String              @db.Text
  // deadline is stored as a String to allow flexible input (e.g. "Q1 2027",
  // "March 2027", or a date string). It is not enforced as a date type.
  deadline               String?
  budget                 String?
  additionalRequirements String?             @db.Text
  status                 CustomRequestStatus @default(NEW)
  adminNotes             String?             @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("custom_project_requests")
}

// =============================================================================
// SITE SETTINGS
// =============================================================================

// site_settings stores a small set of admin-configurable platform values.
// Keys are defined constants (see docs/26-site-settings.md equivalent section).
// This is NOT a generic data bucket — only documented keys are valid.
model SiteSetting {
  // Valid keys:
  //   site_name         — Display name of the platform
  //   site_tagline      — Homepage tagline
  //   contact_email     — Public contact email shown on /contact page
  //   maintenance_mode  — "true" | "false"
  //   footer_text       — Footer copyright / custom text
  key       String   @id
  value     String   @db.Text
  updatedAt DateTime @updatedAt

  @@map("site_settings")
}

// =============================================================================
// AUDIT LOG
// =============================================================================

model AuditLog {
  id         String  @id @default(cuid())
  userId     String?  // ID of the admin who performed the action; null for system actions
  action     String   // Action constant (see docs/32-audit-logging.md)
  entityType String   // "Project", "ProjectProvider", "Inquiry", etc.
  entityId   String?  // ID of the affected entity
  details    Json?    // Additional context specific to the action

  createdAt DateTime @default(now())

  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## Price & Promotional Offer Validation Rules (Phase 4)

The `price` and promotional offer fields (`originalPrice`, `priceQualifier`, `dealType`, `dealLabel`, `dealStartsAt`, `dealEndsAt`) are conditional on `priceMode` and enforced server-side via Zod (`lib/validation/project.schema.ts` & `lib/pricing/offers.ts`):

| priceMode | price required? | Promotional Offers (`dealType != NONE`) | Rule |
|---|---|---|---|
| `CONTACT` | No (`null`) | Not allowed (`dealType = NONE`) | `price` and `originalPrice` are cleared to `null` |
| `FREE` | No (`null`) | Not allowed (`dealType = NONE`) | `price` and `originalPrice` are cleared to `null` |
| `STARTING_FROM` | **Yes** (`> 0`) | Not allowed (`dealType = NONE`) | `price` is the starting value; `originalPrice` must be `null` or `> price` |
| `FIXED` | **Yes** (`> 0`, `<= 10,000,000`) | **Supported** (`LIMITED_DEAL`, `LAUNCH_OFFER`, `FESTIVE_SALE`, `EARLY_BIRD`, `CLEARANCE`, `CUSTOM`) | When `dealType != NONE`: `originalPrice` is required and must be strictly greater than `price` (`1%`–`95%` discount); `CUSTOM` requires `dealLabel` (2–30 chars); time-bound deals (`LIMITED_DEAL`, `LAUNCH_OFFER`, `FESTIVE_SALE`, `EARLY_BIRD`) require a future `dealEndsAt` (`dealStartsAt < dealEndsAt` when both set) |

### Effective Pricing Resolution (`getEffectivePricing(project, now)`)
All public cards, detail pages, related projects, quick-edit dialogs, and JSON-LD structured data compute display pricing from a single pure helper (`getEffectivePricing` in `lib/utils/pricing.ts` / `lib/pricing/effective-pricing.ts`) without requiring a background cron job:
1. **Scheduled (`now < dealStartsAt`):** Offer is not active yet (`offerStatus = "SCHEDULED"`). Public pages display the regular price (`originalPrice`).
2. **Active (`dealStartsAt <= now <= dealEndsAt`):** Offer is live (`offerStatus = "ACTIVE"`). Public pages display the discounted selling `price`, strike-through `originalPrice`, `% OFF` + `Save ₹X` badge, deal badge (`Limited time deal`, etc.), and a live countdown when ending within 7 days.
3. **Expired (`now > dealEndsAt`):** Offer has automatically expired (`offerStatus = "EXPIRED"`). Public pages immediately revert to displaying the regular price (`originalPrice`) with no deal badge or strike-through.

---

## Publication Gate (Server-Side Rules)

A project may only be published if **all** of the following are true:

1. `project.status` is being set to `PUBLISHED`
2. `project.providerId` is set (not null)
3. `project.provider.isActive === true`
4. At least one contact method is available:
   - (`provider.showWhatsapp === true` AND `provider.whatsappNumber` is not null) **OR**
   - (`provider.showEmail === true` AND `provider.email` is not null)
5. `project.provider.providerConsentConfirmed === true` (if provider is a third party)

If any condition fails, the server returns a validation error and does not publish the project.

---

## Important Relationships

| Relationship | Cardinality | Notes |
|---|---|---|
| Project → Category | Many-to-One | Every project has one category |
| Project → Provider | Many-to-One | Every project has one provider |
| Project ↔ Technology | Many-to-Many | Via `project_technologies` |
| Project → Images | One-to-Many | Max 10 screenshots per project |
| Project → Features | One-to-Many | Many features per project |
| Project → Specs | One-to-Many | Many spec rows per project |
| Project → FAQs | One-to-Many | Many FAQs per project |
| Inquiry → Project | Many-to-One | Inquiry links to its project |
| Inquiry → Provider | Many-to-One | Provider captured at inquiry time |
| Inquiry → User | Many-to-One | Optional customer link |

---

## Provider Routing Guarantee

Every project has exactly one `providerId`. The server ALWAYS resolves contact details through this chain:

```
project.providerId → project_providers.id → email / whatsappNumber
```

**There is no global fallback number or email.** If a provider has no WhatsApp number, the WhatsApp button is not shown — no alternative number is used.

---

## Why Inquiry Stores Provider ID

If a project changes providers after an inquiry is submitted, the old inquiry must still reference the original provider.

```
Inquiry A created when project.provider = Rahul
  → Inquiry A.providerId = Rahul.id

Project reassigned to Ajay
  → Inquiry A.providerId still = Rahul.id ✅
  → Inquiry B (new) would use Ajay.id
```

This preserves historical accuracy. The `notificationStatus` on each inquiry independently tracks whether the email notification reached Rahul at the time.

---

## Image Storage Fields

Each `ProjectImage` record stores both the `url` (for display) and `storageKey` (the storage provider's `public_id`). The `storageKey` is required to delete the image from Cloudinary when the image record is deleted from the database.

```
storageKey example: "soft-showcase/projects/abc123/screenshot-1"
url example:        "https://res.cloudinary.com/yourcloud/image/upload/.../screenshot-1.jpg"
```

Both must be saved on every upload. Deleting only the database record without the `storageKey` would leave orphaned files in Cloudinary.
