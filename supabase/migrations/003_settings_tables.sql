-- Migration 003: User Settings, Team Members, Platform Connections
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- ── user_settings ─────────────────────────────────────────────────────────────
-- Stores notification preferences per user (one row per user)
create table if not exists user_settings (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid references auth.users(id) on delete cascade unique,
  notifs      jsonb not null default '{"email":true,"push":false,"new_review":true,"critical":true,"weekly":true,"monthly":false,"whatsapp":false}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table user_settings enable row level security;
create policy "Users manage own settings"
  on user_settings for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ── auto_reply_settings: add auto_publish column ──────────────────────────────
alter table auto_reply_settings add column if not exists auto_publish boolean default false;

-- ── team_members ──────────────────────────────────────────────────────────────
-- Stores additional team members invited by the business owner
create table if not exists team_members (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text check (role in ('admin','manager','viewer')) default 'viewer',
  status      text check (status in ('active','pending')) default 'active',
  joined_at   timestamptz default now(),
  unique(owner_id, email)
);

alter table team_members enable row level security;
create policy "Users manage own team"
  on team_members for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ── platform_connections ──────────────────────────────────────────────────────
-- Tracks which review platforms each user has connected
create table if not exists platform_connections (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid references auth.users(id) on delete cascade,
  platform      text not null,
  reviews_count int default 0,
  last_sync_at  timestamptz,
  created_at    timestamptz default now(),
  unique(owner_id, platform)
);

alter table platform_connections enable row level security;
create policy "Users manage own connections"
  on platform_connections for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
