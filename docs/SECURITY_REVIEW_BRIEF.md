# Plistic Marketplace — Security & Code Review Brief

**Prepared for:** an independent developer / security reviewer
**Purpose:** sign off the payment and authentication code **before** the Stripe
account is switched from **test** to **live** keys.
**Status at handover:** the marketplace is fully built and works end-to-end in
Stripe **test mode**. This is a review-and-sign-off, not a build.

---

## 1. Why this review exists (the go-live gate)

Plistic takes real money on behalf of third parties: a buyer pays through the
site, Plistic **holds the funds in escrow**, and releases them to the supplier
once the work is confirmed delivered (minus commission). That makes Plistic a
party to the transaction and puts real funds and personal data on the line.

**No live Stripe keys are switched on until this review passes.** Everything
below has been built and verified against Stripe **test** keys only.

## 2. What Plistic is / the stack

- A directory → marketplace → showcase for Scotland's creative/media sector.
- **Next.js (App Router) on Vercel** — SSR pages, Route Handlers (`src/app/api/**`),
  Server Actions, and an edge middleware session gate (`src/proxy.ts`).
- **Supabase** — Postgres with Row-Level Security (RLS), Auth (magic link /
  password / Google OAuth / TOTP 2FA), and Storage.
- **Stripe** — Billing (featured-listing subscription) and **Connect Express**
  (marketplace escrow + payouts).
- **Resend** — transactional email.

Money is stored as `numeric(10,2)` GBP in Postgres and converted to integer
pence only at the Stripe boundary.

## 3. Scope — review these paths

### 3a. Payment / money movement (primary focus)
| Area | Files |
| --- | --- |
| Stripe client + helpers | `src/lib/stripe.ts` |
| Connect onboarding (Express) | `src/app/api/stripe/connect/onboard/route.ts`, `src/lib/connect.ts` |
| Featured-subscription checkout & portal | `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/portal/route.ts` |
| Marketplace order checkout (escrow in) | `src/app/api/stripe/orders/checkout/route.ts` |
| Order lifecycle + release/refund/transfer | `src/lib/orders.ts`, `src/app/dashboard/orders/actions.ts` |
| Stripe webhook (all event handling) | `src/app/api/webhooks/stripe/route.ts` |
| Admin dispute resolution (refund / release) | `src/app/admin/actions.ts` |
| Auto-release + scheduled jobs | `src/app/api/cron/**` |
| Money tables + RLS | `supabase/migrations/0011_connect.sql` … `0015_disputes.sql` |

**Escrow model to verify:** buyer pays the **platform** account
(`mode: 'payment'`), funds sit on the platform balance tagged with a
`transfer_group` = order id, and on release the supplier's share is sent via
`stripe.transfers.create` to their connected account. Commission is what is
**not** transferred. Commission rate + amount are **snapshotted onto the order at
creation** so later rate changes never touch in-flight orders.

### 3b. Authentication & authorisation
| Area | Files |
| --- | --- |
| Session / role / MFA helpers (`requireUser`, `requireAdmin`, AAL2) | `src/lib/auth.ts` |
| Supabase clients (anon / server / **service-role**) | `src/lib/supabase/*.ts` |
| Edge session gate | `src/proxy.ts` |
| Auth landing (OAuth + magic link + recovery) | `src/app/auth/callback/route.ts`, `src/app/auth/confirm/route.ts` |
| Rate limiting | `src/lib/rateLimit.ts` |

### 3c. Public write endpoints (abuse surface)
`src/app/api/enquiries/route.ts`, `src/app/api/pricing-lead/route.ts`,
`src/app/api/earn/route.ts`, `src/app/api/submit-listing/route.ts`,
`src/app/api/showcase-submit/route.ts` (**accepts an image upload**),
`src/app/api/subscribe/route.ts` (newsletter — GDPR consent capture),
`src/app/claim/[token]/actions.ts`, `src/app/api/webhooks/calcom/route.ts`.

Both `submit-listing` and `showcase-submit` accept **file uploads** to the public
`service-media` Storage bucket — review type/size validation and the generated
storage path (see the file-upload checklist item under *General*).

## 4. Review checklist (what "pass" means)

### Payments & webhooks
- [ ] The Stripe webhook verifies the signature against the raw request body
      (`request.text()` + `STRIPE_WEBHOOK_SECRET`) before trusting any event.
- [ ] Webhook handlers are **idempotent** — a replayed or duplicated event
      cannot double-pay, double-transfer, or double-refund.
- [ ] Order amount, commission rate, and commission amount are computed
      server-side and cannot be influenced by client input; pence conversion is
      correct and rounding-safe.
- [ ] Payout (`transfers.create`) only runs for orders that are genuinely
      released/completed, to the correct connected account, once.
