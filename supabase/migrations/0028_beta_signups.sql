-- Beta-tester sign-ups captured from the directory coming-soon gate and the
-- "list your business" form. Written server-side via the service-role client;
-- admins can read, nobody else. No public read/insert (like other lead tables).
create table if not exists beta_signups (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  business_name text,
  source text not null default 'gate', -- 'gate' | 'list-your-business'
  created_at timestamptz not null default now()
);

create index if not exists beta_signups_email_idx on beta_signups (email);
create index if not exists beta_signups_created_idx on beta_signups (created_at desc);

alter table beta_signups enable row level security;

drop policy if exists "beta_signups: admin all" on beta_signups;
create policy "beta_signups: admin all" on beta_signups
  for all using (is_admin()) with check (is_admin());
