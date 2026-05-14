-- Review Pulse: Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Businesses table
create table if not exists businesses (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid references auth.users(id) on delete cascade,
  name        text not null,
  category    text,
  phone       text,
  website     text,
  logo_url    text,
  created_at  timestamptz default now()
);

alter table businesses enable row level security;
create policy "Owners can manage their business"
  on businesses for all using (auth.uid() = owner_id);

-- Reviews table
create table if not exists reviews (
  id               uuid primary key default uuid_generate_v4(),
  business_id      uuid references businesses(id) on delete cascade,
  reviewer_name    text not null,
  reviewer_initials text generated always as (
    upper(left(reviewer_name, 1))
  ) stored,
  platform         text check (platform in ('google','facebook','tripadvisor','wolt','other')),
  rating           int check (rating between 1 and 5),
  content          text,
  sentiment        text check (sentiment in ('very_positive','positive','neutral','critical')),
  status           text check (status in ('pending','replied','ignored')) default 'pending',
  reply_text       text,
  replied_at       timestamptz,
  created_at       timestamptz default now()
);

alter table reviews enable row level security;
create policy "Business owners can see reviews"
  on reviews for select
  using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );
create policy "Business owners can update reviews"
  on reviews for update
  using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

-- KPI summary view
create or replace view kpi_summary as
select
  business_id,
  round(avg(rating)::numeric, 1)                                       as avg_rating,
  count(*)                                                              as total_reviews,
  count(*) filter (where created_at >= date_trunc('month', now()))     as monthly_reviews,
  count(*) filter (where status = 'pending')                           as pending_count,
  round(
    100.0 * count(*) filter (where sentiment in ('positive','very_positive'))
    / nullif(count(*), 0)
  , 1)                                                                  as positive_pct
from reviews
group by business_id;

-- Sentiment over time view
create or replace view sentiment_by_day as
select
  business_id,
  date_trunc('day', created_at)::date                                     as day,
  round(
    100.0 * count(*) filter (where sentiment in ('positive','very_positive'))
    / nullif(count(*), 0), 1
  )                                                                         as positive_pct,
  round(
    100.0 * count(*) filter (where sentiment = 'critical')
    / nullif(count(*), 0), 1
  )                                                                         as critical_pct
from reviews
group by business_id, date_trunc('day', created_at)::date
order by day;
