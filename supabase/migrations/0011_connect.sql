-- Plistic — Phase 2 marketplace, step A: supplier payout onboarding (Stripe Connect Express).
-- Additive + idempotent. Run after 0010. No money moves yet — this only tracks
-- whether a seller has completed Connect onboarding and can receive payouts.

alter table profiles
  add column if not exists stripe_connect_account_id text unique, -- Connect Express account
  add column if not exists payouts_enabled boolean not null default false, -- Stripe: can receive transfers
  add column if not exists charges_enabled boolean not null default false; -- Stripe: account fully enabled
