-- Plistic — make every listing claimable.
--
-- Problem: `claim_token` (added in 0009) had no default and was never
-- backfilled. Listings created before 0009, imported from the original Google
-- Form, or added via the on-site "List your business" form (which never set a
-- token) ended up with claim_token = NULL — so the admin panel showed no claim
-- link and those businesses could not be invited to claim their page.
--
-- Fix: give every existing owner-less listing a token, and set a database
-- default so EVERY future insert gets one automatically, on any code path.
-- Additive + idempotent. Safe to run more than once.

-- 1. Auto-generate a token for every future row, regardless of which code path
--    creates it (importer, self-submit form, admin, seed).
alter table services
  alter column claim_token set default replace(gen_random_uuid()::text, '-', '');

-- 2. Backfill every existing listing that is still missing a token.
--    (Claimed listings get one too — harmless; the link simply isn't shown once
--    a listing has an owner.)
update services
  set claim_token = replace(gen_random_uuid()::text, '-', '')
  where claim_token is null;
