-- ============================================================================
-- 0022_subscribers — email signups for story notifications + newsletter.
-- Granular, GDPR-friendly consent: two independent opt-ins captured with a
-- timestamp. Writes happen only through the service-role API (like enquiries),
-- so there are no public/authenticated RLS policies — admin reads only.
-- ============================================================================

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  -- Independent consents (each defaults off; the form leaves both unticked).
  notify_stories boolean not null default false, -- "tell me about new stories"
  marketing boolean not null default false,       -- "send me the newsletter / marketing"
  source text,                                    -- where they signed up (e.g. "showcase")
  consent_at timestamptz not null default now(),  -- when consent was given/updated
  unsubscribed_at timestamptz,                    -- set when they opt out of everything
  created_at timestamptz not null default now()
);

create index if not exists subscribers_active_idx
  on subscribers (unsubscribed_at) where unsubscribed_at is null;

alter table subscribers enable row level security;

-- Service-role API handles all writes; only admins can read the list.
create policy "subscribers: admin all" on subscribers
  for all using (is_admin()) with check (is_admin());
