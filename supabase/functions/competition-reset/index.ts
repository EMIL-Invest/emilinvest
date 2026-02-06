import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PortfolioHolding {
  participant_id: string;
  ticker: string;
  quantity: number;
  average_purchase_price: number;
}

interface StockQuote {
  ticker: string;
  price: number;
  currency: string;
}

// Exchange rates to NOK
const getExchangeRate = (currency: string): number => {
  const rates: Record<string, number> = {
    'NOK': 1,
    'USD': 11.0,
    'DKK': 1.55,
    'EUR': 11.6,
    'SEK': 1.05,
    'CHF': 12.5,
    'GBP': 14.0,
    'GBp': 0.14, // British pence
  };
  return rates[currency] || 1;
};

async function fetchQuotes(tickers: string[]): Promise<Record<string, StockQuote>> {
  const quotesMap: Record<string, StockQuote> = {};
  
  // Fetch in batches of 25
  for (let i = 0; i < tickers.length; i += 25) {
    const batch = tickers.slice(i, i + 25);
    
    for (const ticker of batch) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        
        if (response.ok) {
          const data = await response.json();
          const result = data.chart?.result?.[0];
          if (result) {
            const meta = result.meta;
            const price = meta.regularMarketPrice || meta.previousClose || 0;
            const currency = meta.currency || 'USD';
            
            quotesMap[ticker] = { ticker, price, currency };
          }
        }
      } catch (error) {
        console.error(`Error fetching ${ticker}:`, error);
      }
    }
  }
  
  return quotesMap;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse reset type from request body
    const { reset_type } = await req.json().catch(() => ({ reset_type: "monthly" }));
    
    if (!["monthly", "yearly", "both"].includes(reset_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid reset_type. Use 'monthly', 'yearly', or 'both'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting ${reset_type} competition reset...`);

    // Get all active participants
    const { data: participants, error: participantsError } = await supabase
      .from("competition_participants")
      .select("*")
      .eq("is_active", true);

    if (participantsError) {
      throw new Error(`Error fetching participants: ${participantsError.message}`);
    }

    if (!participants || participants.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active participants to reset" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${participants.length} active participants`);

    // Get all portfolio holdings
    const { data: allHoldings, error: holdingsError } = await supabase
      .from("competition_portfolios")
      .select("*");

    if (holdingsError) {
      throw new Error(`Error fetching holdings: ${holdingsError.message}`);
    }

    // Get unique tickers (excluding ASK)
    const tickers = [...new Set(
      (allHoldings || [])
        .filter(h => h.ticker !== "ASK")
        .map(h => h.ticker)
    )];

    // Fetch current quotes
    const quotes = tickers.length > 0 ? await fetchQuotes(tickers) : {};
    console.log(`Fetched quotes for ${Object.keys(quotes).length} tickers`);

    // Calculate and update each participant
    const updates: { id: string; newValue: number }[] = [];
    
    for (const participant of participants) {
      const participantHoldings = (allHoldings || []).filter(
        h => h.participant_id === participant.id
      );

      let portfolioValue = 0;

      for (const holding of participantHoldings) {
        if (holding.ticker === "ASK") {
          portfolioValue += Number(holding.quantity);
        } else {
          const quote = quotes[holding.ticker];
          if (quote && quote.price > 0) {
            const exchangeRate = getExchangeRate(quote.currency);
            portfolioValue += quote.price * Number(holding.quantity) * exchangeRate;
          } else {
            // Fallback to purchase price
            portfolioValue += Number(holding.average_purchase_price) * Number(holding.quantity);
          }
        }
      }

      updates.push({ id: participant.id, newValue: portfolioValue });
    }

    // Update participants based on reset type
    const now = new Date().toISOString();
    let updatedCount = 0;

    for (const update of updates) {
      const updateData: Record<string, unknown> = {};

      if (reset_type === "monthly" || reset_type === "both") {
        updateData.monthly_start_value = update.newValue;
        updateData.monthly_start_date = now;
      }

      if (reset_type === "yearly" || reset_type === "both") {
        updateData.yearly_start_value = update.newValue;
        updateData.yearly_start_date = now;
      }

      const { error: updateError } = await supabase
        .from("competition_participants")
        .update(updateData)
        .eq("id", update.id);

      if (updateError) {
        console.error(`Error updating participant ${update.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`Updated participant ${update.id}: ${update.newValue.toFixed(0)} NOK`);
      }
    }

    const result = {
      success: true,
      reset_type,
      participants_updated: updatedCount,
      timestamp: now,
    };

    console.log("Competition reset completed:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Competition reset error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
