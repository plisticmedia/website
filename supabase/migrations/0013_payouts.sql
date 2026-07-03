-- Plistic — Phase 2 marketplace, step C: payouts (escrow release).
-- Additive + idempotent. Run after 0012.
-- SECURITY-SENSITIVE: payout rows record real transfers. Written only by the
-- server (release logic / cron); sellers get read-only RLS.

do $$ begin
  create type payout_status as enum ('pending', 'paid', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders (id) on delete cascade, -- one payout per order
  seller_id uuid not null references profiles (id) on delete cascade,
  stripe_transfer_id text,
  amount_gbp numeric(10, 2) not null,
  status payout_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists payouts_seller_id_idx on payouts (seller_id);

alter table payouts enable row level security;

-- Seller reads their own payouts; admin all. No client writes (service role only).
drop policy if exists "payouts: seller read" on payouts;
create policy "payouts: seller read" on payouts
  for select using (seller_id = auth.uid());

drop policy if exists "payouts: admin all" on payouts;
create policy "payouts: admin all" on payouts
  for all using (is_admin()) with check (is_admin());
