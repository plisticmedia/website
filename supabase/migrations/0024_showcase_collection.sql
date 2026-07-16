-- Showcase "collections" — an editorial grouping on top of the content kind,
-- so the showcase page can present sections like "Hall of Fame" (timeless
-- best-of) and "Recent news" (what's happening now). Nullable: an item with no
-- collection just shows in the general feed. Additive + idempotent.

alter table showcase_items
  add column if not exists collection text;
