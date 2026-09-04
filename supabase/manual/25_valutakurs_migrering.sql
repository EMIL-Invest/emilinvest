-- ============================================================
-- 25_valutakurs_migrering.sql — overgang til LIVE valutakurser uten
-- at noen deltaker får hopp i avkastningen.
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- BAKGRUNN: stock-prices og daily-snapshot hadde hardkodede valutakurser
-- (USD = 11,00 osv.). Utenlandske aksjer fikk derfor feil NOK-pris når
-- valutakursen flyttet seg (møtet 3. sep: «en aksje vises til 3 000 kr»).
-- Funksjonene henter nå kursene live fra Yahoo (USDNOK=X osv.).
--
-- PROBLEMET dette skriptet løser: i det øyeblikket de nye funksjonene
-- deployes, endres NOK-prisen på utenlandske aksjer — og da ville alle
-- som eier slike aksjer fått et kunstig hopp i avkastningen. Skriptet
-- skalerer derfor, per deltaker og posisjon:
--   * snittkjøpskursen per aksje  (posisjonens avkastning uendret)
--   * alle startverdier           (total-, års- og månedsavkastning uendret)
--   * dagens snapshot             (bidragsregnskapet fra skript 24 uendret)
-- med forholdet ny/gammel kurs. Avkastningen er da identisk før og etter.
--
-- KJØRES I FIRE STEG, i denne rekkefølgen — helst etter børsslutt
-- (16:25 norsk tid), så ekte kursbevegelser ikke blandes inn:
--   STEG 1: Kjør DEL 1 her (fryser dagens kurser FØR deploy).
--   STEG 2: Deploy de nye funksjonene fra terminalen på egen maskin:
--             supabase functions deploy stock-prices
--             supabase functions deploy daily-snapshot
--   STEG 3: Kjør DEL 2 her (henter nye kurser), VENT ~30 sekunder.
--   STEG 4: Kjør DEL 3 (skaleringen) og deretter DEL 4 (kontrollen).
--           Når kontrollen viser OK for alle: kjør DEL 5 (rydder opp).
-- ============================================================

-- ============================================================
-- DEL 1: Frys kursbildet FØR de nye funksjonene tar over.
-- (Vanlige tabeller, ikke TEMP — de må overleve mellom kjøringene.)
-- ============================================================
DROP TABLE IF EXISTS public.migrering_kurs_foer;
CREATE TABLE public.migrering_kurs_foer AS
SELECT ticker, price FROM stock_price_cache;

DROP TABLE IF EXISTS public.migrering_deltakere_foer;
CREATE TABLE public.migrering_deltakere_foer AS
SELECT id, display_name, monthly_start_value, yearly_start_value, all_time_start_value
FROM competition_participants;

DROP TABLE IF EXISTS public.migrering_portefoljer_foer;
CREATE TABLE public.migrering_portefoljer_foer AS
SELECT participant_id, ticker, quantity, average_purchase_price
FROM competition_portfolios;

SELECT 'DEL 1 ferdig — deploy nå de nye funksjonene (STEG 2), kjør så DEL 2' AS status;

-- ============================================================
-- DEL 2: Hent NYE kurser (med riktig valuta) inn i cachen.
-- NB: pg_net fyrer først ved commit — kjør denne delen for seg selv,
-- og VENT ~30 sekunder før DEL 3.
-- ============================================================
-- SELECT net.http_post(
--   url := 'https://nehqvobfwooyufxqbzpv.supabase.co/functions/v1/stock-prices',
--   headers := jsonb_build_object('Content-Type','application/json',
--     'apikey','sb_publishable_KVhuYnqq7zfxJcnHSZDlLw_j_RvW_FM',
--     'Authorization','Bearer sb_publishable_KVhuYnqq7zfxJcnHSZDlLw_j_RvW_FM'),
--   body := jsonb_build_object('tickers',
--     (SELECT COALESCE(jsonb_agg(DISTINCT ticker),'[]'::jsonb)
--      FROM competition_portfolios WHERE ticker <> 'ASK')));

