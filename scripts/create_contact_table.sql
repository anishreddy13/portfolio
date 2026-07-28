-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Project: poxczxizlsllglexrgrn (portfolio-analytics)
-- ============================================================

-- Create the contact_submissions table
create table if not exists public.contact_submissions (
  id         uuid        default gen_random_uuid() primary key,
  name       text        not null,
  email      text        not null,
  subject    text        not null default 'Portfolio contact request',
  message    text        not null,
  created_at timestamptz not null default now()
);

-- Disable RLS so service role key can insert without policy setup
alter table public.contact_submissions disable row level security;

-- Grant all permissions to service_role (used by the API route)
grant all on public.contact_submissions to service_role;

-- Verify the table was created
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'contact_submissions'
order by ordinal_position;
