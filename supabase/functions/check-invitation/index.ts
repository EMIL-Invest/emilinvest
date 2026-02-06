import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Enhanced rate limiting with exponential backoff
interface RateLimitRecord {
  count: number;
  resetTime: number;
  blockedUntil: number;
  violations: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const BASE_RATE_LIMIT = 5; // Initial max requests per window
const RATE_WINDOW = 60000; // 1 minute in milliseconds
const MAX_BACKOFF = 3600000; // Maximum block time: 1 hour

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
  const dynamicLimit = Math.max(2, BASE_RATE_LIMIT - record.violations);
  
  if (record.count >= dynamicLimit) {
    // Exceeded limit - apply exponential backoff
    record.violations = Math.min(record.violations + 1, 10);
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting (fallback to a generic key)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Cleanup old rate limit records
    cleanupRateLimitMap();
    
    // Check rate limit with exponential backoff
    const rateLimitResult = getRateLimitInfo(clientIP);
    if (rateLimitResult.limited) {
      console.log(`Rate limit exceeded for IP: ${clientIP}, retry after: ${rateLimitResult.retryAfter}s`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later.", invited: false }),
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
    const { email } = body;

    // Validate email is provided
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email required", invited: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 255 || !emailRegex.test(trimmedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format", invited: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email has a valid invitation
    const { data, error } = await supabase
      .from("invitations")
      .select("id, role, expires_at")
      .eq("email", trimmedEmail.toLowerCase())
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error("Error checking invitation:", error);
      // Return generic error to avoid information leakage
      return new Response(
        JSON.stringify({ error: "Unable to check invitation status", invited: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return minimal information - don't expose role to reduce information disclosure
    return new Response(
      JSON.stringify({ 
        invited: !!data, 
        role: data?.role || null,
        expiresAt: data?.expires_at || null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    // Return generic error message
    return new Response(
      JSON.stringify({ error: "An error occurred", invited: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
