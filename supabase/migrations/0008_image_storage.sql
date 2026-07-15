-- Public bucket for uploaded question images. Public so players (anonymous,
-- no auth token) can just render the resolved URL straight from the
-- question payload embedded in games rows — no signed URLs needed.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Admins may only write inside their own folder: images/{their-uid}/...
create policy "own image uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own image updates" on storage.objects
  for update to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own image deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Explicit read policy (the bucket being `public` already serves objects via
-- the public URL without RLS, but this keeps direct Storage API reads and
-- the dashboard's object browser consistent).
create policy "public read images" on storage.objects
  for select using (bucket_id = 'images');
