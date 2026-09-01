import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { isExchangeOpen, getExchangeFromTicker, getExchangeInfo, getExchangeName } from "@/lib/exchangeHours";
import { KRAV_ANTALL_AKSJER } from "@/lib/konkurranseregler";

export interface OsloStock {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  is_active: boolean;
  exchange?: string;
}

export interface Participant {
  id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
  is_active: boolean;
  all_time_start_value: number;
  monthly_start_value: number;
  yearly_start_value: number;
  /** Når porteføljen først ble gyldig (minst 5 aksjer). Null = ikke ennå. */
  qualified_at: string | null;
}

export interface PortfolioHolding {
  id: string;
  participant_id: string;
  ticker: string;
  quantity: number;
  average_purchase_price: number;
}

export interface LeaderboardEntry {
  participant_id: string;
  display_name: string;
  portfolio_value: number;
  return_percentage: number;
  /** 0 for de som ennå ikke er kvalifisert — de rangeres ikke. */
  rank: number;
  antall_aksjer: number;
  kvalifisert: boolean;
}

/**
 * Hvor mange ulike aksjer som kreves for å bli rangert på ledertavlen.
 * Selve tallet bor nå i src/lib/konkurranseregler.ts sammen med de andre
 * konkurransereglene; det re-eksporteres her fordi flere komponenter
 * allerede importerer det herfra.
 */
export { KRAV_ANTALL_AKSJER };

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

