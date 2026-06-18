-- Add is_demo flag so we can identify and replace seeded demo reviews
alter table reviews
  add column if not exists is_demo boolean not null default false;

-- Allow business owners to insert reviews (needed for demo seeding from the client)
drop policy if exists "Business owners can insert reviews" on reviews;
create policy "Business owners can insert reviews"
  on reviews for insert
  with check (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

-- Allow business owners to delete their own reviews (needed to replace demo reviews)
drop policy if exists "Business owners can delete reviews" on reviews;
create policy "Business owners can delete reviews"
  on reviews for delete
  using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );
