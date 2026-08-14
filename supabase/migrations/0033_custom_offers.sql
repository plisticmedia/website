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
