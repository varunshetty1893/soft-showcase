# 17 — Google OAuth Setup

## Prerequisites

- Google Account
- Google Cloud Console access
- Soft Showcase project running locally

---

## Step 1: Create a Google Cloud Project

1. Open [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top.
3. Click **New Project**.
4. Enter a project name: `Soft Showcase` (or similar)
5. Click **Create**.

---

## Step 2: Enable Required APIs

1. In the left menu, go to **APIs & Services → Library**.
2. Search for **"Google People API"**.
3. Click **Enable**.

(Note: Some setups also require "Google+ API" but "Google People API" is the modern replacement.)

---

## Step 3: Create OAuth Credentials

1. Go to **APIs & Services → Credentials**.
2. Click **+ Create Credentials** → **OAuth client ID**.
3. If prompted, configure the **OAuth consent screen** first (see Step 4).
4. Application type: **Web application**
5. Name: `Soft Showcase Web Client`

### Authorized JavaScript Origins

Add:

```
http://localhost:3000
```

(For production, also add your live domain:)

```
https://soft-showcase.vercel.app
```

### Authorized Redirect URIs

Add:

```
http://localhost:3000/api/auth/callback/google
```

(For production:)

```
https://soft-showcase.vercel.app/api/auth/callback/google
```

6. Click **Create**.
7. Copy:
   - **Client ID** → this is your `GOOGLE_CLIENT_ID`
   - **Client Secret** → this is your `GOOGLE_CLIENT_SECRET`

---

## Step 4: Configure OAuth Consent Screen

If asked to configure the consent screen before creating credentials:

1. Go to **APIs & Services → OAuth consent screen**.
2. User type: **External** (unless you have a Google Workspace org).
3. Fill in:
   - App name: `Soft Showcase`
   - User support email: your email
   - Developer contact: your email
4. Scopes: Click **Add or Remove Scopes**. Add:
   - `openid`
   - `profile`
   - `email`
5. Test users: Add your email address (while in testing mode).
6. Save.

---

## Step 5: Add Variables to .env.local

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
AUTH_SECRET=run-openssl-rand-base64-32-to-generate
NEXTAUTH_URL=http://localhost:3000
```

Generate AUTH_SECRET (in terminal):

```bash
openssl rand -base64 32
```

---

## Step 6: Set Up Admin User

After running the app for the first time and signing in with Google:

1. Open your database (Neon dashboard or `psql`).
2. Find your user record:

```sql
SELECT id, email, "isAdmin" FROM users;
```

3. Set yourself as admin:

```sql
UPDATE users SET "isAdmin" = true WHERE email = 'your@email.com';
```

---

## Production Checklist

- [ ] Add production domain to Authorized JavaScript Origins
- [ ] Add production callback URL to Authorized Redirect URIs
- [ ] Set `NEXTAUTH_URL` to production URL in Vercel environment
- [ ] Publish OAuth consent screen (if currently in "Testing" mode)
- [ ] Verify Google consent screen is approved (if needed for non-test users)

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` | Callback URL not in Google console | Add exact URL to Authorized Redirect URIs |
| `invalid_client` | Wrong Client ID or Secret | Double-check .env.local values |
| Admin redirect loop | isAdmin not set | Run UPDATE SQL to set isAdmin=true |
| "Access blocked" | OAuth app in Testing mode | Add email as test user, or publish app |
| Session not persisting | AUTH_SECRET not set | Generate and set AUTH_SECRET |
