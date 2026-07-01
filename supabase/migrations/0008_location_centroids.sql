-- Plistic Media — coordinates for locations, powering the density map.
-- Adds lat/long to locations and seeds centroids for the standard Scottish
-- regions. Auto-created town locations get geocoded by the admin map tool.
-- Run after 0007. Additive + idempotent.

alter table locations add column if not exists latitude double precision;
alter table locations add column if not exists longitude double precision;

update locations set latitude = v.lat, longitude = v.lng
from (values
  ('glasgow',            55.8642, -4.2518),
  ('edinburgh',          55.9533, -3.1883),
  ('aberdeen',           57.1497, -2.0943),
  ('dundee',             56.4620, -2.9707),
  ('stirling',           56.1165, -3.9369),
  ('highlands-islands',  57.4778, -4.2247),
  ('south-scotland',     55.1000, -3.4000),
  ('fife',               56.2082, -3.1495),
  ('remote-scotland',    56.8000, -4.2000)
) as v(slug, lat, lng)
where locations.slug = v.slug;
