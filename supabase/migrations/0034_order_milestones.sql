-- Milestones (Fiverr-style staged release). A seller can split a custom offer
-- into stages. The buyer pays the FULL amount up front, held in escrow like any
-- order; each stage is released to the seller (minus commission) as the buyer
-- approves it. The first stage acts as the "deposit". No money leaves escrow
-- until a stage is approved, so the platform carries no chargeback exposure.
-- Additive + idempotent. SECURITY-SENSITIVE: releases move money.

create table if not exists order_milestones (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  title text not null,
  amount_gbp numeric(10, 2) not null,
  commission_gbp numeric(10, 2) not null default 0,   -- this stage's slice of commission (snapshot)
  sort_order int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'delivered', 'released', 'disputed')),
  delivered_at timestamptz,
  released_at timestamptz,
  auto_release_at timestamptz,
  stripe_transfer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists order_milestones_order_idx on order_milestones (order_id);
create index if not exists order_milestones_status_idx on order_milestones (status);

drop trigger if exists order_milestones_updated_at on order_milestones;
create trigger order_milestones_updated_at before update on order_milestones
  for each row execute function set_updated_at();

-- Milestone template on the offer: [{ "title": "...", "amount_gbp": 100 }, ...]
alter table custom_offers add column if not exists milestones jsonb;

-- Marks an order as milestone-based (staged release instead of one release).
alter table orders add column if not exists has_milestones boolean not null default false;

-- payouts now records one row per released milestone as well as per single-shot
-- order, so it gains a milestone_id and the strict one-per-order rule is relaxed
-- to "one per non-milestone order" + "one per milestone".
alter table payouts add column if not exists milestone_id uuid references order_milestones (id) on delete cascade;
alter table payouts drop constraint if exists payouts_order_id_key;
create unique index if not exists payouts_order_single_idx on payouts (order_id) where milestone_id is null;
create unique index if not exists payouts_milestone_idx on payouts (milestone_id) where milestone_id is not null;

-- RLS: buyer + seller of the parent order read; admin all. Writes via service role.
alter table order_milestones enable row level security;

drop policy if exists "order_milestones: party read" on order_milestones;
create policy "order_milestones: party read" on order_milestones
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_milestones.order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

drop policy if exists "order_milestones: admin all" on order_milestones;
create policy "order_milestones: admin all" on order_milestones
  for all using (is_admin()) with check (is_admin());
