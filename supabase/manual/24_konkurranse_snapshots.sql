-- ============================================================
-- 24_konkurranse_snapshots.sql — daglige porteføljesnapshots for
-- konkurransen, slik at vi ved sesongslutt kan legge frem
-- «vinneroppskriften»: hvordan hver enkelt aksje bidro til
-- vinnerens (og alle andres) avkastning, dag for dag.
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
--
-- SLIK VIRKER DET:
--   * Hver børsdag kl. 16:10 UTC ber en cron-jobb stock-prices-
--     funksjonen om ferske sluttkurser for alle aksjer som eies
--     i konkurransen (Oslo Børs stenger 16:25 norsk tid, dvs.
--     14:25/15:25 UTC — kursene er altså endelige).
--   * Kl. 16:20 UTC tar competition_take_snapshot() en kopi av alle
--     aktive deltakeres beholdning (antall, kurs, verdi per aksje,
--     inkl. kontanter/ASK) inn i competition_snapshots.
--   * Viewet competition_bidrag regner ut hver akjses bidrag i kroner
--     og prosent per deltaker — det er selve vinneroppskriften.
--
-- BIDRAGSREGNSKAPET er eksakt også ved kjøp og salg underveis:
--   bidrag(aksje) = sluttverdi − startverdi + alle salg − alle kjøp
-- over konkurranseperioden (kontantstrømmene hentes fra
-- competition_transactions, som logger hver handel med beløp).
-- Summen av alle aksjebidrag = deltakerens totale gevinst.
-- Handler gjort ETTER dagens snapshot fanges opp i morgendagens.
--
-- Kjør hele fila én gang. DEL 5 (første snapshot nå) kjøres separat
-- til slutt — se instruksjonen der (pg_net fyrer først ved commit).
-- ============================================================

-- ============================================================
-- DEL 1: Tabellen
-- ============================================================
CREATE TABLE IF NOT EXISTS public.competition_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  taken_at timestamptz NOT NULL DEFAULT now(),
  participant_id uuid NOT NULL REFERENCES public.competition_participants(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  quantity numeric NOT NULL,
  price numeric NOT NULL,
  value numeric NOT NULL,
  UNIQUE (participant_id, ticker, snapshot_date)
);

CREATE INDEX IF NOT EXISTS competition_snapshots_deltaker_dato
  ON public.competition_snapshots (participant_id, snapshot_date);

ALTER TABLE public.competition_snapshots ENABLE ROW LEVEL SECURITY;

-- Alle kan lese (porteføljene er allerede åpne i topplisten via
-- ParticipantPortfolioDialog); kun snapshot-funksjonen skriver.
DROP POLICY IF EXISTS "Anyone can view snapshots" ON public.competition_snapshots;
CREATE POLICY "Anyone can view snapshots"
ON public.competition_snapshots
FOR SELECT
USING (true);
-- Ingen INSERT/UPDATE/DELETE-policyer: bare cron/SECURITY DEFINER skriver.

-- ============================================================
-- DEL 2: Snapshot-funksjonen
-- Kurs hentes fra stock_price_cache (nettopp oppdatert av cron-jobben
-- i DEL 4); mangler en ticker der brukes snittkjøpskursen som reserve,
-- slik at raden aldri uteblir. Kjøres den flere ganger samme dag,
-- overskrives dagens rader (siste kjøring vinner).
-- ============================================================
CREATE OR REPLACE FUNCTION public.competition_take_snapshot()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _antall integer;
BEGIN
  INSERT INTO competition_snapshots
    (snapshot_date, taken_at, participant_id, ticker, quantity, price, value)
  SELECT current_date,
         now(),
         f.participant_id,
         f.ticker,
         f.quantity,
         CASE WHEN f.ticker = 'ASK' THEN 1
              ELSE COALESCE(c.price, f.average_purchase_price) END,
         round((f.quantity * CASE WHEN f.ticker = 'ASK' THEN 1
                                  ELSE COALESCE(c.price, f.average_purchase_price) END)::numeric, 2)
  FROM competition_portfolios f
  JOIN competition_participants p ON p.id = f.participant_id AND p.is_active
  LEFT JOIN stock_price_cache c ON c.ticker = f.ticker
  ON CONFLICT (participant_id, ticker, snapshot_date) DO UPDATE
    SET quantity = EXCLUDED.quantity,
        price    = EXCLUDED.price,
        value    = EXCLUDED.value,
        taken_at = EXCLUDED.taken_at;

  GET DIAGNOSTICS _antall = ROW_COUNT;
  RETURN _antall;
END;
$$;

