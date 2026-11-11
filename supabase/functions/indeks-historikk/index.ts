import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * indeks-historikk - sluttkurser for indeksene forsiden sammenligner porteføljen med.
 *
 * Åpen for alle (forsiden er offentlig), men tar ingen tickere som input: listen
 * under er fast, så funksjonen kan ikke brukes som en generell Yahoo-proxy.
 * Alt regnes om til NOK med daglig valutakurs, slik at indeksene kan sammenlignes
 * rett mot porteføljen. Svar caches i market_history_cache (samme tabell som
 * price-history) i 10 minutter.
 *
 * Svar: { serier: { [nøkkel]: { navn, punkter: [{ d, c }] } }, hentet }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Verdensindeksen følges via iShares MSCI World (URTH), som speiler MSCI World. */
const INDEKSER: Record<string, { yahoo: string; navn: string }> = {
  verden: { yahoo: "URTH", navn: "Verdensindeksen" },
  oslo: { yahoo: "OSEBX.OL", navn: "Oslo Børs" },
  dow: { yahoo: "^DJI", navn: "Dow Jones" },
  sp500: { yahoo: "^GSPC", navn: "S&P 500" },
};

const INTERVAL = "1d";
const RANGE = "2y";
// Kort levetid, så dagens kurs følger børsen gjennom dagen. Ett kall gir
// fem Yahoo-oppslag, så selv med mange besøkende blir det få kall.
const CACHE_TTL_MS = 10 * 60 * 1000;

interface Punkt { d: string; c: number }
interface Serie { yahoo: string; currency: string; points: Punkt[] }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });

const hentYahoo = async (yahoo: string): Promise<Serie | null> => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?interval=${INTERVAL}&range=${RANGE}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; EMILInvest/1.0)" } });
  if (!res.ok) {
    console.error(`Yahoo ${yahoo}: ${res.status}`);
    return null;
  }
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return null;
  const ts: number[] = result.timestamp ?? [];
  const close: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
  const points: Punkt[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = close[i];
    if (c === null || c === undefined || !isFinite(c) || c <= 0) continue;
    const d = new Date(ts[i] * 1000).toISOString().slice(0, 10);
    // Yahoo kan gi to punkter for i dag (sluttkurs + live) - behold det siste
    if (points.length && points[points.length - 1].d === d) points[points.length - 1].c = c;
    else points.push({ d, c });
  }
  return { yahoo, currency: result.meta?.currency ?? "", points };
};

/**
 * Fjerner åpenbart feile kurser fra Yahoo. Rett etter børsåpning kan Yahoo gi
 * et «live»-punkt som er helt feil (6. nov. 2026 kom OSEBX som 1 389 069 i stedet
 * for ~2080, og forsiden viste +66 495 %). En indeks flytter seg aldri 25 % fra
 * dagene rundt, så et punkt som avviker så mye fra medianen av naboene, droppes.
 */
const ROBUST_VINDU = 5;
const MAKS_AVVIK = 0.25;
const fjernFeilkurser = (punkter: Punkt[]): Punkt[] =>
  punkter.filter((p, i) => {
    const naboer = punkter
      .slice(Math.max(0, i - ROBUST_VINDU), i + ROBUST_VINDU + 1)
      .filter((_, j) => j !== Math.min(i, ROBUST_VINDU))
      .map((n) => n.c)
      .sort((a, b) => a - b);
    if (naboer.length === 0) return true;
    const median = naboer[Math.floor(naboer.length / 2)];
    return Math.abs(p.c / median - 1) <= MAKS_AVVIK;
  });

/** Kurs på dato d, eller siste kjente før d (helger og helligdager). */
const kursPaa = (punkter: Punkt[], d: string): number | null => {
  let svar: number | null = null;
  for (const p of punkter) {
    if (p.d > d) break;
    svar = p.c;
  }
  return svar ?? punkter[0]?.c ?? null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const symboler = [...Object.values(INDEKSER).map((i) => i.yahoo), "USDNOK=X"];
    const noekler = symboler.map((s) => `${s}|${INTERVAL}|${RANGE}`);
    const { data: cachet } = await admin.from("market_history_cache").select("key, data, fetched_at").in("key", noekler);
    const cache = new Map<string, Serie>();
    for (const rad of cachet ?? []) {
      if (Date.now() - new Date(rad.fetched_at).getTime() < CACHE_TTL_MS) cache.set(rad.key, rad.data as Serie);
    }

    const nye: { key: string; data: Serie; fetched_at: string }[] = [];
    const hent = async (yahoo: string): Promise<Serie | null> => {
      const key = `${yahoo}|${INTERVAL}|${RANGE}`;
      const c = cache.get(key);
      if (c) return c;
      const s = await hentYahoo(yahoo);
      if (s && s.points.length > 0) nye.push({ key, data: s, fetched_at: new Date().toISOString() });
      return s;
    };

    const [usdnok, ...serier] = await Promise.all([hent("USDNOK=X"), ...Object.values(INDEKSER).map((i) => hent(i.yahoo))]);

    const ut: Record<string, { navn: string; punkter: Punkt[] }> = {};
    Object.entries(INDEKSER).forEach(([noekkel, info], i) => {
      const s = serier[i];
      if (!s) return;
      // Filtreres her og ikke ved henting, så også feil som alt ligger i cachen fanges
      let punkter = fjernFeilkurser(s.points);
      if (s.currency === "USD") {
        if (!usdnok) return; // uten valutakurs blir sammenligningen feil - dropp heller indeksen
        const valuta = fjernFeilkurser(usdnok.points);
        punkter = punkter.map((p) => ({ d: p.d, c: p.c * (kursPaa(valuta, p.d) ?? 0) })).filter((p) => p.c > 0);
      }
      ut[noekkel] = { navn: info.navn, punkter };
    });

    if (nye.length > 0) {
      const { error } = await admin.from("market_history_cache").upsert(nye, { onConflict: "key" });
      if (error) console.error("Cache-skriving feilet:", error.message);
    }

    return json({ serier: ut, hentet: new Date().toISOString() });
  } catch (e) {
    console.error("indeks-historikk feilet:", e);
    return json({ error: "Kunne ikke hente indekser." }, 500);
  }
});
