-- Plistic Media — coverage areas ("where a business operates").
-- Distinct from the base location (address/postcode -> map pin). A listing can
-- operate in several areas; these drive the Location filter and density mapping.
-- Run after 0006. Additive + idempotent.

create table if not exists service_areas (
  service_id uuid not null references services (id) on delete cascade,
  location_id uuid not null references locations (id) on delete cascade,
  primary key (service_id, location_id)
);
create index if not exists service_areas_location_idx on service_areas (location_id);

alter table service_areas enable row level security;

create policy "service_areas: public read for published" on service_areas
  for select using (
    exists (select 1 from services s where s.id = service_id and s.status = 'published')
  );
create policy "service_areas: seller manage own" on service_areas
  for all using (
    exists (select 1 from services s where s.id = service_id and s.seller_id = auth.uid())
  ) with check (
    exists (select 1 from services s where s.id = service_id and s.seller_id = auth.uid())
  );
create policy "service_areas: admin all" on service_areas
  for all using (is_admin()) with check (is_admin());
