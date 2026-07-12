# Plistic — Pre-launch checklist ⚠️ READ BEFORE GOING LIVE

This is the "don't forget" list. Work top to bottom before you take the site
fully public or switch on real payments. Everything here is written in plain
English — no coding needed except where it says "for your developer".

Launch date referenced in the claim emails: **13 July 2026** (change it in
`src/lib/claimInvite.ts` if the date moves).

---

## 1. Database migrations to run (Supabase → SQL Editor)

Run any you haven't already, **in order**. Each is safe to re-run. There is no
`0008` — that number was skipped, which is fine.

```
0001_init   0002_rls   0003_seed   0004_storage   0005_directory
0006_listing_website   0007_service_areas   0009_platform   0010_submitter
0011_connect   0012_orders   0013_payouts   0014_reviews   0015_disputes
0016_claim_invites   0017_claim_followup   0018_account_type
0019_pricing_leads   0020_booking_url   0021_showcase
```

- **`0018_account_type`** — unlocks public buyer accounts (vs business). Until run,
  everyone who signs up is treated as a business.
- **`0019_pricing_leads`** — stores calculator estimates so the daily follow-up
  email can nudge people who don't get in touch.
- **`0020_booking_url`** — lets sellers add a Cal.com/Calendly booking link to
  their listing ("Book a call" button).
- **`0021_showcase`** — the "Best of Scotland" showcase feed + submissions; seeds
  it with Plistic's own work so it isn't empty.

None of these break anything if run late — the related feature just switches on
once its migration is applied.

## 2. Email delivery (so sign-in links and claim emails arrive)

- In **Supabase → Authentication → Emails → SMTP**, connect Resend:
  host `smtp.resend.com`, port `465`, user `resend`, password = your Resend API
  key, sender `hello@updates.plisticmedia.com`. Without this, magic-link and
  password-reset emails are unreliable.
- Claim-invitation emails already send via Resend from the verified domain
  `updates.plisticmedia.com`.

## 3. Two-factor authentication for admins (built — set it up)

- 2FA is now **required** for every admin. The first time you open `/admin`
  after this deploy, you'll be sent to set up an authenticator app (Google
  Authenticator, Authy, 1Password, etc.): scan the QR code, enter the 6-digit
  code, done. After that you enter a code once per session.
- **Keep a backup.** Store the setup key somewhere safe, or enrol a second device.
  If you ever lose your authenticator, the factor must be removed from your
  account (Supabase dashboard, or your developer via the service role) before you
  can get back into admin. With only one admin today, this matters — don't get
  locked out.
- Everyone else can turn on 2FA voluntarily under **Dashboard → Security**.

## 4. Google sign-in (currently hidden on purpose)

- The "Continue with Google" button is **hidden** because the Google provider
  isn't configured in Supabase yet (it was returning a 404).
- To switch it on: configure Google as an auth provider in Supabase, then set
  the environment variable `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` in Vercel.
  Until then, email + password and magic-link sign-in work fine.

## 5. Payments — DO NOT switch to live Stripe keys yet

- The whole marketplace (escrow, payouts, refunds, reviews) is built and tested
  in **Stripe test mode**. It moves real money, so it must be reviewed by a
  developer before you use live keys. See section 7.
- Owner steps in Stripe when you're ready (after review): enable Connect, and add
  the `account.updated`, transfer, and refund events to the webhook endpoint.

## 6. Going public (removing the "coming soon" gate)

- See `docs/operations-guide.md` → "Going live". In short: the coming-soon gate
  hides unclaimed/preview listings until you're ready; lift it on launch day.
- Before lifting it: send the claim invites (Admin → claim invites panel),
  preview a sample of listings, and confirm the imported pages look good.

---

## 7. 🔒 PROFESSIONAL REVIEW BEFORE LAUNCH — NON-NEGOTIABLE (task #25)

**Do not go live with real payments or the gate removed until an experienced
developer has reviewed the platform.** This was agreed and must not be skipped.
Give them this scoped list:

- **Payments / escrow (highest priority):** the money paths in
  `src/lib/orders.ts`, `src/app/api/stripe/*`, `src/app/api/webhooks/stripe/*`,
  and the disputes/refunds admin actions. Check: webhook signature verification,
  idempotency keys, commission maths, that funds can't be double-released or
  released to the wrong account, and refund correctness.
- **Access control / RLS:** every Supabase Row Level Security policy
  (`supabase/migrations/*_rls` and per-table policies). Confirm one user can
  never read or write another's orders, listings, enquiries, or profile.
- **Auth & admin:** the `requireAdmin` / `getAdminApiContext` gates, the edge
  middleware, and the 2FA enforcement — confirm no admin route or admin API
  bypasses role + 2FA.
- **GDPR / the seed listings:** ~83 businesses were imported from public
  information as *unclaimed* listings under legitimate interest, with a one-click
  opt-out and consent captured on claim. Have this posture confirmed by a
  solicitor/DPO, and the Terms/Privacy reviewed now that the site takes payments
  and holds a marketplace.
- **Terms & refund/dispute wording:** `src/data/legal.ts` — taking payment makes
  Plistic a party to transactions; a solicitor should review the marketplace,
  refund and dispute clauses.
- **Secrets & headers:** confirm no secrets in the repo, security headers present
  (`next.config.ts`), and rate limits on public forms.

---

## 8. 🧭 First-login feature tour / onboarding (task #24 — build near the end)

**Decision made:** build this once the rest of the platform is finished, so it
tours the final feature set rather than a moving target. Captured here so it
isn't forgotten. Suggested spec for when we build it:

- A short, dismissible guided tour that runs the **first time** a user reaches
  their dashboard, tailored to their account type:
  - **Business:** create/claim a listing → add photos & showreel → set up payouts
    → turn on 2FA → where enquiries and sales arrive.
  - **Buyer:** how to browse and filter the directory → how booking & escrow
    protects them → where their orders live.
- Store "tour seen" against the profile (a `has_seen_tour boolean`, or
  localStorage for a lighter version) so it shows once and can be replayed from a
  "Show me around" link.
- Keep it skippable and accessible (keyboard, screen-reader labels).
- Likely a small client component overlay; no new backend beyond the "seen" flag.

---

### Quick status of the recent work
- ✅ Appealing claim page + live-page preview (what the invite emails link to)
- ✅ Google sign-in 404 fixed (button hidden until configured)
- ✅ Admin 2FA built and enforced
- ✅ Public buyer accounts vs business accounts
- ⏳ Feature tour — deferred to end of build (section 8)
- ⏳ Professional dev + security review — gate before launch (section 7)
