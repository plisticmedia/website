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
