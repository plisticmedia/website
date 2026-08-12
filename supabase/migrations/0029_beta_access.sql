-- Beta-tester directory access. A profile with beta_access = true (or role
-- 'admin') can reach the Media Directory while it's still behind the coming-soon
-- gate. Granted automatically to anyone who signed up as a beta tester and then
-- made (or already had) an account with the same email.
alter table profiles add column if not exists beta_access boolean not null default false;

-- Backfill: existing accounts whose email is in beta_signups.
update profiles p
set beta_access = true
where beta_access = false
  and exists (
    select 1
    from beta_signups b
    join auth.users u on lower(u.email) = lower(b.email)
    where u.id = p.id
  );

-- Grant beta access to an existing account by email (called when someone who
-- already has an account signs up as a beta tester).
create or replace function grant_beta_access_by_email(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set beta_access = true
  from auth.users u
  where u.id = p.id
    and lower(u.email) = lower(p_email)
    and p.beta_access = false;
end;
$$;

-- New sign-ups: grant beta_access if the email already signed up as a beta tester.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, account_type, beta_access)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(nullif(new.raw_user_meta_data ->> 'account_type', ''), 'buyer'),
    exists (select 1 from public.beta_signups b where lower(b.email) = lower(new.email))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
