import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

async function fetchYahooQuote(ticker: string): Promise<StockQuote | null> {
  try {
    // Map tickers to Yahoo Finance format
    const yahooTicker = ticker.endsWith(".OSE") ? ticker : 
                        ticker === "AKRBP" ? "AKRBP.OL" :
                        ticker === "EQNR" ? "EQNR.OL" :
                        ticker;

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${ticker}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      console.error(`No result for ${ticker}`);
      return null;
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice || 0;
    const previousClose = meta.previousClose || price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      ticker: ticker,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      currency: meta.currency || "NOK",
    };
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tickers } = await req.json();

    if (!tickers || !Array.isArray(tickers)) {
      return new Response(
        JSON.stringify({ error: "Invalid tickers array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching prices for:", tickers);

    const quotes = await Promise.all(
      tickers.map((ticker: string) => fetchYahooQuote(ticker))
    );

    const validQuotes = quotes.filter((q): q is StockQuote => q !== null);

    console.log("Fetched quotes:", validQuotes);

    return new Response(
      JSON.stringify({ quotes: validQuotes, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
