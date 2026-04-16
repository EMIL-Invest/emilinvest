import { Badge } from "@/components/ui/badge";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import PortfolioOverview from "@/components/portfolio/PortfolioOverview";
import StocksTable from "@/components/portfolio/StocksTable";

const PortfolioSection = () => {
  const {
    holdings,
    quotes,
    loading,
    quotesLoading,
    lastUpdated,
    fetchQuotes,
    calculatePortfolioValue,
  } = usePortfolioData();

  if (loading) {
    return (
      <section id="portfolio" className="py-24 bg-secondary/30">
        <div className="section-container">
          <div className="text-center">
            <p className="text-muted-foreground">Laster portefølje...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="portfolio" className="py-24 bg-secondary/30">
      <div className="section-container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Portefølje
          </Badge>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Våre investeringer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Følg utviklingen av våre aksjeinvesteringer med live markedsdata
          </p>
        </div>

        <PortfolioOverview 
          holdings={holdings}
          quotes={quotes}
          calculatePortfolioValue={calculatePortfolioValue}
        />

        <StocksTable
          holdings={holdings}
          quotes={quotes}
          loading={quotesLoading}
          lastUpdated={lastUpdated}
          onRefresh={() => fetchQuotes()}
        />
      </div>
    </section>
  );
};

export default PortfolioSection;
