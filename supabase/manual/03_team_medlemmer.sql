-- ============================================================================
-- EmilInvest: teammedlemmer med bilder — kjøres i SQL Editor
-- (nytt prosjekt nehqvobfwooyufxqbzpv). Idempotent.
--
-- Oppretter:
--   * team_members-tabell (navn, rolle, bilde, rekkefølge) — alle kan lese,
--     kun admin kan endre
--   * 'team'-storage-bucket (åpen lesing, kun admin skriver) for medlemsbilder
--   * seed av dagens komité (kjøres bare hvis tabellen er tom)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view team members" ON public.team_members;
CREATE POLICY "Anyone can view team members"
ON public.team_members
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Storage-bucket for medlemsbilder (åpen lesing — bildene vises på forsiden)
INSERT INTO storage.buckets (id, name, public)
VALUES ('team', 'team', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Anyone can view team photos" ON storage.objects;
CREATE POLICY "Anyone can view team photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'team');

DROP POLICY IF EXISTS "Admins can upload team photos" ON storage.objects;
CREATE POLICY "Admins can upload team photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'team' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update team photos" ON storage.objects;
CREATE POLICY "Admins can update team photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'team' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete team photos" ON storage.objects;
CREATE POLICY "Admins can delete team photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'team' AND public.is_admin(auth.uid()));

-- Seed dagens komité (kun hvis tabellen er tom, så rekjøring ikke dupliserer)
INSERT INTO public.team_members (name, role, sort_order)
SELECT * FROM (VALUES
  ('Kristian Hove', 'Leder', 10),
  ('Henrik Heierstad', 'Nestleder', 20),
  ('Daniel Dowsett', 'Ex. Nestleder', 30),
  ('Gustav Stockholm', 'Forvalter', 40),
  ('Jakob Wigulf Christensen', 'Økonomiansvarlig', 50),
  ('Vinh Diep', 'Logistikk-ansvarlig', 60),
  ('Erik Nysæther', 'Bedriftskontakt', 70),
  ('Anne Håkanes', 'SOME-ansvarlig', 80),
  ('Johannes Lyssand Mjelde', 'IT-ansvarlig', 90),
  ('Tom-Vegar Moen', 'Analytiker', 100),
  ('Sondre Pettersen', 'Analytiker', 110),
  ('Andreas Dahl Jørgensen', 'Analytiker', 120),
  ('Erik Munch-Finne', 'Analytiker', 130),
  ('Adrian Andersen', 'Analytiker', 140),
  ('Henrik Kvennås', 'Analytiker', 150),
  ('Marie Rogn Kværnes', 'Støttemedlem', 160)
) AS seed(name, role, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.team_members);

-- Kontroll
SELECT count(*) AS antall_medlemmer FROM public.team_members;
