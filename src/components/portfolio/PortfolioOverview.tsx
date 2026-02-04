import { Card, CardContent } from "@/components/ui/card";
import { Holding, StockQuote } from "@/hooks/usePortfolioData";

interface PortfolioOverviewProps {
  holdings: Holding[];
  quotes: Record<string, StockQuote>;
  calculatePortfolioValue: (holdings: Holding[], quotes: Record<string, StockQuote>) => number;
}

const PortfolioOverview = ({ holdings, quotes, calculatePortfolioValue }: PortfolioOverviewProps) => {
  const totalValue = calculatePortfolioValue(holdings, quotes);
  const stockCount = holdings.filter(h => h.holding_type === "stock").length;

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-12">
      <Card className="glass-card">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">
            Total porteføljeverdi
          </p>
          <p className="text-3xl font-serif font-bold text-foreground">
            {totalValue.toLocaleString("no-NO", { maximumFractionDigits: 0 })} kr
          </p>
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">
            Antall aksjer
          </p>
          <p className="text-3xl font-serif font-bold text-foreground">
            {stockCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Diversifisert portefølje
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioOverview;
