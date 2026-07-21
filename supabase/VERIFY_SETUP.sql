-- ============================================================================
-- VERIFY_SETUP.sql — check which of the recent scripts have actually run.
-- Safe to run any time: it only READS, it changes nothing.
-- Paste into Supabase → SQL Editor → Run. Each row tells you done / missing.
-- ============================================================================
select
  item,
  case when ok then '✅ done' else '❌ missing — run this one' end as status
from (
  -- 0025_peer_network.sql
  select '0025 · peer_connections table' as item,
         to_regclass('public.peer_connections') is not null as ok
  union all
  select '0025 · peer_feedback table',
         to_regclass('public.peer_feedback') is not null
  -- 0026_peer_confidence.sql
  union all
  select '0026 · services.peer_reply column',
         exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='services' and column_name='peer_reply')
  union all
  select '0026 · services.peer_confidence_hidden column',
         exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='services' and column_name='peer_confidence_hidden')
  union all
  select '0026 · services.peer_confidence_disputed_at column',
         exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='services' and column_name='peer_confidence_disputed_at')
  -- 0027_listing_type.sql
  union all
  select '0027 · services.listing_type column',
         exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='services' and column_name='listing_type')
  -- PLISTIC_MEDIA_LISTING.sql
  union all
  select 'Plistic Media example listing exists',
         exists (select 1 from services where slug='plistic-media')
  union all
  select 'Plistic Media has priced packages',
         (select count(*) from service_packages sp
            join services s on s.id = sp.service_id
          where s.slug='plistic-media') > 0
) checks
order by item;

-- Showcase media (SHOWCASE_MEDIA.sql) updates existing stories rather than
-- creating new objects, so the quickest check is just to open /showcase and
-- look — the trailers/images either show or they don't.
