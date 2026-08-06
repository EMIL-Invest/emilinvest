-- ============================================================================
-- EmilInvest: KOMPLETT engangsoppsett + sikkerhetsfikser i nytt Supabase-
-- prosjekt (nehqvobfwooyufxqbzpv). Kjøres i SQL Editor i dashbordet.
-- Erstatter den tidligere (avkuttede) 01_storage_og_cron.sql.
--
-- Filen er idempotent — den kan trygt kjøres flere ganger.
--
-- Innhold:
--   1) Utvidelser (pg_cron, pg_net)
--   2) Priscache-tabell (grunnlag for anti-juks-validering)
--   3) Hardnede kjøp/salg-funksjoner (servervalidering av pris/antall/ticker)
--   4) Atomisk påmeldingsfunksjon
--   5) Innstramming av RLS (fjerner direkte skrivetilgang til konkurransen)
--   6) Vern av deltakernes startverdier (trigger)
--   7) Storage-bucket for rapporter (åpen lesing, kun admin skriver)
--   8) Rapport-policyer + retting av gamle fil-URL-er
--   9) Daglig cron-jobb for porteføljesnapshot
--  10) Kontrollspørringer
-- ============================================================================


-- ============================================================
-- 1) Utvidelser for planlagte jobber
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


-- ============================================================
-- 2) Priscache. stock-prices-edge-funksjonen oppdaterer denne
--    hver gang kurser hentes; kjøp/salg validerer mot den.
-- ============================================================
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
-- Ingen INSERT/UPDATE-policyer: kun service role (edge-funksjonen) kan skrive.


