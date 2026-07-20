-- Peer confidence (Layer 2) support: a right-of-reply and an admin hide switch.
-- The public aggregate itself is computed server-side and gated by the
-- PEER_CONFIDENCE_PUBLIC env flag — nothing here turns it on. Additive.

alter table services
  add column if not exists peer_reply text,                         -- owner's public right-of-reply
  add column if not exists peer_confidence_hidden boolean not null default false, -- admin can hide a disputed aggregate
  add column if not exists peer_confidence_disputed_at timestamptz; -- set when the owner flags a dispute
