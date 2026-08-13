-- ============================================================
-- 15_kostpris_i_dag.sql — sett kostpris = dagens kurs
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- I MOTSETNING TIL SKRIPT 14: her er ingenting kommentert ut. Lim inn
-- hele fila, trykk Run, og jobben er gjort.
--
-- Hva den gjør: setter kjøpskurs, kostpris og kjøpsdato på alle ti
-- aksjene til kursen de sto i 13. august 2026 kl. 13:58. Etter dette
-- måler «Avkastning per aksje» fra i dag og framover, og alle
-- posisjonene starter på null.
--
-- HVOR TALLENE KOMMER FRA
-- Markedsverdiene under er lest rett av emilinvest.no/portefolje kl.
-- 13:58 den 13. august 2026, altså de samme live-kursene grafen selv
-- sammenligner mot. Summen av dem er 122 964 kr, som er nøyaktig den
-- markedsverdien siden viste — så ingen post er glemt eller dobbelt.
--
-- Merk at skriptet lagrer MARKEDSVERDIEN, ikke kursen, og lar databasen
-- regne ut kursen selv som verdi / antall. Grunnen er at antall aksjer
-- er brøkdeler (44,429 SUBC), og nettsiden viser dem avrundet til tre
-- desimaler. Ved å dele på det antallet som faktisk står i basen unngår
-- vi at avrundingen forplanter seg. Kontrollen nederst skal vise kurser
-- som stemmer med aksjesidene: SUBC 338,60 · DNB 313,80 · AKERBP 341,09
-- · PROT 495,01 · MOWI 203,20 · SATS 40,85 · ORK 104,00 · NHY 90,20 ·
-- TEL 133,90 · YAR 419,20.
--
-- FRAMOVER: når komiteen kjøper eller selger, legg inn den virkelige
-- kjøpskursen og kjøpsdatoen i admin-panelet → Portefølje → rediger
-- posisjonen. Da måler grafen fra det virkelige kjøpet, og du trenger
-- ikke dette skriptet igjen.
-- ============================================================

-- 1) FØR: hva står der nå?
SELECT ticker,
       quantity,
       purchase_price                                  AS kostpris_per_aksje,
       COALESCE(cost_basis, purchase_price * quantity)  AS kostpris_totalt,
       purchase_date
FROM portfolio_holdings
WHERE holding_type = 'stock'
ORDER BY ticker;


-- 2) OPPDATERINGEN
BEGIN;

WITH verdier (ticker, markedsverdi) AS (
  VALUES
    ('SUBC',   15044::numeric),
    ('DNB',    13232::numeric),
    ('AKERBP', 13111::numeric),
    ('PROT',   13090::numeric),
    ('MOWI',   12811::numeric),
    ('SATS',   12293::numeric),
    ('ORK',    11314::numeric),
    ('NHY',    11041::numeric),
    ('TEL',    10699::numeric),
    ('YAR',    10329::numeric)
)
UPDATE portfolio_holdings h
SET purchase_price = round(v.markedsverdi / h.quantity, 4),
    cost_basis     = v.markedsverdi,
    purchase_date  = CURRENT_DATE,
    updated_at     = now()
FROM verdier v
WHERE v.ticker = h.ticker
  AND h.holding_type = 'stock'
  AND h.quantity > 0;

-- 3) KONTROLL — skal vise 10 rader, alle med kjøpsdato i dag
SELECT ticker,
       quantity,
       purchase_price AS kurs,
       cost_basis     AS kostpris,
       purchase_date
FROM portfolio_holdings
WHERE holding_type = 'stock'
ORDER BY ticker;

-- 4) KONTROLL — er det noen aksje skriptet ikke traff?
-- Skal gi 0 rader. Får du treff her, står tickeren annerledes i basen
-- (for eksempel «SUBC.OL»), og den må rettes for hånd i admin-panelet.
SELECT ticker, name
FROM portfolio_holdings
WHERE holding_type = 'stock'
  AND ticker NOT IN ('SUBC','DNB','AKERBP','PROT','MOWI','SATS','ORK','NHY','TEL','YAR');

-- 5) KONTROLL — samlet kostpris skal være 122 964 kr
SELECT sum(cost_basis) AS samlet_kostpris
FROM portfolio_holdings
WHERE holding_type = 'stock';

COMMIT;
-- Ser noe feil ut i kontrollene over: bytt COMMIT til ROLLBACK og kjør
-- fila på nytt. Ingenting er lagret før COMMIT har gått gjennom.
