-- ============================================================
-- 10_aksjeprofiler.sql — nøkkeltall, regnskap og bransjeforklaring
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- To tabeller:
--   stock_profiles   — én rad per selskap: multipler + tekst
--   stock_financials — én rad per regnskapsperiode (år eller kvartal)
--
-- Alle tall fylles inn manuelt i admin-panelet under fanen «Aksjesider».
-- Ingenting hentes fra API, så tallene står til noen oppdaterer dem —
-- derfor har stock_profiles feltene tall_per_dato og kilde, slik at
-- leseren ser hvor gamle tallene er og hvor de kommer fra.
-- ============================================================

-- 1) PROFIL --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker            text NOT NULL UNIQUE,
  name              text NOT NULL,
  sector            text,
  exchange          text,
  valuta            text NOT NULL DEFAULT 'NOK',

  -- Tekst
  kort_beskrivelse  text,           -- 1–2 setninger: hva selskapet gjør
  bransjeforklaring text,           -- lang: hvordan bransjen fungerer
  nettside          text,

  -- Nøkkeltall og multipler. NULL = «ikke oppgitt», og vises som «–».
  borsverdi_mrd     numeric,        -- milliarder i valutaen over
  pe                numeric,
  pb                numeric,
  ps                numeric,
  ev_ebitda         numeric,
  ev_ebit           numeric,
  utbytte_prosent   numeric,        -- direkteavkastning, %
  roe_prosent       numeric,
  egenkapitalandel  numeric,        -- %
  netto_gjeld_ebitda numeric,       -- ganger

  -- Sporbarhet
  tall_per_dato     date,           -- «tall per», vises i grensesnittet
  kilde             text,           -- f.eks. «Q2 2026-rapport, side 12»

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 2) REGNSKAP ------------------------------------------------
-- Alle beløp i MILLIONER av valutaen i stock_profiles.
CREATE TABLE IF NOT EXISTS public.stock_financials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker        text NOT NULL REFERENCES public.stock_profiles(ticker)
                  ON DELETE CASCADE ON UPDATE CASCADE,
  periode_type  text NOT NULL CHECK (periode_type IN ('ar', 'kvartal')),
  periode_navn  text NOT NULL,      -- «2025» eller «Q2 2026»
  periode_slutt date NOT NULL,      -- brukes til sortering

  omsetning     numeric,
  ebitda        numeric,
  ebit          numeric,
  resultat      numeric,            -- resultat etter skatt
  egenkapital   numeric,
  netto_gjeld   numeric,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (ticker, periode_type, periode_navn)
);

CREATE INDEX IF NOT EXISTS stock_financials_ticker_idx
  ON public.stock_financials (ticker, periode_type, periode_slutt);

-- 3) OPPDATER updated_at AUTOMATISK -------------------------
CREATE OR REPLACE FUNCTION public.sett_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stock_profiles_updated_at ON public.stock_profiles;
CREATE TRIGGER stock_profiles_updated_at
  BEFORE UPDATE ON public.stock_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sett_updated_at();

DROP TRIGGER IF EXISTS stock_financials_updated_at ON public.stock_financials;
CREATE TRIGGER stock_financials_updated_at
  BEFORE UPDATE ON public.stock_financials
  FOR EACH ROW EXECUTE FUNCTION public.sett_updated_at();

-- 4) RLS -----------------------------------------------------
-- Alle kan lese (sidene er åpne), bare admin kan skrive.
ALTER TABLE public.stock_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_financials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alle kan lese aksjeprofiler" ON public.stock_profiles;
CREATE POLICY "Alle kan lese aksjeprofiler"
ON public.stock_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin kan endre aksjeprofiler" ON public.stock_profiles;
CREATE POLICY "Admin kan endre aksjeprofiler"
ON public.stock_profiles FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Alle kan lese regnskap" ON public.stock_financials;
CREATE POLICY "Alle kan lese regnskap"
ON public.stock_financials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin kan endre regnskap" ON public.stock_financials;
CREATE POLICY "Admin kan endre regnskap"
ON public.stock_financials FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 5) KONTROLL ------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('stock_profiles', 'stock_financials');

-- Etterpå: kjør `supabase gen types typescript` (eller hent typene fra
-- dashbordet) hvis du vil ha de nye tabellene inn i
-- src/integrations/supabase/types.ts. Koden fungerer uten, fordi den
-- bruker egne typer for disse to tabellene.