-- ============================================================
-- 3) Hardnede kjøp/salg-funksjoner.
--    Nytt vs. gammel versjon:
--      * avviser negative/null antall og priser (stoppet "uendelig penger"-hullet)
--      * ticker må finnes i oslo_stocks og være aktiv (og ikke 'ASK')
--      * klientens pris må matche fersk serverkurs (±5 %, maks 15 min gammel)
--      * salg: dagsgrense telles ETTER radlås (tetter race), og manglende
--        ASK-rad håndteres i stedet for å bli NULL
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
BEGIN
  -- Verify the participant belongs to the calling user
  SELECT cp.user_id INTO _user_id
  FROM competition_participants cp
  WHERE cp.id = _participant_id;

  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Servervalidering av input (klienten kan ikke stoles på)
  IF _quantity IS NULL OR _quantity <= 0 OR _quantity > 1000000 THEN
    RETURN json_build_object('success', false, 'error', 'Ugyldig antall');
  END IF;
  IF _price IS NULL OR _price <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Ugyldig pris');
  END IF;
  IF _ticker IS NULL OR _ticker = 'ASK' THEN
    RETURN json_build_object('success', false, 'error', 'Ugyldig ticker');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM oslo_stocks WHERE ticker = _ticker AND is_active) THEN
    RETURN json_build_object('success', false, 'error', 'Ukjent eller inaktiv aksje: ' || _ticker);
  END IF;

  -- Valider prisen mot serverens priscache (±5 %, maks 15 minutter gammel)
  SELECT price, updated_at INTO _cached
  FROM stock_price_cache
  WHERE ticker = _ticker;

  IF _cached IS NULL OR _cached.updated_at < now() - interval '15 minutes' THEN
    RETURN json_build_object('success', false, 'error', 'Ingen fersk kurs tilgjengelig — oppdater kursene og prøv igjen');
  END IF;
  IF abs(_price - _cached.price) / _cached.price > 0.05 THEN
    RETURN json_build_object('success', false, 'error', 'Prisen har endret seg — oppdater kursene og prøv igjen');
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
BEGIN
  -- Verify the participant belongs to the calling user
  SELECT cp.user_id INTO _user_id
  FROM competition_participants cp
  WHERE cp.id = _participant_id;

  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Servervalidering av input
  IF _quantity IS NULL OR _quantity <= 0 OR _quantity > 1000000 THEN
    RETURN json_build_object('success', false, 'error', 'Ugyldig antall');
  END IF;
  IF _price IS NULL OR _price <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Ugyldig pris');
  END IF;
  IF _ticker IS NULL OR _ticker = 'ASK' THEN
    RETURN json_build_object('success', false, 'error', 'Ugyldig ticker');
  END IF;

  -- Valider prisen mot serverens priscache (±5 %, maks 15 minutter gammel)
  SELECT price, updated_at INTO _cached
  FROM stock_price_cache
  WHERE ticker = _ticker;

  IF _cached IS NULL OR _cached.updated_at < now() - interval '15 minutes' THEN
    RETURN json_build_object('success', false, 'error', 'Ingen fersk kurs tilgjengelig — oppdater kursene og prøv igjen');
  END IF;
  IF abs(_price - _cached.price) / _cached.price > 0.05 THEN
    RETURN json_build_object('success', false, 'error', 'Prisen har endret seg — oppdater kursene og prøv igjen');
  END IF;

  _total_value := _quantity * _price;

  -- Lock and check stock holding FIRST (so the daily-limit count below
  -- happens under lock and can't be raced past by parallel calls)
  SELECT * INTO _existing_holding
  FROM competition_portfolios
  WHERE participant_id = _participant_id AND ticker = _ticker
  FOR UPDATE;

  IF _existing_holding IS NULL OR _existing_holding.quantity < _quantity THEN
    RETURN json_build_object('success', false, 'error', 'Ikke nok aksjer å selge');
  END IF;

  -- Check daily transaction limit (after lock)
  SELECT COUNT(*) INTO _daily_count
  FROM competition_transactions
  WHERE participant_id = _participant_id
    AND ticker = _ticker
    AND executed_at >= date_trunc('day', now())
    AND executed_at < date_trunc('day', now()) + interval '1 day';

  IF _daily_count >= 3 THEN
    RETURN json_build_object('success', false, 'error', 'Maks 3 transaksjoner per aksje per dag nådd for ' || _ticker);
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

  -- Lock and update cash (guard against a missing ASK row)
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
    WHERE participant_id = _participant_id AND ticker = 'ASK';
  END IF;

  -- Record transaction
  INSERT INTO competition_transactions (participant_id, ticker, transaction_type, quantity, price_per_share, total_amount)
  VALUES (_participant_id, _ticker, 'sell', _quantity, _price, _total_value);

  RETURN json_build_object('success', true);
END;
$$;


-- ============================================================
-- 4) Atomisk påmelding: deltaker + startkapital i én transaksjon.
--    Erstatter klientens to separate inserts, som kunne etterlate
--    deltakere uten ASK-konto hvis andre insert feilet.
-- ============================================================
CREATE OR REPLACE FUNCTION public.competition_join(_display_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _participant_id uuid;
  _name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Du må være innlogget for å delta');
  END IF;

  _name := trim(_display_name);
  IF _name IS NULL OR length(_name) < 2 OR length(_name) > 30 THEN
    RETURN json_build_object('success', false, 'error', 'Visningsnavnet må være 2–30 tegn');
  END IF;

  BEGIN
    INSERT INTO competition_participants (user_id, display_name)
    VALUES (auth.uid(), _name)
    RETURNING id INTO _participant_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'Du er allerede påmeldt konkurransen');
  END;

  INSERT INTO competition_portfolios (participant_id, ticker, quantity, average_purchase_price)
  VALUES (_participant_id, 'ASK', 100000, 1);

  RETURN json_build_object('success', true, 'participant_id', _participant_id);
END;
$$;


-- ============================================================
-- 5) Fjern direkte skrivetilgang til konkurransetabellene.
--    All mutasjon skal gå via SECURITY DEFINER-funksjonene over —
--    med disse policyene på plass kunne enhver deltaker gi seg selv
--    penger/aksjer med en rå UPDATE fra nettleserkonsollen.
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own portfolio holdings" ON public.competition_portfolios;
DROP POLICY IF EXISTS "Users can update own portfolio holdings" ON public.competition_portfolios;
DROP POLICY IF EXISTS "Users can delete own portfolio holdings" ON public.competition_portfolios;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.competition_transactions;
DROP POLICY IF EXISTS "Users can join competition" ON public.competition_participants;


