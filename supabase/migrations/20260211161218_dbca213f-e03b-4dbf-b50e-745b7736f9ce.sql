
-- Fix US stocks: NASDAQ
UPDATE oslo_stocks SET exchange = 'NASDAQ' WHERE ticker IN (
  'ABNB', 'ADBE', 'AMD', 'COIN', 'COST', 'CSCO', 'GOOG', 'INTC', 'NFLX', 'PYPL', 'ZM'
);

-- Fix US stocks: NYSE
UPDATE oslo_stocks SET exchange = 'NYSE' WHERE ticker IN (
  'ABT', 'BA', 'BABA', 'BRK-B', 'CAT', 'CRM', 'CVX', 'DIS', 'HD', 'JNJ', 'KO', 'LMT', 'MA', 'MCD', 'NIO', 'NKE', 'ORCL', 'PEP', 'PG', 'PLTR', 'RACE', 'RTX', 'SHOP', 'SNAP', 'SONY', 'SPOT', 'T', 'TM', 'UBER', 'V', 'VZ', 'WMT', 'XOM'
);

-- Fix European stocks: EPA (Euronext Paris/Brussels)
UPDATE oslo_stocks SET exchange = 'EPA' WHERE ticker IN ('AIR.PA', 'MC.PA', 'OR.PA');

-- Fix European stocks: XETRA (Frankfurt)
UPDATE oslo_stocks SET exchange = 'XETRA' WHERE ticker IN ('BMW.DE', 'SAP.DE', 'SIE.DE', 'VOW3.DE');

-- Fix European stocks: LSE (London)
UPDATE oslo_stocks SET exchange = 'LSE' WHERE ticker IN ('AZN.L', 'BP.L', 'SHEL.L', 'SN.L');

-- Fix European stocks: STO (Stockholm)
UPDATE oslo_stocks SET exchange = 'STO' WHERE ticker IN ('ERIC-B.ST', 'HM-B.ST', 'VOLV-B.ST');

-- Fix European stocks: AMS (Amsterdam - Euronext)
UPDATE oslo_stocks SET exchange = 'AMS' WHERE ticker = 'ASML.AS';

-- Fix European stocks: SWX (Swiss Exchange)
UPDATE oslo_stocks SET exchange = 'SWX' WHERE ticker IN ('NESN.SW', 'ROG.SW');

-- Fix Norwegian stocks that don't have .OL suffix but are OSL
-- CADLR, LOKO, VEND are Norwegian companies on Oslo Børs - keep as OSL
