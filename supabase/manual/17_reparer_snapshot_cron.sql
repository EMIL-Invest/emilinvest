-- ============================================================
-- 17_reparer_snapshot_cron.sql — få snapshot-jobben på beina igjen
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- HVA DIAGNOSEN VISTE (16_snapshot_diagnose.sql, del 3):
-- Én respons fra fredag: kl. 14:30 UTC, status 500, «Ingen historikk».
-- Det er IKKE snapshot-jobben — det er WEEKLY-REPORT, fredagsrapporten
-- til Slack (16:30 norsk tid). Den leser portfolio_history for å bygge
-- ukesrapporten, fant tabellen tom etter nullstillingen, og ga opp. Den
-- reparerer seg selv: neste fredag finnes det historikk igjen, og
-- rapporten går ut som normalt.
--
-- Det avgjørende er responsen som MANGLER: daily-snapshot skulle kjørt
-- fredag 08:00 UTC og lagt igjen en respons i samme liste. Siden
-- 14:30-responsen fortsatt ligger der, ville en 08:00-respons også
-- gjort det. Ingen respons = kallet ble aldri sendt = snapshot-jobben
-- fyrer ikke. Denne fila planlegger jobben på nytt, kjører et snapshot
-- med én gang, og verifiserer begge deler.
-- ============================================================

-- 1) PLANLEGG JOBBEN PÅ NYTT
--    Trygt å kjøre uansett hva som var galt: fjerner en eventuell død
--    jobb først, og legger den inn igjen slik skript 02 definerte den.
SELECT cron.unschedule('daily-portfolio-snapshot')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-portfolio-snapshot');

SELECT cron.schedule(
  'daily-portfolio-snapshot',
  '0 8 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://nehqvobfwooyufxqbzpv.supabase.co/functions/v1/daily-snapshot',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '98071ee040cc8d039124ee1d793f0b3a9d4e3558f112e2cf9e5691d4c4e27846'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 2) KONTROLL: jobben skal nå finnes med active = true
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'daily-portfolio-snapshot';

-- 3) KJØR ET SNAPSHOT NÅ (samme kall som jobben gjør)
--    Børsen er stengt i helgen, så kursene er fredagens sluttkurser.
SELECT net.http_post(
  url := 'https://nehqvobfwooyufxqbzpv.supabase.co/functions/v1/daily-snapshot',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', '98071ee040cc8d039124ee1d793f0b3a9d4e3558f112e2cf9e5691d4c4e27846'
  ),
  body := '{}'::jsonb
) AS request_id;

-- 4) VENT 10–15 SEKUNDER, marker og kjør så disse to:

--    a) Funksjonens svar — skal være status_code 200 med "success":true.
--       Får du 401 her, er CRON_SECRET i funksjonens miljø en annen enn
--       hemmeligheten over — sett den på nytt med:
--       supabase secrets set CRON_SECRET=98071ee040cc8d039124ee1d793f0b3a9d4e3558f112e2cf9e5691d4c4e27846
SELECT created, status_code, left(content, 160) AS svar
FROM net._http_response
ORDER BY created DESC
LIMIT 3;

--    b) Historikken — skal ha én rad med dagens dato.
SELECT date, portfolio_value, osebx_value, invested_capital
FROM portfolio_history
ORDER BY date;

-- ============================================================
-- ETTERPÅ
-- Mandag 08:00 UTC (10:00 norsk) skal jobben legge inn neste punkt av
-- seg selv — da har grafen to punkter og begynner å tegne. Sjekk gjerne
-- mandag formiddag at raden er der; hvis ikke, kjør del 4 i
-- 16_snapshot_diagnose.sql og se hva responsen sier.
--
-- Fredagsrapporten til Slack trenger ingen fiks — den virker igjen så
-- snart historikken har rader.
-- ============================================================
