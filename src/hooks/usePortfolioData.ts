import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  purchase_price: number;
  cost_basis: number | null;
  holding_type: string;
  sector: string | null;
  exchange: string | null;
  /** Datoen posisjonen ble kjøpt - utgangspunktet avkastningen måles fra. */
  purchase_date: string | null;
}

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

export interface HistoryPoint {
  date: string;
  portfolio_value: number;
  osebx_value: number | null;
  invested_capital: number | null;
}

export const usePortfolioData = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHoldings = useCallback(async () => {
    const { data, error } = await supabase
      .from("portfolio_holdings")
      .select("*")
      .order("holding_type", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching holdings:", error);
      return [];
    }
    
    setHoldings(data || []);
    return data || [];
  }, []);

  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from("portfolio_history")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching history:", error);
      return [];
    }
    
    setHistory(data || []);
    return data || [];
  }, []);

  const fetchQuotes = useCallback(async (holdingsList?: Holding[]) => {
    const stockHoldings = (holdingsList || holdings).filter(h => h.holding_type === "stock");
    if (stockHoldings.length === 0) return {};

    setQuotesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stock-prices", {
        body: { tickers: stockHoldings.map(s => s.ticker) },
      });

      if (error) {
        console.error("Error fetching prices:", error);
        return {};
      }

      if (data?.quotes) {
        const quotesMap: Record<string, StockQuote> = {};
        data.quotes.forEach((q: StockQuote) => {
          quotesMap[q.ticker] = q;
        });
        setQuotes(quotesMap);
        setLastUpdated(new Date());
        return quotesMap;
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setQuotesLoading(false);
    }
    return {};
  }, [holdings]);

  const calculateHoldingValue = useCallback((
    holding: Holding,
    quote: StockQuote | undefined
  ): number => {
    // Edge-funksjonen stock-prices returnerer alltid priser i NOK,
    // så ingen valutakonvertering skal skje på klienten.
    if (quote && quote.price > 0) {
      return quote.price * holding.quantity;
    }
    // Use cost_basis as fallback (already in NOK)
    return holding.cost_basis || (holding.purchase_price * holding.quantity);
  }, []);

  const calculatePortfolioValue = useCallback((
    holdingsList: Holding[],
    quotesMap: Record<string, StockQuote>
  ) => {
    let totalValue = 0;

    for (const holding of holdingsList) {
      if (holding.holding_type === "stock") {
        totalValue += calculateHoldingValue(holding, quotesMap[holding.ticker]);
      } else {
        // Fond og andre beholdninger har ingen live-kurs - bruk kostbasis
        // slik at totalverdien ikke underrapporterer klubbens verdi.
        totalValue += holding.cost_basis || (holding.purchase_price * holding.quantity);
      }
    }

    return totalValue;
  }, [calculateHoldingValue]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const holdingsData = await fetchHoldings();
    await fetchHistory();
    await fetchQuotes(holdingsData);
    setLoading(false);
  }, [fetchHoldings, fetchHistory, fetchQuotes]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    refresh();
  }, []);

  // Automatisk kursoppdatering hvert 5. minutt.
  // NB: fetchQuotes må stå i deps - den gjenskapes når holdings endres,
  // ellers fryser intervallet på en tom holdings-liste (stale closure).
  useEffect(() => {
    const interval = setInterval(() => fetchQuotes(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  return {
    holdings,
    quotes,
    history,
    loading,
    quotesLoading,
    lastUpdated,
    fetchQuotes,
    refresh,
    calculatePortfolioValue,
    calculateHoldingValue,
  };
};
