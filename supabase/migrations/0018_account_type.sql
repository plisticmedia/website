-- ---------------------------------------------------------------------------
-- Buyer vs business accounts.
--
-- Until now every sign-up became a "seller" (business) and landed in the
-- business dashboard. The marketplace needs members of the public to sign up
-- purely to hire/buy — without being presented as a business.
--
-- `account_type` captures that intent, separate from `role` (which stays
-- seller/admin and governs permissions). Existing accounts are all businesses;
-- new generic sign-ups default to 'buyer' and can upgrade with one click when
-- they claim or list a business.
-- ---------------------------------------------------------------------------

alter table profiles add column if not exists account_type text;

-- Everyone who exists today listed or was seeded as a business.
update profiles set account_type = 'business' where account_type is null;

alter table profiles alter column account_type set default 'buyer';
alter table profiles alter column account_type set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_account_type_check'
  ) then
    alter table profiles
      add constraint profiles_account_type_check check (account_type in ('buyer', 'business'));
  end if;
end $$;

-- New sign-ups can declare their intent via auth metadata (account_type).
-- Absent a choice we default to 'buyer' — a buyer wrongly shown a business
-- dashboard was the reported problem; a buyer can upgrade to business instantly.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(nullif(new.raw_user_meta_data ->> 'account_type', ''), 'buyer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
