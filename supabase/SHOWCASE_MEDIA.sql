-- ============================================================================
-- Add media + richer copy to the showcase stories that had none.
--
-- The three trailer stories (GTA, California Schemin', Outlander) already carry
-- their official promo videos. This adds illustrative header images — Plistic's
-- OWN, fully-cleared photos (studio, film-set and Glasgow shots) — to the RSNO
-- and news pieces so no card is bare, and enriches the RSNO story with its real,
-- verified film/TV/game credits.
--
-- These are ILLUSTRATIVE headers, not the organisations' own images. When RSNO /
-- Screen Scotland / BAFTA reply to the outreach emails with press-cleared photos,
-- swap them in via the story editor (that's the copyright-safe way to use theirs).
--
-- Run once in the Supabase SQL editor. Matches existing published rows by title.
-- ============================================================================

-- RSNO — Glasgow recording studio (illustrative) + real credits.
update showcase_items
set image_url = '/assets/photos/drum-studio.webp',
    body = E'When you hear a sweeping orchestral score in a Hollywood film, there''s a growing chance it was recorded in Glasgow.\n\nThe Royal Scottish National Orchestra''s purpose-built recording space, Scotland''s Studio, is the only orchestral facility in the UK that can record sound to picture. Its aim is to become the go-to studio for film and game soundtracks outside London — and it''s delivering. Recent work includes the films Horizon: An American Saga, The Woman King and Argylle; the BAFTA-winning series Silo; and video games including Avatar: Frontiers of Pandora and Star Wars Outlaws.\n\nThe facility earned the Association of British Orchestras'' Impact Award for Innovation, and the RSNO runs a Film Composers Lab to develop the next generation of screen composers, with a public screening in Glasgow in summer 2026.\n\nWorld-class film music, made in Scotland.\n\n(Summary by Plistic — see the RSNO via the link below.)'
where title = 'The Glasgow studio recording Hollywood''s soundtracks';

-- Screen Scotland skills report — broadcast/screen-sector image (illustrative).
update showcase_items
set image_url = '/assets/photos/site/news-room.jpg'
where title = 'Skills take centre stage for Scotland''s screen sector';

-- Screen Daily productions — film-shoot set overlooking Glasgow (illustrative).
update showcase_items
set image_url = '/assets/photos/studio-window.webp'
where title = 'Scotland''s screens fill up: a bumper year of productions';

-- BAFTA look-ahead — Glasgow cityscape (illustrative).
update showcase_items
set image_url = '/assets/photos/glasgow-view.webp'
where title = 'BAFTA looks ahead to a big 2026 for Scotland';
