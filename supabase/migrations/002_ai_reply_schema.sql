-- Migration 002: AI Reply Sessions + Auto-Reply Settings

create table if not exists reply_sessions (
  id           uuid primary key default uuid_generate_v4(),
  review_id    uuid references reviews(id) on delete cascade,
  tone         text check (tone in ('soft','gentle','firm','apologetic')),
  suggestions  jsonb not null,
  chosen_index int,
  whatsapp_to  text,
  expires_at   timestamptz default (now() + interval '24 hours'),
  created_at   timestamptz default now()
);

alter table reply_sessions enable row level security;
create policy "Owners can manage reply sessions"
  on reply_sessions for all
  using (
    review_id in (
      select r.id from reviews r
      join businesses b on b.id = r.business_id
      where b.owner_id = auth.uid()
    )
  );

create table if not exists auto_reply_settings (
  id              uuid primary key default uuid_generate_v4(),
  business_id     uuid references businesses(id) on delete cascade unique,
  enabled         boolean default false,
  default_tone    text check (default_tone in ('soft','gentle','firm','apologetic')) default 'soft',
  whatsapp_number text,
  created_at      timestamptz default now()
);

alter table auto_reply_settings enable row level security;
create policy "Owners can manage auto reply settings"
  on auto_reply_settings for all
  using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );
