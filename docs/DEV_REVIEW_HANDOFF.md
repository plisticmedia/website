# Plistic — developer review handoff

**For:** a developer friend doing a general code/build review before launch.
**What this is:** a map of the project, how to run it, and where to look. For the
**payment/auth security** review specifically, see `SECURITY_REVIEW_BRIEF.md`.

## What Plistic is
A directory + marketplace + showcase for Scotland's creative/media sector:
- **Directory** — searchable business/freelancer profiles (map, filters, enquiries).
- **Marketplace** — bookable packages on a listing → Stripe **escrow** → payout to the seller.
- **Showcase** — a curated editorial feed ("Best of Scotland").
- **Peer network** — verified "worked with" links + (flagged-off) peer confidence.

## Stack
- **Next.js (App Router) on Vercel** — SSR pages, Route Handlers (`src/app/api/**`),
  Server Actions, and an edge gate (`src/proxy.ts`).
- **Supabase** — Postgres + Row-Level Security, Auth (magic link / password / Google / TOTP 2FA), Storage.
- **Stripe** — Billing (featured subscription) + **Connect Express** (marketplace escrow + payouts). **Test mode.**
- **Resend** — transactional email. **Leaflet/OSM** map. **Vercel Web Analytics** (cookieless).

## Run it locally
```bash
pnpm install
cp .env.example .env.local   # then fill in values (see below)
pnpm dev                     # http://localhost:3000
pnpm build                   # production build + typecheck + lint
```
- **Env vars:** every key is listed in `.env.example` with a comment. You need a Supabase
  project (URL + anon + service-role keys), and optionally Stripe **test** keys + Resend to
  exercise those flows. No real secrets are in the repo.
- **Database:** the schema is the ordered files in `supabase/migrations/` (run them in
  number order in the Supabase SQL editor). Seed/content helpers are the other `supabase/*.sql` files.
- **Coming-soon gate:** the whole site sits behind a password gate unless `SITE_LIVE=true`.
  Locally, either set `SITE_LIVE=true` or use the gate password to get in. (Owner will share the password.)

## Where things live
| Area | Path |
| --- | --- |
| Public pages (home, directory, showcase, pricing, work) | `src/app/*`, `src/sections/*` |
| Directory listing profile | `src/app/directory/[slug]/` |
| Seller dashboard (listings, enquiries, orders, sales, payouts, network) | `src/app/dashboard/*` |
| Admin | `src/app/admin/*` |
| API routes (Stripe, webhooks, cron, submissions) | `src/app/api/**` |
| Auth / session / roles / 2FA | `src/lib/auth.ts`, `src/lib/supabase/*` |
| Data access helpers | `src/lib/services.ts`, `peers.ts`, `showcase.ts`, `orders.ts` |
| Edge gate + session refresh | `src/proxy.ts`, `src/lib/supabase/middleware.ts` |

## Data model in one breath
`profiles` (accounts) own many `services` (directory listings). A listing has
`service_packages` (display or **bookable**), `service_media`, categories/areas.
Buyers create `orders` (escrow) → `payouts`. Trust: `reviews` (order-gated),
`peer_connections` + `peer_feedback` (B2B). Content: `showcase_items`. Money is
`numeric(10,2)` GBP, converted to pence only at the Stripe boundary.

## What's built (review surface)
Directory + search + map + filters; claim flow (unclaimed → claim by token/email);
listings CRUD + media + embeds; enquiries + inbox + email; **marketplace** (Connect
onboarding, bookable packages, escrow checkout, delivery/release/refund, disputes,
order-gated reviews); featured-listing subscription; showcase (public + no-code admin
+ submissions); peer network; multi-listing (business vs individual); admin moderation;
2FA for admins; cookieless analytics; legal pages; coming-soon gate.

## Please focus on
1. **Payments & auth** — see `SECURITY_REVIEW_BRIEF.md` (this is the go-live gate; **Stripe stays in test mode until it passes**).
2. **RLS correctness** — can any user read/write another's orders, listings, feedback? (Policies in `supabase/migrations/*`.)
3. **Server Actions & API routes** — ownership checks, input validation, rate limiting on public POSTs.
4. **General** — obvious bugs, broken flows, accessibility, anything that would embarrass us in front of beta users.

## Known state / not-yet
- Stripe is **test mode** (no live keys until the security review passes).
- Public **peer confidence** aggregate is built but **off** behind `PEER_CONFIDENCE_PUBLIC` (pending legal advice) — see `PEER_NETWORK_SPEC.md`.
- A couple of showcase news items are text-only pending press images.

## How to give feedback
GitHub issues or PR review comments are ideal. For anything money/auth-related, note severity + file/line.
