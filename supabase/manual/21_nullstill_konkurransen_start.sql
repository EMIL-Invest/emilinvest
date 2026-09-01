-- ============================================================
-- 21_nullstill_konkurransen_start.sql — felles start for konkurransen.
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- Konkurransen starter «på ordentlig» nå, og alle skal stille likt:
--   * Alle deltakere settes til NØYAKTIG 100 000 kr i totalverdi.
--   * De som har bygget en portefølje BEHOLDER sammensetningen sin —
--     antall aksjer skaleres opp/ned proporsjonalt (vektene bevares),
--     og resten legges i kontanter (ASK).
--   * Kjøpskursen per posisjon settes til dagens kurs, så både total-
--     avkastningen og hver enkelt posisjon starter på 0 %.
--   * Alle startverdier (måned, år, all-time) settes til 100 000.
--
-- Antall aksjer kan bli desimaltall (f.eks. 42,7183) — det er bevisst:
-- avrunding til hele aksjer ville endret vektene og i verste fall
-- nullet ut små posisjoner, som igjen kunne tatt en gyldig portefølje
-- under femaksjersgrensen. Motoren og handelen håndterer desimaler.
--
-- Kursene hentes fra stock_price_cache (siste kjente kurs), med
-- eksisterende snittkurs som reserve. Verdi og ny kjøpskurs bruker
-- SAMME kurs, så avkastningen blir eksakt 0 uansett hvor fersk kursen er.
--
-- qualified_at røres ikke: den som har gyldig portefølje, er fortsatt
-- kvalifisert. Handelshistorikken beholdes også — den er historie, og
-- vil ikke lenger summere seg til beholdningen. Det er som forventet.
-- ============================================================

BEGIN;

-- Skaleringsfaktor per deltaker: 100 000 / dagens totalverdi
CREATE TEMP TABLE _skalering ON COMMIT DROP AS
WITH verdier AS (
  SELECT f.participant_id,
         SUM(CASE WHEN f.ticker = 'ASK' THEN f.quantity
                  ELSE f.quantity * COALESCE(c.price, f.average_purchase_price) END) AS total
  FROM competition_portfolios f
  LEFT JOIN stock_price_cache c ON c.ticker = f.ticker
  GROUP BY f.participant_id
)
SELECT participant_id, 100000.0 / total AS faktor
FROM verdier
WHERE total > 0;

-- 1) Aksjepostene: skaler antallet, sett kjøpskurs = dagens kurs
UPDATE competition_portfolios f
SET quantity = round(f.quantity * s.faktor, 4),
    average_purchase_price = COALESCE(
      (SELECT c.price FROM stock_price_cache c WHERE c.ticker = f.ticker),
      f.average_purchase_price)
FROM _skalering s
WHERE s.participant_id = f.participant_id
  AND f.ticker <> 'ASK';

-- 2) Kontantene: nøyaktig det som mangler opp til 100 000
UPDATE competition_portfolios ask
SET quantity = 100000 - COALESCE((
      SELECT SUM(f.quantity * f.average_purchase_price)
      FROM competition_portfolios f
      WHERE f.participant_id = ask.participant_id AND f.ticker <> 'ASK'), 0),
    average_purchase_price = 1
FROM _skalering s
WHERE ask.participant_id = s.participant_id
  AND ask.ticker = 'ASK';

-- Deltakere som mot formodning mangler ASK-rad, får en
INSERT INTO competition_portfolios (participant_id, ticker, quantity, average_purchase_price)
SELECT s.participant_id,
       'ASK',
       100000 - COALESCE((SELECT SUM(f.quantity * f.average_purchase_price)
                          FROM competition_portfolios f
                          WHERE f.participant_id = s.participant_id AND f.ticker <> 'ASK'), 0),
       1
FROM _skalering s
WHERE NOT EXISTS (
  SELECT 1 FROM competition_portfolios a
  WHERE a.participant_id = s.participant_id AND a.ticker = 'ASK');

-- 3) Startverdiene: alle måles fra 100 000 fra nå av
UPDATE competition_participants
SET monthly_start_value = 100000,
    yearly_start_value = 100000,
    all_time_start_value = 100000
WHERE is_active;

COMMIT;

-- ============================================================
-- KONTROLL — alle skal stå med totalverdi 100 000,00 og avkastning 0
-- ============================================================
SELECT p.display_name,
       round(SUM(CASE WHEN f.ticker = 'ASK' THEN f.quantity
                      ELSE f.quantity * f.average_purchase_price END)::numeric, 2) AS totalverdi,
       count(f.id) FILTER (WHERE f.ticker <> 'ASK') AS antall_aksjer,
       round(MIN(CASE WHEN f.ticker = 'ASK' THEN f.quantity END)::numeric, 2) AS kontanter
FROM competition_participants p
LEFT JOIN competition_portfolios f ON f.participant_id = p.id
WHERE p.is_active
GROUP BY p.id, p.display_name
ORDER BY p.display_name;
