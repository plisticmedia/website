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

## ⚠️ Before you launch
See **`docs/PRE-LAUNCH.md`** — the single "don't forget" checklist (migrations to
run, email/2FA setup, the professional security review that must happen before
real payments, and the planned first-login tour).

## Database setup (one-time, in Supabase SQL Editor)
Run these once, in order (each is idempotent — safe to re-run). The full,
up-to-date list is in `docs/PRE-LAUNCH.md`; the earliest are:
`0001_init` → `0002_rls` → `0003_seed` → `0004_storage` → `0005_directory` →
`0006_listing_website` → `0007_service_areas` → … → `0018_account_type`.
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
- **"Merge duplicate services & locations"** (button on `/admin`) — collapses
  case/spacing duplicates (e.g. "Video production" + "Video Production") into one.
  Run it after a big import, then fine-tune the rest in `/admin/taxonomy`.
- **"Clear rating"** (per listing, Google column) — removes a wrong Google match and
  stops it re-matching; **"Re-check Google"** turns matching back on for that listing.
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

## Going live
The public coming-soon password gate has been removed. The main site is public;
dashboard, admin, and seller workflows remain protected by Supabase auth.

## Google ratings (built — needs an API key to switch on)
Listings show their Google star rating + review count once a **Places API (New)**
key is added. To turn it on:
1. In **Google Cloud Console**, create a project, enable **Places API (New)**, and
   create an **API key** (restrict it to the Places API).
2. In **Vercel → Settings → Environment Variables**, add `GOOGLE_PLACES_API_KEY`
   (the key) and `CRON_SECRET` (any long random string). Redeploy.
3. In **`/admin`**, click **"Refresh Google ratings"** to fetch them now. After that
   a nightly cron keeps them current automatically.
Businesses are matched to Google by name + address, so keep those accurate. Listings
with no Google match simply show no stars.

## Not yet enabled (fast-follows)
- **Per-account paid featuring** (Stripe) — needs a Stripe account + a monthly price;
  the free admin "Make trusted" already covers launch partners.
- **Auth email via Resend SMTP** — set this in Supabase (Authentication → Emails →
  SMTP) to remove the sign-in email rate limit. (You've raised the cap to 1000, which
  covers launch; SMTP removes the limit entirely.)

## Troubleshooting
- **"email rate limit exceeded" on login** → Supabase's built-in mailer cap; wait an
  hour, or connect Resend SMTP (above) to remove it.
- **A page 404s / a new feature is missing** → you're on an older Vercel preview;
  open the newest **Ready** deployment (Vercel → Deployments).
- **A listing has no map pin** → it needs an address/postcode (add one in the listing
  editor, then **`/admin` → "Add listings to the map"** to geocode). Businesses with no
  fixed address (Scotland-wide / remote) aren't pinned — by design they appear in the
  **"Scotland-wide & remote"** list beside the map instead.
- **The map** groups nearby businesses into numbered circles; zoom in and they split into
  individual pins showing each business's address. Filter by service on `/directory/density`.
- **Import "skipped" instead of "updated"** → older deployment; use the newest build.
- **Legal** → `/terms` and `/privacy` are data-driven in `src/data/legal.ts`; have a
  solicitor review the Partner Directory clauses before launch.
