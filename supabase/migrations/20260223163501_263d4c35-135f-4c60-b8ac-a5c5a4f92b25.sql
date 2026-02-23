
-- Table to store daily per-stock price snapshots for Excel export
CREATE TABLE public.portfolio_stock_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  ticker text NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NOK',
  exchange_rate numeric NOT NULL DEFAULT 1,
  quantity numeric NOT NULL DEFAULT 0,
  value_nok numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(date, ticker)
);

-- Enable RLS
ALTER TABLE public.portfolio_stock_snapshots ENABLE ROW LEVEL SECURITY;

-- Only admins can read (for Excel export)
CREATE POLICY "Admins can view stock snapshots"
ON public.portfolio_stock_snapshots
FOR SELECT
USING (is_admin(auth.uid()));

-- Service role can insert/update (for daily-snapshot function)
CREATE POLICY "Service role can manage stock snapshots"
ON public.portfolio_stock_snapshots
FOR ALL
USING (auth.role() = 'service_role');

-- Index for efficient date-range queries
CREATE INDEX idx_stock_snapshots_date ON public.portfolio_stock_snapshots(date);
CREATE INDEX idx_stock_snapshots_ticker ON public.portfolio_stock_snapshots(ticker);
