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

-- Row Level Security on, with NO policies attached.
--
-- That combination makes the table unreadable to the anon and authenticated
-- keys entirely. Only the service_role key reaches it, because service_role
-- bypasses RLS. The browser never talks to Supabase directly, so no policy is
-- needed — and if the anon key ever leaked, these rows would still be sealed.
alter table oauth_tokens enable row level security;
