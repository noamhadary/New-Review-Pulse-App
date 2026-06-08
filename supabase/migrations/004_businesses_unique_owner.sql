-- Migration 004: Add unique constraint on businesses.owner_id
-- Ensures one business record per user (required for upsert to work)
-- Run in Supabase SQL Editor

alter table businesses
  add constraint businesses_owner_id_unique unique (owner_id);
