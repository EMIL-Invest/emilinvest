-- ============================================================
-- 13_konkurranseregler.sql — diversifiseringskrav i konkurransen
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- Formålet med konkurransen er å gi erfaring med investering, ikke å
-- premiere den som satser alt på én aksje og har flaks. Uten regler er
-- den beste strategien for å vinne å legge hele startkapitalen i det
-- mest volatile selskapet man finner — og den som gjør det, lærer
-- ingenting om porteføljebygging.
--
-- MERK om hvilken regel som faktisk virker: et MINSTEBELØP per posisjon
-- hindrer ikke at noen satser alt på én aksje. Det er MAKSVEKTEN som
-- gjør det. Minstebeløpet hindrer den motsatte omgåelsen, nemlig å kjøpe
-- én aksje for 200 kroner i fire selskaper for å oppfylle et krav om
-- antall posisjoner, og legge resten i det femte. Derfor trengs begge.
--
-- Reglene som innføres:
--   1. Maks 30 % av porteføljeverdien i én enkelt aksje ved kjøp
--   2. Minst 4 000 kr per posisjon (4 % av startkapitalen)
--   3. Uendret: maks 10 ulike aksjer, maks 3 handler per aksje per dag
--
-- Reglene sjekkes ved KJØP, ikke løpende. Stiger en aksje forbi 30 %
-- etter at du kjøpte, er det helt greit — da har du bare gjort et godt
-- valg. Du får bare ikke kjøpe mer av den.
--
-- Kravet om minst 5 ulike aksjer for å bli rangert på ledertavlen ligger
-- i grensesnittet, ikke her, fordi ledertavlen regnes ut i klienten.
-- ============================================================

