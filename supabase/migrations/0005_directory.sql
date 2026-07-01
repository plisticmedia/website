-- Plistic Media — Directory vision upgrades (additive; safe on the existing DB)
-- Run AFTER 0001–0004. Adds: locations, multi-service tagging, business-listing
-- fields, claim-a-listing, and a pending moderation status.

-- ---------------------------------------------------------------------------
-- Pending moderation status (new/claimed listings await review before going live)
-- ---------------------------------------------------------------------------
alter type service_status add value if not exists 'pending';

-- ---------------------------------------------------------------------------
-- Editable LOCATION categories (mirrors `categories`)
-- ---------------------------------------------------------------------------
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Business-listing fields on `services`
-- ---------------------------------------------------------------------------
alter table services
  add column if not exists location_id uuid references locations (id) on delete set null,
  add column if not exists address text,
  add column if not exists postcode text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists google_place_id text,
  add column if not exists google_rating numeric(2, 1),
  add column if not exists google_rating_count int,
  add column if not exists google_rating_updated_at timestamptz,
  add column if not exists social_links jsonb not null default '{}',
  add column if not exists logo_url text;

-- Imported listings have no owner until claimed.
alter table services alter column seller_id drop not null;

create index if not exists services_location_idx on services (location_id);

-- ---------------------------------------------------------------------------
-- Many-to-many: a listing can hold several services (doc §4.3)
-- (`services.category_id` is kept as the primary/fallback category.)
-- ---------------------------------------------------------------------------
create table if not exists listing_services (
  service_id uuid not null references services (id) on delete cascade,
  category_id uuid not null references categories (id) on delete cascade,
  primary key (service_id, category_id)
);
create index if not exists listing_services_category_idx on listing_services (category_id);

-- ---------------------------------------------------------------------------
-- Claim-a-listing
-- ---------------------------------------------------------------------------
create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  claimant_user_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'pending',          -- pending | approved | rejected
  evidence text,                                    -- e.g. business-domain email
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists claims_service_idx on claims (service_id);
create index if not exists claims_user_idx on claims (claimant_user_id);
create trigger claims_updated_at before update on claims
  for each row execute function set_updated_at();

-- ===========================================================================
-- RLS
-- ===========================================================================
alter table locations        enable row level security;
alter table listing_services enable row level security;
alter table claims           enable row level security;

-- locations: public read, admin write
create policy "locations: public read" on locations
  for select using (true);
create policy "locations: admin write" on locations
  for all using (is_admin()) with check (is_admin());

-- listing_services: visible when parent listing is published; seller/admin manage
create policy "listing_services: public read for published" on listing_services
  for select using (
    exists (select 1 from services s where s.id = service_id and s.status = 'published')
  );
create policy "listing_services: seller manage own" on listing_services
  for all using (
    exists (select 1 from services s where s.id = service_id and s.seller_id = auth.uid())
  ) with check (
    exists (select 1 from services s where s.id = service_id and s.seller_id = auth.uid())
  );
create policy "listing_services: admin all" on listing_services
  for all using (is_admin()) with check (is_admin());

-- claims: a signed-in user can request a claim and read their own; admin manages
create policy "claims: insert own" on claims
  for insert with check (auth.uid() = claimant_user_id);
create policy "claims: read own" on claims
  for select using (auth.uid() = claimant_user_id);
create policy "claims: admin all" on claims
  for all using (is_admin()) with check (is_admin());

-- ===========================================================================
-- Seed a starter set of Scotland-wide locations (editable in admin)
-- ===========================================================================
insert into locations (slug, name, sort_order) values
  ('glasgow',            'Glasgow',                 10),
  ('edinburgh',          'Edinburgh',               20),
  ('aberdeen',           'Aberdeen & North East',   30),
  ('dundee',             'Dundee & Tayside',        40),
  ('stirling',           'Stirling & Forth Valley', 50),
  ('highlands-islands',  'Highlands & Islands',     60),
  ('south-scotland',     'South of Scotland',       70),
  ('fife',               'Fife',                    80),
  ('remote-scotland',    'Remote / Scotland-wide',  90)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;
