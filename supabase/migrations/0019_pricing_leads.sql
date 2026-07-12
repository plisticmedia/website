-- ---------------------------------------------------------------------------
-- Pricing-estimate leads + follow-up.
--
-- Every estimate sent from the calculator is now stored so we can send a single
-- gentle follow-up a few days later if the person hasn't been in touch — turning
-- more quotes into booked calls. Written by the API/cron via the service role;
-- only admins can read them.
-- ---------------------------------------------------------------------------

create table if not exists pricing_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  organisation text,
  service_title text,
  range_text text,
  project_note text,
  followup_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Cheap lookup for the follow-up sweep (leads not yet followed up).
create index if not exists pricing_leads_pending_idx
  on pricing_leads (created_at)
  where followup_sent_at is null;

alter table pricing_leads enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'pricing_leads' and policyname = 'pricing_leads: admin all'
  ) then
    create policy "pricing_leads: admin all" on pricing_leads
      for all using (is_admin()) with check (is_admin());
  end if;
end $$;
