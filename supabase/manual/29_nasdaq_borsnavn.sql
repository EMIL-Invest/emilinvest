-- 29: Riktig børs for store Nasdaq-aksjer
-- Disse ligger på Nasdaq, men stod som NYSE i oslo_stocks. Brukes av
-- markedsfilteret i konkurransen. Åpningstidene er de samme, så handel
-- påvirkes ikke.
update public.oslo_stocks
set exchange = 'NASDAQ'
where ticker in ('AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'PEP', 'PLTR')
  and exchange = 'NYSE';
