-- ============================================================
-- 16_snapshot_diagnose.sql — hvorfor mangler grafen datapunkter?
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- Grafen «Portefølje vs OSEBX» tegnes fra portfolio_history, som får én
-- rad per hverdag fra cron-jobben daily-portfolio-snapshot (08:00 UTC,
-- altså 10:00 norsk sommertid). Tabellen er tom nå, og det finnes to
-- mulige forklaringer:
--
--   A) Fredagens cron-kjøring feilet, så raden ble aldri skrevet.
--   B) Cron-kjøringen gikk fint, men raden ble slettet ETTERPÅ — skript
--      11_nullstill_historikk.sql sletter ALT i portfolio_history, så
--      hvis det ble kjørt fredag ettermiddag eller i helgen, forsvant
--      fredagspunktet med det.
--
-- Del 1–3 avgjør hvilken av dem det var. Del 4 lager dagens datapunkt
-- med én gang. Grafen trenger to punkter for å tegne en linje, så
-- kurven dukker opp når mandagens cron har kjørt.
-- ============================================================

-- 1) Finnes jobben, og er den aktiv? (skal gi én rad med active = true)
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'daily-portfolio-snapshot';

-- 2) Kjørte den på fredag? Siste ti kjøringer.
--    status 'succeeded' betyr bare at HTTP-kallet ble SENDT — se del 3
--    for hva funksjonen faktisk svarte.
SELECT start_time, status, left(return_message, 120) AS melding
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-portfolio-snapshot')
ORDER BY start_time DESC
LIMIT 10;

-- 3) Hva svarte snapshot-funksjonen? (pg_net tar vare på svarene en stund)
--    status_code 200 = raden ble skrevet (og senere slettet → forklaring B).
--    401 = feil cron-hemmelighet. 500 = funksjonen feilet. Ingen rader
--    fra fredag = kallet ble aldri sendt (→ forklaring A).
SELECT created, status_code, left(content, 160) AS svar, error_msg, timed_out
FROM net._http_response
ORDER BY created DESC
LIMIT 10;

-- ============================================================
-- 4) KJØR ET SNAPSHOT NÅ
--    Samme kall som cron-jobben gjør. Børsen er stengt i helgen, så
--    kursene som hentes ER fredagens sluttkurser — punktet får dagens
--    dato, men fredagens verdier.
-- ============================================================
SELECT net.http_post(
  url := 'https://nehqvobfwooyufxqbzpv.supabase.co/functions/v1/daily-snapshot',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', '98071ee040cc8d039124ee1d793f0b3a9d4e3558f112e2cf9e5691d4c4e27846'
  ),
  body := '{}'::jsonb
) AS request_id;

-- 5) VENT 10–15 SEKUNDER, og kjør så disse to for å se resultatet:

SELECT created, status_code, left(content, 160) AS svar
FROM net._http_response
ORDER BY created DESC
LIMIT 3;

SELECT date, portfolio_value, osebx_value, invested_capital
FROM portfolio_history
ORDER BY date;

-- ============================================================
-- VIL DU HA PUNKTET PÅ FREDAGS DATO I STEDET?
-- Funksjonen stempler alltid dagens dato. Siden verdiene uansett er
-- fredagens sluttkurser, kan du flytte raden:
--
--   UPDATE portfolio_history SET date = '2026-08-14'
--   WHERE date = CURRENT_DATE;
--
-- Gjør det bare hvis du kjørte del 4 i helgen — på mandag vil cron
-- skrive sin egen rad for mandagens dato ved siden av.
--
-- ============================================================
-- VIKTIG FRAMOVER
-- Ikke kjør 11_nullstill_historikk.sql igjen — den sletter hele grafen.
-- Nullstillingen er gjort, og historikken som bygges opp nå er den
-- ekte. Kostpriser rettes i admin, aldri med skript 11.
-- ============================================================
