-- 29: Riktig børs for amerikanske aksjer i oslo_stocks
-- Disse ligger på Nasdaq, men stod som NYSE (Shopify og Walmart flyttet
-- til Nasdaq i 2025). TSM ligger på NYSE, men stod som NASDAQ. Brukes av
-- markedsfilteret i konkurransen. Åpningstidene er de samme, så handel
-- påvirkes ikke.
update public.oslo_stocks
set exchange = 'NASDAQ'
where ticker in ('AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'PEP', 'PLTR', 'SHOP', 'WMT')
  and exchange = 'NYSE';

update public.oslo_stocks
set exchange = 'NYSE'
where ticker = 'TSM'
  and exchange = 'NASDAQ';
