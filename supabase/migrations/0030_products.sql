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
