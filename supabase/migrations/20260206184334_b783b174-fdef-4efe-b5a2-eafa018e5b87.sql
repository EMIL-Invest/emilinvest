-- Create table for available Oslo Børs stocks
CREATE TABLE public.oslo_stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sector TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.oslo_stocks ENABLE ROW LEVEL SECURITY;

-- Anyone can view stocks
CREATE POLICY "Anyone can view oslo stocks" 
ON public.oslo_stocks 
FOR SELECT 
USING (true);

-- Only admins can manage stocks
CREATE POLICY "Admins can insert oslo stocks" 
ON public.oslo_stocks 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update oslo stocks" 
ON public.oslo_stocks 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete oslo stocks" 
ON public.oslo_stocks 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Create table for competition participants
CREATE TABLE public.competition_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Track starting values for each period
  all_time_start_value NUMERIC NOT NULL DEFAULT 100000,
  all_time_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  monthly_start_value NUMERIC NOT NULL DEFAULT 100000,
  monthly_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', now()),
  yearly_start_value NUMERIC NOT NULL DEFAULT 100000,
  yearly_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('year', now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can view participants
CREATE POLICY "Anyone can view competition participants" 
ON public.competition_participants 
FOR SELECT 
USING (true);

-- Users can join the competition
CREATE POLICY "Users can join competition" 
ON public.competition_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own participation
CREATE POLICY "Users can update their own participation" 
ON public.competition_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create table for competition portfolios (current holdings)
CREATE TABLE public.competition_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.competition_participants(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL, -- 'ASK' for cash
  quantity NUMERIC NOT NULL DEFAULT 0,
  average_purchase_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_id, ticker)
);

-- Enable RLS
ALTER TABLE public.competition_portfolios ENABLE ROW LEVEL SECURITY;

-- Anyone can view portfolios
CREATE POLICY "Anyone can view competition portfolios" 
ON public.competition_portfolios 
FOR SELECT 
USING (true);

-- Users can manage their own portfolio
CREATE POLICY "Users can insert own portfolio holdings" 
ON public.competition_portfolios 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.competition_participants 
    WHERE id = participant_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own portfolio holdings" 
ON public.competition_portfolios 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.competition_participants 
    WHERE id = participant_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own portfolio holdings" 
ON public.competition_portfolios 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.competition_participants 
    WHERE id = participant_id AND user_id = auth.uid()
  )
);

-- Create table for transactions (buy/sell history)
CREATE TABLE public.competition_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.competition_participants(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL,
  price_per_share NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competition_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" 
ON public.competition_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.competition_participants 
    WHERE id = participant_id AND user_id = auth.uid()
  )
);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions" 
ON public.competition_transactions 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" 
ON public.competition_transactions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.competition_participants 
    WHERE id = participant_id AND user_id = auth.uid()
  )
);

-- Create table for leaderboard snapshots (for performance)
CREATE TABLE public.competition_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.competition_participants(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'yearly', 'all_time')),
  portfolio_value NUMERIC NOT NULL,
  return_percentage NUMERIC NOT NULL,
  rank INTEGER,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_id, period_type, snapshot_date)
);

-- Enable RLS
ALTER TABLE public.competition_leaderboard ENABLE ROW LEVEL SECURITY;

-- Anyone can view leaderboard
CREATE POLICY "Anyone can view leaderboard" 
ON public.competition_leaderboard 
FOR SELECT 
USING (true);

-- Only system can insert leaderboard entries (via edge function)
CREATE POLICY "Service role can manage leaderboard" 
ON public.competition_leaderboard 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add trigger for updated_at on competition_portfolios
CREATE TRIGGER update_competition_portfolios_updated_at
BEFORE UPDATE ON public.competition_portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some popular Oslo Børs stocks to get started
INSERT INTO public.oslo_stocks (ticker, name, sector) VALUES
  ('EQNR.OL', 'Equinor', 'Energi'),
  ('DNB.OL', 'DNB Bank', 'Finans'),
  ('AKRBP.OL', 'Aker BP', 'Energi'),
  ('TEL.OL', 'Telenor', 'Telekom'),
  ('MOWI.OL', 'Mowi', 'Sjømat'),
  ('ORK.OL', 'Orkla', 'Konsumvarer'),
  ('YAR.OL', 'Yara International', 'Materialer'),
  ('SALM.OL', 'SalMar', 'Sjømat'),
  ('SUBC.OL', 'Subsea 7', 'Energitjenester'),
  ('KOG.OL', 'Kongsberg Gruppen', 'Industri'),
  ('NHY.OL', 'Norsk Hydro', 'Materialer'),
  ('BAKKA.OL', 'Bakkafrost', 'Sjømat'),
  ('SCATC.OL', 'Scatec', 'Fornybar energi'),
  ('AKER.OL', 'Aker', 'Industri'),
  ('FRO.OL', 'Frontline', 'Shipping'),
  ('GOGL.OL', 'Golden Ocean', 'Shipping'),
  ('PGS.OL', 'PGS', 'Energitjenester'),
  ('KAHOOT.OL', 'Kahoot!', 'Teknologi'),
  ('AUSS.OL', 'Austevoll Seafood', 'Sjømat'),
  ('GJF.OL', 'Gjensidige Forsikring', 'Forsikring'),
  ('STB.OL', 'Storebrand', 'Finans'),
  ('SCHB.OL', 'Schibsted', 'Media'),
  ('VEI.OL', 'Veidekke', 'Bygg'),
  ('AKSO.OL', 'Aker Solutions', 'Energitjenester'),
  ('RECSI.OL', 'REC Silicon', 'Materialer'),
  ('SRBNK.OL', 'SpareBank 1 SR-Bank', 'Finans'),
  ('NONG.OL', 'Nordic Semiconductor', 'Teknologi'),
  ('AUTO.OL', 'AutoStore', 'Teknologi'),
  ('BELCO.OL', 'Bonheur', 'Industri'),
  ('BWO.OL', 'BW Offshore', 'Energitjenester');