# Security Assessment — plisticmedia

**Status:** Pre-launch review  
**Stack:** Next.js 15 (App Router) · Supabase (Auth + Postgres + Storage) · Stripe Connect · Vercel  
**Scope:** Auth, RLS policies, webhooks, file uploads, cron routes, XSS surface, secret hygiene, supply chain

---

## Summary

12 issues identified across 4 severity levels. One critical issue (**RLS privilege escalation**) allows any authenticated user to self-grant admin access and must be fixed before launch. Two high-severity issues (stored XSS, webhook bypass) follow immediately. All medium and low findings are documented below with concrete verification steps and targeted fixes.

---

## Issues by Severity

### CRITICAL

#### 1. RLS Privilege Escalation — Any user can grant themselves admin

**File:** `supabase/migrations/0002_rls.sql`

The `UPDATE` policy on `profiles` checks row ownership but does not restrict which columns can be updated:

```sql
using (auth.uid() = id)
```

Any authenticated user can call:

```js
supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
```

from the browser and the policy allows it, bypassing the entire admin gate.

**Verify:** Sign in as a regular user, open the browser console, run the update above, then reload — check `profiles.role` in the Supabase dashboard.

**Fix:**

```sql
-- Add a WITH CHECK clause that prevents role from changing
CREATE POLICY "profiles: self update" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );
```

Alternatively, restrict all `role` writes to the service-role client only (webhooks, admin actions).

---

### HIGH

#### 2. Stored XSS — `dangerouslySetInnerHTML` with DB-sourced listing title

**File:** `src/app/claim/[token]/page.tsx:88,139`

```ts
const featuredOffer = `...and ${svc.title} is featured from day one.`;
// ...
<p dangerouslySetInnerHTML={{ __html: featuredOffer }} />
```

`svc.title` is fetched from the database and interpolated directly into HTML. A listing with a title containing `<img onerror=...>` executes in any visitor's browser. Because listings go through admin approval first, this is second-order XSS: attacker submits payload → admin approves → visitors are attacked.

**Verify:** Create a listing with title `<img src=x onerror="alert('XSS')">`, approve it in admin, visit `/claim/<token>`.

**Fix:** Escape the title before interpolation, or switch to JSX (which escapes by default) and remove `dangerouslySetInnerHTML`:

```ts
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const featuredOffer = `...and ${escapeHtml(svc.title)} is featured from day one.`;
```

---

#### 3. Cal.com Webhook — Signature verification skipped when env var is unset

**File:** `src/app/api/webhooks/calcom/route.ts:16-18`

If `CALCOM_WEBHOOK_SECRET` is not set, the HMAC check is skipped entirely. Any external caller can POST arbitrary booking payloads and inject fake records into the database.

**Verify:** Remove `CALCOM_WEBHOOK_SECRET` from `.env.local`, POST any JSON body to `/api/webhooks/calcom` — it is accepted and processed.

**Fix:** Fail closed — return 500 if the secret is missing:

```ts
const secret = process.env.CALCOM_WEBHOOK_SECRET;
if (!secret) return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
```

---

### MEDIUM

#### 4. Cron Routes — `x-vercel-cron` header can be spoofed

**Files:** `src/app/api/cron/ratings/route.ts:22-29`, `src/app/api/cron/import-sheet/route.ts`

Cron routes accept requests if `x-vercel-cron` is present OR if `CRON_SECRET` matches. Vercel does not guarantee stripping `x-vercel-cron` from all external requests. If `CRON_SECRET` is unset, an attacker can trigger escrow auto-releases and full data backups on demand.

**Fix:** Remove the `x-vercel-cron` header fallback. Require `CRON_SECRET` unconditionally; treat its absence as a misconfiguration error at startup.

---

#### 5. PostgREST Filter Injection via `?q=` Search Parameter

**File:** `src/lib/services.ts:81-83` (mirrored at lines ~244, ~297)

```ts
const term = `%${query.q.replace(/[%_]/g, "")}%`;
builder = builder.or(`title.ilike.${term},summary.ilike.${term}`);
```

Only `%` and `_` are stripped. PostgREST parses `.or()` strings — parentheses and commas remain in user input. A crafted value can inject additional filter conditions:

```
?q=foo),google_rating.gte.4,(title.ilike.%
```

**Impact:** Bounded by the outer `status = 'published'` filter and RLS — unpublished rows cannot be read, but result counts and ordering can be manipulated.

**Fix:** Use column-level `.ilike()` calls instead of string-interpolated `.or()`:

```ts
builder = builder.ilike('title', term).or(`summary.ilike.${term}`);
// or two separate .or() calls, avoiding the composite string form
```

---

