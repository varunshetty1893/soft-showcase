# 34 — Deployment

## Production Stack

| Service | Provider | Purpose |
|---|---|---|
| Hosting | Vercel | Next.js hosting, serverless functions |
| Database | Neon | PostgreSQL 16, serverless |
| Email | Gmail SMTP | Direct SMTP over port 465 with SSL/TLS |
| Image Storage | Cloudinary | Image hosting and CDN |
| Domain | Your domain registrar | Custom domain (optional) |

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm or pnpm
- Git

### Step-by-Step

```bash
# 1. Clone repository
git clone https://github.com/your-org/soft-showcase.git
cd soft-showcase

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Fill in .env.local (see docs/33-environment-variables.md)

# 5. Generate Prisma client
npx prisma generate

# 6. Apply database migrations
npx prisma migrate dev --name init

# 7. (Optional) Seed database
npx prisma db seed

# 8. Start development server
npm run dev
```

Visit: http://localhost:3000

---

## Database Setup (Neon)

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project: `soft-showcase`
3. Create a database: `soft-showcase`
4. Copy the connection strings:
   - **Pooled connection** → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`
5. Add to `.env.local`
6. Run `npx prisma migrate dev --name init`

---

## First Admin Setup

After running locally and signing in with Google:

```bash
# Open Prisma Studio (visual DB editor)
npx prisma studio
```

In the `users` table, find your user and set `isAdmin = true`.

Or via SQL:

```sql
UPDATE users SET "isAdmin" = true WHERE email = 'your@email.com';
```

---

## Vercel Deployment

### First Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing Vercel account
# - Create new project or link existing
# - Vercel auto-detects Next.js
```

### Set Environment Variables on Vercel

Option A: Via Vercel dashboard

1. Go to `vercel.com/[your-org]/soft-showcase`
2. Settings → Environment Variables
3. Add all variables from `.env.example`

Option B: Via Vercel CLI

```bash
vercel env add DATABASE_URL
vercel env add AUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
# ... etc for all variables
```

### Run Prisma Migration on Production

```bash
# After setting DIRECT_URL in Vercel env:
npx prisma migrate deploy
```

Or set up a Vercel post-deployment hook.

---

## Vercel Configuration

Create `vercel.json` if needed:

```json
{
  "buildCommand": "npx prisma generate && next build",
  "framework": "nextjs"
}
```

---

## Domain Setup

1. Buy a domain from any registrar (Namecheap, GoDaddy, Google Domains, etc.)
2. In Vercel dashboard → Project → Settings → Domains
3. Add your domain
4. Update DNS records at your registrar as Vercel instructs
5. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` in Vercel env to your domain

---

## Google OAuth Production Setup

1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. APIs & Services → Credentials → Edit your OAuth 2.0 client
4. Add to Authorized JavaScript Origins:
   ```
   https://your-domain.com
   ```
5. Add to Authorized Redirect URIs:
   ```
   https://your-domain.com/api/auth/callback/google
   ```
6. Save

---

## Post-Deployment Checklist

- [ ] Application loads at production URL
- [ ] Google OAuth works (sign in and sign out)
- [ ] Admin user can access /admin
- [ ] Project catalog displays projects
- [ ] Project detail page loads
- [ ] WhatsApp button generates correct link
- [ ] Email inquiry form submits and provider receives email
- [ ] Customer receives confirmation email
- [ ] Image uploads work
- [ ] Sitemap accessible at /sitemap.xml
- [ ] HTTPS enforced (Vercel handles this automatically)
- [ ] Error pages show friendly messages

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Prisma can't connect to DB | Check DATABASE_URL in Vercel env variables |
| Google OAuth redirect error | Add production URL to Google Cloud Console |
| Email not sending | Check SMTP_USER, SMTP_PASSWORD (App Password), and port 465 |
| Images not loading | Check CLOUDINARY credentials and next.config remotePatterns |
| Admin access not working | Verify isAdmin=true in database for your user |
| Build failing on Vercel | Check build logs; often a missing env variable |

---

## Continuous Deployment

Vercel auto-deploys on every push to main branch.

```
git push origin main
        ↓
Vercel detects push
        ↓
Vercel builds Next.js
        ↓
Vercel runs: npx prisma generate && next build
        ↓
Deployed to production
```

For database migrations, run manually before deploying code that requires them:

```bash
npx prisma migrate deploy
```
