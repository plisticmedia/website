-- Milestones on bookable packages. Lets a seller advertise a staged / deposit
-- payment plan on a listing package, so any buyer can book the work in stages
-- straight from the listing (no bespoke offer needed). Reuses the same
-- order_milestones + staged-release machinery as custom offers. Additive.

-- Milestone template: [{ "title": "...", "amount_gbp": 100 }, ...]. Null = a
-- single payment on delivery (the existing behaviour).
alter table service_packages add column if not exists milestones jsonb;