#### 6. File Upload — Permissive MIME check allows SVG uploads

**File:** `src/app/api/submit-listing/route.ts:96-97`

```ts
if (!file.type.startsWith("image/")) return error(...)
```

This allows `image/svg+xml`. SVGs with embedded `<script>` tags served from public Supabase Storage execute in browsers that navigate to them directly.

**Fix:** Use an explicit allowlist matching the authenticated upload paths:

```ts
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
if (!ALLOWED.has(file.type)) return error(...)
```

---

#### 7. Coming-Soon Gate — Bypass value hardcoded in source

**File:** `src/lib/siteAccess.ts:3-6`

- The beta password `plisticbeta` is disclosed in a comment in committed source.
- `SITE_ACCESS_COOKIE_VALUE` is a hardcoded constant — anyone with repo access can set the cookie manually and bypass the gate.

**Fix:**
- Remove the comment disclosing the plaintext password.
- Move `SITE_ACCESS_COOKIE_VALUE` to an env var (`SITE_ACCESS_COOKIE_SECRET`).
- Consider rotating the beta password since it is in git history.

---

### LOW

#### 8. No Content-Security-Policy Header

**File:** `next.config.ts`

A missing CSP means if an XSS payload lands (see issues 2 and 5), there is no browser-level containment.

**Fix:** Add a CSP via Next.js middleware, allowing Supabase Storage, Stripe JS, and map tile CDNs. Use `nonce`-based CSP for inline scripts.

---

#### 9. In-Memory Rate Limiter is Per-Instance

**File:** `src/lib/rateLimit.ts`

On Vercel serverless, each function instance has an independent in-memory store. Distributed requests hit different instances and never accumulate against a single limit. Effective only against single-IP casual abuse.

**Fix (when scale requires it):** Replace with `@upstash/ratelimit` — a near-drop-in swap for the existing abstraction.

---

#### 10. `deleteMedia` / `deletePackage` Server Actions — No Application-Layer Ownership Check

**File:** `src/app/dashboard/listings/actions.ts:301-308, 436-442`

These server actions pass the ID directly to Supabase delete, relying entirely on RLS for ownership. If a future migration introduces an RLS regression, any authenticated user could delete any record.

**Fix:** Add an explicit ownership pre-flight — query the record, assert `seller_id === currentUser.id`, then delete.

---

#### 11. `latest` Semver in `package.json`

**File:** `package.json`

`next`, `react`, `react-dom`, `typescript`, and `lucide-react` are declared as `"latest"`. The lockfile currently pins them, but regenerating without `--frozen-lockfile` can pull a breaking major version.

**Fix:** Pin to explicit major ranges (`"^19"`, `"^5"`, etc.) to allow patch/minor updates but block unintentional major bumps.

---

#### 12. No Dependency Vulnerability Scanning in CI

No GitHub Actions pipeline exists. `pnpm audit` is never run automatically.

**Fix:** Add a GitHub Actions workflow running `pnpm audit --audit-level=high` on every push and PR.

---

## Verification Checklist

| # | Issue | How to verify |
|---|---|---|
| 1 | RLS escalation | Run `supabase.from('profiles').update({role:'admin'})` as a regular user in the browser console |
| 2 | Stored XSS | Submit listing with HTML title, approve in admin, visit `/claim/<token>` |
| 3 | Cal.com bypass | Unset `CALCOM_WEBHOOK_SECRET`, POST any body to `/api/webhooks/calcom` |
| 4 | Cron spoofing | Remove `CRON_SECRET`, send request with `x-vercel-cron: 1` header to a cron route |
| 5 | Filter injection | Use `?q=foo),google_rating.gte.4,(title.ilike.%25` in the directory search |
| 6 | SVG upload | POST SVG with `image/svg+xml` MIME type to `/api/submit-listing` |
| 7 | Gate bypass | Manually set `plistic_site_access=<hardcoded value>` cookie and access the site |
| 8 | CSP | `curl -I <site>` — check for absent `Content-Security-Policy` header |
| 9 | Rate limit | Send 20+ rapid requests from multiple clients in parallel |
| 10 | Ownership check | Attempt to delete another user's media record by ID via server action |

---

## Remediation Order

1. **RLS privilege escalation** — fix before any launch
2. **Stored XSS** on claim page
3. **Cal.com webhook** — fail closed on missing secret
4. **Cron route hardening** — require `CRON_SECRET`
5. **SVG upload allowlist**
6. **Filter injection** cleanup
7. **CSP header**
8. **Coming-soon secret hygiene** + rotate beta password
9. **Rate limiter → Redis** (when scale demands it)
10. **CI pipeline + `pnpm audit`**
