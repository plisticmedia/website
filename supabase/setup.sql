-- ==========================================================================
-- Plistic Media — ONE-SHOT DATABASE SETUP
-- Paste this whole file into the Supabase SQL Editor and click RUN.
-- It is the same as supabase/migrations/0001-0004 combined, in order.
-- ==========================================================================


-- >>>>> supabase/migrations/0001_init.sql <<<<<

-- Plistic Media backend — initial schema
-- Run order: this file first, then 0002_rls.sql, then 0003_seed.sql
--
-- Two halves:
--   A) Services directory (sellers, listings, enquiries, sponsorships)
--   B) Agency lead-gen (leads, referrals, partnerships, quotes, bookings, payments)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('seller', 'admin');
create type service_status as enum ('draft', 'published', 'paused', 'removed');
create type enquiry_status as enum ('new', 'responded', 'closed');
create type sponsorship_status as enum ('active', 'past_due', 'canceled');
create type lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost');
create type booking_status as enum ('scheduled', 'completed', 'canceled', 'no_show');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- A) SERVICES DIRECTORY
-- ===========================================================================

-- 1:1 with auth.users. Created automatically on signup (see 0002_rls.sql trigger).
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'seller',
  display_name text,
  bio text,
  avatar_url text,
  website_url text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles (id) on delete cascade,
  category_id uuid references categories (id) on delete set null,
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  cover_image_url text,
  status service_status not null default 'draft',
  is_featured boolean not null default false,
  featured_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_status_idx on services (status);
create index services_category_idx on services (category_id);
create index services_seller_idx on services (seller_id);
create index services_featured_idx on services (is_featured, featured_until);
create trigger services_updated_at before update on services
  for each row execute function set_updated_at();

