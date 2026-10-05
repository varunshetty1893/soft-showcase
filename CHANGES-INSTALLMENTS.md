# Installments, receipts, UTR reading, price validation

Copy these files over your project (same folder structure), commit, push -> Vercel deploys.
Database changes apply automatically on deploy (`scripts/ensure-schema.mjs`, idempotent; also available as
`prisma/migrations/20261004180000_add_transaction_payments`). Existing transactions are backfilled as one payment each.

Env (no change needed): `GEMINI_API_KEY` must be set on Vercel for screenshot reading.
Optional: `GEMINI_MODEL` to pin a model. Default chain: gemini-3.5-flash -> gemini-3.1-flash-lite -> gemini-flash-latest.

Rules: max 3 payments per transaction, no overpayment, duplicate UTR blocked, cash = no UTR,
Delivered/Completed only when balance is 0, amounts never 0 / negative (max 2 decimals), budget = positive number.
Receipts: /receipts/<paymentId> (customer from My Orders, partner from Transaction page, admin from /admin/receipts).
