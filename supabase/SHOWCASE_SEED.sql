-- ============================================================================
-- Showcase seed — real Plistic work, so the showcase isn't empty for beta/launch.
-- These are genuine case studies (not invented "news"), each linking to its
-- full page on the site. Safe to re-run (skips anything already added).
--
-- Run once in the Supabase SQL editor.
-- News/events stay for you to curate via /showcase/submit + the admin queue —
-- we deliberately don't auto-generate news stories about real organisations.
-- ============================================================================

insert into showcase_items (kind, title, summary, image_url, link_url, source, is_featured, status)
select 'work', 'Strathclyde Inspire — #1 on Apple Podcasts',
  'Production support for a university entrepreneurship show that reached #1 in its niche on Apple Podcasts.',
  '/assets/photos/site/inspire-1.jpg', '/work/strathclyde-inspire', 'Plistic', true, 'published'
where not exists (select 1 from showcase_items where title = 'Strathclyde Inspire — #1 on Apple Podcasts');

insert into showcase_items (kind, title, summary, image_url, link_url, source, is_featured, status)
select 'work', 'Tiny Changes — a youth mental health podcast',
  'End-to-end support for a youth mental health podcast about building a career in music without losing yourself inside it.',
  '/assets/photos/site/tiny-changes-2.jpg', '/work/tiny-changes', 'Plistic', false, 'published'
where not exists (select 1 from showcase_items where title = 'Tiny Changes — a youth mental health podcast');

insert into showcase_items (kind, title, summary, image_url, link_url, source, is_featured, status)
select 'work', 'Connect-Ed — eight live events, one evergreen series',
  'Eight live events turned into an evergreen podcast series, social clips and a reusable resource for Scotland''s university entrepreneurship network.',
  '/assets/photos/site/connect-ed-1.jpg', '/work/connect-ed-network', 'Plistic', false, 'published'
where not exists (select 1 from showcase_items where title = 'Connect-Ed — eight live events, one evergreen series');

insert into showcase_items (kind, title, summary, image_url, link_url, source, is_featured, status)
select 'work', 'Unfiltered — a documentary on neurodiverse entrepreneurship',
  'A UKRI ESRC-funded research documentary on neurodiverse entrepreneurship, produced with full accessibility coordination throughout.',
  '/assets/photos/site/documentary-2.jpg', '/work/unfiltered-neurodiverse-entrepreneur', 'Plistic', false, 'published'
where not exists (select 1 from showcase_items where title = 'Unfiltered — a documentary on neurodiverse entrepreneurship');

-- ---- To remove these seeded items later ----
-- delete from showcase_items where source = 'Plistic' and link_url like '/work/%';
