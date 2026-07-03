-- Plistic — Phase 2 marketplace, step B: bookable packages + escrow orders.
-- Additive + idempotent. Run after 0011.
-- SECURITY-SENSITIVE: orders move real money. Order rows are written only by the
-- server (service role / Stripe webhook); clients get read-only RLS.

-- Order lifecycle. Escrow model: buyer pays the platform (paid → in_progress),
-- supplier delivers, buyer confirms or auto-release (completed), or disputed /
-- refunded / canceled.
do $$ begin
  create type order_status as enum (
    'pending', 'paid', 'in_progress', 'delivered', 'completed', 'disputed', 'refunded', 'canceled'
  );
exception when duplicate_object then null; end $$;

-- A package the seller has opted into selling online (checkout-enabled).
alter table service_packages
  add column if not exists is_bookable boolean not null default false;

-- ---------------------------------------------------------------------------
-- orders — one buyer purchase of one package. Amounts snapshotted at creation.
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  package_id uuid references service_packages (id) on delete set null,
  seller_id uuid not null references profiles (id) on delete cascade,
  buyer_id uuid not null references profiles (id) on delete cascade,
  buyer_email text,
  amount_gbp numeric(10, 2) not null,
  commission_rate numeric(4, 3) not null,   -- e.g. 0.100 or 0.050, snapshotted
  commission_gbp numeric(10, 2) not null,
  currency text not null default 'gbp',
  status order_status not null default 'pending',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  transfer_group text,                        -- ties the charge to the later payout transfer
  delivered_at timestamptz,
  released_at timestamptz,
  auto_release_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_service_id_idx on orders (service_id);
create index if not exists orders_seller_id_idx on orders (seller_id);
create index if not exists orders_buyer_id_idx on orders (buyer_id);
create index if not exists orders_status_idx on orders (status);

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- order_events — append-only audit trail of every state change (escrow record).
-- ---------------------------------------------------------------------------
create table if not exists order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  type text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_id_idx on order_events (order_id);

-- ---------------------------------------------------------------------------
-- RLS: buyer and seller read their own orders; admin all. All writes happen
-- via the service role (checkout route / webhook), so no client write policy.
-- ---------------------------------------------------------------------------
alter table orders enable row level security;
alter table order_events enable row level security;

drop policy if exists "orders: party read" on orders;
create policy "orders: party read" on orders
  for select using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "orders: admin all" on orders;
create policy "orders: admin all" on orders
  for all using (is_admin()) with check (is_admin());

drop policy if exists "order_events: party read" on order_events;
create policy "order_events: party read" on order_events
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

drop policy if exists "order_events: admin all" on order_events;
create policy "order_events: admin all" on order_events
  for all using (is_admin()) with check (is_admin());
