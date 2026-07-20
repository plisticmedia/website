-- ============================================================================
-- Showcase news drafts — a first batch of real, current Scottish screen-sector
-- stories, written in Plistic's own words with a link to the original source.
--
-- They arrive as 'pending' so they land in your admin review queue
-- (/admin/showcase). Review each, ADD a press-cleared image if you have one,
-- and Publish — or Reject. Nothing goes live until you publish it.
--
-- Run once in the Supabase SQL editor ("Run without RLS" if prompted).
--
-- NOTE ON IMAGES: I've deliberately NOT attached images from the web — using
-- another organisation's photos without a licence is a copyright risk. Add your
-- own or a press-cleared image in the editor before publishing.
-- ============================================================================

insert into showcase_items (kind, title, summary, body, image_url, link_url, source, status)
select 'news',
  'Skills take centre stage for Scotland''s screen sector',
  'A new Screen Scotland report puts training and talent at the heart of the country''s ambitions to grow its screen and live performance industries.',
  E'Screen Scotland has published a report positioning skills investment as central to the growth of Scotland''s screen and live performance sectors.\n\nThe findings point to training and talent development as the key to meeting rising demand from productions choosing to film in Scotland — from scripted drama to animation and live events.\n\nFor Scotland''s creators and studios, it''s a clear signal of where the sector is heading: more homegrown talent, and more work staying in Scotland.\n\n(Summary by Plistic — read the full announcement from Screen Scotland via the link below.)',
  '/assets/photos/site/news-room.jpg',
  'https://www.screen.scot/news/2026/june/new-report-positions-skills-investment-at-the-heart-of-scotlands-screen-and-live-performance-growth-ambitions',
  'Screen Scotland', 'pending'
where not exists (select 1 from showcase_items where title = 'Skills take centre stage for Scotland''s screen sector');

insert into showcase_items (kind, title, summary, body, image_url, link_url, source, status)
select 'news',
  'Scotland''s screens fill up: a bumper year of productions',
  'From high-end TV to a major feature reimagining, 2026 is shaping up to be a landmark year for productions filming across Scotland.',
  E'2026 is a big year for filming in Scotland. Trade press is tracking a strong slate of film and high-end TV productions shooting across the UK and Ireland, with Scotland''s studios and locations featuring prominently — including a reimagining of Highlander, the story of an immortal Scottish swordsman.\n\nIt reflects Scotland''s growing pull as a production base, backed by world-class crews and studio facilities from FirstStage in Edinburgh to Wardpark and beyond.\n\n(Summary by Plistic — see the full production tracker via the link below.)',
  '/assets/photos/studio-window.webp',
  'https://www.screendaily.com/news/2026-film-and-high-end-tv-productions-shooting-in-the-uk-and-ireland-latest-updates/5212395.article',
  'Screen Daily', 'pending'
where not exists (select 1 from showcase_items where title = 'Scotland''s screens fill up: a bumper year of productions');

insert into showcase_items (kind, title, summary, body, image_url, link_url, source, status)
select 'news',
  'BAFTA looks ahead to a big 2026 for Scotland',
  'BAFTA''s look-ahead to 2026 highlights the talent and projects to watch across Scotland in the year to come.',
  E'BAFTA has published its look ahead to 2026 for Scotland and Wales, spotlighting the people and productions shaping the year in film, games and television.\n\nFor anyone following Scotland''s creative scene, it''s a useful map of the talent and stories worth watching — and a reminder of how much is happening north of the border.\n\n(Summary by Plistic — read BAFTA''s full piece via the link below.)',
  '/assets/photos/glasgow-view.webp',
  'https://www.bafta.org/stories/a-look-ahead-to-scotland-wales-in-2026/',
  'BAFTA', 'pending'
where not exists (select 1 from showcase_items where title = 'BAFTA looks ahead to a big 2026 for Scotland');
