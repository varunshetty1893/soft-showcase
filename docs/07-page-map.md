# 07 — Page Map

## Public Pages

| Route | Page | Auth Required |
|---|---|---|
| `/` | Homepage | No |
| `/projects` | Project catalog | No |
| `/projects/[slug]` | Project detail | No |
| `/categories` | Category listing | No |
| `/categories/[slug]` | Category detail (filtered catalog) | No |
| `/custom-project` | Custom project request | No |
| `/about` | About Soft Showcase | No |
| `/contact` | Contact page | No |
| `/faq` | Frequently asked questions | No |
| `/privacy` | Privacy policy | No |
| `/terms` | Terms of service | No |

---

## Authentication Pages

| Route | Page | Auth Required |
|---|---|---|
| `/login` | Sign in with Google | No (redirects if already signed in) |

> **Note:** There is no email/password login. `/login` initiates Google OAuth.
> NextAuth.js uses `/api/auth/callback/google` internally for the OAuth callback — this is a technical route, not a user-facing page.

---

## Customer Pages (Authenticated)

| Route | Page | Auth Required |
|---|---|---|
| `/profile` | Profile settings | Yes |
| `/my-inquiries` | My inquiry history | Yes |
| `/my-requests` | My custom request history | Yes |

---

## Admin Pages

| Route | Page | Auth Required | Admin Only |
|---|---|---|---|
| `/admin` | Admin dashboard | Yes | Yes |
| `/admin/projects` | Project list | Yes | Yes |
| `/admin/projects/new` | Create project (manual) | Yes | Yes |
| `/admin/projects/import` | Import project (JSON) | Yes | Yes |
| `/admin/projects/[id]/edit` | Edit project | Yes | Yes |
| `/admin/providers` | Provider list | Yes | Yes |
| `/admin/providers/new` | Create provider | Yes | Yes |
| `/admin/providers/[id]/edit` | Edit provider | Yes | Yes |
| `/admin/categories` | Category management | Yes | Yes |
| `/admin/technologies` | Technology management | Yes | Yes |
| `/admin/inquiries` | All inquiries | Yes | Yes |
| `/admin/inquiries/[id]` | Inquiry detail | Yes | Yes |
| `/admin/custom-requests` | Custom project requests | Yes | Yes |
| `/admin/custom-requests/[id]` | Custom request detail | Yes | Yes |
| `/admin/users` | User management | Yes | Yes |
| `/admin/settings` | Site settings | Yes | Yes |
| `/admin/audit-logs` | Audit log | Yes | Yes |

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js handler (OAuth flow) |
| `/api/projects` | GET | List published projects |
| `/api/projects/[slug]` | GET | Get project by slug |
| `/api/projects/[slug]/whatsapp` | GET | Get WhatsApp link for project |
| `/api/inquiries` | POST | Submit email inquiry |
| `/api/custom-requests` | POST | Submit custom project request |
| `/api/admin/projects` | GET/POST | Admin project management |
| `/api/admin/projects/[id]` | GET/PUT/PATCH | Admin project operations |
| `/api/admin/projects/import` | POST | Import project from JSON |
| `/api/admin/providers` | GET/POST | Admin provider management |
| `/api/admin/providers/[id]` | GET/PUT/PATCH | Admin provider operations |
| `/api/admin/inquiries` | GET | List all inquiries |
| `/api/admin/inquiries/[id]` | GET/PUT | Inquiry detail and status update |
| `/api/admin/uploads` | POST | Image upload handler |

---

## Special Routes

| Route | Description |
|---|---|
| `/sitemap.xml` | Auto-generated sitemap |
| `/robots.txt` | Robots configuration |

---

## Route Naming Rules

- Public auth uses `/login` (user-facing)
- Customer area uses `/profile`, `/my-inquiries`, `/my-requests` (flat, no `/dashboard` prefix)
- Admin area uses `/admin/...` prefix
- NextAuth internal callback `/api/auth/callback/google` is a technical route — not a user-facing page and must not be confused with the login page
