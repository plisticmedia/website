-- ============================================================================
-- Plistic Media — the flagship example listing (directory + marketplace).
--
-- A fully-filled-in profile with real services and calculator pricing, to use
-- as the model example for beta testers / early adopters. Owned by your admin
-- account so you can manage it from the dashboard (edit copy, media, packages).
--
-- Idempotent: safe to re-run (the listing is keyed by slug; packages are
-- cleared and re-inserted). Run once in the Supabase SQL editor.
-- ============================================================================

-- 1) The listing.
insert into services (
  slug, title, listing_type, summary, description,
  category_id, location_id, website_url, logo_url, cover_image_url,
  social_links, credits, availability, status,
  is_featured, verified, founding, seller_id, source
)
select
  'plistic-media',
  'Plistic Media',
  'business',
  'Glasgow media production studio — podcasts, video, documentary, ads and coaching, end to end.',
  E'Plistic Media is a Glasgow production studio making media the simple way — podcasts, video, documentary, ads, music videos, coaching and strategy, from first idea to a launch that lands.\n\nWe work end to end: research and story, filming and recording (up to three cameras), edit and post, plus on-camera and on-mic coaching so you feel calm and natural. Recent work includes a podcast that reached #1 in its niche on Apple Podcasts (Strathclyde Inspire), a youth mental-health series (Tiny Changes), eight live events turned into an evergreen series (Connect-Ed), and a UKRI-funded research documentary (Unfiltered).\n\nBased in Glasgow, working across Scotland. Use the packages below as a starting point, or send an enquiry and we''ll shape the right scope with you.',
  coalesce(
    (select id from categories where lower(name) like '%podcast%' limit 1),
    (select id from categories where lower(name) like '%video%' limit 1),
    (select id from categories where lower(name) like '%media%' limit 1)
  ),
  (select id from locations where lower(name) like '%glasgow%' limit 1),
  'https://www.plisticmedia.com',
  '/assets/brand/plistic-media.png',
  '/assets/photos/studio-window.webp',
  '{}'::jsonb,
  'Strathclyde Inspire (#1 in niche on Apple Podcasts) · Tiny Changes · Connect-Ed Network · Unfiltered (UKRI ESRC documentary)',
  'Booking new projects now — Glasgow and across Scotland.',
  'published',
  true, true, true,
  (select id from profiles where role = 'admin' order by created_at asc limit 1),
  'Plistic'
where not exists (select 1 from services where slug = 'plistic-media');

-- 2) Tag it with every relevant category that exists in your taxonomy.
insert into listing_services (service_id, category_id)
select s.id, c.id
from services s
join categories c on (
  lower(c.name) like '%podcast%' or lower(c.name) like '%video%' or lower(c.name) like '%event%'
  or lower(c.name) like '%document%' or lower(c.name) like '%coach%' or lower(c.name) like '%media%'
)
where s.slug = 'plistic-media'
  and not exists (select 1 from listing_services ls where ls.service_id = s.id and ls.category_id = c.id);

-- 3) Packages priced from the calculator (display prices; flip is_bookable on
--    later, once Stripe payouts are enabled). Cleared + re-inserted so re-runs
--    stay clean.
delete from service_packages where service_id = (select id from services where slug = 'plistic-media');

insert into service_packages (service_id, name, price_gbp, delivery_days, is_bookable, sort_order)
select s.id, v.name, v.price, v.days, false, v.ord
from services s,
  (values
    ('Podcast — pilot series (3 episodes, proof of concept)', 3500, 30, 1),
    ('Podcast — starter series (6 episodes, batch-recorded)', 6000, 45, 2),
    ('Podcast — editing & post only (6 episodes)', 1200, 14, 3),
    ('Podcast — ongoing production (per episode)', 1200, 7, 4),
    ('Event filming — one camera, full day (edit included)', 1200, 14, 5),
    ('Event filming — three cameras + gimbal, full day', 2500, 21, 6),
    ('Video / brand film / music video (from)', 2500, 30, 7),
    ('Documentary — short film (from)', 12000, 60, 8),
    ('Coaching — single remote session', 75, 7, 9),
    ('Coaching — team media workshop', 800, 14, 10)
  ) as v(name, price, days, ord)
where s.slug = 'plistic-media';
