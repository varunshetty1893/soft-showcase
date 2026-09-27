# 35 — Testing

## Testing Strategy

Soft Showcase uses a layered testing approach:

| Layer | Tool | Purpose |
|---|---|---|
| Unit | Jest / Vitest | Pure functions, utilities, validators |
| Integration | Vitest + Prisma test DB | API routes, DB operations |
| End-to-End | Playwright | Full browser flows |

---

## Critical Test: Provider Contact Routing

This is the most important test in the entire system.

### Test: Project A routes to Provider A, Project B routes to Provider B

```typescript
// tests/integration/provider-routing.test.ts

describe("Provider Contact Routing", () => {
  let projectA: Project, projectB: Project;
  let providerA: ProjectProvider, providerB: ProjectProvider;

  beforeAll(async () => {
    // Create Provider A
    providerA = await prisma.projectProvider.create({
      data: {
        displayName: "Varun",
        email: "varun@test.com",
        whatsappNumber: "+919000000001",
        showWhatsapp: true,
        showEmail: true,
        isActive: true,
      },
    });

    // Create Provider B
    providerB = await prisma.projectProvider.create({
      data: {
        displayName: "Rahul",
        email: "rahul@test.com",
        whatsappNumber: "+919000000002",
        showWhatsapp: true,
        showEmail: true,
        isActive: true,
      },
    });

    // Create Project A with Provider A
    projectA = await prisma.project.create({
      data: {
        title: "Project Alpha",
        slug: "project-alpha",
        shortDescription: "Test project A",
        fullDescription: "Full description A",
        status: "PUBLISHED",
        providerId: providerA.id,
        categoryId: testCategoryId,
      },
    });

    // Create Project B with Provider B
    projectB = await prisma.project.create({
      data: {
        title: "Project Beta",
        slug: "project-beta",
        shortDescription: "Test project B",
        fullDescription: "Full description B",
        status: "PUBLISHED",
        providerId: providerB.id,
        categoryId: testCategoryId,
      },
    });
  });

  test("Project A WhatsApp resolves to Provider A number", async () => {
    const res = await fetch(`/api/projects/project-alpha/whatsapp`);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.url).toContain("919000000001"); // Provider A's number
    expect(data.data.url).not.toContain("919000000002"); // NOT Provider B
  });

  test("Project B WhatsApp resolves to Provider B number", async () => {
    const res = await fetch(`/api/projects/project-beta/whatsapp`);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.url).toContain("919000000002"); // Provider B's number
    expect(data.data.url).not.toContain("919000000001"); // NOT Provider A
  });

  test("Inquiry for Project A is associated with Provider A", async () => {
    const res = await fetch("/api/inquiries", {
      method: "POST",
      body: JSON.stringify({
        projectId: projectA.id,
        name: "Test Customer",
        email: "customer@test.com",
        message: "I am interested in Project A",
      }),
    });

    const data = await res.json();
    expect(data.success).toBe(true);

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: data.data.inquiryId },
    });

    expect(inquiry?.providerId).toBe(providerA.id); // Must be Provider A
    expect(inquiry?.providerId).not.toBe(providerB.id); // NOT Provider B
  });
});
```

---

## Test: Customer Cannot Manipulate Provider Email

```typescript
test("Customer cannot inject provider_email in inquiry request", async () => {
  const res = await fetch("/api/inquiries", {
    method: "POST",
    body: JSON.stringify({
      projectId: projectA.id,
      name: "Malicious User",
      email: "malicious@test.com",
      message: "Test message",
      // Attempting to inject a different recipient
      provider_email: "arbitrary@victim.com",
      providerId: providerB.id,
    }),
  });

  const data = await res.json();

  // The inquiry should succeed but use the correct provider
  if (data.success) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: data.data.inquiryId },
    });
    // Must use Project A's actual provider, not the injected one
    expect(inquiry?.providerId).toBe(providerA.id);
  }
});
```

---

## Test Cases by Area

### Authentication & Customer Isolation

- [ ] Unauthenticated user can browse public pages
- [ ] Unauthenticated user can submit inquiry
- [ ] Unauthenticated user cannot access `/admin`
- [ ] Unauthenticated user cannot access customer pages (`/profile`, `/my-inquiries`, `/my-requests`)
- [ ] Google login creates new user with `isAdmin: false`
- [ ] Admin user (isAdmin=true) can access `/admin`
- [ ] Non-admin authenticated user cannot access `/admin`
- [ ] Customer data isolation: customer cannot view or query another customer's inquiries

