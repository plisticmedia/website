-- ============================================================================
-- Showcase drafts — batch 2: "Made in Scotland" stories.
--
-- Rockstar/GTA, RSNO's film studio, Blazing Griffin's California Schemin', and
-- Outlander. All arrive as 'pending' in your review queue (/admin/showcase or
-- the "Add a story" area). Review, optionally tick "Feature this", then Publish.
--
-- Run once in the Supabase SQL editor.
--
-- IMAGES / VIDEO: The GTA and California Schemin' items embed the *official*
-- trailers (safe to share — that's what they're for), and the tile auto-shows
-- the video's own poster frame, so no image is needed. The RSNO and Outlander
-- items are text stories with no image; add a press-cleared image in the editor
-- before publishing if you'd like a picture on the card.
-- ============================================================================

insert into showcase_items (kind, title, summary, body, embed_url, link_url, source, status)
select 'news',
  'The biggest game on Earth is made in Scotland',
  'Grand Theft Auto is built in Edinburgh. As GTA VI heads for a November 2026 release, here''s the Scottish studio behind gaming''s biggest name.',
  E'Here''s one that surprises people: Grand Theft Auto — the biggest entertainment franchise on the planet — is made in Scotland.\n\nRockstar North, the studio behind the series, is based in Edinburgh. It''s where the open worlds, the stories and the chaos of GTA are built, by a team of Scottish and international talent.\n\nWith Grand Theft Auto VI due for release on 19 November 2026, the countdown is on — Trailer 2 alone passed 90 million views in its first 24 hours. Some of the world''s most-watched media is created right here.\n\nNext time someone tells you Scotland''s creative scene punches above its weight, point them at Vice City.\n\n(Trailer via Rockstar Games'' official channel.)',
  'https://www.youtube.com/watch?v=VQRLujxTm3c',
  'https://www.rockstargames.com/VI',
  'Rockstar Games', 'pending'
where not exists (select 1 from showcase_items where title = 'The biggest game on Earth is made in Scotland');

insert into showcase_items (kind, title, summary, body, link_url, source, status)
select 'news',
  'The Glasgow studio recording Hollywood''s soundtracks',
  'The Royal Scottish National Orchestra''s Glasgow studio is now recording major film scores — putting Scotland alongside London and LA.',
  E'When you hear a sweeping orchestral score in a Hollywood film, there''s a growing chance it was recorded in Glasgow.\n\nThe Royal Scottish National Orchestra''s purpose-built recording space, Scotland''s Studio, has recorded soundtracks for major releases including Nuremberg (Sony Pictures) and Now You See Me: Now You Don''t (Lionsgate). It earned the Association of British Orchestras'' Impact Award for Innovation for repositioning Glasgow as a destination that competes directly with London and Los Angeles for film, TV and videogame scores.\n\nThe RSNO also runs a Film Composers Lab, developing the next generation of screen composers, with a public screening in Glasgow in summer 2026.\n\nWorld-class film music, made in Scotland.\n\n(Summary by Plistic — see the RSNO via the link below.)',
  'https://www.rsno.org.uk/about/scotlands-studio/',
  'Royal Scottish National Orchestra', 'pending'
where not exists (select 1 from showcase_items where title = 'The Glasgow studio recording Hollywood''s soundtracks');

insert into showcase_items (kind, title, summary, body, embed_url, link_url, source, status)
select 'video',
  'California Schemin'': a Scottish story hits the big screen',
  'James McAvoy''s directorial debut tells the wild true story of Dundee rap duo Silibil N'' Brains — with Glasgow''s Blazing Griffin among the companies behind it.',
  E'It''s one of the great Scottish stories: two friends from Dundee who, unable to get a break as themselves, reinvented as a fake Californian rap duo — Silibil N'' Brains — and blagged their way into the US music industry.\n\nNow it''s a feature film. California Schemin'', the directorial debut of Scottish actor James McAvoy, brings the story to the screen, with Glasgow production company Blazing Griffin among those involved.\n\nIt''s exactly the kind of homegrown storytelling — Scottish talent, Scottish crews, a Scottish story — that the country''s screen sector does so well.\n\n(Trailer via STUDIOCANAL''s official channel.)',
  'https://www.youtube.com/watch?v=oUTSyu4Ovcc',
  'https://www.blazinggriffin.com/',
  'Blazing Griffin / STUDIOCANAL', 'pending'
where not exists (select 1 from showcase_items where title = 'California Schemin'': a Scottish story hits the big screen');

insert into showcase_items (kind, title, summary, body, source, status)
select 'news',
  'Outlander: a global hit made in Scotland',
  'The time-travelling drama loved around the world is filmed and built in Scotland, at Wardpark Studios in Cumbernauld.',
  E'Few shows have done more for Scotland''s global image than Outlander. The time-spanning drama, adored by fans worldwide, is filmed across the country and produced at Wardpark Studios in Cumbernauld — one of Scotland''s major purpose-built studio facilities.\n\nBeyond the screen, it has driven a wave of "set-jetting" tourism to Scottish castles, glens and historic sites, and helped sustain a deep pool of Scottish crew, craftspeople and locations talent.\n\nWorld-class, globally loved television — made here, at scale.\n\n(Summary by Plistic.)',
  'Made in Scotland', 'pending'
where not exists (select 1 from showcase_items where title = 'Outlander: a global hit made in Scotland');
