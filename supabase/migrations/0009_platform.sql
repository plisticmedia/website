-- Plistic — platform Phase 1 additions (directory → full platform).
-- Additive + idempotent. Run after 0007.

-- ---------------------------------------------------------------------------
-- Listing fields: claim links, provenance, trust badges, richer profile
-- ---------------------------------------------------------------------------
alter table services
  add column if not exists claim_token text unique,   -- per-listing claim link
  add column if not exists source text,                -- e.g. 'public research'
  add column if not exists verified boolean not null default false, -- trust badge
  add column if not exists founding boolean not null default false, -- founding partner
  add column if not exists credits text,               -- notable work / credits
  add column if not exists availability text,           -- free-text availability
  add column if not exists view_count int not null default 0;

-- Consent captured at the moment a business claims its listing.
alter table profiles
  add column if not exists marketing_opt_in boolean,
  add column if not exists consent_at timestamptz;

-- ---------------------------------------------------------------------------
-- Profile insights: daily-bucketed view tallies (no per-user tracking)
-- ---------------------------------------------------------------------------
create table if not exists service_views (
  service_id uuid not null references services (id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (service_id, day)
);

alter table service_views enable row level security;

-- Owner (or admin) can read their own view stats; writes happen via the
-- service role only (server-side, bypasses RLS), so no insert/update policy.
drop policy if exists "service_views: owner read" on service_views;
create policy "service_views: owner read" on service_views
  for select using (
    exists (
      select 1 from services s
      where s.id = service_id and (s.seller_id = auth.uid() or is_admin())
    )
  );
