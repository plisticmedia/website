-- Seed the EVENT50 cardholder offer (50% off event filming days), matching the
-- printed business cards. Idempotent: re-running leaves an existing code as-is.
-- Expiry and max uses are intentionally left open — set them in the admin
-- "Discount codes" page ("Limited time offer") whenever you want to close it.
insert into discount_codes (code, label, discount_type, discount_value, service, active)
values ('EVENT50', '50% off event filming days', 'percent', 50, 'event', true)
on conflict (code) do nothing;
