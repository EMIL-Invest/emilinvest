import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PerformanceSection from "@/components/PerformanceSection";
import { AllocationSection, ContributionSection } from "@/components/PortfolioVisuals";
import { usePortfolioData, StockQuote } from "@/hooks/usePortfolioData";

/**
 * Dedikert porteføljeside — viser alle plasseringene med vekting,
 * inspirert av profesjonelle fondssider. Aksjer med live-kurs,
 * fond og bankinnskudd med bokført verdi.
 */

const formatKr = (n: number) =>
  `${Math.round(n).toLocaleString("no-NO")} kr`;

/** Tidsvektet avkastning siden årsskiftet (samme metode som grafen). */
const useYtdReturn = (
  history: { date: string; portfolio_value: number; invested_capital: number | null; osebx_value: number | null }[]
) =>
  useMemo(() => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const pts = history.filter((h) => new Date(h.date) >= startOfYear);
    if (pts.length < 2) return { portfolio: null as number | null, osebx: null as number | null };

    let index = 1;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      const flow =
        cur.invested_capital != null && prev.invested_capital != null
          ? Number(cur.invested_capital) - Number(prev.invested_capital)
          : 0;
      const denom = Number(prev.portfolio_value) + flow;
      if (denom > 0) index *= Number(cur.portfolio_value) / denom;
    }

    const firstOsebx = pts.find((p) => p.osebx_value)?.osebx_value ?? null;
    const lastOsebx = [...pts].reverse().find((p) => p.osebx_value)?.osebx_value ?? null;
    const osebx =
      firstOsebx && lastOsebx ? (Number(lastOsebx) / Number(firstOsebx) - 1) * 100 : null;

    return { portfolio: (index - 1) * 100, osebx };
  }, [history]);

const Portefolje = () => {
  const navigate = useNavigate();
  const { holdings, quotes, history, loading, lastUpdated, calculatePortfolioValue, calculateHoldingValue } =
    usePortfolioData();

  const totalValue = calculatePortfolioValue(holdings, quotes);
  const ytd = useYtdReturn(history);

  const stocks = holdings
    .filter((h) => h.holding_type === "stock")
    .map((h) => ({
      holding: h,
      quote: quotes[h.ticker] as StockQuote | undefined,
      value: calculateHoldingValue(h, quotes[h.ticker]),
    }))
    .sort((a, b) => b.value - a.value);

  const other = holdings
    .filter((h) => h.holding_type !== "stock")
    .map((h) => ({
      holding: h,
      value: h.cost_basis || h.purchase_price * h.quantity,
    }))
    .sort((a, b) => b.value - a.value);

  const weight = (value: number) => (totalValue > 0 ? (value / totalValue) * 100 : 0);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-16">
        {/* Topp: tittel + nøkkeltall */}
        <div className="section-container py-14 md:py-20">
          <p className="eyebrow mb-6">Portefølje</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6 max-w-2xl">
            Våre plasseringer
          </h1>
          <div className="w-10 h-px bg-foreground/30 mb-7" />
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Hele porteføljen, helt åpent — hver aksje, hvert fond og hver krone.
            Kursene oppdateres automatisk gjennom børsdagen.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden mt-10">
            {[
              { label: "Markedsverdi", value: loading ? "–" : formatKr(totalValue) },
              {
                label: "Avkastning i år",
                value: ytd.portfolio == null ? "–" : `${ytd.portfolio >= 0 ? "+" : ""}${ytd.portfolio.toFixed(1)} %`,
                positive: (ytd.portfolio ?? 0) >= 0,
                colored: ytd.portfolio != null,
              },
              {
                label: "OSEBX i år",
                value: ytd.osebx == null ? "–" : `${ytd.osebx >= 0 ? "+" : ""}${ytd.osebx.toFixed(1)} %`,
              },
              { label: "Plasseringer", value: loading ? "–" : String(holdings.length) },
            ].map((stat) => (
              <div key={stat.label} className="bg-card p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  {stat.label}
                </p>
                <p
                  className={`font-serif text-2xl md:text-3xl tabular-nums ${
                    stat.colored ? (stat.positive ? "stock-positive" : "stock-negative") : "text-foreground"
                  }`}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-3">
              Kurser oppdatert {lastUpdated.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}.
              Avkastning måles tidsvektet — innskudd og uttak påvirker ikke prosenten.
            </p>
          )}
        </div>

        {/* Fordeling: smultring, fakta og posisjonsbrikker */}
        {!loading && <AllocationSection stocks={stocks} other={other} totalValue={totalValue} />}

        {/* Aksjer */}
        <div className="section-container pb-16">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">Aksjer</h2>
          <div className="rounded-md border border-border bg-card overflow-x-auto" style={{ boxShadow: "var(--shadow-soft)" }}>
            {loading ? (
              <p className="text-muted-foreground text-center py-12">Laster porteføljen…</p>
            ) : stocks.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">Ingen aksjer i porteføljen akkurat nå.</p>
            ) : (
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Selskap</th>
                    <th className="text-left py-4 px-4 text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Sektor</th>
                    <th className="text-right py-4 px-4 text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Antall</th>
                    <th className="text-right py-4 px-4 text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">I dag</th>
                    <th className="text-right py-4 px-4 text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Verdi</th>
                    <th className="text-left py-4 px-6 text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium w-40">Andel</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map(({ holding, quote, value }) => (
                    <tr
                      key={holding.id}
                      onClick={() => navigate(`/aksje/${holding.ticker}`)}
                      className="border-b border-border/60 last:border-0 hover:bg-secondary/40 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        {/* Lenken gjør raden tilgjengelig med tastatur og
                            skjermleser; onClick på raden gjør hele flaten
                            klikkbar for mus. */}
                        <Link
                          to={`/aksje/${holding.ticker}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-foreground hover:underline underline-offset-2"
                        >
                          {holding.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{holding.ticker}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">{holding.sector || "–"}</td>
                      <td className="py-4 px-4 text-sm text-right tabular-nums">{holding.quantity.toLocaleString("no-NO")}</td>
                      <td className={`py-4 px-4 text-sm text-right tabular-nums ${
                        quote ? (quote.changePercent >= 0 ? "stock-positive" : "stock-negative") : "text-muted-foreground"
                      }`}>
                        {quote ? `${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)} %` : "–"}
                      </td>
                      <td className="py-4 px-4 text-sm text-right font-medium tabular-nums">{formatKr(value)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(weight(value), 100)}%`, background: "hsl(var(--accent))" }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                            {weight(value).toFixed(1)} %
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Fond og bankinnskudd */}
          {other.length > 0 && (
            <>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6 mt-14">Fond og bankinnskudd</h2>
              <div className="rounded-md border border-border bg-card" style={{ boxShadow: "var(--shadow-soft)" }}>
                {other.map(({ holding, value }, i) => (
                  <div
                    key={holding.id}
                    className={`flex items-center justify-between gap-4 py-4 px-6 ${i > 0 ? "border-t border-border/60" : ""}`}
                  >
                    <div>
                      <p className="font-medium text-foreground">{holding.name}</p>
                      <p className="text-xs text-muted-foreground">Bokført verdi</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-sm font-medium tabular-nums">{formatKr(value)}</p>
                      <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                        {weight(value).toFixed(1)} %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bidrag per posisjon */}
        {!loading && <ContributionSection stocks={stocks} />}

        {/* Utviklingsgrafen — samme som på forsiden */}
        <PerformanceSection />
      </main>

      <Footer />
    </div>
  );
};

export default Portefolje;
