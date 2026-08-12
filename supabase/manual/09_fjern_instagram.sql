-- ============================================================
-- 09_fjern_instagram.sql — fjerner Instagram-funksjonen
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- Bakgrunn: Instagram-seksjonen ble aldri vist på forsiden, men
-- admin-panelet skrev fortsatt til instagram_posts. Både seksjonen
-- og admin-fanen er nå fjernet fra koden, så tabellen har ingen
-- brukere igjen.
--
-- ADVARSEL: dette sletter data permanent. Ønsker du å beholde
-- innholdet, kjør steg 1 først og lagre resultatet.
-- ============================================================

-- 1) VALGFRITT: se hva som ligger der før du sletter
SELECT * FROM public.instagram_posts ORDER BY created_at DESC;

-- 2) Slett tabellen. CASCADE tar med RLS-policyene som hører til.
DROP TABLE IF EXISTS public.instagram_posts CASCADE;

-- 3) Kontroll — skal gi 0 rader
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'instagram_posts';

-- Etterpå: kjør `supabase gen types typescript` på nytt (eller hent
-- typene fra dashbordet) for å fjerne instagram_posts fra
-- src/integrations/supabase/types.ts. Den filen er autogenerert,
-- så den er ikke redigert manuelt her.
