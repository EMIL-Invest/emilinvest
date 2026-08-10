-- ============================================================
-- 08_aksjeunivers.sql — utvidet aksjeunivers for konkurransen
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- 1) Retter feil navn i eksisterende data
-- 2) Deaktiverer avnoterte og obskure nisjeselskaper
--    (de som eier dem kan fortsatt selge — ingen kan kjøpe)
-- 3) Legger til ~70 nye aksjer: bredde fra Oslo Børs +
--    de store amerikanske selskapene (S&P 500)
-- ============================================================

-- 1) NAVNEFIKS -------------------------------------------------
-- NONG.OL var feilmerket som «Nordic Semiconductor» — det er
-- SpareBank 1 Nord-Norge. (Ekte Nordic Semiconductor = NOD.OL,
-- legges inn under.)
UPDATE oslo_stocks
SET name = 'SpareBank 1 Nord-Norge', sector = 'Finans'
WHERE ticker = 'NONG.OL';

-- 2) BEHOLD hele dagens liste aktiv ---------------------------
-- (Sørger for at alle er aktive selv om en tidligere versjon av
-- dette skriptet deaktiverte dem.)
-- NB: PGS.OL (fusjonert inn i TGS) og RECSI.OL (kjøpt av Hanwha)
-- er avnotert fra børsen — de vil stå uten kurs og kan dermed
-- ikke kjøpes i praksis.
UPDATE oslo_stocks
SET is_active = true
WHERE ticker IN (
  'PGS.OL','RECSI.OL','AKAST.OL','LOKO','EAM.OL','ENSU.OL','NAPA.OL',
  'GEOS.OL','ENDUR.OL','VOW.OL','NNE','DNN','UEC','LEU'
);

-- AKAST.OL var feilmerket som «Acast» — riktig navn er Akastor.
UPDATE oslo_stocks
SET name = 'Akastor'
WHERE ticker = 'AKAST.OL';

