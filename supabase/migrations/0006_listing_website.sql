-- Plistic Media — per-listing website (businesses have their own site).
-- Run after 0005. Additive and idempotent.

alter table services add column if not exists website_url text;
