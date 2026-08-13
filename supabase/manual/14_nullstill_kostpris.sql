-- ============================================================
-- 14_nullstill_kostpris.sql — nullstill «Avkastning per aksje»
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- MERK: dette gjøres nå enklere i admin-panelet → Portefølje →
-- «Kostpriser» → «Sett til dagens kurs». Den knappen bruker live-kursene
-- og skriver både purchase_price, cost_basis og purchase_date. Skriptet
-- her er beholdt som dokumentasjon og for tilfellet der du vil sette
-- mange kostpriser til bestemte historiske kurser.
--
-- OBS: UPDATE-blokkene under er bevisst kommentert ut med /* ... */.
-- Kjører du fila som den er, skjer det INGEN endring — bare SELECT-ene
-- kjører. Du må fjerne kommentartegnene rundt den blokken du vil bruke.
--
-- HVORFOR TRENGS DENNE?
-- Grafen «Avkastning per aksje» (Bidrag per posisjon) leser ikke fra
-- portfolio_history i det hele tatt. Den regner ut
--
--     gevinst = dagens kurs * antall  −  kostpris
--
-- der kostprisen kommer fra portfolio_holdings.cost_basis, eller
-- purchase_price * quantity hvis cost_basis er tom. Derfor rørte ikke
-- 11_nullstill_historikk.sql den: den slettet historikkradene, mens
-- kostprisene sto urørt i portfolio_holdings. Tallene du ser (SUBC
-- +15,1 %, YAR −20,3 %) er gevinst målt mot gamle kjøpskurser.
--
-- Nullstilling betyr her: sett kostprisen til kursen porteføljen har nå,
-- slik at alle posisjonene starter på 0 % samtidig — samme utgangspunkt
-- som porteføljegrafen og OSEBX.
--
-- REKKEFØLGE: kjør denne FØR 11_nullstill_historikk.sql hvis du vil
-- bruke alternativ A. Alternativ A henter kursene fra
-- portfolio_stock_snapshots, og skript 11 sletter den tabellen.
-- Har du allerede kjørt 11, bruk alternativ B.
--
-- Kjør ett av alternativene, ikke begge.
-- ============================================================

-- ---------- FØRST: se hva som står der nå ----------

SELECT ticker,
       name,
       quantity,
       purchase_price                                   AS kostpris_per_aksje,
       COALESCE(cost_basis, purchase_price * quantity)   AS kostpris_totalt,
       purchase_date
FROM portfolio_holdings
WHERE holding_type = 'stock'
ORDER BY ticker;


-- ============================================================
-- ALTERNATIV A — automatisk, fra siste kurssnapshot
-- ============================================================
-- Bruker den nyeste raden per aksje i portfolio_stock_snapshots.
-- value_nok / quantity gir kursen i kroner, som er det klienten
-- sammenligner mot (edge-funksjonen stock-prices returnerer alltid NOK).
--
-- Sjekk først hvilke kurser som ville blitt brukt:

WITH siste AS (
  SELECT DISTINCT ON (ticker)
         ticker,
         date,
         CASE WHEN quantity > 0 THEN value_nok / quantity ELSE price END AS kurs_nok
  FROM portfolio_stock_snapshots
  ORDER BY ticker, date DESC
)
SELECT h.ticker,
       h.name,
       h.purchase_price AS gammel_kostpris,
       round(s.kurs_nok, 2) AS ny_kostpris,
       s.date AS kurs_fra_dato
FROM portfolio_holdings h
LEFT JOIN siste s ON s.ticker = h.ticker
WHERE h.holding_type = 'stock'
ORDER BY h.ticker;

-- Ser tabellen over riktig ut, og har ingen aksje NULL i ny_kostpris,
-- kjør oppdateringen. (Er noen NULL, mangler aksjen snapshot — ta den
-- via alternativ B.)

/*  ← fjern kommentartegnene rundt blokken for å kjøre den

BEGIN;

WITH siste AS (
  SELECT DISTINCT ON (ticker)
         ticker,
         date,
         CASE WHEN quantity > 0 THEN value_nok / quantity ELSE price END AS kurs_nok
  FROM portfolio_stock_snapshots
  ORDER BY ticker, date DESC
)
UPDATE portfolio_holdings h
SET purchase_price = round(s.kurs_nok, 4),
    cost_basis     = round(s.kurs_nok * h.quantity, 2),
    purchase_date  = s.date,
    updated_at     = now()
FROM siste s
WHERE s.ticker = h.ticker
  AND h.holding_type = 'stock';

-- Kontroll: alle posisjoner skal nå ha kostpris ≈ dagens kurs.
SELECT ticker, quantity, purchase_price, cost_basis, purchase_date
FROM portfolio_holdings
WHERE holding_type = 'stock'
ORDER BY ticker;

COMMIT;   -- bytt til ROLLBACK; hvis kontrollen ser feil ut

*/


-- ============================================================
-- ALTERNATIV B — manuelt, med kurser du fyller inn selv
-- ============================================================
-- Bruk denne hvis snapshots er slettet, eller — bedre — hvis du vet hva
-- komiteen faktisk betalte for hver post. Reelle kjøpskurser gir
-- riktigere tall enn en kunstig nullstilling.
--
-- Fyll inn kurs i kroner per aksje. Tickeren må stå akkurat som i
-- portfolio_holdings (kjør SELECT-en øverst for å se dem).

/*  ← fjern kommentartegnene rundt blokken for å kjøre den

BEGIN;

WITH kurser (ticker, kurs_nok) AS (
  VALUES
    ('MOWI',  000.00::numeric),
    ('DNB',   000.00::numeric),
    ('YAR',   000.00::numeric),
    ('SUBC',  000.00::numeric)
    -- ... legg til én linje per aksje
)
UPDATE portfolio_holdings h
SET purchase_price = k.kurs_nok,
    cost_basis     = round(k.kurs_nok * h.quantity, 2),
    purchase_date  = CURRENT_DATE,
    updated_at     = now()
FROM kurser k
WHERE k.ticker = h.ticker
  AND h.holding_type = 'stock';

-- Kontroll: står det noen aksje igjen som ikke ble truffet?
SELECT ticker, purchase_price, cost_basis, purchase_date
FROM portfolio_holdings
WHERE holding_type = 'stock'
ORDER BY purchase_date DESC NULLS FIRST, ticker;

COMMIT;   -- bytt til ROLLBACK; hvis noe ser feil ut

*/


-- ============================================================
-- MERK OM FOND OG BANKINNSKUDD
-- ============================================================
-- Radene med holding_type <> 'stock' (fond, bankinnskudd) har ingen
-- live-kurs, og vises ikke i «Avkastning per aksje». Der er cost_basis
-- selve verdien vi viser fram, så den skal IKKE nullstilles — den skal
-- oppdateres til bokført verdi når du får ny kontoutskrift. Det gjøres
-- enklest i admin-panelet under Portefølje.
--
-- ============================================================
-- ETTERPÅ
-- ============================================================
-- Kostprisene kan også endres uten SQL: admin-panelet → Portefølje →
-- rediger posisjonen → «Kjøpskurs». Bruk SQL når alle skal settes på én
-- gang, admin-panelet når det er én post som skal rettes.
--
-- Rett etter kjøringen står alle stolpene i grafen på 0 %. Det er
-- meningen — de begynner å bevege seg med neste kursoppdatering.
