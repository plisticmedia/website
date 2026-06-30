# Plistic Media — Backend Setup & Progress

This document tracks the backend build described in `docs/section-plan.md` /
the services-directory plan, and tells a non-technical operator exactly which
accounts to create and which values to hand over.

## How to hand over keys (IMPORTANT — never paste secrets into chat)

Secrets live in **two places**, never in the chat window and never committed to
git:

1. **Vercel → Project → Settings → Environment Variables** — this is what the
   live site uses. Add each variable for *Production* and *Preview*.
2. **The Claude Code web environment → Environment variables / Secrets** — add
   the same values here so the assistant can run and test against your real
   accounts in this session. (`.env.local` files are wiped when the cloud
   container restarts, so the environment-variable settings are the durable
   place.)

The variable names to use are listed in `.env.example`. Paste the *values*
there; tell the assistant in chat only that "the keys are set", not the keys
themselves.

## Accounts to create & what to grab

| Service | What to do | Values needed (env var) |
|---|---|---|
| **Supabase** | Create a project. Open Project Settings → API. | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Stripe** | Create account. Create one **recurring** Product/Price (the monthly featured-listing fee) in **test mode** first. Enable the Customer Portal. Add a webhook endpoint later. | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_FEATURED_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` |
| **Resend** | Create account. Verify the `plisticmedia.com` (or `plistic.media`) sending domain. | `RESEND_API_KEY`, `EARN_FROM_EMAIL` |
| **Cal.com** | Already embedded on `/book`. Later: add a webhook for booking events. | `CALCOM_WEBHOOK_SECRET` |

> The £100–£200 Claude **Max** plan referenced in the brief is for using Claude;
> it is unrelated to these service accounts.

## Decisions still needed from the owner

These don't block the foundation work but are needed before the revenue and
deposit flows go live:

1. **Featured subscription price** — how much per month, and is it **per
   listing** or **per seller account**? (Schema currently supports either.)
2. **Agency deposit** on `/pricing` — a **flat amount** or a **% of the
   estimate**?
3. **Team notification inbox** — which email address should receive enquiry /
   lead alerts? (Defaults to `hello@plistic.media`.)
4. **Reviews** and **buyer accounts** — deferred for MVP unless required at
   launch.

## Running the database migrations

Once the Supabase project exists, run the SQL in `supabase/migrations/` in
order (via the Supabase SQL editor or the Supabase CLI):

1. `0001_init.sql` — tables, enums, triggers
2. `0002_rls.sql` — Row Level Security + signup → profile provisioning
3. `0003_seed.sql` — seed the service categories
4. `0004_storage.sql` — the public `service-media` storage bucket + policies

## Supabase Auth configuration (needed for Phase 1 to work)

In the Supabase dashboard, once the project exists:

1. **Authentication → URL Configuration**
   - Site URL: `https://www.plisticmedia.com`
   - Redirect URLs (use wildcards so every Vercel preview works without
     reconfiguring): add
     - `https://www.plisticmedia.com/**`
     - `https://*-hello-78393625s-projects.vercel.app/**` (all your Vercel previews)
     - `http://localhost:3000/**` (local dev)
2. **Authentication → Providers → Email**: enabled by default — magic-link
   sign-in works out of the box. **No email-template edit is required**: the
   `/auth/callback` route accepts both the PKCE `code` and `token_hash` styles.
3. *(Optional)* **Authentication → Providers → Google**: enable and paste a
   Google OAuth client ID + secret (create these in Google Cloud Console; set
   the authorized redirect URI to
   `https://<your-project-ref>.supabase.co/auth/v1/callback`). Magic-link works
   without this, so Google can wait.
4. To make yourself an **admin**: after your first sign-in, run in the SQL
   editor: `update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@plisticmedia.com');`

> Note: during testing, magic-link emails are sent by Supabase's built-in mailer
> (low hourly limit, may land in spam). Swapping in Resend SMTP for auth emails
> is a Phase 9 polish item.

## Build progress

- [x] **Phase 0 — Foundation (partial)**: dependencies installed
  (`@supabase/supabase-js`, `@supabase/ssr`, `stripe`, `zod`); Supabase client
  helpers (`src/lib/supabase/*`); Stripe client (`src/lib/stripe.ts`); full DB
  schema + RLS + seed + storage migrations; expanded `.env.example`.
- [ ] **Phase 0 (remaining)**: create the live Supabase/Stripe accounts, run
  migrations, populate env vars. *(needs owner accounts)*
- [x] **Phase 1 — Auth & accounts (code complete)**: Supabase Auth with email
  magic-link + Google OAuth; open self-signup; `/login` page; session refresh +
  route protection via `src/proxy.ts`; auth route handlers
  (`/auth/callback`, `/auth/confirm`, `/auth/signout`); `requireUser` /
  `requireAdmin` helpers; gated `/dashboard` shell. *(activates once Supabase
  keys + auth config below are in place)*
- [x] **Phase 2 — Agency lead capture (referral + partnership)**: `/api/earn`
  now persists submissions to the `referrals` / `partnerships` tables (service
  role) in addition to sending Resend emails. Contact + quote endpoints follow
  when those forms exist.
- [x] **Phase 3 — Directory listings (code complete)**: seller listing CRUD
  (create / edit / publish / pause / delete) with display-pricing packages and
  Supabase Storage photo uploads; public directory at **`/directory`** (search,
  category filter, pagination, featured-first) and listing detail at
  **`/directory/[slug]`** (gallery, packages, seller profile, enquiry CTA).
  Added a "Directory" link to the main nav. *(Listings live at `/directory`
  rather than `/services` to avoid clashing with the existing agency service
  pages.)*
- [x] **Phase 4 — Enquiries (complete)**: enquiry form on each listing →
  `/api/enquiries` saves the lead (honeypot-protected) and emails the seller +
  Plistic, with an auto-reply to the buyer. Seller **enquiry inbox** at
  `/dashboard/enquiries` lists enquiries, links a pre-filled email reply, and
  marks them responded/closed.
- [ ] **Phase 5 — Sponsored listings** (Stripe Billing + webhooks + cron)
- [ ] **Phase 6 — Seller dashboard**
- [ ] **Phase 7 — Agency booking & deposits** (Cal.com webhook, Stripe deposit)
- [ ] **Phase 8 — Admin dashboard**
- [ ] **Phase 9 — Hardening & launch** (rate limits, monitoring, legal, e2e)
