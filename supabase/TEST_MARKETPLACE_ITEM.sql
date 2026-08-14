-- Adds a TEST marketplace item to the Plistic Media listing so you can see the
-- shop working: it appears under "For sale" on the profile and on /marketplace.
-- Idempotent: safe to re-run — keyed on the item title, so it won't duplicate.
-- Run once in the Supabase SQL editor.
--
-- Note: the "Buy now" button only appears once the Plistic Media seller account
-- has finished Stripe Connect onboarding (payouts enabled). Until then the item
-- is fully browsable and shows an "Enquire" button — which is the correct,
-- safe behaviour. Nothing here touches money.

-- 1) The item itself.
insert into products (service_id, title, description, price_gbp, product_type, stock, fulfilment, delivery_info, status, sort_order)
select
  s.id,
  'Test item — Plistic tote bag',
  'A sample marketplace listing so you can see how items look and behave. Printed cotton tote — this is a placeholder for testing the shop, not a real product yet.',
  12.00,
  'physical',
  10,
  'both',
  'UK shipping £3.50, or collect from Glasgow.',
  'active',
  0
from services s
where s.slug = 'plistic-media'
  and not exists (
    select 1 from products p
    where p.service_id = s.id and p.title = 'Test item — Plistic tote bag'
  );

-- 2) A photo for it (reuses the brand image as a placeholder). Only added if the
--    item has no photo yet.
insert into product_media (product_id, url, sort_order)
select p.id, '/assets/brand/plistic-media.png', 0
from products p
join services s on s.id = p.service_id
where s.slug = 'plistic-media'
  and p.title = 'Test item — Plistic tote bag'
  and not exists (select 1 from product_media pm where pm.product_id = p.id);
