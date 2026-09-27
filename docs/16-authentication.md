# 16 — Authentication

## Authentication System

**Framework:** NextAuth.js v5 (Auth.js)

**Supported Sign-in Methods:**
1. **Email & Password**: User registers with name, email, and password. A 6-digit OTP and 1-click verification link are dispatched to their email via Gmail SMTP.
2. **Google OAuth**: Fast 1-click sign in with Google account.

**Session Strategy:** JWT session strategy with Prisma database persistence.

---

## Authentication Routes & Pages

### 1. Registration (`/register`)
- Collects: Full Name, Email Address, Password, Confirm Password.
- **Compulsory Input Validation** (enforced on client and server via Zod):
  - Name: Minimum 2 characters, maximum 60 characters.
  - Email: Valid format, trimmed, and normalized to lowercase.
  - Password: Minimum 8 characters, requiring at least one letter and one number.
  - Confirm Password: Must match password.
- Submits to `POST /api/auth/register`.
- Generates 6-digit OTP (expires in 15 minutes) saved in `verification_tokens`.
- Sends email via Gmail SMTP containing the 6-digit code and a 1-click verification link (`/verify-email?email=...&token=...`).

### 2. Email Verification (`/verify-email`)
- Accepts 6-digit numeric OTP code.
- Automatically validates if user clicks the direct link in their email.
- Resend capability with 60-second cooldown timer.
- On success: sets `emailVerified = new Date()` and redirects to `/login?verified=true`.

### 3. Sign In (`/login`)
- Provides both:
  - **Email & Password**: Authenticates against hashed credentials via `CredentialsProvider`.
  - **Continue with Google**: Direct OAuth authentication via `GoogleProvider`.
- If an unverified user attempts to log in with email/password, prompts them with a direct link to verify their account.

---

## Security Implementation

1. **Password Hashing**: Passwords are never stored in plain text; hashed using `bcryptjs` with salt rounds = 10.
2. **Account Linking**: `allowDangerousEmailAccountLinking: true` allows linking Google OAuth accounts with existing verified email accounts.
3. **Session Guards**: `isAdmin` flag is always fetched fresh from the database during session evaluation — never trusted from client-tamperable state.
4. **Credential Isolation**: SMTP credentials and password hashes are strictly server-side and never exposed in client bundles.
