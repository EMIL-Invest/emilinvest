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

// Validation constants
const MAX_TICKERS = 250;
const TICKER_REGEX = /^[A-Za-z0-9.-]{1,25}$/;

// Rate limiting configuration
interface RateLimitRecord {
  count: number;
  resetTime: number;
  blockedUntil: number;
  violations: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT = 20; // Max requests per window
const RATE_WINDOW = 60000; // 1 minute in milliseconds
const MAX_BACKOFF = 300000; // Maximum block time: 5 minutes

function getRateLimitInfo(identifier: string): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  // No record or window expired - reset
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { 
      count: 1, 
      resetTime: now + RATE_WINDOW,
      blockedUntil: 0,
      violations: record?.violations || 0
    });
    return { limited: false, retryAfter: 0 };
  }
  
  // Currently blocked due to previous violations
  if (record.blockedUntil > now) {
    const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
    return { limited: true, retryAfter };
  }
  
  // Calculate dynamic limit based on violations (exponential backoff)
  const dynamicLimit = Math.max(5, RATE_LIMIT - (record.violations * 2));
  
  if (record.count >= dynamicLimit) {
    // Exceeded limit - apply exponential backoff
    record.violations = Math.min(record.violations + 1, 5);
    const backoffTime = Math.min(RATE_WINDOW * Math.pow(2, record.violations), MAX_BACKOFF);
    record.blockedUntil = now + backoffTime;
    const retryAfter = Math.ceil(backoffTime / 1000);
    console.log(`Rate limit violation #${record.violations} for IP, blocked for ${retryAfter}s`);
    return { limited: true, retryAfter };
  }
  
  record.count++;
  return { limited: false, retryAfter: 0 };
}

// Clean up old records periodically (every 100 requests)
let requestCount = 0;
function cleanupRateLimitMap() {
  requestCount++;
  if (requestCount % 100 === 0) {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      // Remove records that are expired and not blocked
      if (now > record.resetTime && now > record.blockedUntil) {
        rateLimitMap.delete(key);
      }
    }
  }
}

// Convert NOK price based on currency
function convertToNOK(price: number, currency: string): number {
  const rates: Record<string, number> = {
    "NOK": 1,
    "USD": 11.0,
    "DKK": 1.55,
    "EUR": 11.6,
    "SEK": 1.05,
    "GBP": 13.5,
    "JPY": 0.073,
    "TWD": 0.34,
    "CAD": 7.7,
  };
  return price * (rates[currency] || 1);
}

// Map ticker to Yahoo Finance format
function getYahooTicker(ticker: string): string {
  // Remove existing suffix to normalize, then apply correct mapping
  const baseTicker = ticker.replace(/\.(OL|CO|ST|HE|L|PA|DE)$/i, "");
  
  const yahooMappings: Record<string, string> = {
    // Oslo Børs special cases
    "AKERBP": "AKRBP.OL",
    "AKRBP": "AKRBP.OL",
    "EQNR": "EQNR.OL",
    "KOG": "KOG.OL",
    "DNB": "DNB.OL",
    "TEL": "TEL.OL",
    "MOWI": "MOWI.OL",
    "ORK": "ORK.OL",
    "YAR": "YAR.OL",
    "SALM": "SALM.OL",
    "SUBC": "SUBC.OL",
    "NHY": "NHY.OL",
    "BAKKA": "BAKKA.OL",
    "SCATC": "SCATC.OL",
    "AKER": "AKER.OL",
    "FRO": "FRO.OL",
    "PGS": "PGS.OL",
    "AUSS": "AUSS.OL",
    "GJF": "GJF.OL",
    "STB": "STB.OL",
    "VEI": "VEI.OL",
    "LOKO": "LOKO.OL",
    "CADLR": "CADLR.OL",
    "VEND": "VEND.OL",
    
    // Copenhagen
    "NOVO-B": "NOVO-B.CO",
    
    // US stocks - no suffix
    "AAPL": "AAPL",
    "AMZN": "AMZN",
    "GOOGL": "GOOGL",
    "MSFT": "MSFT",
    "NVDA": "NVDA",
    "TSLA": "TSLA",
    "META": "META",
    "JPM": "JPM",
    "TSM": "TSM",
    "CCJ": "CCJ",
    "TTWO": "TTWO",
    "XYZ": "XYZ",
    
    // Crypto
    "BTC-USD": "BTC-USD",
    "ETH-USD": "ETH-USD",
    "SOL-USD": "SOL-USD",
  };

  // Check if we have a specific mapping
  if (yahooMappings[baseTicker]) {
    return yahooMappings[baseTicker];
  }

  // If ticker already has a known suffix, use as-is
  if (ticker.includes(".")) {
    return ticker;
  }

  // Default: assume it's already in Yahoo format
  return ticker;
}

