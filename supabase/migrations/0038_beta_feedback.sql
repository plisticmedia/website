-- ---------------------------------------------------------------------------
-- Beta feedback.
--
-- Notes testers send from the feedback page or the floating feedback button.
-- Still emailed to the team inbox (frictionless), and now also stored so it can
-- be reviewed in the admin console. Written by the API via the service role;
-- only admins can read.
-- ---------------------------------------------------------------------------

create table if not exists beta_feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  name text,
  email text,
  -- 1-5 star rating, when given from the feedback page.
  rating integer check (rating is null or (rating between 1 and 5)),
  -- Which page they were on (auto-filled from the floating button).
  page text,
  created_at timestamptz not null default now()
);

create index if not exists beta_feedback_created_idx on beta_feedback (created_at desc);

alter table beta_feedback enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'beta_feedback' and policyname = 'beta_feedback: admin all'
  ) then
    create policy "beta_feedback: admin all" on beta_feedback
      for all using (is_admin()) with check (is_admin());
  end if;
end $$;
