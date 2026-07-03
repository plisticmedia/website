-- Plistic — Phase 2 marketplace, step E: disputes / refunds.
-- Additive + idempotent. Run after 0014.
-- A buyer can raise an issue before funds are released; that pauses auto-release
-- until an admin resolves it (refund the buyer or release to the seller).
-- SECURITY-SENSITIVE: resolution moves money. Rows written by the server only.

do $$ begin
  create type dispute_status as enum ('open', 'resolved_refund', 'resolved_release', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders (id) on delete cascade, -- one open dispute per order
  raised_by uuid not null references profiles (id) on delete cascade,
  reason text,
  status dispute_status not null default 'open',
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists disputes_status_idx on disputes (status);

alter table disputes enable row level security;

-- Buyer and seller of the order can see its dispute; admin all. Writes (raise +
-- resolve) go through the service role with explicit checks.
drop policy if exists "disputes: party read" on disputes;
create policy "disputes: party read" on disputes
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

drop policy if exists "disputes: admin all" on disputes;
create policy "disputes: admin all" on disputes
  for all using (is_admin()) with check (is_admin());