-- Display-only pricing tiers. No checkout — informational.
create table service_packages (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  name text not null,
  price_gbp numeric(10, 2),
  delivery_days int,
  features text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index service_packages_service_idx on service_packages (service_id);

-- Portfolio samples (images / video URLs in Supabase Storage).
create table service_media (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  url text not null,
  kind text not null default 'image', -- 'image' | 'video'
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index service_media_service_idx on service_media (service_id);

-- Buyer -> seller lead. This is the off-platform "purchase" action.
create table enquiries (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  seller_id uuid not null references profiles (id) on delete cascade,
  buyer_name text not null,
  buyer_email text not null,
  message text not null,
  status enquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index enquiries_seller_idx on enquiries (seller_id);
create index enquiries_service_idx on enquiries (service_id);
create trigger enquiries_updated_at before update on enquiries
  for each row execute function set_updated_at();

-- Featured-listing subscription state, driven by Stripe webhooks.
create table sponsorships (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles (id) on delete cascade,
  service_id uuid references services (id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text,
  status sponsorship_status not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sponsorships_seller_idx on sponsorships (seller_id);
create index sponsorships_service_idx on sponsorships (service_id);
create trigger sponsorships_updated_at before update on sponsorships
  for each row execute function set_updated_at();

-- ===========================================================================
-- B) AGENCY LEAD-GEN
-- ===========================================================================

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  source text,                 -- e.g. 'contact', 'pricing_estimator'
  payload jsonb not null default '{}',
  status lead_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger leads_updated_at before update on leads
  for each row execute function set_updated_at();

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_name text,
  referrer_email text,
  referred_name text,
  referred_email text,
  project_description text,
  payload jsonb not null default '{}',
  status lead_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger referrals_updated_at before update on referrals
  for each row execute function set_updated_at();

create table partnerships (
  id uuid primary key default gen_random_uuid(),
  partner_name text,
  partner_email text,
  partner_company text,
  partner_discipline text,
  partner_message text,
  payload jsonb not null default '{}',
  status lead_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger partnerships_updated_at before update on partnerships
  for each row execute function set_updated_at();

create table quotes (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  estimate_gbp numeric(10, 2),
  payload jsonb not null default '{}',   -- estimator selections
  status lead_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger quotes_updated_at before update on quotes
  for each row execute function set_updated_at();

create table bookings (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  external_event_id text unique,   -- Cal.com booking uid
  scheduled_at timestamptz,
  payload jsonb not null default '{}',
  status booking_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger bookings_updated_at before update on bookings
  for each row execute function set_updated_at();

create table payments (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  amount_gbp numeric(10, 2),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  payload jsonb not null default '{}',   -- estimator/quote context
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger payments_updated_at before update on payments
  for each row execute function set_updated_at();


-- >>>>> supabase/migrations/0002_rls.sql <<<<<

-- Plistic Media backend — Row Level Security policies & auth provisioning
-- Run after 0001_init.sql.

-- ---------------------------------------------------------------------------
-- Auto-provision a profile row when a new auth user is created.
-- New signups default to the 'seller' role. Admins are promoted manually.
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Helper: is the current user an admin?
-- ---------------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table.
-- ---------------------------------------------------------------------------
alter table profiles         enable row level security;
alter table categories       enable row level security;
alter table services         enable row level security;
alter table service_packages enable row level security;
alter table service_media    enable row level security;
alter table enquiries        enable row level security;
alter table sponsorships     enable row level security;
alter table leads            enable row level security;
alter table referrals        enable row level security;
alter table partnerships     enable row level security;
alter table quotes           enable row level security;
alter table bookings         enable row level security;
alter table payments         enable row level security;

-- ===========================================================================
-- profiles
-- ===========================================================================
create policy "profiles: public read" on profiles
  for select using (true);
create policy "profiles: self update" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles: admin all" on profiles
  for all using (is_admin()) with check (is_admin());

-- ===========================================================================
-- categories (public read; admin write)
-- ===========================================================================
create policy "categories: public read" on categories
  for select using (true);
create policy "categories: admin write" on categories
  for all using (is_admin()) with check (is_admin());

-- ===========================================================================
-- services
-- ===========================================================================
create policy "services: public read published" on services
  for select using (status = 'published');
create policy "services: seller read own" on services
  for select using (auth.uid() = seller_id);
create policy "services: seller insert own" on services
  for insert with check (auth.uid() = seller_id);
create policy "services: seller update own" on services
  for update using (auth.uid() = seller_id) with check (auth.uid() = seller_id);
create policy "services: seller delete own" on services
  for delete using (auth.uid() = seller_id);
create policy "services: admin all" on services
  for all using (is_admin()) with check (is_admin());

-- ===========================================================================
-- service_packages (visible when parent listing is visible)
-- ===========================================================================
create policy "packages: public read for published" on service_packages
  for select using (
    exists (select 1 from services s where s.id = service_id and s.status = 'published')
  );
create policy "packages: seller manage own" on service_packages
  for all using (
    exists (select 1 from services s where s.id = service_id and s.seller_id = auth.uid())
  ) with check (
    exists (select 1 from services s where s.id = service_id and s.seller_id = auth.uid())
  );
create policy "packages: admin all" on service_packages
  for all using (is_admin()) with check (is_admin());

-- ===========================================================================
-- service_media
-- ===========================================================================
create policy "media: public read for published" on service_media
  for select using (
    exists (select 1 from services s where s.id = service_id and s.status = 'published')
  );
create policy "media: seller manage own" on service_media
  for all using (
    exists (select 1 from services s where s.id = service_id and s.seller_id = auth.uid())
  ) with check (
    exists (select 1 from services s where s.id = service_id and s.seller_id = auth.uid())
  );
create policy "media: admin all" on service_media
  for all using (is_admin()) with check (is_admin());

-- ===========================================================================
-- enquiries
-- Public may INSERT (rate-limited + BotID at the app layer). Sellers read
-- only their own. Server-side ingestion uses the service role and bypasses RLS.
-- ===========================================================================
create policy "enquiries: public insert" on enquiries
  for insert with check (true);
create policy "enquiries: seller read own" on enquiries
  for select using (auth.uid() = seller_id);
create policy "enquiries: seller update own" on enquiries
  for update using (auth.uid() = seller_id) with check (auth.uid() = seller_id);
create policy "enquiries: admin all" on enquiries
  for all using (is_admin()) with check (is_admin());

-- ===========================================================================
-- sponsorships (sellers read own; writes happen via service role / webhooks)
-- ===========================================================================
create policy "sponsorships: seller read own" on sponsorships
  for select using (auth.uid() = seller_id);
create policy "sponsorships: admin all" on sponsorships
  for all using (is_admin()) with check (is_admin());

-- ===========================================================================
-- Agency lead-gen tables.
-- No anon/authenticated policies => only the service role (server-side) and
-- admins can touch them. Public form submissions are inserted via service role.
-- ===========================================================================
create policy "leads: admin all" on leads
  for all using (is_admin()) with check (is_admin());
create policy "referrals: admin all" on referrals
  for all using (is_admin()) with check (is_admin());
create policy "partnerships: admin all" on partnerships
  for all using (is_admin()) with check (is_admin());
create policy "quotes: admin all" on quotes
  for all using (is_admin()) with check (is_admin());
create policy "bookings: admin all" on bookings
  for all using (is_admin()) with check (is_admin());
create policy "payments: admin all" on payments
  for all using (is_admin()) with check (is_admin());


-- >>>>> supabase/migrations/0003_seed.sql <<<<<

-- Plistic Media backend — seed reference data (categories)
-- Safe to re-run; uses upserts on slug.

insert into categories (slug, name, sort_order) values
  ('podcasting',     'Podcasting',      10),
  ('video',          'Video production', 20),
  ('event-filming',  'Event filming',   30),
  ('documentary',    'Documentary',     40),
  ('photography',    'Photography',     50),
  ('animation',      'Animation',       60),
  ('pr',             'PR & comms',      70),
  ('audio',          'Audio & music',   80)
on conflict (slug) do update
  set name = excluded.name, sort_order = excluded.sort_order;


-- >>>>> supabase/migrations/0004_storage.sql <<<<<

-- Plistic Media backend — Storage bucket for listing media.
-- Public-read bucket; only the owning seller (or admin) can write.
-- Files are namespaced by the seller's user id as the top-level folder:
--   service-media/<seller_uid>/<service_id>/<filename>

insert into storage.buckets (id, name, public)
values ('service-media', 'service-media', true)
on conflict (id) do nothing;

-- Anyone can read (bucket is public, but keep an explicit select policy too).
create policy "service-media: public read" on storage.objects
  for select using (bucket_id = 'service-media');

-- A seller can write only inside their own /<uid>/ folder.
create policy "service-media: owner insert" on storage.objects
  for insert with check (
    bucket_id = 'service-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "service-media: owner update" on storage.objects
  for update using (
    bucket_id = 'service-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "service-media: owner delete" on storage.objects
  for delete using (
    bucket_id = 'service-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