CREATE OR REPLACE FUNCTION public.competition_buy_stock(
  _participant_id uuid,
  _ticker text,
  _quantity numeric,
  _price numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cash_holding RECORD;
  _existing_holding RECORD;
  _total_cost numeric;
  _new_cash numeric;
  _new_quantity numeric;
  _new_avg_price numeric;
  _stock_count integer;
  _user_id uuid;
  _daily_count integer;
  -- Diversifisering
  _portefoljeverdi numeric;
  _verdi_etter_kjop numeric;
  _maksvekt numeric := 0.30;      -- 30 % av porteføljen i én aksje
  _minstebelop numeric := 4000;   -- 4 000 kr per posisjon
BEGIN
  -- Verifiser at deltakeren tilhører den innloggede brukeren
  SELECT cp.user_id INTO _user_id
  FROM competition_participants cp
  WHERE cp.id = _participant_id;

  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  _total_cost := _quantity * _price;

  -- Lås og sjekk kontantbeholdningen
  SELECT * INTO _cash_holding
  FROM competition_portfolios
  WHERE participant_id = _participant_id AND ticker = 'ASK'
  FOR UPDATE;

  IF _cash_holding IS NULL OR _cash_holding.quantity < _total_cost THEN
    RETURN json_build_object('success', false, 'error', 'Ikke nok penger på ASK-kontoen');
  END IF;

  -- Maks 3 handler per aksje per dag
  SELECT COUNT(*) INTO _daily_count
  FROM competition_transactions
  WHERE participant_id = _participant_id
    AND ticker = _ticker
    AND executed_at >= date_trunc('day', now())
    AND executed_at < date_trunc('day', now()) + interval '1 day';

  IF _daily_count >= 3 THEN
    RETURN json_build_object('success', false, 'error',
      'Maks 3 transaksjoner per aksje per dag nådd for ' || _ticker);
  END IF;

  SELECT * INTO _existing_holding
  FROM competition_portfolios
  WHERE participant_id = _participant_id AND ticker = _ticker
  FOR UPDATE;

  -- Maks 10 ulike aksjer
  IF _existing_holding IS NULL THEN
    SELECT COUNT(*) INTO _stock_count
    FROM competition_portfolios
    WHERE participant_id = _participant_id AND ticker != 'ASK';

    IF _stock_count >= 10 THEN
      RETURN json_build_object('success', false, 'error', 'Maksimalt 10 aksjer i porteføljen');
    END IF;
  END IF;

  -- ---------- DIVERSIFISERING ----------

  -- 1) Minstebeløp. Gjelder ny posisjon, slik at man ikke kan kjøpe for
  --    200 kroner i mange selskaper bare for å telle posisjoner.
  IF _existing_holding IS NULL AND _total_cost < _minstebelop THEN
    RETURN json_build_object('success', false, 'error',
      -- Skriv tallet med mellomrom som tusenskille. to_char følger
      -- databasens locale og ga «4,000» på engelsk oppsett.
      'Minste førstegangskjøp i en aksje er ' ||
      replace(to_char(_minstebelop, 'FM999G999'), ',', ' ') ||
      ' kr. Da blir posisjonen stor nok å lære noe av.');
  END IF;

  -- 2) Maksvekt. Porteføljeverdien er kontanter pluss aksjer verdsatt til
  --    gjennomsnittlig kjøpspris. Vi bruker kjøpspris framfor dagskurs
  --    fordi funksjonen ikke har tilgang til live kurser, og fordi det
  --    gjør regelen forutsigbar: den flytter seg ikke mens du handler.
  SELECT COALESCE(SUM(
           CASE WHEN ticker = 'ASK' THEN quantity
                ELSE quantity * average_purchase_price END), 0)
    INTO _portefoljeverdi
  FROM competition_portfolios
  WHERE participant_id = _participant_id;

  _verdi_etter_kjop := COALESCE(
    (SELECT quantity * average_purchase_price
     FROM competition_portfolios
     WHERE participant_id = _participant_id AND ticker = _ticker), 0) + _total_cost;

  IF _portefoljeverdi > 0 AND _verdi_etter_kjop > _portefoljeverdi * _maksvekt THEN
    RETURN json_build_object('success', false, 'error',
      'Én aksje kan maks utgjøre ' || round(_maksvekt * 100) ||
      ' % av porteføljen. ' || _ticker || ' ville blitt ' ||
      round(100 * _verdi_etter_kjop / _portefoljeverdi) ||
      ' %. Spre kjøpet på flere selskaper.');
  END IF;

  -- ---------- GJENNOMFØR KJØPET ----------

  _new_cash := _cash_holding.quantity - _total_cost;
  UPDATE competition_portfolios
  SET quantity = _new_cash
  WHERE participant_id = _participant_id AND ticker = 'ASK';

  IF _existing_holding IS NOT NULL THEN
    _new_quantity := _existing_holding.quantity + _quantity;
    _new_avg_price := ((_existing_holding.average_purchase_price * _existing_holding.quantity)
                       + (_price * _quantity)) / _new_quantity;

    UPDATE competition_portfolios
    SET quantity = _new_quantity, average_purchase_price = _new_avg_price
    WHERE id = _existing_holding.id;
  ELSE
    INSERT INTO competition_portfolios (participant_id, ticker, quantity, average_purchase_price)
    VALUES (_participant_id, _ticker, _quantity, _price);
  END IF;

  INSERT INTO competition_transactions
    (participant_id, ticker, transaction_type, quantity, price_per_share, total_amount)
  VALUES (_participant_id, _ticker, 'buy', _quantity, _price, _total_cost);

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- KONTROLL
-- ============================================================

-- Hvem ville ikke vært kvalifisert i dag? (færre enn 5 ulike aksjer)
SELECT p.display_name,
       count(f.id) FILTER (WHERE f.ticker <> 'ASK') AS antall_aksjer
FROM competition_participants p
LEFT JOIN competition_portfolios f ON f.participant_id = p.id
WHERE p.is_active
GROUP BY p.id, p.display_name
HAVING count(f.id) FILTER (WHERE f.ticker <> 'ASK') < 5
ORDER BY antall_aksjer, p.display_name;

-- Største enkeltposisjon per deltaker, målt mot kjøpsverdi.
-- Posisjoner over 30 % er lovlige hvis de har vokst dit av seg selv,
-- men de kan ikke økes videre.
WITH verdier AS (
  SELECT participant_id,
         ticker,
         CASE WHEN ticker = 'ASK' THEN quantity
              ELSE quantity * average_purchase_price END AS verdi
  FROM competition_portfolios
),
totaler AS (
  SELECT participant_id, SUM(verdi) AS total FROM verdier GROUP BY participant_id
)
SELECT p.display_name,
       v.ticker,
       round(100 * v.verdi / NULLIF(t.total, 0), 1) AS vekt_prosent
FROM verdier v
JOIN totaler t ON t.participant_id = v.participant_id
JOIN competition_participants p ON p.id = v.participant_id
WHERE v.ticker <> 'ASK'
  AND v.verdi > t.total * 0.30
ORDER BY vekt_prosent DESC;
