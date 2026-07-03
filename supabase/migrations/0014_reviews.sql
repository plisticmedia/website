-- Plistic — Phase 2 marketplace, step D: verified reviews.
-- Additive + idempotent. Run after 0013.
-- Reviews are gated on a completed order (verified purchase) and expire after
-- 12 months so a profile reflects recent work.

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders (id) on delete cascade, -- one review per order
  service_id uuid not null references services (id) on delete cascade,
  buyer_id uuid not null references profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 months')
);

create index if not exists reviews_service_id_idx on reviews (service_id);

alter table reviews enable row level security;

-- Public sees non-expired reviews on published listings.
drop policy if exists "reviews: public read" on reviews;
create policy "reviews: public read" on reviews
  for select using (
    expires_at > now()
    and exists (select 1 from services s where s.id = service_id and s.status = 'published')
  );

-- A buyer may review only their own completed order for that listing.
drop policy if exists "reviews: buyer insert" on reviews;
create policy "reviews: buyer insert" on reviews
  for insert with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from orders o
      where o.id = order_id
        and o.buyer_id = auth.uid()
        and o.service_id = reviews.service_id
        and o.status = 'completed'
    )
  );

drop policy if exists "reviews: admin all" on reviews;
create policy "reviews: admin all" on reviews
  for all using (is_admin()) with check (is_admin());
