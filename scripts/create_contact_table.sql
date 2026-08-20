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

-- Keep RLS enabled; service_role bypasses RLS while browser roles retain no access.
alter table public.contact_submissions enable row level security;

-- Grant all permissions to service_role (used by the API route)
revoke all on public.contact_submissions from anon, authenticated;
grant all on public.contact_submissions to service_role;

-- Verify the table was created
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'contact_submissions'
order by ordinal_position;
