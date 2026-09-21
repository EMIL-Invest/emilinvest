-- ============================================================
-- 27_roller_september_2026.sql - rollebytter etter komitémøtet.
-- Kjøres i Supabase SQL Editor. Kan også gjøres i Admin → Komité,
-- dette skriptet gjør bare de samme fire endringene i én omgang.
--
--   Vinh Diep                (Logistikkansvarlig) → Analytiker
--   Erik Nysæther            (Bedriftskontakt)    → Analytiker
--   Gustav Stockholm         (Forvalter)          → Analytiker
--   Jakob Wigulf Christensen (IT-ansvarlig)       → Økonomiansvarlig
--
-- Merk: Økonomiansvarlig sto ledig, og IT-ansvarlig blir nå ledig.
-- ============================================================

-- DEL 1: FØR - sjekk at alle fire finnes med forventet rolle.
SELECT name, role, is_active
FROM team_members
WHERE name ILIKE 'Vinh Diep%'
   OR name ILIKE 'Erik Nys%'
   OR name ILIKE 'Gustav%'
   OR name ILIKE 'Jakob%'
ORDER BY name;


-- DEL 2: ENDRINGEN. Kjøres når DEL 1 viser nøyaktig fire rader.
BEGIN;

UPDATE team_members SET role = 'Analytiker'
WHERE name ILIKE 'Vinh Diep%' OR name ILIKE 'Erik Nys%' OR name ILIKE 'Gustav%';

UPDATE team_members SET role = 'Økonomiansvarlig'
WHERE name ILIKE 'Jakob%';

COMMIT;


-- DEL 3: ETTER - hele komiteen slik den vises på nettsiden.
SELECT name, role, sort_order
FROM team_members
WHERE is_active
ORDER BY sort_order, name;
