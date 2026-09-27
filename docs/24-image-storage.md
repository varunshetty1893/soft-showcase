# 24 — Image Storage

## Overview

Project screenshots are stored using an external image storage service (not the Next.js server or database). Images are served via CDN.

---

## Recommended Provider: Cloudinary

| Attribute | Value |
|---|---|
| Free tier | 25 GB storage, 25 GB monthly bandwidth |
| Image transformations | Resize, crop, optimize automatically |
| CDN | Global CDN included |
| Upload API | REST over HTTPS |

---

## Storage Architecture

```
Admin selects image file
        ↓
Browser sends file to /api/admin/uploads
        ↓
Server validates: type, size, format
        ↓
Server uploads to Cloudinary via Cloudinary SDK
        ↓
Cloudinary stores image + generates CDN URL
        ↓
Server saves URL in project_images table
        ↓
Public pages load images from Cloudinary CDN URL
```

---

## Upload API Route

```typescript
// app/api/admin/uploads/route.ts

export async function POST(request: Request) {
  // 1. Auth check — admin only
  const session = await requireAdmin();

  // 2. Parse multipart form
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const projectId = formData.get("projectId") as string;
  const altText = formData.get("altText") as string | null;
  const isPrimary = formData.get("isPrimary") === "true";

  // 3. Validate file
  validateImageFile(file); // throws on invalid type/size

  // 4. Upload to Cloudinary
  const result = await storageService.upload(file, {
    folder: `soft-showcase/projects/${projectId}`,
  });

  // 5. Save to DB (both CDN url and storageKey required)
  const image = await prisma.projectImage.create({
    data: {
      projectId,
      url: result.secure_url,
      storageKey: result.public_id, // Storage provider's public_id — required for deletion
      altText: altText || null,
      isPrimary,
      sortOrder: 0,
    },
  });

  return NextResponse.json({ success: true, data: image });
}
```

---

## File Validation Rules

| Rule | Value | Reason |
|---|---|---|
| Allowed types | `image/jpeg`, `image/png`, `image/webp` | Security — no executables |
| Max file size | 5 MB | Performance and storage cost |
| SVG not allowed | ❌ | XSS risk in SVG files |
| GIF not allowed | ❌ | Performance — use static images |
| Max images per project | 10 | Reasonable UX limit |

---

## Storage Service Abstraction

```typescript
// lib/storage/storage-service.ts

interface UploadOptions {
  folder?: string;
}

interface UploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

interface StorageService {
  upload(file: File, options?: UploadOptions): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}

export function createStorageService(): StorageService {
  const provider = process.env.STORAGE_PROVIDER;

  switch (provider) {
    case "cloudinary":
      return new CloudinaryStorageService();
    case "uploadthing":
      return new UploadthingStorageService();
    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }
}
```

---

## Image Management in Admin

From the project edit page, admin can:

1. **Upload** new screenshots (drag-and-drop or file picker)
2. **Set primary image** (shown as project thumbnail on catalog)
3. **Reorder** screenshots (drag to reorder)
4. **Edit alt text** (for accessibility and SEO)
5. **Delete** screenshots (deletes from Cloudinary + DB)

### Deletion Flow (Preventing Orphaned Files)

When an image is removed from a project, both the remote CDN asset and the database record must be deleted:

```typescript
// app/api/admin/projects/[id]/images/[imageId]/route.ts

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  await requireAdmin();

  const image = await prisma.projectImage.findUnique({
    where: { id: params.imageId, projectId: params.id },
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // 1. Delete from remote storage provider using storageKey
  const storageService = createStorageService();
  await storageService.delete(image.storageKey);

  // 2. Delete database record
  await prisma.projectImage.delete({
    where: { id: image.id },
  });

  return NextResponse.json({ success: true });
}
```

---

## Image Display in Frontend

Images are always loaded from Cloudinary CDN URLs stored in the database.

In Next.js, configure the `next.config.ts` to allow Cloudinary images:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};
```

Use `<Image>` from `next/image` for automatic optimization.

---

## Environment Variables

```bash
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → Copy Cloud Name, API Key, API Secret
3. Add to `.env.local`

---

## Alternative: Uploadthing

If Cloudinary is not preferred, [Uploadthing](https://uploadthing.com) is an alternative:

- Free tier: 2 GB storage, 2 GB bandwidth/month
- Native Next.js integration
- Simpler setup

Set `STORAGE_PROVIDER=uploadthing` and configure `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`.
