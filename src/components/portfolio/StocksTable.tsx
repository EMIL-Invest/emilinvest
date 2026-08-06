import { ExternalLink, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Holding, StockQuote } from "@/hooks/usePortfolioData";

interface StocksTableProps {
  holdings: Holding[];
  quotes: Record<string, StockQuote>;
  loading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

const StocksTable = ({ holdings, quotes, loading, lastUpdated, onRefresh }: StocksTableProps) => {
  const stocks = holdings.filter(h => h.holding_type === "stock");

  if (stocks.length === 0) {
    return (
      <Card className="glass-card mb-8">
        <CardHeader>
          <CardTitle className="font-serif">Aksjer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Ingen aksjer i porteføljen ennå.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-serif">Aksjer</CardTitle>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Sist oppdatert: {lastUpdated.toLocaleTimeString("no-NO")}
            </p>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Oppdater
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Ticker
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Selskap
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Sektor
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Kurs
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Avkastning siden kjøp
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Verdi
                </th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => {
                const quote = quotes[stock.ticker];
                const isPositive = quote ? quote.changePercent >= 0 : true;

                // Edge-funksjonen returnerer alle kurser ferdig konvertert til NOK —
                // ingen valutakonvertering skal skje her.
                const currentValue = quote && quote.price > 0
                  ? quote.price * stock.quantity
                  : stock.cost_basis || (stock.purchase_price * stock.quantity);
                
                return (
                  <tr
                    key={stock.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <a
                        href={
                          stock.exchange === "OSE"
                            ? `https://finance.yahoo.com/quote/${stock.ticker}${stock.ticker.includes(".") ? "" : ".OL"}`
                            : `https://finance.yahoo.com/quote/${stock.ticker}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        {stock.ticker}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {stock.name}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="text-xs">
                        {stock.sector || "Ukjent"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-foreground">
                      {quote ? (
                        <span>
                          {quote.price.toLocaleString("no-NO", { minimumFractionDigits: 2 })} {quote.currency}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {quote && quote.price > 0 ? (
                        (() => {
                          // Current value in NOK (quote.price is already in NOK from edge function)
                          const currentValueNOK = Number(quote.price) * stock.quantity;
                          // Cost basis is stored in NOK
                          const costBasisNOK = stock.cost_basis || (Number(stock.purchase_price) * stock.quantity);
                          const returnSincePurchase = ((currentValueNOK - costBasisNOK) / costBasisNOK) * 100;
                          const isReturnPositive = returnSincePurchase >= 0;
                          return (
                            <span className={`flex items-center justify-end gap-1 font-medium ${isReturnPositive ? "text-emerald-600" : "text-red-600"}`}>
                              {isReturnPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              {isReturnPositive ? "+" : ""}{returnSincePurchase.toFixed(2)}%
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground">0.00%</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-foreground">
                      {currentValue.toLocaleString("no-NO", { maximumFractionDigits: 0 })} kr
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StocksTable;