### Project Catalog

- [ ] Published projects appear in catalog
- [ ] Draft projects do NOT appear in catalog
- [ ] Archived projects do NOT appear in catalog
- [ ] Category filter works correctly
- [ ] Technology filter works correctly
- [ ] Search by title, shortDescription, fullDescription works
- [ ] Pagination works

### Project Detail & Publication Gate

- [ ] Published project page loads correctly
- [ ] Draft project returns 404 for public
- [ ] Server rejects publishing project if provider is inactive
- [ ] Server rejects publishing project without confirmed provider consent
- [ ] Server rejects publishing project with FIXED/STARTING_FROM if price is missing
- [ ] WhatsApp button appears when `showWhatsapp: true`
- [ ] WhatsApp button hidden when `showWhatsapp: false`
- [ ] Email button appears when `showEmail: true`
- [ ] Email button hidden when `showEmail: false`
- [ ] Neither button shows "Contact unavailable" message

### Provider Management

- [ ] Admin can create a provider
- [ ] Admin confirms provider consent (`providerConsentConfirmed = true`)
- [ ] Duplicate provider email rejected
- [ ] Admin can edit provider
- [ ] Admin can deactivate provider
- [ ] Deactivated provider's projects retain data
- [ ] Provider selector in project form auto-loads contact info

### WhatsApp

- [ ] WhatsApp link generated with correct provider number
- [ ] WhatsApp link NOT generated for unpublished project
- [ ] WhatsApp link NOT generated if `showWhatsapp: false`
- [ ] Pre-filled message contains project title
- [ ] URL encoding is correct

### Email Inquiry

- [ ] Submission with valid data succeeds
- [ ] Submission without name fails validation
- [ ] Submission with invalid email fails validation
- [ ] Short message fails validation
- [ ] Rate limiting triggers after 3 requests per 15 minutes
- [ ] Inquiry stored in DB with correct providerId
- [ ] Inquiry stored with `notificationStatus: SENT` on email success or `FAILED` on email error
- [ ] Inquiry NOT stored if project is not PUBLISHED
- [ ] Customer cannot inject provider_email (security test)

### Project Import

- [ ] Valid JSON imports successfully
- [ ] Invalid JSON shows parse error
- [ ] Missing required fields show Zod errors
- [ ] Import creates project as DRAFT
- [ ] Import matches existing provider by email
- [ ] Import creates new provider if not found
- [ ] Slug is generated from title
- [ ] Duplicate slug gets unique suffix

### Image Upload

- [ ] JPEG file uploads successfully
- [ ] PNG file uploads successfully
- [ ] WebP file uploads successfully
- [ ] Non-image file rejected
- [ ] File over 5MB rejected
- [ ] Uploaded image URL saved to DB

### Mobile UI

- [ ] Homepage renders correctly on 375px width
- [ ] Project card readable on mobile
- [ ] Contact buttons visible on mobile project detail
- [ ] Admin tables scroll horizontally on mobile
- [ ] Inquiry form usable on mobile

---

## End-to-End Test Scenarios (Playwright)

```typescript
// tests/e2e/inquiry-flow.spec.ts

test("Customer can submit an email inquiry", async ({ page }) => {
  await page.goto("/projects/ai-resume-analyzer");
  await page.click("text=Send Email Inquiry");

  await page.fill('[name="name"]', "John Doe");
  await page.fill('[name="email"]', "john@example.com");
  await page.fill('[name="message"]', "I am interested in this project and want to know more.");

  await page.click("text=Send Inquiry");

  await expect(page.locator("text=Inquiry Sent")).toBeVisible();
});

test("WhatsApp button opens correct link", async ({ page }) => {
  await page.goto("/projects/ai-resume-analyzer");

  const [newPage] = await Promise.all([
    page.context().waitForEvent("page"),
    page.click("text=Discuss on WhatsApp"),
  ]);

  expect(newPage.url()).toContain("wa.me");
  expect(newPage.url()).toContain("919876543210"); // Correct provider number
});
```

---

## Running Tests

```bash
# Unit tests
npm run test

# End-to-end tests (development server must be running)
npm run test:e2e

# All tests
npm run test:all
```
