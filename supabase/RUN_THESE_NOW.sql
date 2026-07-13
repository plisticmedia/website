-- ============================================================
-- Plistic — run this whole block once in Supabase SQL Editor.
-- It is safe to run, and safe to run again if unsure.
-- ============================================================


-- ---- 0018_account_type ----
-- ---------------------------------------------------------------------------
-- Buyer vs business accounts.
--
-- Until now every sign-up became a "seller" (business) and landed in the
-- business dashboard. The marketplace needs members of the public to sign up
-- purely to hire/buy — without being presented as a business.
--
-- `account_type` captures that intent, separate from `role` (which stays
-- seller/admin and governs permissions). Existing accounts are all businesses;
-- new generic sign-ups default to 'buyer' and can upgrade with one click when
-- they claim or list a business.
-- ---------------------------------------------------------------------------

alter table profiles add column if not exists account_type text;

-- Everyone who exists today listed or was seeded as a business.
update profiles set account_type = 'business' where account_type is null;

alter table profiles alter column account_type set default 'buyer';
alter table profiles alter column account_type set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_account_type_check'
  ) then
    alter table profiles
      add constraint profiles_account_type_check check (account_type in ('buyer', 'business'));
  end if;
end $$;

-- New sign-ups can declare their intent via auth metadata (account_type).
-- Absent a choice we default to 'buyer' — a buyer wrongly shown a business
-- dashboard was the reported problem; a buyer can upgrade to business instantly.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(nullif(new.raw_user_meta_data ->> 'account_type', ''), 'buyer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


-- ---- 0019_pricing_leads ----
-- ---------------------------------------------------------------------------
-- Pricing-estimate leads + follow-up.
--
-- Every estimate sent from the calculator is now stored so we can send a single
-- gentle follow-up a few days later if the person hasn't been in touch — turning
-- more quotes into booked calls. Written by the API/cron via the service role;
-- only admins can read them.
-- ---------------------------------------------------------------------------

create table if not exists pricing_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  organisation text,
  service_title text,
  range_text text,
  project_note text,
  followup_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Cheap lookup for the follow-up sweep (leads not yet followed up).
create index if not exists pricing_leads_pending_idx
  on pricing_leads (created_at)
  where followup_sent_at is null;

alter table pricing_leads enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'pricing_leads' and policyname = 'pricing_leads: admin all'
  ) then
    create policy "pricing_leads: admin all" on pricing_leads
      for all using (is_admin()) with check (is_admin());
  end if;
end $$;


-- ---- 0020_booking_url ----
-- ---------------------------------------------------------------------------
-- Seller booking link.
-- Lets a listing owner add their own Cal.com / Calendly (or any) booking URL,
-- shown as a "Book a call" button on their public page.
-- ---------------------------------------------------------------------------

alter table services add column if not exists booking_url text;


-- ---- 0021_showcase ----
-- ---------------------------------------------------------------------------
-- "Best of Scotland" showcase.
--
-- A curated editorial feed celebrating Scotland's creative, arts and media
-- scene — videos, images, events, news stories and standout work — separate
-- from the business directory. Anyone can submit an item (arrives as 'pending');
-- admins publish. Written by the API/admin via the service role.
-- ---------------------------------------------------------------------------

create table if not exists showcase_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'work' check (kind in ('video', 'image', 'event', 'news', 'work')),
  title text not null,
  summary text,
  body text,
  image_url text,           -- cover image (site asset path or full URL)
  embed_url text,           -- YouTube / Vimeo embed URL (video kind)
  link_url text,            -- external source or on-site link (e.g. /work/...)
  source text,              -- attribution / credit (e.g. "RSNO", "Plistic")
  location text,
  event_date date,          -- for kind = 'event'
  is_featured boolean not null default false,
  status text not null default 'published' check (status in ('published', 'pending', 'removed')),
  submitter_email text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  published_at timestamptz default now()
);

create index if not exists showcase_items_feed_idx
  on showcase_items (status, is_featured, published_at desc);

alter table showcase_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'showcase_items' and policyname = 'showcase: public read') then
    create policy "showcase: public read" on showcase_items for select using (status = 'published');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'showcase_items' and policyname = 'showcase: admin all') then
    create policy "showcase: admin all" on showcase_items for all using (is_admin()) with check (is_admin());
  end if;
end $$;

-- Seed with Plistic's own work so the showcase isn't empty at launch. Idempotent.
insert into showcase_items (kind, title, summary, image_url, link_url, source, is_featured)
select 'work', 'Strathclyde Inspire', 'Production support for a show that reached #1 in its niche on Apple Podcasts.', '/assets/photos/strathclyde-inspire.jpg', '/work/strathclyde-inspire', 'Plistic', true
where not exists (select 1 from showcase_items where title = 'Strathclyde Inspire');

insert into showcase_items (kind, title, summary, image_url, link_url, source, is_featured)
select 'work', 'Tiny Changes', 'End-to-end production for a youth mental health podcast about building a music career without losing yourself.', '/assets/photos/podcast-monitor.webp', '/work/tiny-changes', 'Plistic', true
where not exists (select 1 from showcase_items where title = 'Tiny Changes');

insert into showcase_items (kind, title, summary, image_url, link_url, source, is_featured)
select 'work', 'Connect-Ed Network', 'Eight live events turned into an evergreen podcast series, social clips and a reusable resource for Scotland''s university entrepreneurship network.', '/assets/photos/connect-ed.png', '/work/connect-ed-network', 'Plistic', false
where not exists (select 1 from showcase_items where title = 'Connect-Ed Network');

insert into showcase_items (kind, title, summary, image_url, link_url, source, is_featured)
select 'work', 'Unfiltered', 'A UKRI ESRC-funded research documentary on neurodiverse entrepreneurship, produced with full accessibility coordination throughout.', '/assets/photos/documentary-interview.webp', '/work/unfiltered-neurodiverse-entrepreneur', 'Plistic', false
where not exists (select 1 from showcase_items where title = 'Unfiltered');

