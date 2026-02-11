
-- Atomic buy stock function with row-level locking
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
BEGIN
  -- Verify the participant belongs to the calling user
  SELECT cp.user_id INTO _user_id
  FROM competition_participants cp
  WHERE cp.id = _participant_id;
  
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  _total_cost := _quantity * _price;

  -- Lock and check cash balance
  SELECT * INTO _cash_holding
  FROM competition_portfolios
  WHERE participant_id = _participant_id AND ticker = 'ASK'
  FOR UPDATE;

  IF _cash_holding IS NULL OR _cash_holding.quantity < _total_cost THEN
    RETURN json_build_object('success', false, 'error', 'Ikke nok penger på ASK-kontoen');
  END IF;

  -- Check daily transaction limit (3 per stock per day)
  SELECT COUNT(*) INTO _daily_count
  FROM competition_transactions
  WHERE participant_id = _participant_id
    AND ticker = _ticker
    AND executed_at >= date_trunc('day', now())
    AND executed_at < date_trunc('day', now()) + interval '1 day';

  IF _daily_count >= 3 THEN
    RETURN json_build_object('success', false, 'error', 'Maks 3 transaksjoner per aksje per dag nådd for ' || _ticker);
  END IF;

  -- Check existing holding
  SELECT * INTO _existing_holding
  FROM competition_portfolios
  WHERE participant_id = _participant_id AND ticker = _ticker
  FOR UPDATE;

  -- Check max 10 stocks
  IF _existing_holding IS NULL THEN
    SELECT COUNT(*) INTO _stock_count
    FROM competition_portfolios
    WHERE participant_id = _participant_id AND ticker != 'ASK';
    
    IF _stock_count >= 10 THEN
      RETURN json_build_object('success', false, 'error', 'Maksimalt 10 aksjer i porteføljen');
    END IF;
  END IF;

  -- Deduct cash
  _new_cash := _cash_holding.quantity - _total_cost;
  UPDATE competition_portfolios
  SET quantity = _new_cash
  WHERE participant_id = _participant_id AND ticker = 'ASK';

  -- Update or insert holding
  IF _existing_holding IS NOT NULL THEN
    _new_quantity := _existing_holding.quantity + _quantity;
    _new_avg_price := ((_existing_holding.average_purchase_price * _existing_holding.quantity) + (_price * _quantity)) / _new_quantity;
    
    UPDATE competition_portfolios
    SET quantity = _new_quantity, average_purchase_price = _new_avg_price
    WHERE id = _existing_holding.id;
  ELSE
    INSERT INTO competition_portfolios (participant_id, ticker, quantity, average_purchase_price)
    VALUES (_participant_id, _ticker, _quantity, _price);
  END IF;

  -- Record transaction
  INSERT INTO competition_transactions (participant_id, ticker, transaction_type, quantity, price_per_share, total_amount)
  VALUES (_participant_id, _ticker, 'buy', _quantity, _price, _total_cost);

  RETURN json_build_object('success', true);
END;
$$;

-- Atomic sell stock function with row-level locking
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
  _total_value numeric;
  _new_quantity numeric;
  _user_id uuid;
  _daily_count integer;
BEGIN
  -- Verify the participant belongs to the calling user
  SELECT cp.user_id INTO _user_id
  FROM competition_participants cp
  WHERE cp.id = _participant_id;
  
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  _total_value := _quantity * _price;

  -- Check daily transaction limit
  SELECT COUNT(*) INTO _daily_count
  FROM competition_transactions
  WHERE participant_id = _participant_id
    AND ticker = _ticker
    AND executed_at >= date_trunc('day', now())
    AND executed_at < date_trunc('day', now()) + interval '1 day';

  IF _daily_count >= 3 THEN
    RETURN json_build_object('success', false, 'error', 'Maks 3 transaksjoner per aksje per dag nådd for ' || _ticker);
  END IF;

  -- Lock and check stock holding
  SELECT * INTO _existing_holding
  FROM competition_portfolios
  WHERE participant_id = _participant_id AND ticker = _ticker
  FOR UPDATE;

  IF _existing_holding IS NULL OR _existing_holding.quantity < _quantity THEN
    RETURN json_build_object('success', false, 'error', 'Ikke nok aksjer å selge');
  END IF;

  -- Update or delete stock holding
  _new_quantity := _existing_holding.quantity - _quantity;
  IF _new_quantity > 0 THEN
    UPDATE competition_portfolios
    SET quantity = _new_quantity
    WHERE id = _existing_holding.id;
  ELSE
    DELETE FROM competition_portfolios
    WHERE id = _existing_holding.id;
  END IF;

  -- Lock and update cash
  SELECT * INTO _cash_holding
  FROM competition_portfolios
  WHERE participant_id = _participant_id AND ticker = 'ASK'
  FOR UPDATE;

  UPDATE competition_portfolios
  SET quantity = _cash_holding.quantity + _total_value
  WHERE participant_id = _participant_id AND ticker = 'ASK';

  -- Record transaction
  INSERT INTO competition_transactions (participant_id, ticker, transaction_type, quantity, price_per_share, total_amount)
  VALUES (_participant_id, _ticker, 'sell', _quantity, _price, _total_value);

  RETURN json_build_object('success', true);
END;
$$;
