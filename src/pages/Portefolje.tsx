import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpolTilbake from "@/components/SpolTilbake";
import { ContributionSection } from "@/components/PortfolioVisuals";
import Porteforljekart from "@/components/portefolje/Porteforljekart";
import Beholdning from "@/components/portefolje/Beholdning";
import { usePortfolioData, StockQuote } from "@/hooks/usePortfolioData";

/**
 * Porteføljesiden: grønt bånd med nøkkeltall (samme stil som forsiden),
 * kartet over alle aksjene, beholdningstabellen med valgfri periode,
 * fond og kontanter, bidrag per aksje og «Spol tilbake».
 */

const formatKr = (n: number) =>
  `${Math.round(n).toLocaleString("no-NO")} kr`;

const Portefolje = () => {
  const { holdings, quotes, loading, lastUpdated, calculatePortfolioValue, calculateHoldingValue } =
    usePortfolioData();

  const totalValue = calculatePortfolioValue(holdings, quotes);

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
  const sidenKjop = stocks.reduce(
    (s, r) => s + r.value - (r.holding.cost_basis || r.holding.purchase_price * r.holding.quantity),
    0,
  );
  const kontanter = other.filter((o) => o.holding.holding_type === "cash").reduce((s, o) => s + o.value, 0);
  const kjopsdato = stocks
    .map((r) => r.holding.purchase_date)
    .filter(Boolean)
    .sort()[0];

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-16">
        {/* Grønt bånd, samme som på forsiden og i konkurransen */}
        <section className="text-white" style={{ background: "hsl(var(--band))" }}>
          <div className="section-container grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-20 pt-10 pb-12 md:pt-16 md:pb-16">
            <div>
              <h1 className="font-serif font-normal text-[40px] md:text-6xl leading-[1.02] tracking-[-0.015em]">
                Porteføljen vår
              </h1>
              <p className="text-white/75 text-base md:text-lg leading-relaxed mt-4 max-w-[32em]">
                Hver aksje komiteen eier, med kurser som oppdateres gjennom børsdagen.
                {kjopsdato &&
                  ` Kjøpt for ekte penger ${new Date(kjopsdato).toLocaleDateString("no-NO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}.`}
              </p>
            </div>

            <div className="border-t-2 pt-6 self-end" style={{ borderColor: "hsl(var(--competition))" }}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm text-white/70">Markedsverdi nå</p>
                {lastUpdated && (
                  <p className="text-xs text-white/50">
                    oppdatert {lastUpdated.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              <p className="font-serif text-5xl md:text-7xl leading-none tabular-nums mt-2">
                {loading ? "–" : Math.round(totalValue).toLocaleString("no-NO")}
                <span className="text-2xl md:text-3xl text-white/70 ml-2">kr</span>
              </p>
              {!loading && (
                <p className="flex flex-wrap gap-x-7 gap-y-1 mt-4 text-sm text-white/70 tabular-nums">
                  <span>
                    Siden kjøp{" "}
                    <span className="font-semibold" style={{ color: sidenKjop >= 0 ? "#93D2A3" : "#F0A493" }}>
                      {sidenKjop >= 0 ? "+" : "−"}
                      {formatKr(Math.abs(sidenKjop))}
                    </span>
                  </span>
                  <span>{stocks.length} aksjer</span>
                  {kontanter > 0 && (
                    <span>
                      Kontanter <span className="font-semibold text-white">{formatKr(kontanter)}</span>
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </section>

        {loading ? (
          <p className="text-muted-foreground text-center py-24">Laster porteføljen…</p>
        ) : stocks.length === 0 ? (
          <p className="text-muted-foreground text-center py-24">Ingen aksjer i porteføljen akkurat nå.</p>
        ) : (
          <>
            <Porteforljekart stocks={stocks} totalVerdi={totalValue} />
            <Beholdning stocks={stocks} totalVerdi={totalValue} />
          </>
        )}

        {/* Fond og kontanter */}
        {other.length > 0 && (
          <div className="section-container pb-16">
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">Fond og kontanter</h2>
              <div className="border-y border-border">
                {other.map(({ holding, value }, i) => (
                  <div
                    key={holding.id}
                    className={`flex items-center justify-between gap-4 py-4 ${i > 0 ? "border-t border-border/60" : ""}`}
                  >
                    <div>
                      <p className="font-serif text-lg text-foreground">{holding.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {holding.holding_type === "cash" ? "Penger som ikke er investert ennå" : "Bokført verdi"}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="tabular-nums">{formatKr(value)}</p>
                      <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                        {weight(value).toFixed(1).replace(".", ",")} %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        )}

        {/* Bidrag per posisjon */}
        {!loading && <ContributionSection stocks={stocks} />}

        {/* Spol tilbake: porteføljen slik den var en valgt dag */}
        <SpolTilbake />

      </main>

      <Footer />
    </div>
  );
};

export default Portefolje;