-- 3) NYE AKSJER ------------------------------------------------
INSERT INTO oslo_stocks (ticker, name, sector, exchange, is_active)
SELECT v.ticker, v.name, v.sector, v.exchange, true
FROM (VALUES
  -- ---------- Oslo Børs ----------
  ('NOD.OL',    'Nordic Semiconductor',            'Teknologi',             'OSL'),
  ('NORBT.OL',  'Norbit',                          'Teknologi',             'OSL'),
  ('BOUV.OL',   'Bouvet',                          'Teknologi',             'OSL'),
  ('ZAP.OL',    'Zaptec',                          'Teknologi',             'OSL'),
  ('PEXIP.OL',  'Pexip',                           'Teknologi',             'OSL'),
  ('KOMPL.OL',  'Komplett',                        'Handel',                'OSL'),
  ('FLNG.OL',   'Flex LNG',                        'Shipping',              'OSL'),
  ('KCC.OL',    'Klaveness Combination Carriers',  'Shipping',              'OSL'),
  ('WWI.OL',    'Wilh. Wilhelmsen Holding',        'Shipping',              'OSL'),
  ('BONHR.OL',  'Bonheur',                         'Industri',              'OSL'),
  ('HEX.OL',    'Hexagon Composites',              'Industri',              'OSL'),
  ('ELO.OL',    'Elopak',                          'Industri',              'OSL'),
  ('NSKOG.OL',  'Norske Skog',                     'Materialer',            'OSL'),
  ('AFG.OL',    'AF Gruppen',                      'Bygg',                  'OSL'),
  ('NORCO.OL',  'Norconsult',                      'Rådgivning / Ingeniør', 'OSL'),
  ('OLT.OL',    'Olav Thon Eiendomsselskap',       'Eiendom',               'OSL'),
  ('SBO.OL',    'Selvaag Bolig',                   'Eiendom',               'OSL'),
  ('SRBNK.OL',  'SpareBank 1 Sør-Norge',           'Finans',                'OSL'),
  ('SPOL.OL',   'SpareBank 1 Østlandet',           'Finans',                'OSL'),
  ('ODL.OL',    'Odfjell Drilling',                'Energitjenester',       'OSL'),
  -- ---------- USA: teknologi ----------
  ('IBM',   'IBM',                 'Teknologi', 'NYSE'),
  ('QCOM',  'Qualcomm',            'Teknologi', 'NASDAQ'),
  ('TXN',   'Texas Instruments',   'Teknologi', 'NASDAQ'),
  ('AMAT',  'Applied Materials',   'Teknologi', 'NASDAQ'),
  ('MU',    'Micron Technology',   'Teknologi', 'NASDAQ'),
  ('LRCX',  'Lam Research',        'Teknologi', 'NASDAQ'),
  ('NOW',   'ServiceNow',          'Teknologi', 'NYSE'),
  ('INTU',  'Intuit',              'Teknologi', 'NASDAQ'),
  ('ACN',   'Accenture',           'Teknologi', 'NYSE'),
  ('ARM',   'Arm Holdings',        'Teknologi', 'NASDAQ'),
  ('DASH',  'DoorDash',            'Teknologi', 'NASDAQ'),
  -- ---------- USA: finans ----------
  ('BAC',   'Bank of America',     'Finans', 'NYSE'),
  ('WFC',   'Wells Fargo',         'Finans', 'NYSE'),
  ('C',     'Citigroup',           'Finans', 'NYSE'),
  ('BLK',   'BlackRock',           'Finans', 'NYSE'),
  ('SPGI',  'S&P Global',          'Finans', 'NYSE'),
  ('BX',    'Blackstone',          'Finans', 'NYSE'),
  ('KKR',   'KKR',                 'Finans', 'NYSE'),
  ('HOOD',  'Robinhood',           'Finans', 'NASDAQ'),
  -- ---------- USA: helse ----------
  ('ABBV',  'AbbVie',              'Helse', 'NYSE'),
  ('MRK',   'Merck',               'Helse', 'NYSE'),
  ('TMO',   'Thermo Fisher',       'Helse', 'NYSE'),
  ('DHR',   'Danaher',             'Helse', 'NYSE'),
  ('AMGN',  'Amgen',               'Helse', 'NASDAQ'),
  ('GILD',  'Gilead Sciences',     'Helse', 'NASDAQ'),
  ('VRTX',  'Vertex Pharmaceuticals', 'Helse', 'NASDAQ'),
  ('REGN',  'Regeneron',           'Helse', 'NASDAQ'),
  ('SYK',   'Stryker',             'Helse', 'NYSE'),
  ('BSX',   'Boston Scientific',   'Helse', 'NYSE'),
  ('MDT',   'Medtronic',           'Helse', 'NYSE'),
  -- ---------- USA: industri og transport ----------
  ('HON',   'Honeywell',           'Industri',  'NASDAQ'),
  ('MMM',   '3M',                  'Industri',  'NYSE'),
  ('UNP',   'Union Pacific',       'Industri',  'NYSE'),
  ('UPS',   'UPS',                 'Industri',  'NYSE'),
  ('FDX',   'FedEx',               'Industri',  'NYSE'),
  ('WM',    'Waste Management',    'Industri',  'NYSE'),
  ('DAL',   'Delta Air Lines',     'Transport', 'NYSE'),
  -- ---------- USA: bil ----------
  ('GM',    'General Motors',      'Bil', 'NYSE'),
  ('F',     'Ford',                'Bil', 'NYSE'),
  -- ---------- USA: konsum, handel og restaurant ----------
  ('PM',    'Philip Morris',       'Konsumvarer',  'NYSE'),
  ('MO',    'Altria',              'Konsumvarer',  'NYSE'),
  ('MDLZ',  'Mondelez (Oreo, Freia)', 'Konsumvarer', 'NASDAQ'),
  ('CL',    'Colgate-Palmolive',   'Konsumvarer',  'NYSE'),
  ('LULU',  'Lululemon',           'Konsumvarer',  'NASDAQ'),
  ('LOW',   'Lowe''s',             'Handel',       'NYSE'),
  ('TJX',   'TJX Companies',       'Handel',       'NYSE'),
  ('GME',   'GameStop',            'Detaljhandel', 'NYSE'),
  ('DPZ',   'Domino''s Pizza',     'Restaurant',   'NASDAQ'),
  ('YUM',   'Yum! Brands (KFC)',   'Restaurant',   'NYSE'),
  -- ---------- USA: gaming og media ----------
  ('EA',    'Electronic Arts',     'Gaming',  'NASDAQ'),
  ('TTWO',  'Take-Two (GTA)',      'Gaming',  'NASDAQ'),
  ('RDDT',  'Reddit',              'Media',   'NYSE'),
  ('CMCSA', 'Comcast',             'Media',   'NASDAQ'),
  ('TMUS',  'T-Mobile US',         'Telekom', 'NASDAQ'),
  -- ---------- USA: materialer og energi ----------
  ('LIN',   'Linde',               'Materialer',      'NASDAQ'),
  ('FCX',   'Freeport-McMoRan',    'Materialer',      'NYSE'),
  ('NEM',   'Newmont',             'Materialer',      'NYSE'),
  ('NEE',   'NextEra Energy',      'Fornybar energi', 'NYSE'),
  -- ---------- USA: reiseliv ----------
  ('MAR',   'Marriott',            'Reiseliv', 'NASDAQ'),
  ('BKNG',  'Booking Holdings',    'Reiseliv', 'NASDAQ'),
  -- ---------- USA: krypto-eksponering ----------
  ('MSTR',  'Strategy (MicroStrategy)', 'Krypto', 'NASDAQ'),
  -- ---------- USA: romfart ----------
  ('SPCX',  'SpaceX',              'Romfart', 'NASDAQ')
) AS v(ticker, name, sector, exchange)
WHERE NOT EXISTS (
  SELECT 1 FROM oslo_stocks o WHERE o.ticker = v.ticker
);

-- Sikkerhetsnett: hvis noen av de nye tickerne fantes fra før
-- men var deaktivert, aktiver dem igjen.
UPDATE oslo_stocks
SET is_active = true
WHERE ticker IN (
  'NOD.OL','NORBT.OL','BOUV.OL','ZAP.OL','PEXIP.OL','KOMPL.OL','FLNG.OL',
  'KCC.OL','WWI.OL','BONHR.OL','HEX.OL','ELO.OL','NSKOG.OL','AFG.OL',
  'NORCO.OL','OLT.OL','SBO.OL','SRBNK.OL','SPOL.OL','ODL.OL',
  'IBM','QCOM','TXN','AMAT','MU','LRCX','NOW','INTU','ACN','ARM','DASH',
  'BAC','WFC','C','BLK','SPGI','BX','KKR','HOOD',
  'ABBV','MRK','TMO','DHR','AMGN','GILD','VRTX','REGN','SYK','BSX','MDT',
  'HON','MMM','UNP','UPS','FDX','WM','DAL','GM','F',
  'PM','MO','MDLZ','CL','LULU','LOW','TJX','GME','DPZ','YUM',
  'EA','TTWO','RDDT','CMCSA','TMUS','LIN','FCX','NEM','NEE','MAR','BKNG','MSTR','SPCX'
);

-- Kontroll: antall aktive aksjer etter kjøring
SELECT count(*) AS aktive_aksjer FROM oslo_stocks WHERE is_active;
