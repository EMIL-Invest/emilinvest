import { Card, CardContent } from "@/components/ui/card";
import { Holding, StockQuote } from "@/hooks/usePortfolioData";

interface PortfolioOverviewProps {
  holdings: Holding[];
  quotes: Record<string, StockQuote>;
  calculatePortfolioValue: (holdings: Holding[], quotes: Record<string, StockQuote>) => number;
}

const PortfolioOverview = ({ holdings, quotes, calculatePortfolioValue }: PortfolioOverviewProps) => {
  const totalValue = calculatePortfolioValue(holdings, quotes);
  
  const stockHoldings = holdings.filter(h => h.holding_type === "stock");
  const fundHoldings = holdings.filter(h => h.holding_type === "fund");
  
  const stockValue = stockHoldings.reduce((sum, h) => {
    const quote = quotes[h.ticker];
    return sum + (quote ? quote.price * h.quantity : h.purchase_price * h.quantity);
  }, 0);
  
  const fundValue = fundHoldings.reduce((sum, h) => sum + h.purchase_price * h.quantity, 0);
  
  const stockPercentage = totalValue > 0 ? (stockValue / totalValue) * 100 : 0;
  const fundPercentage = totalValue > 0 ? (fundValue / totalValue) * 100 : 0;

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-12">
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
            Aksjeandel
          </p>
          <p className="text-3xl font-serif font-bold text-foreground">
            {stockPercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Maks tillatt: 10%
          </p>
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">
            Fondandel
          </p>
          <p className="text-3xl font-serif font-bold text-foreground">
            {fundPercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Min. anbefalt: 90%
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioOverview;
