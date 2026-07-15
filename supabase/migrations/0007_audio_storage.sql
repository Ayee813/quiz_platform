-- Public bucket for uploaded background/countdown music. Public so players
-- (anonymous, no auth token) can just <audio src="..."> the resolved URL
-- straight from the games row — no signed URLs needed.
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

-- Admins may only write inside their own folder: audio/{their-uid}/...
create policy "own audio uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own audio updates" on storage.objects
  for update to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own audio deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);

-- Explicit read policy (the bucket being `public` already serves objects via
-- the public URL without RLS, but this keeps direct Storage API reads and
-- the dashboard's object browser consistent).
create policy "public read audio" on storage.objects
  for select using (bucket_id = 'audio');