-- Bare backend skal kunne kjøre den (cron kjører som postgres):
REVOKE EXECUTE ON FUNCTION public.competition_take_snapshot() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- DEL 3: Viewet competition_bidrag — vinneroppskriften.
-- Per deltaker og aksje:
--   bidrag_kr  = sluttverdi − startverdi + salg − kjøp i perioden
--   bidrag_pst = bidrag i prosent av deltakerens startkapital
-- Perioden er fra deltakerens første til siste snapshot. Aksjer som
-- er kjøpt og solgt underveis (og ikke lenger eies) er også med.
-- ============================================================
CREATE OR REPLACE VIEW public.competition_bidrag
WITH (security_invoker = on) AS
WITH grenser AS (
  SELECT participant_id,
         MIN(taken_at) AS start_ts,
         MAX(taken_at) AS slutt_ts
  FROM competition_snapshots
  GROUP BY participant_id
),
startkapital AS (
  SELECT s.participant_id, SUM(s.value) AS total
  FROM competition_snapshots s
  JOIN grenser g ON g.participant_id = s.participant_id AND s.taken_at = g.start_ts
  GROUP BY s.participant_id
),
tickere AS (
  -- alle aksjer en deltaker har vært innom (også de som er solgt ut)
  SELECT DISTINCT participant_id, ticker FROM (
    SELECT participant_id, ticker FROM competition_snapshots
    UNION ALL
    SELECT participant_id, ticker FROM competition_transactions
  ) u
  WHERE ticker <> 'ASK'
)
SELECT t.participant_id,
       p.display_name,
       t.ticker,
       COALESCE(sv.quantity, 0)                     AS antall_naa,
       COALESCE(sv.value, 0)                        AS verdi_naa,
       round((COALESCE(sv.value, 0) - COALESCE(fv.value, 0)
              + COALESCE(fl.salg, 0) - COALESCE(fl.kjop, 0))::numeric, 2) AS bidrag_kr,
       round(((COALESCE(sv.value, 0) - COALESCE(fv.value, 0)
              + COALESCE(fl.salg, 0) - COALESCE(fl.kjop, 0))
              / NULLIF(k.total, 0) * 100)::numeric, 2) AS bidrag_pst
FROM tickere t
JOIN grenser g ON g.participant_id = t.participant_id
JOIN startkapital k ON k.participant_id = t.participant_id
JOIN competition_participants p ON p.id = t.participant_id
LEFT JOIN competition_snapshots fv
  ON fv.participant_id = t.participant_id AND fv.ticker = t.ticker AND fv.taken_at = g.start_ts
LEFT JOIN competition_snapshots sv
  ON sv.participant_id = t.participant_id AND sv.ticker = t.ticker AND sv.taken_at = g.slutt_ts
LEFT JOIN LATERAL (
  SELECT SUM(tr.total_amount) FILTER (WHERE tr.transaction_type = 'sell') AS salg,
         SUM(tr.total_amount) FILTER (WHERE tr.transaction_type = 'buy')  AS kjop
  FROM competition_transactions tr
  WHERE tr.participant_id = t.participant_id
    AND tr.ticker = t.ticker
    AND tr.executed_at >  g.start_ts
    AND tr.executed_at <= g.slutt_ts
) fl ON true;

-- ============================================================
-- DEL 4: Cron-jobbene (UTC). Man–fre; i helgene står kursene stille.
-- 16:10: friske sluttkurser inn i cachen. 16:20: snapshot.
-- ============================================================
SELECT cron.unschedule('competition-snapshot-priser')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'competition-snapshot-priser');

SELECT cron.schedule(
  'competition-snapshot-priser',
  '10 16 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://nehqvobfwooyufxqbzpv.supabase.co/functions/v1/stock-prices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_KVhuYnqq7zfxJcnHSZDlLw_j_RvW_FM',
      'Authorization', 'Bearer sb_publishable_KVhuYnqq7zfxJcnHSZDlLw_j_RvW_FM'
    ),
    body := jsonb_build_object(
      'tickers',
      (SELECT COALESCE(jsonb_agg(DISTINCT ticker), '[]'::jsonb)
       FROM competition_portfolios
       WHERE ticker <> 'ASK')
    )
  );
  $$
);

SELECT cron.unschedule('competition-snapshot')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'competition-snapshot');

SELECT cron.schedule(
  'competition-snapshot',
  '20 16 * * 1-5',
  $$ SELECT public.competition_take_snapshot(); $$
);

-- ============================================================
-- DEL 5: FØRSTE SNAPSHOT NÅ — kjør disse to linjene SEPARAT:
-- først kursoppdateringen (vent ~30 sek etter commit), så snapshoten.
-- Da starter historikken i dag i stedet for ved neste cron-kjøring.
--
--   1) Kjør kun denne, og vent ~30 sekunder:
--      SELECT net.http_post(
--        url := 'https://nehqvobfwooyufxqbzpv.supabase.co/functions/v1/stock-prices',
--        headers := jsonb_build_object('Content-Type','application/json',
--          'apikey','sb_publishable_KVhuYnqq7zfxJcnHSZDlLw_j_RvW_FM',
--          'Authorization','Bearer sb_publishable_KVhuYnqq7zfxJcnHSZDlLw_j_RvW_FM'),
--        body := jsonb_build_object('tickers',
--          (SELECT COALESCE(jsonb_agg(DISTINCT ticker),'[]'::jsonb)
--           FROM competition_portfolios WHERE ticker <> 'ASK')));
--
--   2) Så denne:
--      SELECT public.competition_take_snapshot();
--
-- ============================================================
-- KONTROLL — dagens snapshot og bidragsviewet:
--   SELECT p.display_name, s.ticker, s.quantity, s.price, s.value
--   FROM competition_snapshots s
--   JOIN competition_participants p ON p.id = s.participant_id
--   WHERE s.snapshot_date = current_date
--   ORDER BY p.display_name, s.value DESC;
--
--   SELECT * FROM competition_bidrag ORDER BY display_name, bidrag_kr DESC;
--
-- Vinneroppskriften ved sesongslutt (dag-for-dag-graf per aksje):
--   SELECT snapshot_date, ticker, quantity, price, value
--   FROM competition_snapshots
--   WHERE participant_id = '<vinnerens id>'
--   ORDER BY snapshot_date, ticker;
-- ============================================================
