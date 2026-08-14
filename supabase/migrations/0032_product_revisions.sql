-- Revision limits (marketplace). A seller can cap how many rounds of changes a
-- buyer gets included in the price; beyond that, further changes are arranged
-- (and paid for) separately with the seller. Additive + idempotent.

-- How many change-request rounds are included. Null = unlimited (default).
alter table products add column if not exists revision_limit int;

-- Snapshot of the item's revision_limit at purchase, so later edits to the item
-- never change the deal on an in-flight order. Null = unlimited.
alter table orders add column if not exists revision_limit int;
