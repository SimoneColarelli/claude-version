create table if not exists public.google_reviews_cache (
  cache_key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint google_reviews_cache_expiry_check check (expires_at >= fetched_at)
);

comment on table public.google_reviews_cache is
  'Temporary Google Business Profile review cache. Rows must never be retained for more than 30 days.';

alter table public.google_reviews_cache enable row level security;

revoke all on table public.google_reviews_cache from anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

do $schedule$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'purge-expired-google-reviews-cache'
  ) then
    perform cron.schedule(
      'purge-expired-google-reviews-cache',
      '17 3 * * *',
      $command$delete from public.google_reviews_cache where fetched_at < now() - interval '30 days'$command$
    );
  end if;
end;
$schedule$;
