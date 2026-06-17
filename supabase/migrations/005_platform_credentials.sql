-- Add credentials JSONB column to platform_connections
alter table platform_connections
  add column if not exists credentials jsonb default '{}';
