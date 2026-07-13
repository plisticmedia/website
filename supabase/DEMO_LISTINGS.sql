-- ============================================================
-- Beta demo listings — three fictional "(sample)" businesses so beta
-- testers can try the directory, filters, map and claim flow WITHOUT
-- exposing any of the real imported businesses before they're invited.
--
-- Run once in the Supabase SQL editor. Safe to re-run.
-- To remove them after beta, run the single DELETE line at the bottom.
-- ============================================================

insert into services (seller_id, slug, title, summary, description, category_id, status, latitude, longitude, source)
select null, 'sample-northern-light-studios', 'Northern Light Studios (sample)',
  'Sample listing for beta testing — a Glasgow video production studio.',
  'This is a demo listing used to beta-test the Plistic directory. It is not a real business. Northern Light Studios makes brand films, adverts and music videos across Scotland.',
  (select id from categories where slug = 'video' limit 1),
  'published', 55.8642, -4.2518, 'demo'
where not exists (select 1 from services where slug = 'sample-northern-light-studios');

insert into services (seller_id, slug, title, summary, description, category_id, status, latitude, longitude, source)
select null, 'sample-clyde-audio', 'Clyde Audio (sample)',
  'Sample listing for beta testing — a Glasgow podcast studio.',
  'This is a demo listing used to beta-test the Plistic directory. It is not a real business. Clyde Audio records and produces podcasts for brands and founders.',
  (select id from categories where slug = 'podcasting' limit 1),
  'published', 55.8570, -4.2600, 'demo'
where not exists (select 1 from services where slug = 'sample-clyde-audio');

insert into services (seller_id, slug, title, summary, description, category_id, status, latitude, longitude, source)
select null, 'sample-firth-films', 'Firth Films (sample)',
  'Sample listing for beta testing — an Edinburgh documentary maker.',
  'This is a demo listing used to beta-test the Plistic directory. It is not a real business. Firth Films makes documentaries and event films across the east of Scotland.',
  (select id from categories where slug = 'documentary' limit 1),
  'published', 55.9533, -3.1883, 'demo'
where not exists (select 1 from services where slug = 'sample-firth-films');

-- ---- AFTER BETA: remove all demo listings with this one line ----
-- delete from services where source = 'demo';
