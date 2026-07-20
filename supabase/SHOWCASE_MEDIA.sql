-- ============================================================================
-- Real, cleared, on-topic media for the showcase stories that had none.
--
-- Official trailers are published to be shared — no permission needed — so this
-- uses them as the media, matched to each story's actual subject:
--   • RSNO       → trailer for ARGYLLE, a film the RSNO scored (their own work).
--   • Productions → trailer for DEPT. Q, a major series filmed in Edinburgh.
-- The generic stand-in photos are removed (embeds supply their own thumbnails).
--
-- Two stories are genuine sector reports (a skills report; a BAFTA look-ahead)
-- with no single on-topic official video — their interim photos are removed so
-- they read as clean stories; add a press-cleared image later if you get one.
--
-- Run once in the Supabase SQL editor. Matches published rows by title.
-- ============================================================================

-- RSNO — embed the trailer for a film they scored (Argylle, official Universal
-- trailer). Their actual work; cleared for sharing. Drop the interim photo.
update showcase_items
set embed_url = 'https://www.youtube.com/watch?v=IYwX51FYi0Q',
    image_url = null,
    body = E'When you hear a sweeping orchestral score in a Hollywood film, there''s a growing chance it was recorded in Glasgow.\n\nThe Royal Scottish National Orchestra''s purpose-built recording space, Scotland''s Studio, is the only orchestral facility in the UK that can record sound to picture. Its aim is to become the go-to studio for film and game soundtracks outside London — and it''s delivering. Recent work includes the films Horizon: An American Saga, The Woman King and Argylle; the BAFTA-winning series Silo; and video games including Avatar: Frontiers of Pandora and Star Wars Outlaws.\n\nThe facility earned the Association of British Orchestras'' Impact Award for Innovation, and the RSNO runs a Film Composers Lab to develop the next generation of screen composers, with a public screening in Glasgow in summer 2026.\n\nWorld-class film music, made in Scotland.\n\n(Video: the trailer for Argylle — one of the films scored at Scotland''s Studio — via Universal Pictures'' official channel.)'
where title = 'The Glasgow studio recording Hollywood''s soundtracks';

-- Screen Daily productions — embed the trailer for Dept. Q, a flagship series
-- filmed in Edinburgh (official Netflix trailer). Drop the interim photo.
update showcase_items
set embed_url = 'https://www.youtube.com/watch?v=72hK6FUmm8o',
    image_url = null
where title = 'Scotland''s screens fill up: a bumper year of productions';

-- Screen Scotland skills story — embed the official Screen Scotland Showreel
-- (Creative Scotland's Vimeo). A cleared sector showreel, on-topic. Drop photo.
update showcase_items
set embed_url = 'https://vimeo.com/1186171885',
    image_url = null
where title = 'Skills take centre stage for Scotland''s screen sector';

-- BAFTA look-ahead — no single on-topic official video yet; remove interim photo
-- so it reads as a clean text story until a press-cleared image is available.
update showcase_items set image_url = null
where title = 'BAFTA looks ahead to a big 2026 for Scotland';
