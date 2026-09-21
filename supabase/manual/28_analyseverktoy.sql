-- ============================================================
-- 28_analyseverktoy.sql - tabeller til analyseverktøyet i admin
-- (verdsettelse og porteføljeanalyse). Kjøres i Supabase SQL Editor.
--
-- Fire tabeller:
--   market_history_cache  - kurshistorikk fra Yahoo, cachet 20 t (bare backend)
--   valuations            - lagrede verdsettelser, én rad per analyse
--   portfolio_analyses    - lagrede porteføljeanalyser (øyeblikksbilder)
--   analysis_settings     - felles forutsetninger (risikofri rente, MRP, skatt ...)
--
-- Alt er admin-only via is_admin(auth.uid()) fra skript 02. Ingen
-- eksisterende tabeller berøres. Skriptet er idempotent.
--
-- Husk også: deploy edge-funksjonen price-history
--   supabase functions deploy price-history --no-verify-jwt
-- ============================================================

-- DEL 1: Cache for kurshistorikk. Skrives kun av edge-funksjonen (service role).
CREATE TABLE IF NOT EXISTS public.market_history_cache (
  key        text PRIMARY KEY,           -- "AKRBP.OL|1wk|3y"
  data       jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.market_history_cache ENABLE ROW LEVEL SECURITY;
-- Ingen policyer = ingen tilgang for anon/authenticated. Service role går utenom RLS.

-- DEL 2: Verdsettelser.
CREATE TABLE IF NOT EXISTS public.valuations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker        text NOT NULL,
  selskapsnavn  text NOT NULL,
  valuta        text NOT NULL DEFAULT 'NOK',
  status        text NOT NULL DEFAULT 'utkast' CHECK (status IN ('utkast', 'ferdig')),
  -- Alle forutsetninger analytikeren har lagt inn (DCF, WACC, DDM, peers, vekter ...)
  inputs        jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Utregnede resultater ved lagring, så presentasjonen kan vises uten å regne på nytt
  resultater    jsonb NOT NULL DEFAULT '{}'::jsonb,
  anbefaling    text CHECK (anbefaling IN ('kjop', 'hold', 'selg')),
  konklusjon    text,
  notat         text,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS valuations_ticker_idx ON public.valuations (ticker, updated_at DESC);
ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin styrer verdsettelser" ON public.valuations;
CREATE POLICY "Admin styrer verdsettelser"
ON public.valuations FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- DEL 3: Porteføljeanalyser (øyeblikksbilder).
CREATE TABLE IF NOT EXISTS public.portfolio_analyses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tittel      text NOT NULL,
  parametre   jsonb NOT NULL DEFAULT '{}'::jsonb,
  resultater  jsonb NOT NULL DEFAULT '{}'::jsonb,
  notat       text,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolio_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin styrer porteføljeanalyser" ON public.portfolio_analyses;
CREATE POLICY "Admin styrer porteføljeanalyser"
ON public.portfolio_analyses FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- DEL 4: Felles forutsetninger. Én rad per nøkkel, verdien er jsonb.
CREATE TABLE IF NOT EXISTS public.analysis_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.analysis_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin styrer analyseinnstillinger" ON public.analysis_settings;
CREATE POLICY "Admin styrer analyseinnstillinger"
ON public.analysis_settings FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Startverdier. Endres i Admin → Analyse → Forutsetninger.
INSERT INTO public.analysis_settings (key, value) VALUES
  ('risikofri_rente',   '0.040'),        -- 10-årig norsk stat, ca. Oppdateres av økonomiansvarlig.
  ('markedspremie',     '0.050'),        -- Berk & DeMarzo bruker 4-6 %; 5 % er standardvalget.
  ('skattesats',        '0.22'),         -- Norsk selskapsskatt.
  ('markedsindeks',     '"OSEBX.OL"'),   -- Referanseindeks for beta.
  ('frekvens',          '"ukentlig"'),   -- Kap. 12.3: minst to år med ukentlige data.
  ('historikk',         '"3y"'),
  ('terskel_kjop',      '0.15'),         -- Oppside over dette = underpriset.
  ('terskel_selg',      '-0.10'),        -- Oppside under dette = overpriset.
  ('metodevekter',      '{"dcf": 0.5, "multipler": 0.3, "utbytte": 0.2}')
ON CONFLICT (key) DO NOTHING;

-- DEL 5: updated_at på valuations.
CREATE OR REPLACE FUNCTION public.sett_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS valuations_updated_at ON public.valuations;
CREATE TRIGGER valuations_updated_at
BEFORE UPDATE ON public.valuations
FOR EACH ROW EXECUTE FUNCTION public.sett_updated_at();

-- KONTROLL
SELECT key, value FROM public.analysis_settings ORDER BY key;
