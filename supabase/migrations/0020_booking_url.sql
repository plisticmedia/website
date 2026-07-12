-- ---------------------------------------------------------------------------
-- Seller booking link.
-- Lets a listing owner add their own Cal.com / Calendly (or any) booking URL,
-- shown as a "Book a call" button on their public page.
-- ---------------------------------------------------------------------------

alter table services add column if not exists booking_url text;
