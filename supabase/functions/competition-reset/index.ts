import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - restrict to known domains.
// Kan overstyres med miljøvariabelen ALLOWED_ORIGINS (kommaseparert liste)
// — sett den når endelig Vercel-/eget domene er klart:
//   supabase secrets set ALLOWED_ORIGINS=https://ditt-domene.no,http://localhost:8080
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "https://emilinvest.vercel.app",
  "https://emilinvest.lovable.app",
];
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS")?.split(",").map((s) => s.trim()).filter(Boolean)) ?? DEFAULT_ALLOWED_ORIGINS;

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

interface StockQuote {
  ticker: string;
  price: number;
  currency: string;
}

// Valid reset types
const VALID_RESET_TYPES = ["monthly", "yearly", "both"] as const;
type ResetType = typeof VALID_RESET_TYPES[number];

// Exchange rates to NOK
// Hold denne i sync med stock-prices/index.ts (FX_TO_NOK).
const getExchangeRate = (currency: string): number => {
  const rates: Record<string, number> = {
    'NOK': 1,
    'USD': 11.0,
    'DKK': 1.55,
    'EUR': 11.6,
    'SEK': 1.05,
    'GBP': 13.5,
    'GBp': 0.135,
    'GBX': 0.135,
    'CHF': 12.6,
    'JPY': 0.073,
    'TWD': 0.34,
    'CAD': 7.7,
  };
  const rate = rates[currency];
  if (rate === undefined) {
    console.warn(`Ukjent valuta "${currency}" — bruker 1:1 mot NOK. Legg den til i kurstabellen!`);
    return 1;
  }
  return rate;
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

async function validateAdminAuth(supabase: ReturnType<typeof createClient>, authHeader: string | null): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return false;
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    return !!roleData;
  } catch (error) {
    console.error('Auth validation error:', error);
    return false;
  }
}

function isValidResetType(value: unknown): value is ResetType {
  return typeof value === "string" && VALID_RESET_TYPES.includes(value as ResetType);
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate authentication - accept either admin JWT or CRON_SECRET
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get("CRON_SECRET");
    
    const isCronAuth = cronSecret && expectedCronSecret && cronSecret === expectedCronSecret;
    const isAdmin = !isCronAuth ? await validateAdminAuth(supabase, authHeader) : false;
    
    if (!isAdmin && !isCronAuth) {
      console.log('Unauthorized access attempt to competition-reset');
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate reset type from request body
    const body = await req.json().catch(() => ({}));
    const reset_type = body.reset_type ?? "monthly";
    
    if (!isValidResetType(reset_type)) {
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
      JSON.stringify({ error: "An error occurred during competition reset" }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('Origin')), "Content-Type": "application/json" } }
    );
  }
});
