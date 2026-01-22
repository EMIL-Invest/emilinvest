-- Add purchase_date to portfolio_holdings
ALTER TABLE public.portfolio_holdings 
ADD COLUMN purchase_date date;

-- Add invested_capital to portfolio_history to track cumulative cost basis
ALTER TABLE public.portfolio_history 
ADD COLUMN invested_capital numeric;