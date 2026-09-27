// app/api/auth/[...nextauth]/route.ts
// NextAuth v5 API handler — handles all /api/auth/* routes:
//   GET  /api/auth/signin
//   POST /api/auth/signin
//   GET  /api/auth/callback/google
//   POST /api/auth/signout
//   GET  /api/auth/session
//   GET  /api/auth/csrf
//   GET  /api/auth/providers

import { handlers } from "@/lib/auth/auth";

export const { GET, POST } = handlers;
