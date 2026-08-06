-- ============================================================================
-- EmilInvest: roller og riktige bilder (august 2026) — kjøres i SQL Editor
-- Retter opp tilfeldig bildefordeling + nye roller. Idempotent.
-- ============================================================================

-- Nye roller og rekkefølge
UPDATE public.team_members SET role = 'Leder',     sort_order = 10  WHERE name = 'Henrik Heierstad';
UPDATE public.team_members SET role = 'Nestleder', sort_order = 20  WHERE name = 'Andreas Dahl Jørgensen';
UPDATE public.team_members SET role = 'På utveksling', sort_order = 150 WHERE name = 'Kristian Hove';
UPDATE public.team_members SET role = 'På utveksling', sort_order = 155 WHERE name = 'Jakob Wigulf Christensen';

-- Marie fjernes fra siden
UPDATE public.team_members SET is_active = false WHERE name = 'Marie Rogn Kværnes';

-- Riktige bilder
UPDATE public.team_members SET photo_url = '/team/portrett-7879.jpg' WHERE name = 'Henrik Heierstad';
UPDATE public.team_members SET photo_url = '/team/portrett-7889.jpg' WHERE name = 'Kristian Hove';
UPDATE public.team_members SET photo_url = '/team/portrett-5298.jpg' WHERE name = 'Andreas Dahl Jørgensen';
UPDATE public.team_members SET photo_url = '/team/portrett-5301.jpg' WHERE name = 'Erik Nysæther';
UPDATE public.team_members SET photo_url = '/team/portrett-5307.jpg' WHERE name = 'Erik Munch-Finne';
UPDATE public.team_members SET photo_url = '/team/portrett-5315.jpg' WHERE name = 'Vinh Diep';
UPDATE public.team_members SET photo_url = '/team/portrett-5336.jpg' WHERE name = 'Tom-Vegar Moen';
UPDATE public.team_members SET photo_url = '/team/portrett-5341.jpg' WHERE name = 'Adrian Andersen';
UPDATE public.team_members SET photo_url = '/team/portrett-5351.jpg' WHERE name = 'Johannes Lyssand Mjelde';
UPDATE public.team_members SET photo_url = '/team/portrett-5369.jpg' WHERE name = 'Gustav Stockholm';

-- Disse har ikke lenger bilde (bildet deres tilhørte noen andre).
-- Anne Håkanes beholder sitt (portrett-5360).
UPDATE public.team_members SET photo_url = NULL
WHERE name IN ('Sondre Pettersen', 'Henrik Kvennås', 'Jakob Wigulf Christensen');

-- Kontroll
SELECT name, role, photo_url, sort_order, is_active
FROM public.team_members ORDER BY sort_order;
