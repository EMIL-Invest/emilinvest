-- ============================================================
-- 11_nullstill_historikk.sql — nullstiller avkastningshistorikken
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- Bakgrunn: midlene har fram til nå vært plassert i ulike fond, med noen
-- mindre aksjeposisjoner ved siden av. Komiteen forvalter en egen
-- portefølje først fra dette semesteret, så den registrerte historikken
-- beskriver ikke den porteføljen grafen skal vise. Vi starter på nytt fra
-- i dag, med porteføljen og OSEBX på samme utgangspunkt.
--
-- Grafen normaliserer begge seriene til 100 ved første datapunkt i
-- perioden. Når historikken er tom og første rad er fra i dag, starter
-- de derfor automatisk likt — ingen manuell justering trengs.
--
-- ADVARSEL: steg 2 og 3 sletter data permanent.
-- ============================================================

-- 1) SE HVA SOM FORSVINNER (kjør denne først)
SELECT
  count(*)          AS antall_rader,
  min(date)         AS eldste,
  max(date)         AS nyeste
FROM public.portfolio_history;

-- 2) SLETT AVKASTNINGSHISTORIKKEN
DELETE FROM public.portfolio_history;

-- 3) SLETT KURSSNAPSHOTENE PER AKSJE
-- Disse er fra samme periode og er like lite reelle. De brukes av
-- Excel-eksporten i admin og av ukesrapporten, så gamle rader ville
-- fortsatt dukket opp der. Hopp over dette steget hvis du vil beholde
-- kurshistorikken per aksje av andre grunner.
DELETE FROM public.portfolio_stock_snapshots;

-- 4) VALGFRITT: LEGG INN DAGENS UTGANGSPUNKT MANUELT
-- Snapshot-jobben lager denne raden av seg selv neste gang den kjører
-- (hverdager 09:00 norsk tid). Vil du at grafen skal ha et startpunkt
-- med én gang, fyll inn de to tallene under og kjør INSERT-en.
--
--   portfolio_value  = porteføljens verdi i kroner, slik den står på
--                      forsiden akkurat nå
--   osebx_value      = dagens OSEBX-nivå
--   invested_capital = innskutt kapital i kroner
--
-- INSERT INTO public.portfolio_history
--   (date, portfolio_value, osebx_value, invested_capital)
-- VALUES
--   (CURRENT_DATE, 122403, 1580.42, 122403);

-- 5) KONTROLL — skal være 0 rader, eller 1 hvis du kjørte steg 4
SELECT count(*) AS rader_igjen FROM public.portfolio_history;
