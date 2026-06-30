-- Plistic Media backend — seed reference data (categories)
-- Safe to re-run; uses upserts on slug.

insert into categories (slug, name, sort_order) values
  ('podcasting',     'Podcasting',      10),
  ('video',          'Video production', 20),
  ('event-filming',  'Event filming',   30),
  ('documentary',    'Documentary',     40),
  ('photography',    'Photography',     50),
  ('animation',      'Animation',       60),
  ('pr',             'PR & comms',      70),
  ('audio',          'Audio & music',   80)
on conflict (slug) do update
  set name = excluded.name, sort_order = excluded.sort_order;
