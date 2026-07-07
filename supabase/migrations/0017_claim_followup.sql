-- Plistic — track the one-week claim-invite follow-up separately from the first
-- send, so the reminder goes only to those who were invited but haven't claimed.
-- Additive + idempotent. Run after 0016.

alter table services
  add column if not exists claim_followup_sent_at timestamptz;
