-- ============================================================================
-- Plistic marketplace — all migrations 0030-0035, in order.
-- Safe to run as one block, even if you've already run some: every statement
-- is idempotent (create ... if not exists / add column if not exists / etc).
-- Paste the whole thing into the Supabase SQL editor and Run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0030_products.sql
-- ---------------------------------------------------------------------------
-- Marketplace products (Phase 1). A business (services row) can list items for
-- sale — services or physical goods — each with a photo gallery. Buyable pages
-- and checkout come in later phases; this is the data + management layer.
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  title text not null,
  description text,
  price_gbp numeric(10, 2),
  product_type text not null default 'physical' check (product_type in ('physical', 'service')),
  stock int,                                   -- null = unlimited / made to order
  fulfilment text check (fulfilment in ('shipping', 'collection', 'both')),
  delivery_info text,
  status text not null default 'draft' check (status in ('draft', 'active', 'sold', 'removed')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_service_idx on products (service_id);
create index if not exists products_status_idx on products (status);

drop trigger if exists products_updated_at on products;
create trigger products_updated_at before update on products
  for each row execute function set_updated_at();

create table if not exists product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_media_product_idx on product_media (product_id);

alter table products enable row level security;
alter table product_media enable row level security;

-- products: public reads active items on published listings; the listing owner
-- manages their own; admin all.
drop policy if exists "products: public read active" on products;
create policy "products: public read active" on products
  for select using (
    status = 'active'
    and exists (select 1 from services s where s.id = products.service_id and s.status = 'published')
  );

drop policy if exists "products: owner manage" on products;
create policy "products: owner manage" on products
  for all using (
    exists (select 1 from services s where s.id = products.service_id and s.seller_id = auth.uid())
  ) with check (
    exists (select 1 from services s where s.id = products.service_id and s.seller_id = auth.uid())
  );

drop policy if exists "products: admin all" on products;
create policy "products: admin all" on products
  for all using (is_admin()) with check (is_admin());

-- product_media mirrors the parent product's access.
drop policy if exists "product_media: public read" on product_media;
create policy "product_media: public read" on product_media
  for select using (
    exists (
      select 1 from products p
      join services s on s.id = p.service_id
      where p.id = product_media.product_id and p.status = 'active' and s.status = 'published'
    )
  );

drop policy if exists "product_media: owner manage" on product_media;
create policy "product_media: owner manage" on product_media
  for all using (
    exists (
      select 1 from products p
      join services s on s.id = p.service_id
      where p.id = product_media.product_id and s.seller_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from products p
      join services s on s.id = p.service_id
      where p.id = product_media.product_id and s.seller_id = auth.uid()
    )
  );

drop policy if exists "product_media: admin all" on product_media;
create policy "product_media: admin all" on product_media
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- 0031_marketplace_orders.sql
-- ---------------------------------------------------------------------------
-- Marketplace checkout (Phase 3). Physical goods & services sold as `products`
-- reuse the same escrow `orders` system as bookable packages: buyer pays the
-- platform, funds are held, seller delivers/ships, buyer confirms (or auto-
-- release), then payout minus commission. This just teaches `orders` about
-- products, quantity, and where to ship. Additive + idempotent.
-- SECURITY-SENSITIVE: orders move real money. Server-writes only (unchanged RLS).

alter table orders add column if not exists product_id uuid references products (id) on delete set null;
alter table orders add column if not exists quantity int not null default 1;
-- Shipping address snapshot (from Stripe Checkout) for physical goods, so the
-- seller knows where to post it. Null for services / collection.
alter table orders add column if not exists ship_to jsonb;
-- 'shipping' | 'collection' | 'both' snapshot at purchase.
alter table orders add column if not exists fulfilment text;

create index if not exists orders_product_id_idx on orders (product_id);

-- ---------------------------------------------------------------------------
-- 0032_product_revisions.sql
-- ---------------------------------------------------------------------------
-- Revision limits (marketplace). A seller can cap how many rounds of changes a
-- buyer gets included in the price; beyond that, further changes are arranged
-- (and paid for) separately with the seller. Additive + idempotent.

-- How many change-request rounds are included. Null = unlimited (default).
alter table products add column if not exists revision_limit int;

-- Snapshot of the item's revision_limit at purchase, so later edits to the item
-- never change the deal on an in-flight order. Null = unlimited.
alter table orders add column if not exists revision_limit int;

-- ---------------------------------------------------------------------------
-- 0033_custom_offers.sql
-- ---------------------------------------------------------------------------
-- Custom offers (Fiverr-style). A seller sends a specific buyer a one-off
-- priced offer — e.g. "2 extra revisions, £15" when the buyer has run out of
-- included revisions. The buyer accepts and pays through the same escrow as any
-- order, so an accepted offer becomes a normal `orders` row and flows through
-- deliver → confirm → payout. Additive + idempotent.
-- SECURITY-SENSITIVE: an accepted offer creates a charge. Server-writes only.

create table if not exists custom_offers (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  seller_id uuid not null references profiles (id) on delete cascade,
  buyer_id uuid not null references profiles (id) on delete cascade,
  -- The order that prompted this offer (e.g. the one out of revisions). Context
  -- only — the accepted offer is its own separate order.
  parent_order_id uuid references orders (id) on delete set null,
  title text not null,
  description text,
  price_gbp numeric(10, 2) not null,
  delivery_days int,
  revision_limit int,                          -- revisions included in this offer (null = unlimited)
  status text not null default 'sent' check (status in ('sent', 'accepted', 'declined', 'cancelled', 'expired')),
  order_id uuid references orders (id) on delete set null,   -- the order created once paid
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_offers_buyer_idx on custom_offers (buyer_id);
create index if not exists custom_offers_seller_idx on custom_offers (seller_id);
create index if not exists custom_offers_parent_idx on custom_offers (parent_order_id);

drop trigger if exists custom_offers_updated_at on custom_offers;
create trigger custom_offers_updated_at before update on custom_offers
  for each row execute function set_updated_at();

-- Link an order back to the offer it came from, so the paid-webhook can mark
-- the offer accepted.
alter table orders add column if not exists custom_offer_id uuid references custom_offers (id) on delete set null;

-- RLS: buyer and seller read their own offers; admin all. All writes go through
-- the service role (server actions / webhook) with explicit party checks, so no
-- client write policy.
alter table custom_offers enable row level security;

drop policy if exists "custom_offers: party read" on custom_offers;
create policy "custom_offers: party read" on custom_offers
  for select using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "custom_offers: admin all" on custom_offers;
create policy "custom_offers: admin all" on custom_offers
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- 0034_order_milestones.sql
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 0035_package_milestones.sql
-- ---------------------------------------------------------------------------
-- Milestones on bookable packages. Lets a seller advertise a staged / deposit
-- payment plan on a listing package, so any buyer can book the work in stages
-- straight from the listing (no bespoke offer needed). Reuses the same
-- order_milestones + staged-release machinery as custom offers. Additive.

-- Milestone template: [{ "title": "...", "amount_gbp": 100 }, ...]. Null = a
-- single payment on delivery (the existing behaviour).
alter table service_packages add column if not exists milestones jsonb;

