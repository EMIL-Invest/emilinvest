-- ============================================================
-- 23_gjenopprett_pamelding.sql — gjenoppretter competition_join,
-- funksjonen bak «Meld meg på»-knappen i konkurransen.
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- FEILEN: nye brukere fikk feilmelding når de la inn visningsnavn.
-- Probing mot produksjon 1. sep viste at RPC-kallet svarte
-- 404 PGRST202 — funksjonen finnes rett og slett ikke i basen.
-- Samme rotårsak som stock_price_cache (skript 22): deler av
-- 02_full_oppsett.sql traff aldri produksjonsbasen. En systematisk
-- sjekk samme dag viste at ALT annet fra 02 er på plass (alle tabeller
-- + buy/sell/is_admin) — det var bare denne som manglet.
--
-- Definisjonen under er identisk med 02_full_oppsett.sql: atomisk
-- påmelding — deltakerrad og 100 000 kr i ASK i samme transaksjon.
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
-- KONTROLL: skal returnere én rad — da ser PostgREST funksjonen.
-- (Selve påmeldingen testes best fra nettsiden med en innlogget bruker.)
-- ============================================================
SELECT proname, pg_get_function_identity_arguments(oid) AS argumenter
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace AND proname = 'competition_join';
