-- Schedule periodic refresh jobs for Observatory + AI incidents.
-- Runs every 6 hours using pg_cron + pg_net.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  supabase_url text := current_setting('app.settings.supabase_url', true);
begin
  if supabase_url is null or supabase_url = '' then
    raise notice 'Skipping cron schedules: app.settings.supabase_url is not set.';
    return;
  end if;

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

  -- AI Incidents refresh every 6 hours (force bypasses cache).
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