# Plistic — Operations & Handover Guide

Plain-English guide to running the site + directory day to day. No coding needed
for anything in the "Running it" section.

## What the site is
- **Marketing site** (home, services, work, pricing, about) + **agency lead forms**
  (referral, partnership, quote, contact) that email you and save to the database.
- **Creative & media directory**: businesses listed with services, coverage areas,
  photos and links; buyers browse, filter (by service **and** location), see a **map**
  and a **density map**, and send **enquiries**. Sellers can self-list and **claim**
  imported listings. You moderate and feature partners.

## Where the keys/secrets live (never in chat or git)
- **Vercel → Project → Settings → Environment Variables** (powers the live site).
- **Supabase** holds the database, logins, and uploaded images.
- **Resend** sends all email (verified sender domain `updates.plisticmedia.com`).
- Variable names are documented in `.env.example`.

## Database setup (one-time, in Supabase SQL Editor)
Run these once, in order (each is idempotent — safe to re-run):
`0001_init` → `0002_rls` → `0003_seed` → `0004_storage` → `0005_directory` →
`0006_listing_website` → `0007_service_areas` → `0008_location_centroids`.
(The one-shot `supabase/launch_directory.sql` bundles the partner seed + admin.)

## Running it (no developer needed)

### Add / update businesses (bulk)
1. Businesses sign up via your Google Form → answers land in the Google Sheet.
2. **File → Download → CSV.**
3. Sign in as admin → **`/admin/import`** → upload the CSV.
   - New businesses are created (as "in review", or published if you tick the box).
   - Businesses already imported are **updated** from the sheet (fix data in the
     sheet and re-upload). Listings a seller has claimed are never overwritten.
4. **`/admin` → "Add listings to the map"** to geocode new addresses into pins.

### Manage the directory (`/admin`)
- **Publish / Remove** any listing; approve listings that are "in review".
- **Make trusted / Un-trust** — free "Trusted Partner" feature (pins to top, badge).
- **Claim requests** — approve/reject businesses claiming their listing.
- **`/admin/taxonomy`** — add/rename/remove **services** and **locations** (no deploy).
- **`/admin/import`** — bulk CSV import.
- All the agency leads (referrals, partnerships, quotes, bookings, enquiries) are listed here.

### Accounts
- Anyone signs in at **`/login`** with a magic email link (creates a seller account).
- To make someone an **admin**, run in Supabase SQL:
  `update profiles set role='admin' where id=(select id from auth.users where email='them@example.com');`

## The sign-up form (recommended questions)
- **Company or individual name** (required)
- **Business address** — short answer; note it's public + "town/postcode is fine"
- **Which areas of Scotland do you work in?** — checkboxes (match the location list)
- **What category best describes your services?** (+ an "other" box)
- Short description, website, logo/profile image, social links, publish consent.
The importer maps these columns automatically.

## Going live (removing the "coming soon" gate)
The whole site currently sits behind a password (`/coming-soon`). To launch, remove
or bypass that gate — the mechanism is in `src/proxy.ts` + `src/lib/siteAccess.ts`
(a developer flips it off, or changes the gate to allow the public in). Do this only
when you're ready for the site to be public.

## Not yet enabled (fast-follows)
- **Google ratings** on listings — needs a Google Cloud account + Places API key.
- **Per-account paid featuring** (Stripe) — needs a Stripe account + a monthly price;
  the free admin "Make trusted" already covers launch partners.
- **Auth email via Resend SMTP** — set this in Supabase (Authentication → Emails →
  SMTP) to remove the sign-in email rate limit. Recommended before launch.

## Troubleshooting
- **"email rate limit exceeded" on login** → Supabase's built-in mailer cap; wait an
  hour, or connect Resend SMTP (above) to remove it.
- **A page 404s / a new feature is missing** → you're on an older Vercel preview;
  open the newest **Ready** deployment (Vercel → Deployments).
- **A listing has no map pin** → its location is "Scotland-wide/remote" (no single
  point — by design) or it needs an address/postcode; add one and re-run geocode.
- **Import "skipped" instead of "updated"** → older deployment; use the newest build.
- **Legal** → `/terms` and `/privacy` are data-driven in `src/data/legal.ts`; have a
  solicitor review the Partner Directory clauses before launch.
