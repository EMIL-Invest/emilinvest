import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Holding } from "@/hooks/usePortfolioData";

interface FundsGridProps {
  holdings: Holding[];
}

const FundsGrid = ({ holdings }: FundsGridProps) => {
  const funds = holdings.filter(h => h.holding_type === "fund");

  if (funds.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-serif">Fond</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Ingen fond i porteføljen ennå.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-serif">Fond</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {funds.map((fund) => {
            const currentValue = Number(fund.purchase_price) * Number(fund.quantity);
            const costBasis = fund.cost_basis ? Number(fund.cost_basis) : null;
            const returnSincePurchase = costBasis 
              ? ((currentValue - costBasis) / costBasis) * 100 
              : null;
            const isPositive = returnSincePurchase !== null ? returnSincePurchase >= 0 : true;

            return (
              <div
                key={fund.id}
                className="p-4 rounded-lg bg-muted/50 border border-border/50"
              >
                <Badge variant="secondary" className="mb-2 text-xs">
                  {fund.sector || "Fond"}
                </Badge>
                <h4 className="font-medium text-foreground mb-2 text-sm">
                  {fund.name}
                </h4>
                <p className="text-lg font-serif font-bold text-foreground">
                  {currentValue.toLocaleString("no-NO", { maximumFractionDigits: 0 })} kr
                </p>
                {returnSincePurchase !== null && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {isPositive ? "+" : ""}{returnSincePurchase.toFixed(2)}%
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">siden kjøp</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FundsGrid;
