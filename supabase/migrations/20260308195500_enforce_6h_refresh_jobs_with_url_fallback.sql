-- Ensure 6-hour refresh schedules are always installed, even when
-- app.settings.supabase_url is unavailable in SQL settings.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  supabase_url text := coalesce(
    nullif(current_setting('app.settings.supabase_url', true), ''),
    'https://yuwjkhnkgvxehkzyjqlz.supabase.co'
  );
begin
  -- Replace existing jobs if they already exist.
  if exists (select 1 from cron.job where jobname = 'refresh-suffering-index-6h') then
    perform cron.unschedule('refresh-suffering-index-6h');
  end if;

  if exists (select 1 from cron.job where jobname = 'refresh-ai-incidents-6h') then
    perform cron.unschedule('refresh-ai-incidents-6h');
  end if;

  -- Suffering Index refresh every 6 hours.
  perform cron.schedule(
    'refresh-suffering-index-6h',
    '0 */6 * * *',
    format(
      $request$select net.http_post(
          url := '%s/functions/v1/suffering-index',
          headers := '{"Content-Type":"application/json"}'::jsonb,
          body := '{"force":true}'::jsonb
        )$request$,
      supabase_url
    )
  );

  -- AI Incidents refresh every 6 hours.
  perform cron.schedule(
    'refresh-ai-incidents-6h',
    '0 */6 * * *',
    format(
      $request$select net.http_post(
          url := '%s/functions/v1/ai-incidents?refresh=true',
          headers := '{"Content-Type":"application/json"}'::jsonb,
          body := '{}'::jsonb
        )$request$,
      supabase_url
    )
  );
end
$$;