-- ============================================================
-- DEL 3: Skaleringen. Kjøres i én transaksjon.
-- Startverdi-triggeren slås av midlertidig (skriptet kjører som
-- administrator i SQL Editor, men triggeren kjenner ikke auth.uid()).
-- ============================================================
-- BEGIN;
--
-- ALTER TABLE competition_participants DISABLE TRIGGER protect_participant_start_values;
--
-- -- a) Startverdiene skaleres med hver deltakers verdiforhold ny/gammel.
-- --    (Samme faktor på alle tre periodene holder alle avkastningstall
-- --    uendret, siden nåverdien de måles mot skalerer likt.)
-- --    Gjøres FØR kjøpskursene røres, siden fallbacken bruker dem.
-- WITH verdier AS (
--   SELECT f.participant_id,
--     SUM(CASE WHEN f.ticker = 'ASK' THEN f.quantity
--              ELSE f.quantity * COALESCE(n.price, f.average_purchase_price) END) AS ny,
--     SUM(CASE WHEN f.ticker = 'ASK' THEN f.quantity
--              ELSE f.quantity * COALESCE(g.price, f.average_purchase_price) END) AS gammel
--   FROM competition_portfolios f
--   LEFT JOIN stock_price_cache n ON n.ticker = f.ticker
--   LEFT JOIN migrering_kurs_foer g ON g.ticker = f.ticker
--   GROUP BY f.participant_id
-- )
-- UPDATE competition_participants p
-- SET monthly_start_value  = p.monthly_start_value  * v.ny / v.gammel,
--     yearly_start_value   = p.yearly_start_value   * v.ny / v.gammel,
--     all_time_start_value = p.all_time_start_value * v.ny / v.gammel
-- FROM verdier v
-- WHERE v.participant_id = p.id AND v.gammel > 0 AND v.ny > 0;
--
-- -- b) Snittkjøpskurs per posisjon skaleres med kursforholdet for aksjen,
-- --    så hver posisjons viste avkastning også er uendret.
-- UPDATE competition_portfolios f
-- SET average_purchase_price = f.average_purchase_price * (n.price / g.price)
-- FROM stock_price_cache n, migrering_kurs_foer g
-- WHERE n.ticker = f.ticker AND g.ticker = f.ticker
--   AND f.ticker <> 'ASK' AND g.price > 0 AND n.price > 0;
--
-- ALTER TABLE competition_participants ENABLE TRIGGER protect_participant_start_values;
--
-- -- c) Skriv dagens snapshot på nytt med de nye kursene, så
-- --    bidragsregnskapet (skript 24) starter på riktig nivå.
-- SELECT public.competition_take_snapshot();
--
-- COMMIT;

-- ============================================================
-- DEL 4: KONTROLL — avkastning før og etter skal være identisk.
-- ============================================================
-- WITH gammel AS (
--   SELECT pf.participant_id,
--     SUM(CASE WHEN pf.ticker = 'ASK' THEN pf.quantity
--              ELSE pf.quantity * COALESCE(g.price, pf.average_purchase_price) END) AS total
--   FROM migrering_portefoljer_foer pf
--   LEFT JOIN migrering_kurs_foer g ON g.ticker = pf.ticker
--   GROUP BY pf.participant_id
-- ),
-- ny AS (
--   SELECT f.participant_id,
--     SUM(CASE WHEN f.ticker = 'ASK' THEN f.quantity
--              ELSE f.quantity * COALESCE(n.price, f.average_purchase_price) END) AS total
--   FROM competition_portfolios f
--   LEFT JOIN stock_price_cache n ON n.ticker = f.ticker
--   GROUP BY f.participant_id
-- )
-- SELECT df.display_name,
--   round(((g.total - df.all_time_start_value) / df.all_time_start_value * 100)::numeric, 3) AS avkastning_foer,
--   round(((n.total - p.all_time_start_value)  / p.all_time_start_value  * 100)::numeric, 3) AS avkastning_etter,
--   CASE WHEN abs((g.total - df.all_time_start_value) / df.all_time_start_value
--               - (n.total - p.all_time_start_value)  / p.all_time_start_value) < 0.0005
--        THEN 'OK' ELSE 'AVVIK — undersøk!' END AS status
-- FROM migrering_deltakere_foer df
-- JOIN competition_participants p ON p.id = df.id
-- JOIN gammel g ON g.participant_id = df.id
-- JOIN ny n ON n.participant_id = df.id
-- ORDER BY df.display_name;

-- ============================================================
-- DEL 5: Rydd opp (kjøres når DEL 4 viser OK for alle).
-- ============================================================
-- DROP TABLE IF EXISTS public.migrering_kurs_foer;
-- DROP TABLE IF EXISTS public.migrering_deltakere_foer;
-- DROP TABLE IF EXISTS public.migrering_portefoljer_foer;
