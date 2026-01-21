-- Portfolio holdings table (stocks and funds with quantities)
CREATE TABLE public.portfolio_holdings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker text NOT NULL,
    name text NOT NULL,
    quantity numeric NOT NULL DEFAULT 0,
    purchase_price numeric NOT NULL DEFAULT 0,
    sector text,
    exchange text DEFAULT 'OSE',
    holding_type text NOT NULL DEFAULT 'stock' CHECK (holding_type IN ('stock', 'fund')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(ticker)
);

-- Historical portfolio values for performance chart
CREATE TABLE public.portfolio_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    portfolio_value numeric NOT NULL,
    osebx_value numeric,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(date)
);

-- Enable RLS
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for portfolio_holdings
CREATE POLICY "Anyone can view holdings"
ON public.portfolio_holdings FOR SELECT
USING (true);

CREATE POLICY "Admins can insert holdings"
ON public.portfolio_holdings FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update holdings"
ON public.portfolio_holdings FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete holdings"
ON public.portfolio_holdings FOR DELETE
USING (public.is_admin(auth.uid()));

-- RLS policies for portfolio_history
CREATE POLICY "Anyone can view history"
ON public.portfolio_history FOR SELECT
USING (true);

CREATE POLICY "Admins can insert history"
ON public.portfolio_history FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update history"
ON public.portfolio_history FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete history"
ON public.portfolio_history FOR DELETE
USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_portfolio_holdings_updated_at
BEFORE UPDATE ON public.portfolio_holdings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Email notification subscribers table
CREATE TABLE public.report_subscribers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    email text NOT NULL,
    subscribed boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.report_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
ON public.report_subscribers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.report_subscribers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.report_subscribers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.report_subscribers FOR SELECT
USING (public.is_admin(auth.uid()));