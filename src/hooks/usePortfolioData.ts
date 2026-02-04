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

  // Exchange rates to NOK (approximate)
  const getExchangeRate = (currency: string): number => {
    const rates: Record<string, number> = {
      'NOK': 1,
      'USD': 11.0,  // 1 USD ≈ 11 NOK
      'DKK': 1.55,  // 1 DKK ≈ 1.55 NOK
      'EUR': 11.6,  // 1 EUR ≈ 11.6 NOK
    };
    return rates[currency] || 1;
  };

  const calculateHoldingValue = useCallback((
    holding: Holding,
    quote: StockQuote | undefined
  ): number => {
    if (quote && quote.price > 0) {
      const exchangeRate = getExchangeRate(quote.currency);
      return quote.price * holding.quantity * exchangeRate;
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

  useEffect(() => {
    refresh();
    // Refresh quotes every 5 minutes
    const interval = setInterval(() => fetchQuotes(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
    getExchangeRate,
  };
};
