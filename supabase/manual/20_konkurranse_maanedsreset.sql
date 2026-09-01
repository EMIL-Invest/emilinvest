-- ============================================================
-- 20_konkurranse_maanedsreset.sql — månedlig (og årlig) nullstilling
-- av konkurransens topplister. Kjøres i Supabase SQL Editor.
--
-- FEILEN DETTE RETTER: «Toppliste denne måneden» viste 1. september
-- fortsatt avkastning fra i vår. Edge-funksjonen competition-reset
-- (som setter monthly_start_value til porteføljens markedsverdi) finnes
-- og er deployet, men cron-jobben som skal kalle den ble aldri satt opp
-- igjen etter migreringen fra Lovable — bare daily-snapshot ble
-- gjenopprettet (02/17). Uten jobben nullstilles månedslisten aldri.
--
-- Funksjonen henter ferske kurser fra Yahoo (med valutakonvertering),
-- så verdiene blir riktige selv om priscachen er gammel.
--
-- NB (pg_net): http_post-kallene fyres først når transaksjonen
-- committer. Kjør DEL 2 (reparasjonen) for seg selv, og sjekk svaret
-- etterpå med kontrollspørringen nederst.
-- ============================================================

-- ============================================================
-- DEL 1: Cron-jobbene
-- ============================================================

-- Månedlig: kl. 04:15 UTC den 1. hver måned (06:15 norsk sommertid) —
-- før børsen åpner, slik at startverdien = månedsskiftets sluttkurser.
SELECT cron.unschedule('competition-monthly-reset')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'competition-monthly-reset');

SELECT cron.schedule(
  'competition-monthly-reset',
  '15 4 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://nehqvobfwooyufxqbzpv.supabase.co/functions/v1/competition-reset',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '98071ee040cc8d039124ee1d793f0b3a9d4e3558f112e2cf9e5691d4c4e27846'
    ),
    body := '{"reset_type": "monthly"}'::jsonb
  );
  $$
);

-- Årlig: 1. januar kl. 04:25 UTC. (Månedsjobben går også da — begge
-- setter samme verdi, så rekkefølgen spiller ingen rolle.)
SELECT cron.unschedule('competition-yearly-reset')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'competition-yearly-reset');

SELECT cron.schedule(
  'competition-yearly-reset',
  '25 4 1 1 *',
  $$
  SELECT net.http_post(
    url := 'https://nehqvobfwooyufxqbzpv.supabase.co/functions/v1/competition-reset',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '98071ee040cc8d039124ee1d793f0b3a9d4e3558f112e2cf9e5691d4c4e27846'
    ),
    body := '{"reset_type": "yearly"}'::jsonb
  );
  $$
);

-- Kontroll: begge jobbene skal stå her som aktive
SELECT jobname, schedule, active FROM cron.job
WHERE jobname IN ('competition-monthly-reset', 'competition-yearly-reset');

-- ============================================================
-- DEL 2: REPARASJON FOR SEPTEMBER — kjør denne blokken FOR SEG SELV nå.
-- Jobben over går først 1. oktober; september-nullstillingen må fyres
-- manuelt siden månedsskiftet allerede har passert.
-- ============================================================

SELECT net.http_post(
  url := 'https://nehqvobfwooyufxqbzpv.supabase.co/functions/v1/competition-reset',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', '98071ee040cc8d039124ee1d793f0b3a9d4e3558f112e2cf9e5691d4c4e27846'
  ),
  body := '{"reset_type": "monthly"}'::jsonb
) AS request_id;

-- ============================================================
-- DEL 3: KONTROLL — kjør ca. 30 sekunder etter DEL 2.
-- ============================================================

-- 3a) Svaret fra funksjonen (forvent status 200 og participants_updated > 0)
SELECT id, status_code, content::text
FROM net._http_response
ORDER BY id DESC
LIMIT 3;

-- 3b) Startverdiene skal nå være ≈ porteføljeverdiene, og månedslisten ≈ 0 %
SELECT p.display_name,
       round(p.monthly_start_value::numeric) AS mnd_startverdi
FROM competition_participants p
WHERE p.is_active
ORDER BY p.display_name;
