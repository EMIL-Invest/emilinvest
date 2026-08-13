import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Landmark } from "lucide-react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

type TimeFilter = "1M" | "3M" | "YTD" | "1Y" | "ALL";

interface HistoryPoint {
  date: string;
  portfolio_value: number;
  osebx_value: number | null;
  invested_capital: number | null;
}

const PerformanceSection = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("YTD");
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("portfolio_history")
        .select("*")
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching history:", error);
      } else {
        setHistory(data || []);
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const filters: { key: TimeFilter; label: string }[] = [
    { key: "1M", label: "1 mnd" },
    { key: "3M", label: "3 mnd" },
    { key: "YTD", label: "YTD" },
    { key: "1Y", label: "1 år" },
    { key: "ALL", label: "Alle" },
  ];

  const filteredData = useMemo(() => {
    if (history.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case "1M":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3M":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "YTD":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "1Y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "ALL":
      default:
        startDate = new Date(0);
        break;
    }

    const filtered = history.filter(h => new Date(h.date) >= startDate);

    if (filtered.length === 0) return [];

    // Ekte tidsvektet avkastning (TWR), kjedet over delperioder:
    //   r_t = pv_t / (pv_{t-1} + innskudd_t)
    // der innskudd_t = endring i invested_capital siden forrige punkt.
    // Slik nøytraliseres innskudd/uttak: ny kapital gir verken falsk
    // gevinst eller falskt tap. Mangler invested_capital på et punkt
    // antas ingen kapitalflyt (innskudd_t = 0), som gjør at manuelt
    // innlagte historikkrader fungerer sømløst.
    const firstPoint = filtered[0];
    const firstOsebx = firstPoint.osebx_value || 100;

    let portfolioIndex = 100;

    return filtered.map((h, index) => {
      if (index > 0) {
        const prev = filtered[index - 1];
        const flow =
          h.invested_capital != null && prev.invested_capital != null
            ? Number(h.invested_capital) - Number(prev.invested_capital)
            : 0;
        const denominator = Number(prev.portfolio_value) + flow;
        const periodReturn = denominator > 0 ? Number(h.portfolio_value) / denominator : 1;
        portfolioIndex *= periodReturn;
      }

      // OSEBX: simple normalized return from first point
      const osebxReturn = h.osebx_value ? (h.osebx_value / firstOsebx) * 100 : null;

      return {
        date: new Date(h.date).toLocaleDateString("no-NO", {
          day: "2-digit",
          month: "short",
          year: timeFilter === "ALL" || timeFilter === "1Y" ? "2-digit" : undefined
        }),
        portfolio: Math.round(portfolioIndex * 100) / 100,
        osebx: osebxReturn ? Math.round(osebxReturn * 100) / 100 : null,
      };
    });
  }, [history, timeFilter]);

  const returns = useMemo(() => {
    if (filteredData.length < 2) return { portfolio: 0, osebx: 0 };
    const last = filteredData[filteredData.length - 1];
    return {
      portfolio: last.portfolio - 100,
      osebx: last.osebx ? last.osebx - 100 : 0,
    };
  }, [filteredData]);

  if (loading) {
    return (
      <section id="performance" className="py-24">
        <div className="section-container">
          <div className="text-center">
            <p className="text-muted-foreground">Laster historikk...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="performance" className="py-24">
      <div className="section-container">
        <div className="text-center mb-16">
          <p className="eyebrow mb-5">Utvikling</p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Portefølje vs OSEBX
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sammenlign utviklingen av vår portefølje mot Oslo Børs hovedindeks
          </p>
          {/* Historikken er nullstilt fordi komiteen først nå forvalter en
              egen portefølje. Kurven er kort med vilje. Teksten kan fjernes
              når det har gått noen måneder. */}
          <p className="text-sm text-muted-foreground/90 max-w-2xl mx-auto mt-4 leading-relaxed">
            Midlene har fram til nå vært plassert i ulike fond, med noen mindre
            aksjeposisjoner ved siden av. Egen portefølje, forvaltet av komiteen
            selv, begynner dette semesteret — derfor er historikken nullstilt
            her. Porteføljen og OSEBX måles fra samme utgangspunkt, så grafen
            dekker bare de siste dagene inntil videre.
          </p>
        </div>

        <div
          className="rounded-md border border-border bg-card p-6 md:p-9"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          {/* Topp: tittel + periodevalg */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="font-serif text-2xl md:text-3xl text-foreground">Avkastning</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Utvikling i portefølje sammenlignet med OSEBX
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setTimeFilter(filter.key)}
                  className={`px-4 py-2 rounded-[4px] text-sm font-medium border transition-colors ${
                    timeFilter === filter.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-background text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-muted-foreground text-center max-w-md leading-relaxed">
                Historikken er nullstilt, og det første datapunktet kommer med
                neste kursoppdatering. Da begynner kurven å bygge seg opp.
              </p>
            </div>
          ) : (
            <>
              {/* Nøkkeltall-kort */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-4 p-5 rounded-md border border-border bg-background">
                  <div className="w-12 h-12 rounded-[4px] bg-primary flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">EMIL Invest</p>
                    <p className={`text-2xl font-serif font-bold tabular-nums ${returns.portfolio >= 0 ? "stock-positive" : "stock-negative"}`}>
                      {returns.portfolio >= 0 ? "+" : ""}{returns.portfolio.toFixed(2)} %
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avkastning ({filters.find((f) => f.key === timeFilter)?.label})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-5 rounded-md border border-border bg-background">
                  <div className="w-12 h-12 rounded-[4px] border border-foreground/25 bg-secondary/50 flex items-center justify-center flex-shrink-0">
                    <Landmark className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">OSEBX</p>
                    <p className={`text-2xl font-serif font-bold tabular-nums ${returns.osebx >= 0 ? "stock-positive" : "stock-negative"}`}>
                      {returns.osebx >= 0 ? "+" : ""}{returns.osebx.toFixed(2)} %
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avkastning ({filters.find((f) => f.key === timeFilter)?.label})
                    </p>
                  </div>
                </div>
              </div>

              {/* Graf: EMIL som fylt areal, OSEBX som stiplet linje */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredData}>
                    <defs>
                      <linearGradient id="emilFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(153 20% 30%)" stopOpacity={0.14} />
                        <stop offset="100%" stopColor="hsl(153 20% 30%)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 5" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend iconType="plainline" />
                    <Area
                      type="monotone"
                      dataKey="portfolio"
                      name="EMIL Invest"
                      stroke="hsl(153 22% 22%)"
                      strokeWidth={2.5}
                      fill="url(#emilFill)"
                      dot={false}
                      activeDot={{ r: 5, fill: "hsl(153 22% 22%)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="osebx"
                      name="OSEBX"
                      stroke="hsl(150 6% 62%)"
                      strokeWidth={1.8}
                      strokeDasharray="6 5"
                      dot={false}
                      activeDot={{ r: 4, fill: "hsl(150 6% 62%)" }}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                * Verdier er normalisert til 100 ved periodens start for enkel sammenligning
              </p>

              {/* Risikoopplysning. Hører hjemme der avkastningstallene faktisk
                  vises, ikke bare i vilkårene. */}
              <p className="text-xs text-muted-foreground/80 text-center mt-3 max-w-2xl mx-auto leading-relaxed">
                Historisk avkastning er ingen garanti for framtidig avkastning. Tallene
                vises for åpenhet og læring, og er ikke investeringsrådgivning. Se{" "}
                <Link
                  to="/vilkar"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  vilkårene
                </Link>{" "}
                for mer.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default PerformanceSection;
