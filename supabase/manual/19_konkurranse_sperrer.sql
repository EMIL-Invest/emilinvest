-- ============================================================
-- 19_konkurranse_sperrer.sql — gyldig portefølje skal FORBLI gyldig,
-- og avkastningen skal måles fra porteføljen først ble gyldig.
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- Problemet dette løser: rangeringskravet (minst 5 ulike aksjer) ble
-- bare sjekket i visningsøyeblikket. Dermed kunne man ligge konsentrert
-- hele måneden (30 % i én volatil aksje + kontanter), og først siste
-- dagen kjøpe seg opp i fem aksjer — og stille med avkastning opptjent
-- UTENFOR reglene. To grep tetter hullet:
--
--   1. KVALIFISERINGSTIDSPUNKT: første gang en deltaker når 5 ulike
--      aksjer, settes qualified_at, og ALLE startverdiene (måned, år,
--      all-time) nullstilles til porteføljens verdi i det øyeblikket.
--      Avkastning opptjent før porteføljen var gyldig teller altså ikke.
--   2. SALGSSPERRE: en kvalifisert deltaker får ikke solgt seg under
--      5 ulike aksjer. Vil man ut av en aksje, kjøper man en ny først.
--
-- I tillegg RETTES EN REGRESJON: 13_konkurranseregler.sql skrev om
-- competition_buy_stock uten å ta med input- og prisvalideringen fra
-- 02_full_oppsett.sql (±5 % mot serverens priscache, maks 15 min gammel).
-- Den er tilbake her. Kjør derfor denne filen i sin helhet.
--
-- Tallene speiler src/lib/konkurranseregler.ts — endres de ett sted,
-- må de endres begge steder.
-- ============================================================

-- 1) Kvalifiseringstidspunkt på deltakeren
ALTER TABLE public.competition_participants
  ADD COLUMN IF NOT EXISTS qualified_at timestamptz;

-- Deltakere som ALLEREDE har gyldig portefølje beholdes som de er:
-- de får qualified_at = joined_at og ingen nullstilling, slik at ingen
-- mister opptjent avkastning når regelen innføres.
UPDATE public.competition_participants p
SET qualified_at = p.joined_at
WHERE p.qualified_at IS NULL
  AND (SELECT count(*) FROM public.competition_portfolios f
       WHERE f.participant_id = p.id AND f.ticker <> 'ASK') >= 5;

-- ============================================================
-- 2) KJØP — full validering + kvalifisering ved 5. aksje
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
  _cached RECORD;
  _total_cost numeric;
  _new_cash numeric;
  _new_quantity numeric;
  _new_avg_price numeric;
  _stock_count integer;
  _user_id uuid;
  _daily_count integer;
  _qualified_at timestamptz;
  _markedsverdi numeric;
  _nylig_kvalifisert boolean := false;
  _portefoljeverdi numeric;
  _verdi_etter_kjop numeric;
  _maksvekt numeric := 0.30;      -- 30 % av porteføljen i én aksje
  _minstebelop numeric := 4000;   -- minste førstegangskjøp
  _krav_antall integer := 5;      -- ulike aksjer for gyldig portefølje
BEGIN
  -- Deltakeren må tilhøre den innloggede brukeren
  SELECT cp.user_id, cp.qualified_at INTO _user_id, _qualified_at
  FROM competition_participants cp
  WHERE cp.id = _participant_id;

  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Servervalidering av input (gjeninnført fra 02_full_oppsett.sql)
  IF _quantity IS NULL OR _quantity <= 0 OR _quantity > 1000000 THEN
    RETURN json_build_object('success', false, 'error', 'Ugyldig antall');
  END IF;
  IF _price IS NULL OR _price <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Ugyldig pris');
  END IF;
  IF _ticker IS NULL OR _ticker = 'ASK' THEN
    RETURN json_build_object('success', false, 'error', 'Ugyldig ticker');
  END IF;

  -- Prisen må stemme med serverens priscache (±5 %, maks 15 min gammel)
  SELECT price, updated_at INTO _cached
  FROM stock_price_cache
  WHERE ticker = _ticker;

  IF _cached IS NULL OR _cached.updated_at < now() - interval '15 minutes' THEN
    RETURN json_build_object('success', false, 'error',
      'Ingen fersk kurs tilgjengelig — oppdater kursene og prøv igjen');
  END IF;
  IF abs(_price - _cached.price) / _cached.price > 0.05 THEN
    RETURN json_build_object('success', false, 'error',
      'Prisen har endret seg — oppdater kursene og prøv igjen');
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

  -- Minste førstegangskjøp
  IF _existing_holding IS NULL AND _total_cost < _minstebelop THEN
    RETURN json_build_object('success', false, 'error',
      'Minste førstegangskjøp i en aksje er ' ||
      replace(to_char(_minstebelop, 'FM999G999'), ',', ' ') ||
      ' kr. Da blir posisjonen stor nok å lære noe av.');
  END IF;

  -- Maksvekt, målt mot kjøpsverdier (forutsigbart mens man handler)
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

  -- ---------- KVALIFISERING ----------
  -- Første gang porteføljen når kravet: sett qualified_at og nullstill
  -- startverdiene til porteføljens MARKEDSVERDI nå. Det gjør at avkastning
  -- opptjent før porteføljen var gyldig, ikke teller i rangeringen —
  -- ellers kunne man ligget konsentrert hele måneden og «blitt gyldig»
  -- siste dagen. Markedsverdien bruker priscachen der den finnes
  -- (aksjen som nettopp ble handlet, har fersk kurs), med kjøpspris som
  -- reserve for aksjer ingen har hentet kurs på i det siste.
  IF _qualified_at IS NULL THEN
    SELECT COUNT(*) INTO _stock_count
    FROM competition_portfolios
    WHERE participant_id = _participant_id AND ticker != 'ASK';

    IF _stock_count >= _krav_antall THEN
      SELECT COALESCE(SUM(
               CASE WHEN f.ticker = 'ASK' THEN f.quantity
                    ELSE f.quantity * COALESCE(c.price, f.average_purchase_price) END), 0)
        INTO _markedsverdi
      FROM competition_portfolios f
      LEFT JOIN stock_price_cache c ON c.ticker = f.ticker
      WHERE f.participant_id = _participant_id;

      UPDATE competition_participants
      SET qualified_at = now(),
          monthly_start_value = _markedsverdi,
          yearly_start_value = _markedsverdi,
          all_time_start_value = _markedsverdi
      WHERE id = _participant_id;

      _nylig_kvalifisert := true;
    END IF;
  END IF;

  RETURN json_build_object('success', true, 'nylig_kvalifisert', _nylig_kvalifisert);