async function fetchYahooQuote(originalTicker: string): Promise<StockQuote | null> {
  try {
    const yahooTicker = getYahooTicker(originalTicker);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=1d&range=5d`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${originalTicker} (${yahooTicker}): ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      console.error(`No result for ${originalTicker} (${yahooTicker})`);
      return null;
    }

    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close;
    
    // Use regularMarketPrice first, fallback to last close in the data
    let price = meta.regularMarketPrice;
    
    // If market is closed or price is 0, get the last available close price
    if (!price || price === 0) {
      if (closes && closes.length > 0) {
        for (let i = closes.length - 1; i >= 0; i--) {
          if (closes[i] !== null && closes[i] > 0) {
            price = closes[i];
            break;
          }
        }
      }
    }
    
    // Still no price? Use chartPreviousClose
    if (!price || price === 0) {
      price = meta.chartPreviousClose || meta.previousClose || 0;
    }

    // Calculate daily change from chart data (last two valid closes)
    let previousClose = price; // fallback: no change
    if (closes && closes.length >= 2) {
      // Find last two non-null close values
      const validCloses: number[] = [];
      for (let i = closes.length - 1; i >= 0 && validCloses.length < 2; i--) {
        if (closes[i] !== null && closes[i] > 0) {
          validCloses.unshift(closes[i]);
        }
      }
      if (validCloses.length === 2) {
        previousClose = validCloses[0]; // second-to-last valid close
      }
    }
    
    // Fallback to meta previousClose only if chart data wasn't sufficient
    if (previousClose === price) {
      previousClose = meta.previousClose || meta.chartPreviousClose || price;
    }

    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    
    const currency = meta.currency || "NOK";
    const priceInNOK = convertToNOK(price, currency);
    const changeInNOK = convertToNOK(change, currency);
    
    console.log(`${originalTicker}: price=${price} ${currency} -> ${priceInNOK} NOK`);

    return {
      ticker: originalTicker, // Return the ORIGINAL ticker for frontend mapping
      price: Math.round(priceInNOK * 100) / 100,
      change: Math.round(changeInNOK * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      currency: "NOK", // All prices converted to NOK
    };
  } catch (error) {
    console.error(`Error fetching ${originalTicker}:`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Cleanup old rate limit records periodically
    cleanupRateLimitMap();
    
    // Check rate limit with exponential backoff
    const rateLimitResult = getRateLimitInfo(clientIP);
    if (rateLimitResult.limited) {
      console.log(`Rate limit exceeded for IP: ${clientIP}, retry after: ${rateLimitResult.retryAfter}s`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter)
          } 
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { tickers } = body;

    // Validate tickers array exists and is an array
    if (!tickers || !Array.isArray(tickers)) {
      return new Response(
        JSON.stringify({ error: "Invalid tickers array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate array length to prevent resource exhaustion
    if (tickers.length > MAX_TICKERS) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_TICKERS} tickers allowed per request` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tickers.length === 0) {
      return new Response(
        JSON.stringify({ quotes: [], timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each ticker format
    const validTickers: string[] = [];
    for (const ticker of tickers) {
      if (typeof ticker !== "string") {
        return new Response(
          JSON.stringify({ error: "All tickers must be strings" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const trimmedTicker = ticker.trim().toUpperCase();
      if (!TICKER_REGEX.test(trimmedTicker)) {
        return new Response(
          JSON.stringify({ error: `Invalid ticker format: ${ticker}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      validTickers.push(trimmedTicker);
    }

    console.log("Fetching prices for:", validTickers);

    // Fetch all quotes in parallel
    const quotes = await Promise.all(
      validTickers.map((ticker: string) => fetchYahooQuote(ticker))
    );

    const validQuotes = quotes.filter((q): q is StockQuote => q !== null && q.price > 0);

    console.log("Fetched quotes:", validQuotes.length, "of", validTickers.length);

    return new Response(
      JSON.stringify({ quotes: validQuotes, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred while fetching stock prices" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
