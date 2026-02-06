
-- Update the cron job to run at 09:00 CET (08:00 UTC) instead of 17:00 CET
SELECT cron.unschedule('daily-portfolio-snapshot');

SELECT cron.schedule(
    'daily-portfolio-snapshot',
    '0 8 * * 1-5',  -- 08:00 UTC = 09:00 CET, Monday-Friday
    $$
    SELECT net.http_post(
        url := 'https://rdiansdvvwkpujidyzoe.supabase.co/functions/v1/daily-snapshot',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
        ),
        body := '{}'::jsonb
    );
    $$
);
