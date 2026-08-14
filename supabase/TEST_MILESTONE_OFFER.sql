-- Adds a TEST milestone offer so you can see the staged-payment flow. It hangs
-- off your most recent order on the Plistic Media listing and is sent to that
-- order's buyer. Run once in the Supabase SQL editor (after 0034 is run).
-- Idempotent: keyed on the title, so it won't duplicate.
--
-- To SEE it: log in as the account that placed that order (the buyer), go to
-- Dashboard -> My orders, and look for "Custom offers for you". You'll see the
-- three stages and an "Accept & pay" button. (You can't buy your own listing,
-- so the buyer is whatever account placed the original order.)
--
-- If this inserts 0 rows, there's no order on the Plistic Media listing yet —
-- buy the test tote first (with a different account), then re-run this.

insert into custom_offers (service_id, seller_id, buyer_id, parent_order_id, title, description, price_gbp, milestones, status)
select
  o.service_id,
  o.seller_id,
  o.buyer_id,
  o.id,
  'Test milestone offer — bespoke 60-second edit',
  'A sample staged offer so you can see milestones in action. You pay the total up front; each stage is released to the seller only as you approve it.',
  60.00,
  '[{"title":"Deposit to start","amount_gbp":20},{"title":"First draft approved","amount_gbp":20},{"title":"Final delivery","amount_gbp":20}]'::jsonb,
  'sent'
from orders o
join services s on s.id = o.service_id
where s.slug = 'plistic-media'
  and not exists (
    select 1 from custom_offers co
    where co.parent_order_id = o.id
      and co.title = 'Test milestone offer — bespoke 60-second edit'
  )
order by o.created_at desc
limit 1;
