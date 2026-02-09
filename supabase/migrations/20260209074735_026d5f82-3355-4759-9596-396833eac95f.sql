-- Add exchange column to oslo_stocks for trading hours validation
ALTER TABLE public.oslo_stocks ADD COLUMN IF NOT EXISTS exchange TEXT DEFAULT 'OSL';

-- Update exchange for known stocks based on ticker suffix
UPDATE public.oslo_stocks SET exchange = 'OSL' WHERE ticker LIKE '%.OL';
UPDATE public.oslo_stocks SET exchange = 'CPH' WHERE ticker LIKE '%.CO';
UPDATE public.oslo_stocks SET exchange = 'NYSE' WHERE ticker IN ('AAPL', 'AMZN', 'GOOGL', 'MSFT', 'NVDA', 'TSLA', 'META', 'JPM', 'CCJ', 'TTWO');
UPDATE public.oslo_stocks SET exchange = 'NASDAQ' WHERE ticker IN ('TSM');
UPDATE public.oslo_stocks SET exchange = 'CRYPTO' WHERE ticker LIKE '%-USD';

-- Create index for faster transaction counting
CREATE INDEX IF NOT EXISTS idx_competition_transactions_daily 
ON public.competition_transactions (participant_id, ticker, executed_at);

-- Add comment explaining the exchange column
COMMENT ON COLUMN public.oslo_stocks.exchange IS 'Exchange code for trading hours: OSL (Oslo), NYSE, NASDAQ, CPH (Copenhagen), CRYPTO (24/7)';