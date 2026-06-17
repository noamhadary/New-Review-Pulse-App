-- Public bucket for business logo uploads
insert into storage.buckets (id, name, public)
values ('business-logos', 'business-logos', true)
on conflict (id) do nothing;

-- Drop policies first in case of re-run
drop policy if exists "Users can upload their own logo"  on storage.objects;
drop policy if exists "Users can update their own logo"  on storage.objects;
drop policy if exists "Users can delete their own logo"  on storage.objects;
drop policy if exists "Public read business logos"       on storage.objects;

-- Each authenticated user can only write to their own folder ({user_id}/*)
create policy "Users can upload their own logo"
  on storage.objects for insert
  with check (
    bucket_id = 'business-logos'
    and auth.role() = 'authenticated'
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Users can update their own logo"
  on storage.objects for update
  using (
    bucket_id = 'business-logos'
    and auth.role() = 'authenticated'
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Users can delete their own logo"
  on storage.objects for delete
  using (
    bucket_id = 'business-logos'
    and auth.role() = 'authenticated'
    and auth.uid()::text = split_part(name, '/', 1)
  );

-- Public read (bucket is public, but explicit policy is still required)
create policy "Public read business logos"
  on storage.objects for select
  using (bucket_id = 'business-logos');
