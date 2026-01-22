-- Add cost_basis column to store actual purchase cost
ALTER TABLE public.portfolio_holdings 
ADD COLUMN cost_basis numeric DEFAULT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN public.portfolio_holdings.cost_basis IS 'Original purchase cost/investment amount';
COMMENT ON COLUMN public.portfolio_holdings.purchase_price IS 'Current price per unit (for stocks) or current total value (for funds)';