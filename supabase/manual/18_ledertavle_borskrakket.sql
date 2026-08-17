-- ============================================================
-- 18_ledertavle_borskrakket.sql — delt ledertavle for Børskrakket
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- Ledertavlen lå i nettleserens localStorage, altså per maskin. Nå skal
-- den ligge i databasen, slik at alle ser samme tavle uansett enhet —
-- gruppene kan spille fra egne telefoner, og resultatene havner i samme
-- liste.
--
-- SIKKERHETSVURDERING
-- Spillet er åpent for alle uten innlogging, så hvem som helst kan
-- skrive en rad. Det er en bevisst avveining: å kreve konto ville
-- ødelagt lavterskelpoenget. Vi begrenser skaden i stedet:
--   · bare INSERT og SELECT er tillatt — ingen kan endre eller slette
--     andres resultater
--   · avkastningen må ligge innenfor et fornuftig intervall, så ingen
--     kan skrive «+99999 %»
--   · gruppenavnet trimmes og er maks 40 tegn
--   · administratorer kan rydde i tavlen (DELETE-policy)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.game_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Hvilket spill raden gjelder. Feltet finnes for at en senere
  -- konkurranse kan dele tabellen uten migrering.
  spill text NOT NULL DEFAULT 'borskrakket',
  gruppenavn text NOT NULL,
  avkastning_pct numeric NOT NULL,
  sluttverdi numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Grensene: teoretisk maksimum i Børskrakket er ca. +215 %, og man
  -- kan ikke tape mer enn alt. Litt slakk i begge ender.
  CONSTRAINT avkastning_innenfor_rimelighetens_grenser
    CHECK (avkastning_pct > -100 AND avkastning_pct < 1000),
  CONSTRAINT sluttverdi_positiv CHECK (sluttverdi >= 0),
  CONSTRAINT gruppenavn_lengde
    CHECK (char_length(gruppenavn) BETWEEN 1 AND 40)
);

CREATE INDEX IF NOT EXISTS game_leaderboard_spill_avkastning_idx
  ON public.game_leaderboard (spill, avkastning_pct DESC);

-- Trim bort blanke tegn i navnet før lagring, så «EMIL 3» og « EMIL 3 »
-- ikke blir to ulike grupper i listen.
CREATE OR REPLACE FUNCTION public.trim_gruppenavn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.gruppenavn := btrim(NEW.gruppenavn);
  IF char_length(NEW.gruppenavn) = 0 THEN
    RAISE EXCEPTION 'Gruppenavn kan ikke være tomt';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trim_gruppenavn_trigger ON public.game_leaderboard;
CREATE TRIGGER trim_gruppenavn_trigger
  BEFORE INSERT OR UPDATE ON public.game_leaderboard
  FOR EACH ROW EXECUTE FUNCTION public.trim_gruppenavn();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.game_leaderboard ENABLE ROW LEVEL SECURITY;

-- Alle kan se tavlen — det er hele poenget med en ledertavle.
DROP POLICY IF EXISTS "Alle kan se ledertavlen" ON public.game_leaderboard;
CREATE POLICY "Alle kan se ledertavlen"
ON public.game_leaderboard
FOR SELECT
USING (true);

-- Alle kan legge inn et resultat, også uten innlogging.
DROP POLICY IF EXISTS "Alle kan legge inn resultat" ON public.game_leaderboard;
CREATE POLICY "Alle kan legge inn resultat"
ON public.game_leaderboard
FOR INSERT
WITH CHECK (true);

-- Ingen UPDATE-policy: en lagret rad kan ikke endres av noen via API-et.

-- Bare administratorer kan rydde i tavlen (f.eks. slette testresultater
-- eller nullstille før et arrangement).
DROP POLICY IF EXISTS "Admin kan slette resultater" ON public.game_leaderboard;
CREATE POLICY "Admin kan slette resultater"
ON public.game_leaderboard
FOR DELETE
USING (public.is_admin(auth.uid()));

-- ============================================================
-- KONTROLL
-- ============================================================

-- 1) Tabellen og policyene skal finnes (fire rader: SELECT, INSERT, DELETE)
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'game_leaderboard'
ORDER BY cmd;

-- 2) Tavlen — tom nå, fylles av spillet
SELECT gruppenavn, avkastning_pct, sluttverdi, created_at
FROM public.game_leaderboard
WHERE spill = 'borskrakket'
ORDER BY avkastning_pct DESC
LIMIT 20;

-- ============================================================
-- NYTTIG SENERE
-- ============================================================
-- Slett testresultater før et arrangement (krever admin-innlogging, ELLER
-- kjør det her i SQL Editor som nå — den går rundt RLS):
--   DELETE FROM public.game_leaderboard WHERE spill = 'borskrakket';
--
-- Slett én enkelt rad:
--   DELETE FROM public.game_leaderboard WHERE gruppenavn = 'Testgruppe Alfa';
-- ============================================================
