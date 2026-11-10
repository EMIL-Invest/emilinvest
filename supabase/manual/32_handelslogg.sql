-- 32: Handelslogg for den ekte porteføljen.
-- Hver handel (kjøp/salg), utbytte og gebyr lagres med dato, antall, kurs og
-- kurtasje. Kontantbeholdningen regnes ut som:
--   innskutt kapital (capital_flows) + summen av belop_nok her.
-- Kjøp har negativt beløp (penger ut), salg og utbytte positivt.
-- Kjør hele skriptet i SQL Editor. Trygt å kjøre flere ganger.

CREATE TABLE IF NOT EXISTS public.portfolio_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_date  date NOT NULL,
  type        text NOT NULL CHECK (type IN ('kjop', 'salg', 'utbytte', 'gebyr')),
  ticker      text,
  name        text,
  quantity    numeric,                    -- antall aksjer (kjøp/salg)
  price_nok   numeric,                    -- kurs per aksje i NOK
  fees_nok    numeric NOT NULL DEFAULT 0, -- kurtasje/gebyr i NOK
  belop_nok   numeric NOT NULL,           -- kontanteffekt: kjøp < 0, salg/utbytte > 0
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_transactions_dato_idx
  ON public.portfolio_transactions (trade_date);

ALTER TABLE public.portfolio_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view portfolio transactions" ON public.portfolio_transactions;
CREATE POLICY "Anyone can view portfolio transactions"
ON public.portfolio_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage portfolio transactions" ON public.portfolio_transactions;
CREATE POLICY "Admins can manage portfolio transactions"
ON public.portfolio_transactions FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Startkjøpene 10. nov 2026 (kurtasje ukjent = 0). Bare hvis loggen er tom.
INSERT INTO public.portfolio_transactions
  (trade_date, type, ticker, name, quantity, price_nok, fees_nok, belop_nok, note)
SELECT v.trade_date::date, v.type, v.ticker, v.name, v.quantity, v.price_nok, v.fees_nok, v.belop_nok, v.note FROM (VALUES
  ('2026-11-10', 'kjop', 'GOOGL', 'Alphabet', 6, 2728.8333, 0, -16373, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'DNB', 'DNB Bank', 50, 325.0000, 0, -16250, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'SALM', 'SalMar', 20, 592.0000, 0, -11840, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'BRG.OL', 'Borregaard', 74, 158.2027, 0, -11707, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'PROT', 'Protector Forsikring', 24, 480.4167, 0, -11530, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'TSM', 'TSMC (Taiwan Semiconductor)', 3, 3745.0000, 0, -11235, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'PRY.MI', 'Prysmian', 9, 1132.2222, 0, -10190, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'KIT.OL', 'Kitron', 110, 91.8000, 0, -10098, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'YAR', 'Yara International', 25, 402.8800, 0, -10072, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'NOVO-B.CO', 'Novo Nordisk', 23, 383.2609, 0, -8815, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'AKERBP', 'Aker BP', 24, 315.0000, 0, -7560, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'NHY', 'Norsk Hydro', 105, 69.4000, 0, -7287, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'ABB.ST', 'ABB', 8, 795.0000, 0, -6360, 'Oppstart: porteføljen kjøpt'),
  ('2026-11-10', 'kjop', 'SPCX', 'SpaceX', 3, 1351.3333, 0, -4054, 'Oppstart: porteføljen kjøpt')
) AS v(trade_date, type, ticker, name, quantity, price_nok, fees_nok, belop_nok, note)
WHERE NOT EXISTS (SELECT 1 FROM public.portfolio_transactions);

-- Sjekk: 14 kjøp, kontanter = 0.
SELECT
  (SELECT count(*) FROM public.portfolio_transactions) AS handler,
  (SELECT sum(amount) FROM public.capital_flows)
    + (SELECT coalesce(sum(belop_nok), 0) FROM public.portfolio_transactions) AS kontanter;
