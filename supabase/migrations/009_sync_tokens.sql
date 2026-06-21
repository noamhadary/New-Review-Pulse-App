-- Store Google OAuth refresh tokens for background sync
alter table user_settings
  add column if not exists google_refresh_token text,
  add column if not exists last_synced_at timestamptz;

-- Add external_id + insert policy to reviews
alter table reviews
  add column if not exists external_id text;

create unique index if not exists reviews_external_id_idx
  on reviews(external_id) where external_id is not null;

-- Allow business owners to insert reviews (needed for sync)
create policy if not exists "Business owners can insert reviews"
  on reviews for insert
  with check (
    business_id in (select id from businesses where owner_id = auth.uid())
  );
