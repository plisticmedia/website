-- ---------------------------------------------------------------------------
-- "Best of Scotland" showcase.
--
-- A curated editorial feed celebrating Scotland's creative, arts and media
-- scene — videos, images, events, news stories and standout work — separate
-- from the business directory. Anyone can submit an item (arrives as 'pending');
-- admins publish. Written by the API/admin via the service role.
-- ---------------------------------------------------------------------------

create table if not exists showcase_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'work' check (kind in ('video', 'image', 'event', 'news', 'work')),
  title text not null,
  summary text,
  body text,
  image_url text,           -- cover image (site asset path or full URL)
  embed_url text,           -- YouTube / Vimeo embed URL (video kind)
  link_url text,            -- external source or on-site link (e.g. /work/...)
  source text,              -- attribution / credit (e.g. "RSNO", "Plistic")
  location text,
  event_date date,          -- for kind = 'event'
  is_featured boolean not null default false,
  status text not null default 'published' check (status in ('published', 'pending', 'removed')),
  submitter_email text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  published_at timestamptz default now()
);

create index if not exists showcase_items_feed_idx
  on showcase_items (status, is_featured, published_at desc);

alter table showcase_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'showcase_items' and policyname = 'showcase: public read') then
    create policy "showcase: public read" on showcase_items for select using (status = 'published');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'showcase_items' and policyname = 'showcase: admin all') then
    create policy "showcase: admin all" on showcase_items for all using (is_admin()) with check (is_admin());
  end if;
end $$;

-- Seed with Plistic's own work so the showcase isn't empty at launch. Idempotent.
insert into showcase_items (kind, title, summary, image_url, link_url, source, is_featured)
select 'work', 'Strathclyde Inspire', 'Production support for a show that reached #1 in its niche on Apple Podcasts.', '/assets/photos/strathclyde-inspire.jpg', '/work/strathclyde-inspire', 'Plistic', true
where not exists (select 1 from showcase_items where title = 'Strathclyde Inspire');

insert into showcase_items (kind, title, summary, image_url, link_url, source, is_featured)
select 'work', 'Tiny Changes', 'End-to-end production for a youth mental health podcast about building a music career without losing yourself.', '/assets/photos/podcast-monitor.webp', '/work/tiny-changes', 'Plistic', true
where not exists (select 1 from showcase_items where title = 'Tiny Changes');

insert into showcase_items (kind, title, summary, image_url, link_url, source, is_featured)
select 'work', 'Connect-Ed Network', 'Eight live events turned into an evergreen podcast series, social clips and a reusable resource for Scotland''s university entrepreneurship network.', '/assets/photos/connect-ed.png', '/work/connect-ed-network', 'Plistic', false
where not exists (select 1 from showcase_items where title = 'Connect-Ed Network');

insert into showcase_items (kind, title, summary, image_url, link_url, source, is_featured)
select 'work', 'Unfiltered', 'A UKRI ESRC-funded research documentary on neurodiverse entrepreneurship, produced with full accessibility coordination throughout.', '/assets/photos/documentary-interview.webp', '/work/unfiltered-neurodiverse-entrepreneur', 'Plistic', false
where not exists (select 1 from showcase_items where title = 'Unfiltered');
