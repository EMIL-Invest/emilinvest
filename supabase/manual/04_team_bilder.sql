-- ============================================================================
-- EmilInvest: portrettbilder på komitémedlemmene — kjøres i SQL Editor
-- Bildene ligger som statiske filer i repoet under public/team/.
-- Fordelingen er FORELØPIG (tilfeldig) — bytt hvem som har hvilket bilde ved å
-- endre navnene under og kjøre på nytt. Idempotent.
-- ============================================================================

UPDATE public.team_members SET photo_url = '/team/portrett-5298.jpg' WHERE name = 'Kristian Hove';
UPDATE public.team_members SET photo_url = '/team/portrett-5301.jpg' WHERE name = 'Vinh Diep';
UPDATE public.team_members SET photo_url = '/team/portrett-5307.jpg' WHERE name = 'Henrik Kvennås';
UPDATE public.team_members SET photo_url = '/team/portrett-5315.jpg' WHERE name = 'Johannes Lyssand Mjelde';
UPDATE public.team_members SET photo_url = '/team/portrett-5336.jpg' WHERE name = 'Sondre Pettersen';
UPDATE public.team_members SET photo_url = '/team/portrett-5341.jpg' WHERE name = 'Gustav Stockholm';
UPDATE public.team_members SET photo_url = '/team/portrett-5351.jpg' WHERE name = 'Jakob Wigulf Christensen';
UPDATE public.team_members SET photo_url = '/team/portrett-5360.jpg' WHERE name = 'Anne Håkanes';
UPDATE public.team_members SET photo_url = '/team/portrett-5369.jpg' WHERE name = 'Tom-Vegar Moen';

-- Kontroll: hvem har bilde nå?
SELECT name, role, photo_url FROM public.team_members ORDER BY sort_order;
