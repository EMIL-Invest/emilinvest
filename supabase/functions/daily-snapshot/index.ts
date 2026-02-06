import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - restrict to known domains
const ALLOWED_ORIGINS = [
  "https://emilinvest.lovable.app",
  "https://id-preview--3ff7494c-b252-4fda-b060-04c40f323061.lovable.app",
];

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

interface Holding {
  ticker: string;
  quantity: number;
  exchange: string;
  cost_basis: number;
}

// Map database tickers to Yahoo Finance format
function getYahooTicker(ticker: string): string {
  const tickerMappings: Record<string, string> = {
    "EQNR": "EQNR.OL",
    "AKERBP": "AKRBP.OL",
    "KOG": "KOG.OL",
    "NOVO-B": "NOVO-B.CO",
    "AAPL": "AAPL",
    "AMZN": "AMZN",
    "JPM": "JPM",
    "TSM": "TSM",
    "CCJ": "CCJ",
    "TTWO": "TTWO",
  };
  return tickerMappings[ticker] || ticker;
}

// Exchange rates to NOK
function getExchangeRate(currency: string): number {
  const rates: Record<string, number> = {
    'NOK': 1,
    'USD': 11.0,
    'DKK': 1.55,
    'EUR': 11.6,
  };
  return rates[currency] || 1;
}

async function fetchStockPrice(ticker: string): Promise<StockQuote | null> {
  try {
    const yahooTicker = getYahooTicker(ticker);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${ticker}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice || meta.previousClose || 0;

    return {
      ticker,
      price: Math.round(price * 100) / 100,
      currency: meta.currency || 'USD',
    };
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return null;
  }
}

async function fetchOSEBX(): Promise<number | null> {
  try {
    // OSEBX is the Oslo Børs Benchmark Index (OBX)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/OBX.OL?interval=1d&range=5d`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!response.ok) {
      console.error(`Failed to fetch OSEBX: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) return null;

    const meta = result.meta;
    return meta.regularMarketPrice || meta.previousClose || null;
  } catch (error) {
    console.error('Error fetching OSEBX:', error);
    return null;
  }
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

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting daily snapshot...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate authentication - require admin role for this administrative function
    const authHeader = req.headers.get('Authorization');
    const isAdmin = await validateAdminAuth(supabase, authHeader);
    
    if (!isAdmin) {
      console.log('Unauthorized access attempt to daily-snapshot');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`Creating snapshot for date: ${today}`);

    // Check if we already have a snapshot for today
    const { data: existingSnapshot } = await supabase
      .from('portfolio_history')
      .select('id')
      .eq('date', today)
      .single();

    // Fetch all holdings
    const { data: holdings, error: holdingsError } = await supabase
      .from('portfolio_holdings')
      .select('ticker, quantity, exchange, cost_basis')
      .eq('holding_type', 'stock');

    if (holdingsError) {
      console.error('Error fetching holdings:', holdingsError);
      throw holdingsError;
    }

    console.log(`Found ${holdings?.length || 0} holdings`);

    // Calculate total portfolio value
    let portfolioValue = 0;
    let totalInvestedCapital = 0;

    for (const holding of holdings || []) {
      const quote = await fetchStockPrice(holding.ticker);
      if (quote && quote.price > 0) {
        const exchangeRate = getExchangeRate(quote.currency);
        const value = quote.price * holding.quantity * exchangeRate;
        portfolioValue += value;
        console.log(`${holding.ticker}: ${quote.price} ${quote.currency} x ${holding.quantity} = ${value.toFixed(0)} NOK`);
      } else {
        // Fallback to cost_basis
        portfolioValue += holding.cost_basis || 0;
      }
      totalInvestedCapital += holding.cost_basis || 0;
    }

    // Fetch OSEBX value
    const osebxValue = await fetchOSEBX();
    console.log(`OSEBX value: ${osebxValue}`);

    // Round values
    portfolioValue = Math.round(portfolioValue);
    
    console.log(`Portfolio value: ${portfolioValue} NOK`);
    console.log(`Invested capital: ${totalInvestedCapital} NOK`);

    // Insert or update today's snapshot
    if (existingSnapshot) {
      const { error: updateError } = await supabase
        .from('portfolio_history')
        .update({
          portfolio_value: portfolioValue,
          invested_capital: totalInvestedCapital,
          osebx_value: osebxValue,
        })
        .eq('id', existingSnapshot.id);

      if (updateError) throw updateError;
      console.log('Updated existing snapshot');
    } else {
      const { error: insertError } = await supabase
        .from('portfolio_history')
        .insert({
          date: today,
          portfolio_value: portfolioValue,
          invested_capital: totalInvestedCapital,
          osebx_value: osebxValue,
        });

      if (insertError) throw insertError;
      console.log('Created new snapshot');
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        portfolio_value: portfolioValue,
        invested_capital: totalInvestedCapital,
        osebx_value: osebxValue,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Snapshot error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while creating snapshot' }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' } }
    );
  }
});