const STARTING_CAPITAL = 100000;
const MAX_DAILY_TRANSACTIONS_PER_STOCK = 3;
export const useCompetition = () => {
  const [user, setUser] = useState<User | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [availableStocks, setAvailableStocks] = useState<OsloStock[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [leaderboard, setLeaderboard] = useState<{
    monthly: LeaderboardEntry[];
    yearly: LeaderboardEntry[];
    all_time: LeaderboardEntry[];
  }>({ monthly: [], yearly: [], all_time: [] });
  const [loading, setLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(false);

  // Fetch auth user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch available stocks
  const fetchStocks = useCallback(async () => {
    const { data, error } = await supabase
      .from("oslo_stocks")
      .select("*, exchange")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching stocks:", error);
      return;
    }

    setAvailableStocks(data || []);
  }, []);

  // Fetch participant data for current user
  const fetchParticipant = useCallback(async () => {
    if (!user) {
      setParticipant(null);
      setHoldings([]);
      return;
    }

    const { data, error } = await supabase
      .from("competition_participants")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching participant:", error);
      return;
    }

    setParticipant(data);

    if (data) {
      // Fetch holdings
      const { data: holdingsData, error: holdingsError } = await supabase
        .from("competition_portfolios")
        .select("*")
        .eq("participant_id", data.id);

      if (holdingsError) {
        console.error("Error fetching holdings:", holdingsError);
        return;
      }

      setHoldings(holdingsData || []);
    }
  }, [user]);

  // Fetch live quotes for all stocks
  const fetchQuotes = useCallback(async (tickers?: string[]) => {
    const tickersToFetch = tickers || availableStocks.map(s => s.ticker);
    if (tickersToFetch.length === 0) return;

    setQuotesLoading(true);
    try {
      // Edge-funksjonen godtar maks 250 tickere per kall — del opp i bolker
      // så kurslisten skalerer når aksjeuniverset vokser.
      const CHUNK = 150;
      const chunks: string[][] = [];
      for (let i = 0; i < tickersToFetch.length; i += CHUNK) {
        chunks.push(tickersToFetch.slice(i, i + CHUNK));
      }

      const results = await Promise.all(
        chunks.map((chunk) =>
          supabase.functions.invoke("stock-prices", { body: { tickers: chunk } })
        )
      );

      const quotesMap: Record<string, StockQuote> = {};
      for (const { data, error } of results) {
        if (error) {
          console.error("Error fetching quotes:", error?.message || "Unknown error");
          continue;
        }
        if (data?.quotes) {
          data.quotes.forEach((q: StockQuote) => {
            quotesMap[q.ticker] = q;
          });
        }
      }
      if (Object.keys(quotesMap).length > 0) {
        setQuotes(prev => ({ ...prev, ...quotesMap }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching quotes:", errorMessage);
    } finally {
      setQuotesLoading(false);
    }
  }, [availableStocks]);

  // Calculate portfolio value
  const calculatePortfolioValue = useCallback((
    holdingsList: PortfolioHolding[],
    quotesMap: Record<string, StockQuote>
  ): number => {
    let totalValue = 0;

    for (const holding of holdingsList) {
      if (holding.ticker === "ASK") {
        // Cash position - no conversion needed
        totalValue += Number(holding.quantity);
      } else {
        const quote = quotesMap[holding.ticker];
        if (quote && quote.price > 0) {
          totalValue += quote.price * Number(holding.quantity);
        } else {
          // Fallback to purchase price
          totalValue += Number(holding.average_purchase_price) * Number(holding.quantity);
        }
      }
    }

    return totalValue;
  }, []);

  // Get cash balance (ASK)
  const getCashBalance = useCallback((): number => {
    const cashHolding = holdings.find(h => h.ticker === "ASK");
    return cashHolding ? Number(cashHolding.quantity) : 0;
  }, [holdings]);

  // Fetch all participants for leaderboard
  const fetchLeaderboard = useCallback(async () => {
    const { data: participants, error } = await supabase
      .from("competition_participants")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching participants:", error);
      return;
    }

    if (!participants || participants.length === 0) {
      setLeaderboard({ monthly: [], yearly: [], all_time: [] });
      return;
    }

    // Fetch all holdings
    const { data: allHoldings, error: holdingsError } = await supabase
      .from("competition_portfolios")
      .select("*");

    if (holdingsError) {
      console.error("Error fetching all holdings:", holdingsError);
      return;
    }

    // Get unique tickers for quotes
    const tickers = [...new Set(allHoldings?.filter(h => h.ticker !== "ASK").map(h => h.ticker) || [])];
    
    // Fetch quotes directly and use them immediately (avoid stale closure)
    const freshQuotes: Record<string, StockQuote> = {};
    if (tickers.length > 0) {
      try {
        const { data, error: quotesError } = await supabase.functions.invoke("stock-prices", {
          body: { tickers },
        });

        if (!quotesError && data?.quotes) {
          data.quotes.forEach((q: StockQuote) => {
            freshQuotes[q.ticker] = q;
          });
          // Also update the quotes state for other components
          setQuotes(prev => ({ ...prev, ...freshQuotes }));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Error fetching quotes for leaderboard:", errorMessage);
      }
    }

    // Calculate values and returns for each participant using fresh quotes
    const calculateEntries = (periodType: "monthly" | "yearly" | "all_time"): LeaderboardEntry[] => {
      const entries: LeaderboardEntry[] = [];

      for (const p of participants) {
        const participantHoldings = allHoldings?.filter(h => h.participant_id === p.id) || [];
        const portfolioValue = calculatePortfolioValue(participantHoldings, freshQuotes);
        
        let startValue: number;
        switch (periodType) {
          case "monthly":
            startValue = Number(p.monthly_start_value);
            break;
          case "yearly":
            startValue = Number(p.yearly_start_value);
            break;
          default:
            startValue = Number(p.all_time_start_value);
        }

        const returnPercentage = startValue > 0 
          ? ((portfolioValue - startValue) / startValue) * 100 
          : 0;

        const antallAksjer = participantHoldings.filter((h) => h.ticker !== "ASK").length;

        entries.push({
          participant_id: p.id,
          display_name: p.display_name,
          portfolio_value: portfolioValue,
          return_percentage: returnPercentage,
          rank: 0,
          antall_aksjer: antallAksjer,
          kvalifisert: antallAksjer >= KRAV_ANTALL_AKSJER,
        });
      }

      // Sorter på avkastning, men ranger bare dem som oppfyller
      // diversifiseringskravet. De øvrige får rank 0 og vises i en egen
      // gruppe under tabellen, slik at det er tydelig hva som mangler.
      entries.sort((a, b) => b.return_percentage - a.return_percentage);

      let plassering = 0;
      entries.forEach((entry) => {
        entry.rank = entry.kvalifisert ? ++plassering : 0;
      });

      return entries;
    };

    setLeaderboard({
      monthly: calculateEntries("monthly"),
      yearly: calculateEntries("yearly"),
      all_time: calculateEntries("all_time"),
    });
  }, [calculatePortfolioValue]);

  // Join competition (atomic via database function: deltaker + startkapital i én transaksjon)
  const joinCompetition = async (displayName: string): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error("Du må være innlogget for å delta") };
    }

    const { data, error } = await supabase.rpc("competition_join", {
      _display_name: displayName,
    });

    if (error) {
      console.error("Error joining competition:", error);
      return { error: new Error("Kunne ikke melde deg på konkurransen") };
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      return { error: new Error(result.error || "Påmelding feilet") };
    }

    await fetchParticipant();
    return { error: null };
  };

  // Check daily transaction count for a specific stock.
  // NB: bruker UTC-midnatt slik at grensen samsvarer eksakt med serverens
  // date_trunc('day', now()) — ellers spriker UI og server med 1-2 timer i Norge.
  const getDailyTransactionCount = async (participantId: string, ticker: string): Promise<number> => {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const { count, error } = await supabase
      .from("competition_transactions")
      .select("*", { count: "exact", head: true })
      .eq("participant_id", participantId)
      .eq("ticker", ticker)
      .gte("executed_at", today.toISOString())
      .lt("executed_at", tomorrow.toISOString());

    if (error) {
      console.error("Error counting transactions:", error);
      return 0;
    }

    return count || 0;
  };

  // Get exchange for a stock
  const getStockExchange = (ticker: string): string => {
    const stock = availableStocks.find(s => s.ticker === ticker);
    return stock?.exchange || getExchangeFromTicker(ticker);
  };

  // Buy stock (atomic via database function)
  const buyStock = async (
    ticker: string,
    quantity: number,
    price: number
  ): Promise<{ error: Error | null; nyligKvalifisert?: boolean }> => {
    if (!participant) {
      return { error: new Error("Du må være påmeldt konkurransen") };
    }

    // Check if exchange is open (client-side check for UX, server enforces atomicity)
    const exchange = getStockExchange(ticker);
    if (!isExchangeOpen(exchange)) {
      const info = getExchangeInfo(exchange);
      const exchangeName = getExchangeName(exchange);
      return { 
        error: new Error(`${exchangeName} er stengt. Åpningstider: ${info.openTime}–${info.closeTime} norsk tid (${info.tradingDays})`) 
      };
    }

    const { data, error } = await supabase.rpc("competition_buy_stock", {
      _participant_id: participant.id,
      _ticker: ticker,
      _quantity: quantity,
      _price: price,
    });

    if (error) {
      console.error("Error buying stock:", error);
      return { error: new Error("Kunne ikke gjennomføre kjøp") };
    }

    const result = data as { success: boolean; error?: string; nylig_kvalifisert?: boolean };
    if (!result.success) {
      return { error: new Error(result.error || "Kjøp feilet") };
    }

    await fetchParticipant();
    return { error: null, nyligKvalifisert: result.nylig_kvalifisert === true };
  };

  // Sell stock (atomic via database function)
  const sellStock = async (ticker: string, quantity: number, price: number): Promise<{ error: Error | null }> => {
    if (!participant) {
      return { error: new Error("Du må være påmeldt konkurransen") };
    }

    // Check if exchange is open (client-side check for UX, server enforces atomicity)
    const exchange = getStockExchange(ticker);
    if (!isExchangeOpen(exchange)) {
      const info = getExchangeInfo(exchange);
      const exchangeName = getExchangeName(exchange);
      return { 
        error: new Error(`${exchangeName} er stengt. Åpningstider: ${info.openTime}–${info.closeTime} norsk tid (${info.tradingDays})`) 
      };
    }

    const { data, error } = await supabase.rpc("competition_sell_stock", {
      _participant_id: participant.id,
      _ticker: ticker,
      _quantity: quantity,
      _price: price,
    });

    if (error) {
      console.error("Error selling stock:", error);
      return { error: new Error("Kunne ikke gjennomføre salg") };
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      return { error: new Error(result.error || "Salg feilet") };
    }

    await fetchParticipant();
    return { error: null };
  };

  // Helper to check if trading is allowed for a stock
  const checkTradingAllowed = async (ticker: string): Promise<{ allowed: boolean; reason?: string; dailyCount?: number }> => {
    const exchange = getStockExchange(ticker);
    
    if (!isExchangeOpen(exchange)) {
      const info = getExchangeInfo(exchange);
      const exchangeName = getExchangeName(exchange);
      return { 
        allowed: false, 
        reason: `${exchangeName} er stengt. Åpningstider: ${info.openTime}–${info.closeTime} norsk tid (${info.tradingDays})` 
      };
    }

    if (participant) {
      const dailyCount = await getDailyTransactionCount(participant.id, ticker);
      if (dailyCount >= MAX_DAILY_TRANSACTIONS_PER_STOCK) {
        return { 
          allowed: false, 
          reason: `Maks ${MAX_DAILY_TRANSACTIONS_PER_STOCK} transaksjoner per dag nådd`,
          dailyCount
        };
      }
      return { allowed: true, dailyCount };
    }

    return { allowed: true };
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchStocks();
      await fetchParticipant();
      setLoading(false);
    };

    loadData();
  }, [fetchStocks, fetchParticipant]);

  // Fetch quotes when stocks are loaded, then every 30 seconds
  useEffect(() => {
    if (availableStocks.length > 0) {
      fetchQuotes();
      const interval = setInterval(() => fetchQuotes(), 30 * 1000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [availableStocks.length, fetchQuotes]);

  // Fetch leaderboard periodically (less often since it uses cached quotes)
  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 60 * 1000); // Every 60 seconds
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  return {
    user,
    participant,
    holdings,
    availableStocks,
    quotes,
    leaderboard,
    loading,
    quotesLoading,
    joinCompetition,
    buyStock,
    sellStock,
    fetchQuotes,
    getCashBalance,
    calculatePortfolioValue,
    checkTradingAllowed,
    getStockExchange,
    STARTING_CAPITAL,
    MAX_DAILY_TRANSACTIONS_PER_STOCK,
  };
};
