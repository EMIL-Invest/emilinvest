import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Ukesrapport til Slack (#portefolje) — kjøres av pg_cron hver fredag.
// Bruker de lagrede daglige snapshotene (portfolio_history +
// portfolio_stock_snapshots), så ingen eksterne kurskall trengs.
// Autentisering: x-cron-secret, samme mønster som daily-snapshot.

interface HistoryRow {
  date: string;
  portfolio_value: number;
}

interface SnapshotRow {
  date: string;
  ticker: string;
  name: string;
  price: number;
}

const fmtKr = (n: number) =>
  Math.round(n).toLocaleString("no-NO").replace(/ /g, " ") + " kr";

const fmtPct = (n: number) => {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${Math.abs(n).toFixed(2).replace(".", ",")} %`;
};

Deno.serve(async (req) => {
  try {
    // Kun cron-hemmeligheten slipper inn
    const expected = Deno.env.get("CRON_SECRET");
    const got = req.headers.get("x-cron-secret");
    if (!expected || got !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: "SLACK_WEBHOOK_URL er ikke satt" }), { status: 500 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Hent de siste ~3 ukene med historikk (nyeste først)
    const { data: history, error: histError } = await supabase
      .from("portfolio_history")
      .select("date, portfolio_value")
      .order("date", { ascending: false })
      .limit(20);

    if (histError) throw histError;
    if (!history || history.length === 0) {
      return new Response(JSON.stringify({ error: "Ingen historikk" }), { status: 500 });
    }

    const latest = history[0] as HistoryRow;

    // Finn punktet nærmest 7 dager tilbake (aksepter 5–9 dager)
    const latestDate = new Date(latest.date + "T00:00:00Z").getTime();
    const dayMs = 86_400_000;
    let weekAgo: HistoryRow | null = null;
    let bestDiff = Infinity;
    for (const row of history as HistoryRow[]) {
      const age = (latestDate - new Date(row.date + "T00:00:00Z").getTime()) / dayMs;
      if (age >= 5 && age <= 9 && Math.abs(age - 7) < bestDiff) {
        bestDiff = Math.abs(age - 7);
        weekAgo = row;
      }
    }

    let valueLine = `*Porteføljeverdi:* ${fmtKr(Number(latest.portfolio_value))}`;
    let weekLine = "_Ukesendring: ikke nok historikk ennå_";
    let osebxLine = "";
    let winnerLine = "";
    let loserLine = "";

    if (weekAgo && Number(weekAgo.portfolio_value) > 0) {
      const diff = Number(latest.portfolio_value) - Number(weekAgo.portfolio_value);
      const pct = (diff / Number(weekAgo.portfolio_value)) * 100;
      const emoji = diff >= 0 ? ":chart_with_upwards_trend:" : ":chart_with_downwards_trend:";
      weekLine = `*Uken:* ${diff >= 0 ? "+" : "−"}${fmtKr(Math.abs(diff))} (${fmtPct(pct)}) ${emoji}`;

      // Per-aksje-utvikling: sammenlign pris per ticker mellom de to datoene
      const { data: snaps, error: snapError } = await supabase
        .from("portfolio_stock_snapshots")
        .select("date, ticker, name, price")
        .in("date", [latest.date, weekAgo.date]);

      if (!snapError && snaps) {
        const byTicker = new Map<string, { old?: SnapshotRow; now?: SnapshotRow }>();
        for (const s of snaps as SnapshotRow[]) {
          const entry = byTicker.get(s.ticker) ?? {};
          if (s.date === latest.date) entry.now = s;
          if (s.date === weekAgo.date) entry.old = s;
          byTicker.set(s.ticker, entry);
        }

        let best: { name: string; pct: number } | null = null;
        let worst: { name: string; pct: number } | null = null;
        for (const [ticker, { old, now }] of byTicker) {
          if (!old || !now || !(old.price > 0) || !(now.price > 0)) continue;
          const p = ((now.price - old.price) / old.price) * 100;
          if (ticker === "OSEBX") {
            osebxLine = `*OSEBX denne uken:* ${fmtPct(p)}`;
            continue;
          }
          if (!best || p > best.pct) best = { name: now.name || ticker, pct: p };
          if (!worst || p < worst.pct) worst = { name: now.name || ticker, pct: p };
        }
        if (best) winnerLine = `:trophy: *Ukens vinner:* ${best.name} (${fmtPct(best.pct)})`;
        if (worst) loserLine = `:small_red_triangle_down: *Ukens svakeste:* ${worst.name} (${fmtPct(worst.pct)})`;
      }
    }

    const lines = [
      ":newspaper: *Ukesrapport — EMIL Invest*",
      valueLine,
      weekLine,
      osebxLine,
      winnerLine,
      loserLine,
      "_Følg porteføljen live på <https://emilinvest.no|emilinvest.no>_",
    ].filter(Boolean);

    const slackResp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    });

    if (!slackResp.ok) {
      const body = await slackResp.text();
      throw new Error(`Slack-webhook feilet: ${slackResp.status} ${body}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("weekly-report-feil:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Ukjent feil" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
