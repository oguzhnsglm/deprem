-- Supabase Security Advisor fixes
-- Run in Supabase Dashboard -> SQL Editor.
-- Review the function body against your existing public.handle_updated_at function before running.

begin;

-- Fix: Function Search Path Mutable
-- Security Advisor warns when a function does not pin search_path.
-- This keeps the usual updated_at trigger behavior and restricts name resolution.
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_updated_at() from public;

commit;

-- Fix: Leaked Password Protection Disabled
-- This is not a SQL setting in the public database schema.
-- Dashboard path:
-- Authentication -> Auth Server / Password Security -> Leaked password protection -> Enable
-- Then return to Security Advisor and rerun the linter.
