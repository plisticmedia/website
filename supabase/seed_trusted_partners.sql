-- Plistic Media — launch seed: extra categories + the two founding Trusted Partners.
-- Run in the Supabase SQL Editor AFTER 0005. Idempotent (safe to re-run).
-- You can edit/extend everything later from /admin and /admin/taxonomy.

-- 1) Categories the trusted partners (and your noted gap) need ----------------
insert into categories (slug, name, sort_order) values
  ('web-development', 'Web development',  90),
  ('music-video',     'Music video',     100),
  ('venues',          'Venues',          110)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

-- 2) Trusted Partner listings (owner-less imports; claimable later) -----------
-- Featured for 1 year, published, located Scotland-wide by default (edit in dashboard).
insert into services (seller_id, slug, title, summary, description, category_id, location_id, status, is_featured, featured_until)
select
  null,
  'thornwick-consulting',
  'Thornwick Consulting',
  'Applied AI engineering for production LLM systems, agents, evals, SaaS and backend platforms.',
  'Thornwick Consulting builds and ships applied AI: production LLM systems, autonomous agents, evaluation pipelines, and the SaaS and backend platforms around them — alongside full web development.',
  (select id from categories where slug = 'web-development'),
  (select id from locations where slug = 'remote-scotland'),
  'published', true, now() + interval '1 year'
on conflict (slug) do nothing;

insert into services (seller_id, slug, title, summary, description, category_id, location_id, status, is_featured, featured_until)
select
  null,
  'lockie-media',
  'Lockie Media',
  'Music videos and pyrotechnics.',
  'Lockie Media produces high-energy music videos with in-house pyrotechnics for standout live and recorded performance.',
  (select id from categories where slug = 'music-video'),
  (select id from locations where slug = 'remote-scotland'),
  'published', true, now() + interval '1 year'
on conflict (slug) do nothing;

-- 3) Multi-service tags for those listings ------------------------------------
insert into listing_services (service_id, category_id)
select s.id, c.id
from services s
join categories c on c.slug = any (array['web-development'])
where s.slug = 'thornwick-consulting'
on conflict do nothing;

insert into listing_services (service_id, category_id)
select s.id, c.id
from services s
join categories c on c.slug = any (array['music-video', 'video'])
where s.slug = 'lockie-media'
on conflict do nothing;
