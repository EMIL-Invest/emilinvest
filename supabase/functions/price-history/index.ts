import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * price-history - kurshistorikk til analyseverktøyet i admin.
 *
 * Henter justerte sluttkurser fra Yahoo Finance for aksjer, indekser
 * (OSEBX.OL) og valutakryss (USDNOK=X), slik at beta, volatilitet og
 * korrelasjoner kan regnes i nettleseren. Svar caches i tabellen
 * market_history_cache i 20 timer, så komiteen kan kjøre analysen mange
 * ganger om dagen uten å hamre Yahoo.
 *
 * Krever innlogget administrator (JWT i Authorization-headeren).
 *
 * Body: { tickers: string[], interval?: "1d"|"1wk"|"1mo", range?: "1y"|"2y"|"3y"|"5y"|"10y" }
 * Svar: { series: { [ticker]: { yahoo, currency, points: [{ d, c }] } }, fx: { [valuta]: [{ d, c }] } }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TICKER_REGEX = /^[A-Za-z0-9.^=-]{1,25}$/;
const MAX_TICKERS = 40;
const INTERVALLER = new Set(["1d", "1wk", "1mo"]);
const RANGER = new Set(["1y", "2y", "3y", "5y", "10y"]);
const CACHE_TTL_MS = 20 * 60 * 60 * 1000;

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });

/* Enkel rate limit per IP - 30 kall per minutt er rikelig for admin-bruk. */
const treff = new Map<string, { n: number; reset: number }>();
const rateLimited = (ip: string): boolean => {
  const now = Date.now();
  const r = treff.get(ip);
  if (!r || now > r.reset) {
    treff.set(ip, { n: 1, reset: now + 60_000 });
    return false;
  }
  r.n++;
  return r.n > 30;
};

/** Samme kartlegging som stock-prices, slik at porteføljens tickere treffer riktig Yahoo-symbol. */
const YAHOO: Record<string, string> = {
  AKERBP: "AKRBP.OL", AKRBP: "AKRBP.OL", EQNR: "EQNR.OL", KOG: "KOG.OL", DNB: "DNB.OL", TEL: "TEL.OL",
  MOWI: "MOWI.OL", ORK: "ORK.OL", YAR: "YAR.OL", SALM: "SALM.OL", SUBC: "SUBC.OL", NHY: "NHY.OL",
  BAKKA: "BAKKA.OL", SCATC: "SCATC.OL", AKER: "AKER.OL", FRO: "FRO.OL", PGS: "PGS.OL", AUSS: "AUSS.OL",
  GJF: "GJF.OL", STB: "STB.OL", VEI: "VEI.OL", LOKO: "LOKO.OL", CADLR: "CADLR.OL", PROT: "PROT.OL",
  SATS: "SATS.OL", VEND: "VEND.OL", "NOVO-B": "NOVO-B.CO",
};

const tilYahoo = (ticker: string): string => {
  if (ticker.includes("=") || ticker.startsWith("^")) return ticker; // valuta/indeks
  const base = ticker.replace(/\.(OL|CO|ST|HE|L|PA|DE|AS)$/i, "");
  if (YAHOO[base]) return YAHOO[base];
  return ticker;
};

interface Punkt { d: string; c: number }
interface Serie { yahoo: string; currency: string; points: Punkt[] }

const hentYahoo = async (yahoo: string, interval: string, range: string): Promise<Serie | null> => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?interval=${interval}&range=${range}&events=div`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; EMILInvest/1.0)" } });
  if (!res.ok) {
    console.error(`Yahoo ${yahoo}: ${res.status}`);
    return null;
  }
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return null;
  const ts: number[] = result.timestamp ?? [];
  const adj: (number | null)[] | undefined = result.indicators?.adjclose?.[0]?.adjclose;
  const close: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
  const kilde = adj && adj.length === ts.length ? adj : close;
  const points: Punkt[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = kilde[i];
    if (c === null || c === undefined || !isFinite(c) || c <= 0) continue;
    points.push({ d: new Date(ts[i] * 1000).toISOString().slice(0, 10), c });
  }
  let currency: string = result.meta?.currency ?? "";
  if (currency === "GBp") {
    currency = "GBP";
    for (const p of points) p.c = p.c / 100;
  }
  return { yahoo, currency, points };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "ukjent";
    if (rateLimited(ip)) return json({ error: "For mange forespørsler - prøv igjen om et minutt." }, 429);

    // --- Autentisering: må være innlogget administrator ---
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Ikke innlogget." }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brukerklient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: userData, error: userErr } = await brukerklient.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: "Ugyldig innlogging." }, 401);

    const admin = createClient(url, service);
    const { data: roller } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
    if (!roller?.some((r: { role: string }) => r.role === "admin")) {
      return json({ error: "Krever administratortilgang." }, 403);
    }

    // --- Validering ---
    const body = await req.json().catch(() => ({}));
    const interval = INTERVALLER.has(body.interval) ? body.interval : "1wk";
    const range = RANGER.has(body.range) ? body.range : "3y";
    const tickers: unknown = body.tickers;
    if (!Array.isArray(tickers) || tickers.length === 0) return json({ error: "tickers mangler." }, 400);
    if (tickers.length > MAX_TICKERS) return json({ error: `Maks ${MAX_TICKERS} tickere per kall.` }, 400);
    const gyldige: string[] = [];
    for (const t of tickers) {
      if (typeof t !== "string" || !TICKER_REGEX.test(t.trim())) return json({ error: `Ugyldig ticker: ${String(t)}` }, 400);
      gyldige.push(t.trim().toUpperCase());
    }

    // --- Cache-oppslag ---
    const noekler = gyldige.map((t) => `${tilYahoo(t)}|${interval}|${range}`);
    const { data: cachet } = await admin
      .from("market_history_cache")
      .select("key, data, fetched_at")
      .in("key", noekler);
    const cache = new Map<string, Serie>();
    const naa = Date.now();
    for (const rad of cachet ?? []) {
      if (naa - new Date(rad.fetched_at).getTime() < CACHE_TTL_MS) cache.set(rad.key, rad.data as Serie);
    }

    const series: Record<string, Serie> = {};
    const nye: { key: string; data: Serie; fetched_at: string }[] = [];

    const hentMedCache = async (yahoo: string): Promise<Serie | null> => {
      const key = `${yahoo}|${interval}|${range}`;
      const c = cache.get(key);
      if (c) return c;
      const s = await hentYahoo(yahoo, interval, range);
      if (s && s.points.length > 0) {
        nye.push({ key, data: s, fetched_at: new Date().toISOString() });
        cache.set(key, s);
      }
      return s;
    };

    await Promise.all(
      gyldige.map(async (t) => {
        const s = await hentMedCache(tilYahoo(t));
        if (s) series[t] = s;
      }),
    );

    // --- Valutakryss for alt som ikke er i NOK ---
    const valutaer = [...new Set(Object.values(series).map((s) => s.currency).filter((c) => c && c !== "NOK"))];
    const fx: Record<string, Punkt[]> = {};
    await Promise.all(
      valutaer.map(async (v) => {
        const s = await hentMedCache(`${v}NOK=X`);
        if (s) fx[v] = s.points;
      }),
    );

    if (nye.length > 0) {
      const { error } = await admin.from("market_history_cache").upsert(nye, { onConflict: "key" });
      if (error) console.error("Cache-skriving feilet:", error.message);
    }

    return json({ series, fx, interval, range, hentet: new Date().toISOString() });
  } catch (e) {
    console.error("price-history feilet:", e);
    return json({ error: "Kunne ikke hente kurshistorikk." }, 500);
  }
});
