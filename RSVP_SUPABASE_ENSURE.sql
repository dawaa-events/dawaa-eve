-- Run this in Supabase SQL Editor if the RSVP webhook cannot log/update data.
alter table if exists public.guests add column if not exists meta_message_id text;
alter table if exists public.guests add column if not exists invitation_sent_at timestamptz;
alter table if exists public.guests add column if not exists delivered_at timestamptz;
alter table if exists public.guests add column if not exists read_at timestamptz;
alter table if exists public.guests add column if not exists replied_at timestamptz;
alter table if exists public.guests add column if not exists confirmed_count int default 0;
alter table if exists public.guests add column if not exists declined_count int default 0;
alter table if exists public.guests add column if not exists pending_count int default 1;
alter table if exists public.guests add column if not exists updated_at timestamptz default now();

create index if not exists guests_meta_message_id_idx on public.guests(meta_message_id);
create index if not exists guests_phone_number_idx on public.guests(phone_number);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null,
  guest_id uuid null,
  phone_number text,
  direction text default 'outbound',
  message_type text default 'text',
  message_body text,
  meta_message_id text,
  status text default 'sent',
  created_at timestamptz default now()
);

create table if not exists public.guest_timeline_events (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid null,
  booking_id uuid null,
  event_type text not null,
  event_data jsonb default '{}'::jsonb,
  source text default 'internal',
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);
