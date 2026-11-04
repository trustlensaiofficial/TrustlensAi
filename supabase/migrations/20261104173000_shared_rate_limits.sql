-- Shared rate limiting (release blocker B1).
--
-- The limiter was a Map in process memory. On Vercel every serverless instance
-- holds its own, so the effective limit was the configured limit multiplied by
-- however many instances happened to be warm, and it reset on every cold start.
-- That is not abuse protection; it is the appearance of it.
--
-- This gives all instances one counter. The whole check is a single
-- INSERT .. ON CONFLICT DO UPDATE, which takes a row lock and is therefore
-- atomic: two instances arriving together cannot both read "11" and both allow.
--
-- No raw client identifier is stored. The application sends a keyed HMAC, so a
-- reader of this table cannot recover the IP addresses it counts.

create table if not exists public.rate_limits (
  -- An opaque, application-supplied token. Never a raw IP.
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

comment on table public.rate_limits is
  'Shared request counters. Keys are opaque HMAC tokens, never raw client identifiers. Service role only.';

-- RLS on with no policies: anon and authenticated can reach nothing here.
-- The service role bypasses RLS, so a leaked publishable key reads nothing.
alter table public.rate_limits enable row level security;

-- Supports the prune below.
create index if not exists rate_limits_window_start_idx
  on public.rate_limits (window_start);

/*
 * Consume one unit against a key and report what is left.
 *
 * Returns allowed=false on the request that exceeds the limit, not the one
 * after it, so the caller never has to decide the boundary itself.
 */
create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
-- Pinned so the function cannot be redirected by a caller's search_path.
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := now();
  v_window timestamptz;
  v_count integer;
begin
  if p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'consume_rate_limit requires a positive limit and window';
  end if;
  if p_key is null or length(p_key) = 0 or length(p_key) > 200 then
    raise exception 'consume_rate_limit requires a key of 1..200 characters';
  end if;

  /*
   * One atomic statement. The window either rolls forward (count restarts at
   * 1) or it does not (count increments). Doing this as a read followed by a
   * write would reintroduce exactly the race this migration exists to close.
   */
  insert into public.rate_limits as rl (key, window_start, count)
  values (p_key, v_now, 1)
  on conflict (key) do update
    set window_start = case
          when rl.window_start <= v_now - make_interval(secs => p_window_seconds) then v_now
          else rl.window_start
        end,
        count = case
          when rl.window_start <= v_now - make_interval(secs => p_window_seconds) then 1
          else rl.count + 1
        end
  returning rl.window_start, rl.count into v_window, v_count;

  -- Opportunistic prune, roughly once every thousand calls, so the table stays
  -- bounded without depending on a scheduled job existing.
  if random() < 0.001 then
    delete from public.rate_limits
     where window_start < v_now - make_interval(secs => p_window_seconds * 10);
  end if;

  return query
    select
      v_count <= p_limit,
      greatest(p_limit - v_count, 0),
      case
        when v_count <= p_limit then 0
        else greatest(
          1,
          ceil(extract(epoch from (v_window + make_interval(secs => p_window_seconds)) - v_now))::integer
        )
      end;
end;
$$;

comment on function public.consume_rate_limit(text, integer, integer) is
  'Atomically consumes one unit against an opaque key. Service role only.';

-- Only the server may spend quota. An anon caller able to execute this could
-- exhaust another client''s allowance by guessing keys.
revoke all on function public.consume_rate_limit(text, integer, integer) from public;
revoke all on function public.consume_rate_limit(text, integer, integer) from anon;
revoke all on function public.consume_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
