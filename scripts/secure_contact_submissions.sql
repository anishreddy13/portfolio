-- Apply through the Supabase SQL Editor before deploying the contact endpoint.
-- In Supabase Dashboard > Integrations > Data API, explicitly expose `public`
-- before running this script if it is not already exposed. Tables remain protected
-- by RLS and grants; only the server's service-role client can access them.

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null default 'Portfolio contact request',
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;
revoke all on table public.contact_submissions from anon, authenticated;
grant all on table public.contact_submissions to service_role;

create table if not exists public.contact_rate_limits (
  request_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);

alter table public.contact_rate_limits enable row level security;
revoke all on table public.contact_rate_limits from anon, authenticated;
grant all on table public.contact_rate_limits to service_role;

create or replace function public.check_contact_rate_limit(
  request_key text,
  window_seconds integer,
  max_requests integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  if request_key is null or length(request_key) < 32
    or window_seconds < 1 or max_requests < 1 then
    raise exception 'invalid rate limit parameters';
  end if;

  insert into public.contact_rate_limits (request_key, window_started_at, request_count)
  values (request_key, now(), 1)
  on conflict (request_key) do update
  set window_started_at = case
        when public.contact_rate_limits.window_started_at <= now() - make_interval(secs => window_seconds)
        then now() else public.contact_rate_limits.window_started_at end,
      request_count = case
        when public.contact_rate_limits.window_started_at <= now() - make_interval(secs => window_seconds)
        then 1 else public.contact_rate_limits.request_count + 1 end
  returning request_count into current_count;

  return current_count > max_requests;
end;
$$;

revoke all on function public.check_contact_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_contact_rate_limit(text, integer, integer) to service_role;
