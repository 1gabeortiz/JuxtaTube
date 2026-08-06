-- JuxtaTube database schema.
-- Run this in the Supabase dashboard under SQL Editor.

-- Single-owner OAuth token storage: exactly one row, id fixed to 'owner'.
create table if not exists oauth_tokens (
  id text primary key default 'owner',
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Channels to monitor.
create table if not exists tracked_competitors (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null unique,
  channel_name text not null,
  added_at timestamptz not null default now()
);

-- Daily point-in-time stats for tracked competitors.
--
-- This table exists because the YouTube API has no history for channels you do
-- not own — it only reports counts as of right now. Growth charts are therefore
-- only possible if the app records its own history, one row per channel per day.
--
-- The unique constraint on (channel_id, snapshot_date) makes the daily job
-- idempotent: a re-run on the same day overwrites rather than duplicating.
create table if not exists competitor_snapshots (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null references tracked_competitors(channel_id) on delete cascade,
  snapshot_date date not null,
  subscriber_count bigint,
  view_count bigint,
  video_count integer,
  created_at timestamptz not null default now(),
  unique (channel_id, snapshot_date)
);

create index if not exists competitor_snapshots_channel_date_idx
  on competitor_snapshots (channel_id, snapshot_date);

-- Row Level Security on for every table, with NO policies attached.
--
-- That combination makes them unreadable to the anon and authenticated keys
-- entirely. Only the service_role key reaches them, because service_role
-- bypasses RLS. The browser never talks to Supabase directly, so no policy is
-- needed — and if the anon key ever leaked, these rows would still be sealed.
alter table oauth_tokens enable row level security;
alter table tracked_competitors enable row level security;
alter table competitor_snapshots enable row level security;
