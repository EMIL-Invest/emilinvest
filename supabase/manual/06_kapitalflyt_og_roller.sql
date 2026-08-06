-- ============================================================================
-- EmilInvest: kapitalflyt-tabell (riktig avkastningsmåling) + rollejusteringer
-- Kjøres i SQL Editor. Idempotent.
--
-- Avkastningen skal måles per investert krone (tidsvektet, TWR):
--   * Innskudd/uttak av penger skal IKKE endre avkastningsprosenten
--   * Bytte av aksjer skal heller IKKE regnes som kapitalflyt
-- Derfor føres ekte innskudd/uttak i en egen tabell, og daily-snapshot
-- henter «investert kapital» herfra i stedet for fra aksjenes kostpris.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.capital_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_date DATE NOT NULL,
  amount NUMERIC NOT NULL,          -- positivt = innskudd, negativt = uttak
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.capital_flows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view capital flows" ON public.capital_flows;
CREATE POLICY "Anyone can view capital flows"
ON public.capital_flows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage capital flows" ON public.capital_flows;
CREATE POLICY "Admins can manage capital flows"
ON public.capital_flows FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Startsaldo: overfør dagens «investert kapital» fra siste historikkpunkt,
-- slik at målingen fortsetter sømløst uten falsk kapitalflyt ved byttet.
-- Kjøres bare hvis tabellen er tom.
INSERT INTO public.capital_flows (flow_date, amount, note)
SELECT date, invested_capital, 'Startsaldo — overført fra porteføljehistorikken'
FROM public.portfolio_history
WHERE invested_capital IS NOT NULL
ORDER BY date DESC
LIMIT 1
ON CONFLICT DO NOTHING;
-- (ON CONFLICT treffer aldri her, men INSERT ... SELECT under betingelsen:)
DELETE FROM public.capital_flows a
USING public.capital_flows b
WHERE a.note = b.note
  AND a.note = 'Startsaldo — overført fra porteføljehistorikken'
  AND a.created_at > b.created_at;

-- Rollejusteringer
UPDATE public.team_members SET role = 'På utveksling', sort_order = 152 WHERE name = 'Johannes Lyssand Mjelde';
UPDATE public.team_members SET role = 'IT-ansvarlig',  sort_order = 90  WHERE name = 'Jakob Wigulf Christensen';

-- Kontroll
SELECT 'capital_flows' AS tabell, flow_date::text AS dato, amount::text AS belop, note
FROM public.capital_flows
UNION ALL
SELECT 'team_members', name, role, photo_url
FROM public.team_members WHERE name IN ('Johannes Lyssand Mjelde','Jakob Wigulf Christensen');
