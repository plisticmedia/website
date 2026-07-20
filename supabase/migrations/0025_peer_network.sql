-- Peer network: verified collaborations + private peer feedback.
--
-- Layer 1 — peer_connections: a business declares it has worked with another;
-- the other confirms. Only mutually-confirmed links are shown publicly. Safe.
--
-- Layer 2/3 — peer_feedback: structured, business-to-business feedback about a
-- working relationship. Deliberately NOT publicly readable via RLS — only the
-- rater and admins can read it. Any public aggregate is computed server-side
-- (service role) and gated behind a feature flag until it's legally signed off.
-- This keeps honest negatives useful to the operator without publishing a
-- damaging statement about a named business.

-- ---------------------------------------------------------------------------
-- Layer 1: confirmed collaborations
-- ---------------------------------------------------------------------------
create table if not exists peer_connections (
  id uuid primary key default gen_random_uuid(),
  requester_service_id uuid not null references services (id) on delete cascade,
  peer_service_id uuid not null references services (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined')),
  note text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (requester_service_id, peer_service_id),
  check (requester_service_id <> peer_service_id)
);
create index if not exists peer_connections_peer_idx on peer_connections (peer_service_id);
create index if not exists peer_connections_requester_idx on peer_connections (requester_service_id);

alter table peer_connections enable row level security;

-- Anyone can read a confirmed link between two published listings (profile map).
drop policy if exists "peer_conn: public read confirmed" on peer_connections;
create policy "peer_conn: public read confirmed" on peer_connections
  for select using (
    status = 'confirmed'
    and exists (select 1 from services s where s.id = requester_service_id and s.status = 'published')
    and exists (select 1 from services s where s.id = peer_service_id and s.status = 'published')
  );

-- Either party (owner of one of the two listings) can read their own links,
-- including pending, to manage them; admins read all.
drop policy if exists "peer_conn: owner read" on peer_connections;
create policy "peer_conn: owner read" on peer_connections
  for select using (
    is_admin()
    or exists (select 1 from services s where s.id = requester_service_id and s.seller_id = auth.uid())
    or exists (select 1 from services s where s.id = peer_service_id and s.seller_id = auth.uid())
  );

-- Writes happen server-side (service role) with explicit ownership checks, so no
-- client insert/update/delete policies.

-- ---------------------------------------------------------------------------
-- Layer 2/3: private peer feedback
-- ---------------------------------------------------------------------------
create table if not exists peer_feedback (
  id uuid primary key default gen_random_uuid(),
  rater_service_id uuid not null references services (id) on delete cascade,
  subject_service_id uuid not null references services (id) on delete cascade,
  would_work_again text not null check (would_work_again in ('yes', 'mixed', 'no')),
  reliability int check (reliability between 1 and 5),
  communication int check (communication between 1 and 5),
  quality int check (quality between 1 and 5),
  private_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rater_service_id, subject_service_id),
  check (rater_service_id <> subject_service_id)
);
create index if not exists peer_feedback_subject_idx on peer_feedback (subject_service_id);

create trigger peer_feedback_updated_at before update on peer_feedback
  for each row execute function set_updated_at();

alter table peer_feedback enable row level security;

-- NOT publicly readable. Only the rater (their own submissions) and admins can
-- read rows. No public aggregate via RLS — that is computed server-side and
-- gated by a feature flag. Writes are server-side (service role) only.
drop policy if exists "peer_fb: rater or admin read" on peer_feedback;
create policy "peer_fb: rater or admin read" on peer_feedback
  for select using (
    is_admin()
    or exists (select 1 from services s where s.id = rater_service_id and s.seller_id = auth.uid())
  );
