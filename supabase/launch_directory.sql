-- =============================================================================
-- Plistic — ONE-SHOT LAUNCH SETUP (run this whole file once in the SQL Editor)
-- Safe/idempotent. Combines: 0006 (website column) + trusted partners + admin.
-- Run AFTER 0005_directory.sql (which you've already run).
-- =============================================================================

-- 1) Per-listing website field ------------------------------------------------
alter table services add column if not exists website_url text;

-- 2) Extra categories the launch partners / your noted gap need ---------------
insert into categories (slug, name, sort_order) values
  ('web-development', 'Web development',  90),
  ('music-video',     'Music video',     100),
  ('venues',          'Venues',          110)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

-- 3) The two founding Trusted Partners (published + featured, no owner yet) ----
insert into services (seller_id, slug, title, summary, description, category_id, location_id, status, is_featured, featured_until)
select null, 'thornwick-consulting', 'Thornwick Consulting',
  'Applied AI engineering for production LLM systems, agents, evals, SaaS and backend platforms.',
  'Thornwick Consulting builds and ships applied AI: production LLM systems, autonomous agents, evaluation pipelines, and the SaaS and backend platforms around them - alongside full web development.',
  (select id from categories where slug = 'web-development'),
  (select id from locations where slug = 'remote-scotland'),
  'published', true, now() + interval '1 year'
on conflict (slug) do nothing;

insert into services (seller_id, slug, title, summary, description, category_id, location_id, status, is_featured, featured_until)
select null, 'lockie-media', 'Lockie Media',
  'Music videos and pyrotechnics.',
  'Lockie Media produces high-energy music videos with in-house pyrotechnics for standout live and recorded performance.',
  (select id from categories where slug = 'music-video'),
  (select id from locations where slug = 'remote-scotland'),
  'published', true, now() + interval '1 year'
on conflict (slug) do nothing;

insert into listing_services (service_id, category_id)
select s.id, c.id from services s join categories c on c.slug = any (array['web-development'])
where s.slug = 'thornwick-consulting' on conflict do nothing;

insert into listing_services (service_id, category_id)
select s.id, c.id from services s join categories c on c.slug = any (array['music-video', 'video'])
where s.slug = 'lockie-media' on conflict do nothing;

-- 4) Make your account an admin (so you can reach /admin and /admin/import) ----
-- If you sign in with a different email, change it here before running.
update profiles set role = 'admin'
where id in (select id from auth.users where email = 'hello@plisticmedia.com');