-- ============================================================
-- 6) Deltakere kan fortsatt oppdatere raden sin (f.eks. visningsnavn),
--    men startverdiene — som avkastningen regnes mot — låses av en trigger.
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_participant_start_values()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.joined_at IS DISTINCT FROM OLD.joined_at
       OR NEW.all_time_start_value IS DISTINCT FROM OLD.all_time_start_value
       OR NEW.all_time_start_date IS DISTINCT FROM OLD.all_time_start_date
       OR NEW.monthly_start_value IS DISTINCT FROM OLD.monthly_start_value
       OR NEW.monthly_start_date IS DISTINCT FROM OLD.monthly_start_date
       OR NEW.yearly_start_value IS DISTINCT FROM OLD.yearly_start_value
       OR NEW.yearly_start_date IS DISTINCT FROM OLD.yearly_start_date THEN
      RAISE EXCEPTION 'Startverdier kan kun endres av administrator';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_participant_start_values ON public.competition_participants;
CREATE TRIGGER protect_participant_start_values
BEFORE UPDATE ON public.competition_participants
FOR EACH ROW
EXECUTE FUNCTION public.protect_participant_start_values();


-- ============================================================
-- 7) Storage-bucket for kvartalsrapporter.
--    Beslutning: rapportene er ÅPNE for alle besøkende (public bucket),
--    men kun admin kan laste opp, endre og slette.
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Anyone can view report files" ON storage.objects;
CREATE POLICY "Anyone can view report files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'reports');

DROP POLICY IF EXISTS "Authenticated users can upload report files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload report files" ON storage.objects;
CREATE POLICY "Admins can upload report files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'reports' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update report files" ON storage.objects;
CREATE POLICY "Admins can update report files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'reports' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own report files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete report files" ON storage.objects;
CREATE POLICY "Admins can delete report files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'reports' AND public.is_admin(auth.uid()));


-- ============================================================
-- 8) Rapport-metadata: kun admin skriver; alle leser.
--    Retter også fil-URL-er som fortsatt peker på det gamle
--    Lovable-prosjektet.
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert reports" ON public.quarterly_reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON public.quarterly_reports;
DROP POLICY IF EXISTS "Admins can manage reports" ON public.quarterly_reports;
CREATE POLICY "Admins can manage reports"
ON public.quarterly_reports
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

UPDATE public.quarterly_reports
SET file_url = replace(file_url, 'rdiansdvvwkpujidyzoe', 'nehqvobfwooyufxqbzpv')
WHERE file_url LIKE '%rdiansdvvwkpujidyzoe%';


-- ============================================================
-- 9) Daglig snapshot-jobb: hverdager kl. 08:00 UTC (09:00/10:00 norsk tid).
--    Autentiserer med x-cron-secret som daily-snapshot-funksjonen validerer.
--    Verdien under må være identisk med CRON_SECRET satt via
--    `supabase secrets set`. Bytt begge steder hvis den skal roteres
--    (f.eks. hvis repoet noen gang gjøres offentlig).
-- ============================================================
SELECT cron.unschedule('daily-portfolio-snapshot')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-portfolio-snapshot');

SELECT cron.schedule(
  'daily-portfolio-snapshot',
  '0 8 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://nehqvobfwooyufxqbzpv.supabase.co/functions/v1/daily-snapshot',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '{{CRON_SECRET}}'
    ),
    body := '{}'::jsonb
  );
  $$
);


-- ============================================================
-- 10) Kontroll: begge spørringene skal returnere rader.
-- ============================================================
SELECT 'cron-jobb' AS sjekk, jobname, schedule, active::text
FROM cron.job WHERE jobname = 'daily-portfolio-snapshot'
UNION ALL
SELECT 'reports-bucket', id, name, public::text
FROM storage.buckets WHERE id = 'reports';