END;
$$;

-- ============================================================
-- 3) SALG — kvalifisert portefølje får ikke gå under 5 aksjer
-- ============================================================
CREATE OR REPLACE FUNCTION public.competition_sell_stock(
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
  _cached RECORD;
  _total_value numeric;
  _new_quantity numeric;
  _user_id uuid;
  _daily_count integer;
  _qualified_at timestamptz;
  _andre_aksjer integer;
  _krav_antall integer := 5;
BEGIN
  SELECT cp.user_id, cp.qualified_at INTO _user_id, _qualified_at
  FROM competition_participants cp
  WHERE cp.id = _participant_id;

  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF _quantity IS NULL OR _quantity <= 0 OR _quantity > 1000000 THEN
    RETURN json_build_object('success', false, 'error', 'Ugyldig antall');
  END IF;
  IF _price IS NULL OR _price <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Ugyldig pris');
  END IF;
  IF _ticker IS NULL OR _ticker = 'ASK' THEN
    RETURN json_build_object('success', false, 'error', 'Ugyldig ticker');
  END IF;

  SELECT price, updated_at INTO _cached
  FROM stock_price_cache
  WHERE ticker = _ticker;

  IF _cached IS NULL OR _cached.updated_at < now() - interval '15 minutes' THEN
    RETURN json_build_object('success', false, 'error',
      'Ingen fersk kurs tilgjengelig — oppdater kursene og prøv igjen');
  END IF;
  IF abs(_price - _cached.price) / _cached.price > 0.05 THEN
    RETURN json_build_object('success', false, 'error',
      'Prisen har endret seg — oppdater kursene og prøv igjen');
  END IF;

  _total_value := _quantity * _price;

  SELECT * INTO _existing_holding
  FROM competition_portfolios
  WHERE participant_id = _participant_id AND ticker = _ticker
  FOR UPDATE;

  IF _existing_holding IS NULL OR _existing_holding.quantity < _quantity THEN
    RETURN json_build_object('success', false, 'error', 'Ikke nok aksjer å selge');
  END IF;

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

  _new_quantity := _existing_holding.quantity - _quantity;

  -- SPERREN: har porteføljen først vært gyldig, skal den forbli gyldig.
  -- Å selge HELE posisjonen er bare lov hvis minst 5 andre aksjer består.
  IF _new_quantity = 0 AND _qualified_at IS NOT NULL THEN
    SELECT COUNT(*) INTO _andre_aksjer
    FROM competition_portfolios
    WHERE participant_id = _participant_id
      AND ticker != 'ASK' AND ticker != _ticker;

    IF _andre_aksjer < _krav_antall THEN
      RETURN json_build_object('success', false, 'error',
        'En gyldig portefølje må hele tiden ha minst ' || _krav_antall ||
        ' ulike aksjer. Kjøp en annen aksje først — så kan du selge hele posisjonen i ' ||
        _ticker || '. Du kan fortsatt selge deler av den.');
    END IF;
  END IF;

  IF _new_quantity > 0 THEN
    UPDATE competition_portfolios
    SET quantity = _new_quantity
    WHERE id = _existing_holding.id;
  ELSE
    DELETE FROM competition_portfolios
    WHERE id = _existing_holding.id;
  END IF;

  SELECT * INTO _cash_holding
  FROM competition_portfolios
  WHERE participant_id = _participant_id AND ticker = 'ASK'
  FOR UPDATE;

  IF _cash_holding IS NULL THEN
    INSERT INTO competition_portfolios (participant_id, ticker, quantity, average_purchase_price)
    VALUES (_participant_id, 'ASK', _total_value, 1);
  ELSE
    UPDATE competition_portfolios
    SET quantity = _cash_holding.quantity + _total_value
    WHERE id = _cash_holding.id;
  END IF;

  INSERT INTO competition_transactions
    (participant_id, ticker, transaction_type, quantity, price_per_share, total_amount)
  VALUES (_participant_id, _ticker, 'sell', _quantity, _price, _total_value);

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- KONTROLL
-- ============================================================

-- Kvalifiseringsstatus per deltaker
SELECT p.display_name,
       count(f.id) FILTER (WHERE f.ticker <> 'ASK') AS antall_aksjer,
       p.qualified_at,
       round(p.monthly_start_value::numeric) AS mnd_start,
       round(p.all_time_start_value::numeric) AS totalt_start
FROM competition_participants p
LEFT JOIN competition_portfolios f ON f.participant_id = p.id
WHERE p.is_active
GROUP BY p.id
ORDER BY p.qualified_at NULLS LAST, p.display_name;
