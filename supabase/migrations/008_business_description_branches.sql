-- Add short description and multi-branch support to businesses
alter table businesses
  add column if not exists description text,
  add column if not exists branches jsonb not null default '[]'::jsonb;
