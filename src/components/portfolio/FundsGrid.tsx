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
          {funds.map((fund) => (
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
                {(fund.purchase_price * fund.quantity).toLocaleString("no-NO", { maximumFractionDigits: 0 })} kr
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FundsGrid;
