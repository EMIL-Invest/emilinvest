import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePortfolioData, StockQuote } from "@/hooks/usePortfolioData";
import { AllocationSection } from "@/components/PortfolioVisuals";

/**
 * Forsidens porteføljeseksjon: viser fordelingsdiagrammet (smultringen)
 * fra porteføljesiden - den fulle aksjetabellen bor på /portefolje.
 */
const PortfolioSection = () => {
  const { holdings, quotes, loading, calculateHoldingValue, calculatePortfolioValue } =
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

  if (loading) {
    return (
      <section id="portfolio" className="py-20 md:py-24 bg-card border-y border-border">
        <div className="section-container">
          <div className="text-center">
            <p className="text-muted-foreground">Laster portefølje...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="portfolio" className="py-20 md:py-24 bg-card border-y border-border">
      <div className="section-container">
        <div className="text-center mb-16">
          <p className="eyebrow mb-5">Portefølje</p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Våre investeringer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Slik er porteføljen fordelt - live. Pek på et felt for detaljer.
          </p>
        </div>
      </div>

      <AllocationSection stocks={stocks} other={other} totalValue={totalValue} />

      <div className="section-container text-center">
        <Link
          to="/portefolje"
          className="group inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/40 hover:decoration-foreground transition-colors"
        >
          Se hele porteføljen - alle aksjene, verdier og utvikling
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
};

export default PortfolioSection;
