-- Listing type: distinguishes a business/organisation from an individual/
-- freelancer. One account can own several listings of either type (e.g. an
-- events business AND a solo dance/choreography gig), so this lives on the
-- listing, not the account. Additive; defaults to 'business'.

alter table services
  add column if not exists listing_type text not null default 'business'
    check (listing_type in ('business', 'individual'));
