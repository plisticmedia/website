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
