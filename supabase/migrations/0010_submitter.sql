-- Plistic — pre-claim support: remember who submitted a listing so they can
-- take ownership just by signing in with the same email. Additive + idempotent.

alter table services
  add column if not exists submitter_email text;
