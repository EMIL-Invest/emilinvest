-- Update RLS policy for competition_participants to allow public viewing
DROP POLICY IF EXISTS "Authenticated users can view competition participants" ON public.competition_participants;

CREATE POLICY "Anyone can view competition participants" 
ON public.competition_participants 
FOR SELECT 
USING (true);

-- Update RLS policy for competition_portfolios to allow public viewing
DROP POLICY IF EXISTS "Authenticated users can view competition portfolios" ON public.competition_portfolios;

CREATE POLICY "Anyone can view competition portfolios" 
ON public.competition_portfolios 
FOR SELECT 
USING (true);