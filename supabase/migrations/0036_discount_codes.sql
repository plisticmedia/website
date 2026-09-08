-- ---------------------------------------------------------------------------
-- Discount / promo codes.
--
-- Lets an admin create quote codes (e.g. EVENT50 = 50% off event filming days,
-- as printed on the business cards). A customer types the code into the pricing
-- estimator; if it's valid the estimate shows the discounted range, and the code
-- travels with their enquiry so Plistic honours it when quoting.
--
-- Codes are managed by admins only. Validation from the public estimator goes
-- through the service role in an API route (no public RLS read policy), which
-- returns just the fields needed to apply the discount.
-- ---------------------------------------------------------------------------

create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  -- Stored uppercased; matched case-insensitively.
  code text not null unique,
  label text,
  -- 'percent' → discount_value is a percentage (50 = 50% off).
  -- 'fixed'   → discount_value is a pound amount off (100 = £100 off).
  discount_type text not null default 'percent' check (discount_type in ('percent', 'fixed')),
  discount_value numeric not null check (discount_value >= 0),
  -- Which estimator service it applies to: a ServiceChoice value
  -- ('event' | 'podcast' | 'musicVideo' | 'documentary' | 'coaching' | 'other')
  -- or 'all' for any service.
  service text not null default 'all',
  active boolean not null default true,
  expires_at timestamptz,
  -- Optional cap on total redemptions; null = unlimited.
  max_uses integer check (max_uses is null or max_uses >= 0),
  used_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table discount_codes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'discount_codes' and policyname = 'discount_codes: admin all'
  ) then
    create policy "discount_codes: admin all" on discount_codes
      for all using (is_admin()) with check (is_admin());
  end if;
end $$;

-- Atomic redemption counter, called from the server after a lead uses a code.
-- security definer so it runs regardless of the caller's row-level access.
create or replace function increment_discount_use(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update discount_codes set used_count = used_count + 1 where id = p_id;
$$;

-- Record which code (if any) a pricing estimate lead used, so the follow-up and
-- the internal notification know to honour it.
alter table pricing_leads add column if not exists discount_code text;