- [ ] Refund path (`refunds.create`) is admin-only and cannot be triggered
      against an already-released or already-refunded order.
- [ ] A supplier cannot receive a payout without completed Connect onboarding
      (`payouts_enabled`); a package cannot be made bookable otherwise.
- [ ] Auto-release cron cannot be triggered by an unauthenticated caller
      (`CRON_SECRET`) and respects disputes (won't release a disputed order).
- [ ] No secret keys are ever exposed to the browser; only `NEXT_PUBLIC_*` and
      the Stripe **publishable** key reach the client.

### Authorisation & data access
- [ ] Every money-moving and admin write is server-side via the **service-role**
      client or an ownership-scoped session query — never client-trusted.
- [ ] RLS on `orders`, `payouts`, `reviews`, `disputes` blocks cross-account
      reads/writes (buyer sees only their orders, seller only theirs, admin all;
      no client insert/update on webhook-written tables).
- [ ] Admin actions require `requireAdmin` **with AAL2 (2FA)** enforced.
- [ ] Server Actions confirm ownership (`seller_id = auth.uid()` / parent
      `exists(...)`) before writing child rows.
- [ ] Reviews can only be left by a buyer with a completed order for that
      service, one per order.

### General
- [ ] Public POST endpoints are rate-limited and validate + bound all input.
- [ ] File uploads (`submit-listing`, `showcase-submit`) enforce an allow-list of
      image MIME types and a size cap, generate a non-guessable server-side path,
      and can't be used to overwrite existing objects or exhaust storage.
- [ ] The claim-by-token flow can't be abused to hijack a listing (auto-approve
      only on verified email-domain / submitter-email match).
- [ ] Error handling never leaks secrets or internal detail to users.
- [ ] Dependencies have no known critical advisories (`pnpm audit`).

## 5. Access the reviewer needs

- **Read access to this GitHub repository.**
- The site running in **Stripe test mode** (no live keys required to review).
- A read-through of the Supabase schema + RLS policies (the `supabase/migrations`
  folder is the source of truth; a reviewer may also be given read access to the
  Supabase dashboard).
- Environment variables are documented in `.env.example` — **no real secrets are
  in the repo or shared in writing.**

## 6. Out of scope

- Marketing pages, directory browsing, and non-payment content.
- Design / UX / accessibility (covered separately).
- Third-party compliance handled by Stripe (KYC, PCI on hosted Checkout,
  supplier identity via Connect Express).

## 7. Sign-off criteria (the deliverable)

A short written report that either:
1. **Confirms** the payment and auth paths are safe to run with live keys, or
2. **Lists** any issues by severity with the file/line and a suggested fix.

Once (1) is reached — or the issues in (2) are fixed and re-checked — the Stripe
account is switched from test to live keys and payments go live. Until then,
**test keys only.**

---

*Legal note: taking payment makes Plistic a party to the transaction. The Terms
of Service already carry marketplace / escrow / refund / dispute clauses
(`src/data/legal.ts`); these should be confirmed by a solicitor alongside this
technical review.*

---

## Appendix — author self-audit (2026-07-14)

A first-pass self-review was done before handover to save the reviewer time.
The money paths verified as sound (please re-confirm independently):

- **Webhook** verifies the Stripe signature against the raw body; `markOrderPaid`
  is idempotent via a `status = 'pending'` guard.
- **Checkout** computes amount + commission **server-side** from the DB package
  price (client sends only a `packageId`); buyer must be signed in; rate-limited;
  seller must have `payouts_enabled`; can't buy own listing.
- **Release/payout** acts only on `delivered` orders, uses a Stripe
  `idempotencyKey` (`order_release_<id>`) **and** a `unique(order_id)` constraint
  on `payouts` — so a buyer-confirm/auto-release race can't double-pay.
- **Refund** is admin+AAL2 only, `disputed`-only, with `idempotencyKey`
  (`order_refund_<id>`).
- **RLS** isolates orders/payouts/reviews/disputes per party; money tables take
  no client writes (service-role only), except order-gated review inserts.
- **Admin** actions all enforce `requireAdmin` (role + 2FA/AAL2).

Minor notes left for the reviewer to weigh (money is safe in each):

1. A buyer-confirm vs auto-release race can insert a duplicate `order_events`
   "released" row and a second `payouts` insert that fails on the unique
   constraint (swallowed). No double transfer (idempotency key). Cosmetic/audit.
2. `markOrderPaid` could log a duplicate "paid" event under simultaneous webhook
   delivery. No double state change. Cosmetic.
3. The webhook does not handle Stripe-side `charge.dispute.created` (bank
   chargebacks) or `charge.refunded` — the app has its own dispute flow, but
   bank-initiated chargebacks won't reflect in-app. Worth a decision.
