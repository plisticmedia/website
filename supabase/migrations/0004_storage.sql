-- Plistic Media backend — Storage bucket for listing media.
-- Public-read bucket; only the owning seller (or admin) can write.
-- Files are namespaced by the seller's user id as the top-level folder:
--   service-media/<seller_uid>/<service_id>/<filename>

insert into storage.buckets (id, name, public)
values ('service-media', 'service-media', true)
on conflict (id) do nothing;

-- Anyone can read (bucket is public, but keep an explicit select policy too).
create policy "service-media: public read" on storage.objects
  for select using (bucket_id = 'service-media');

-- A seller can write only inside their own /<uid>/ folder.
create policy "service-media: owner insert" on storage.objects
  for insert with check (
    bucket_id = 'service-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "service-media: owner update" on storage.objects
  for update using (
    bucket_id = 'service-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "service-media: owner delete" on storage.objects
  for delete using (
    bucket_id = 'service-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
