-- Plistic — track claim-invitation emails so nobody is emailed twice.
-- Additive + idempotent. Run after 0015.
-- The public contact email is stored in services.submitter_email (added in 0010);
-- this only records when a claim invite was sent for a listing.

alter table services
  add column if not exists claim_invite_sent_at timestamptz;
