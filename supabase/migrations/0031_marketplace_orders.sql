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
