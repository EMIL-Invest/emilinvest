-- ============================================================
-- 22_gjenopprett_priscache.sql — oppretter stock_price_cache og fyller
-- den, slik at kjøp og salg i konkurransen virker igjen.
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- FEILEN: kjøp (og salg) feiler med 42P01 «relation "stock_price_cache"
-- does not exist». Tabellen skulle vært opprettet av 02_full_oppsett.sql,
-- men den delen har aldri truffet produksjonsbasen — og stock-prices-
-- funksjonen som skriver til cachen logger bare feilen stille, så det
-- har vært usynlig. Etter 19 validerer BÅDE kjøp og salg mot cachen,
-- og da stopper all handel så lenge tabellen mangler.
--
-- VIKTIG: løsningen er IKKE å la competition_buy_stock lese kurs fra en
-- annen tabell. oslo_stocks har ingen kurser — cachen er selve
-- sikkerhetsmekanismen som hindrer at klienten kan sende inn en
-- manipulert pris (±5 %-sjekken fra kodegjennomgangen 5. aug).
-- Tabellen skal finnes; det er det som rettes her.
--
-- NB (pg_net): http_post i DEL 2 fyres først når spørringen committer.
-- Kjør hele fila, vent ~30 sekunder, og kjør så kontrollen i DEL 3.
-- ============================================================

-- DEL 1: Tabellen (identisk med 02_full_oppsett.sql — trygg å kjøre igjen)
CREATE TABLE IF NOT EXISTS public.stock_price_cache (
  ticker TEXT PRIMARY KEY,
  price NUMERIC NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_price_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view price cache" ON public.stock_price_cache;
CREATE POLICY "Anyone can view price cache"
ON public.stock_price_cache
FOR SELECT
USING (true);
-- Ingen INSERT/UPDATE-policyer: kun service role (edge-funksjonen) skriver.

-- DEL 2: Be stock-prices-funksjonen hente kurser for alle aksjer som
-- faktisk eies i konkurransen — da virker handel og skript 21 med én
-- gang. (Resten av kurslisten fylles automatisk når noen åpner
-- Kjøp/Selg-fanen; den lastes hvert 30. sekund.)
SELECT net.http_post(
  url := 'https://nehqvobfwooyufxqbzpv.supabase.co/functions/v1/stock-prices',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'apikey', 'sb_publishable_KVhuYnqq7zfxJcnHSZDlLw_j_RvW_FM',
    'Authorization', 'Bearer sb_publishable_KVhuYnqq7zfxJcnHSZDlLw_j_RvW_FM'
  ),
  body := jsonb_build_object(
    'tickers',
    (SELECT COALESCE(jsonb_agg(DISTINCT ticker), '[]'::jsonb)
     FROM competition_portfolios
     WHERE ticker <> 'ASK')
  )
) AS request_id;

-- ============================================================
-- DEL 3: KONTROLL — kjør ~30 sekunder etter DEL 2.
-- Alle tickere som eies skal ha fersk kurs. Mangler noen, har de
-- sannsynligvis ugyldig ticker hos kursleverandøren — sjekk svaret:
--   SELECT status_code, content::text FROM net._http_response
--   ORDER BY id DESC LIMIT 1;
-- ============================================================
SELECT eid.ticker,
       c.price,
       c.updated_at,
       CASE WHEN c.ticker IS NULL THEN 'MANGLER KURS' ELSE 'ok' END AS status
FROM (SELECT DISTINCT ticker FROM competition_portfolios WHERE ticker <> 'ASK') eid
LEFT JOIN stock_price_cache c ON c.ticker = eid.ticker
ORDER BY status DESC, eid.ticker;
