-- 31: Den ekte porteføljen, kjøpt 10. november 2026.
-- Sletter ALT fra den gamle (fiktive) porteføljen og starter på nytt:
-- beholdning, verdihistorikk, Excel-data (daglige kurser per aksje),
-- startsaldo og selskapsprofiler/nøkkeltall. Kjør hele skriptet i SQL Editor.

BEGIN;

DELETE FROM public.stock_financials;
DELETE FROM public.stock_profiles;
DELETE FROM public.portfolio_stock_snapshots;
DELETE FROM public.portfolio_history;
DELETE FROM public.capital_flows;
DELETE FROM public.portfolio_holdings;

-- 14 aksjer. Kjøpskurs = verdi / antall (NOK) per 10. nov.
INSERT INTO public.portfolio_holdings
  (ticker, name, quantity, purchase_price, cost_basis, holding_type, sector, exchange, purchase_date)
VALUES
  ('GOOGL', 'Alphabet', 6, 2728.8333, 16373, 'stock', 'Kommunikasjon', 'NASDAQ', '2026-11-10'),
  ('DNB', 'DNB Bank', 50, 325.0000, 16250, 'stock', 'Finans', 'OSE', '2026-11-10'),
  ('SALM', 'SalMar', 20, 592.0000, 11840, 'stock', 'Sjømat', 'OSE', '2026-11-10'),
  ('BRG.OL', 'Borregaard', 74, 158.2027, 11707, 'stock', 'Materialer', 'OSE', '2026-11-10'),
  ('PROT', 'Protector Forsikring', 24, 480.4167, 11530, 'stock', 'Finans', 'OSE', '2026-11-10'),
  ('TSM', 'TSMC (Taiwan Semiconductor)', 3, 3745.0000, 11235, 'stock', 'IT', 'NYSE', '2026-11-10'),
  ('PRY.MI', 'Prysmian', 9, 1132.2222, 10190, 'stock', 'Industri', 'BIT', '2026-11-10'),
  ('KIT.OL', 'Kitron', 110, 91.8000, 10098, 'stock', 'Industri', 'OSE', '2026-11-10'),
  ('YAR', 'Yara International', 25, 402.8800, 10072, 'stock', 'Materialer', 'OSE', '2026-11-10'),
  ('NOVO-B.CO', 'Novo Nordisk', 23, 383.2609, 8815, 'stock', 'Helse', 'CPH', '2026-11-10'),
  ('AKERBP', 'Aker BP', 24, 315.0000, 7560, 'stock', 'Energi', 'OSE', '2026-11-10'),
  ('NHY', 'Norsk Hydro', 105, 69.4000, 7287, 'stock', 'Materialer', 'OSE', '2026-11-10'),
  ('ABB.ST', 'ABB', 8, 795.0000, 6360, 'stock', 'Industri', 'STO', '2026-11-10'),
  ('SPCX', 'SpaceX', 3, 1351.3333, 4054, 'stock', 'Industri', 'NASDAQ', '2026-11-10');

-- Innskutt kapital: det porteføljen ble kjøpt for.
INSERT INTO public.capital_flows (flow_date, amount, note)
VALUES ('2026-11-10', 143371, 'Startkapital - den ekte porteføljen kjøpt 10. nov 2026');

-- Første punkt i historikken (startpunktet for kurven og indeks-sammenligningen).
INSERT INTO public.portfolio_history (date, portfolio_value, osebx_value, invested_capital)
VALUES ('2026-11-10', 143371, 2081.41, 143371);

-- Første rad i Excel-dataene (kurser i NOK ved kjøp).
INSERT INTO public.portfolio_stock_snapshots
  (date, ticker, name, price, currency, exchange_rate, quantity, value_nok)
VALUES
  ('2026-11-10', 'GOOGL', 'Alphabet', 2728.8333, 'NOK', 1, 6, 16373),
  ('2026-11-10', 'DNB', 'DNB Bank', 325.0000, 'NOK', 1, 50, 16250),
  ('2026-11-10', 'SALM', 'SalMar', 592.0000, 'NOK', 1, 20, 11840),
  ('2026-11-10', 'BRG.OL', 'Borregaard', 158.2027, 'NOK', 1, 74, 11707),
  ('2026-11-10', 'PROT', 'Protector Forsikring', 480.4167, 'NOK', 1, 24, 11530),
  ('2026-11-10', 'TSM', 'TSMC (Taiwan Semiconductor)', 3745.0000, 'NOK', 1, 3, 11235),
  ('2026-11-10', 'PRY.MI', 'Prysmian', 1132.2222, 'NOK', 1, 9, 10190),
  ('2026-11-10', 'KIT.OL', 'Kitron', 91.8000, 'NOK', 1, 110, 10098),
  ('2026-11-10', 'YAR', 'Yara International', 402.8800, 'NOK', 1, 25, 10072),
  ('2026-11-10', 'NOVO-B.CO', 'Novo Nordisk', 383.2609, 'NOK', 1, 23, 8815),
  ('2026-11-10', 'AKERBP', 'Aker BP', 315.0000, 'NOK', 1, 24, 7560),
  ('2026-11-10', 'NHY', 'Norsk Hydro', 69.4000, 'NOK', 1, 105, 7287),
  ('2026-11-10', 'ABB.ST', 'ABB', 795.0000, 'NOK', 1, 8, 6360),
  ('2026-11-10', 'SPCX', 'SpaceX', 1351.3333, 'NOK', 1, 3, 4054),
  ('2026-11-10', 'OSEBX', 'Oslo Børs (OSEBX)', 2081.41, 'NOK', 1, 1, 2081);

COMMIT;

-- Sjekk: skal vise 14 aksjer, 143371 kr, 1 dag historikk.
SELECT
  (SELECT count(*) FROM public.portfolio_holdings) AS aksjer,
  (SELECT sum(cost_basis) FROM public.portfolio_holdings) AS kostpris,
  (SELECT count(*) FROM public.portfolio_history) AS dager_historikk,
  (SELECT count(*) FROM public.stock_profiles) AS profiler;
