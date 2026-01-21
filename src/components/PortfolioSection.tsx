import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Stock {
  ticker: string;
  name: string;
  purchaseValue: number;
  sector: string;
  exchange: string;
}

interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

// Portfolio holdings
const stocks: Stock[] = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    purchaseValue: 2769,
    sector: "Teknologi",
    exchange: "NASDAQ",
  },
  {
    ticker: "AKRBP",
    name: "Aker BP ASA",
    purchaseValue: 4998,
    sector: "Energi",
    exchange: "OSE",
  },
  {
    ticker: "EQNR",
    name: "Equinor ASA",
    purchaseValue: 2009,
    sector: "Energi",
    exchange: "OSE",
  },
  {
    ticker: "TTWO",
    name: "Take-Two Interactive Software",
    purchaseValue: 2399,
    sector: "Teknologi",
    exchange: "NASDAQ",
  },
];

const funds = [
  {
    name: "DNB Global Indeks A",
    value: 95700,
    category: "Global Indeks",
  },
  {
    name: "DNB Teknologi A",
    value: 29270,
    category: "Teknologi",
  },
];

const PortfolioSection = () => {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stock-prices", {
        body: { tickers: stocks.map((s) => s.ticker) },
      });

      if (error) {
        console.error("Error fetching prices:", error);
        return;
      }

      if (data?.quotes) {
        const quotesMap: Record<string, StockQuote> = {};
        data.quotes.forEach((q: StockQuote) => {
          quotesMap[q.ticker] = q;
        });
        setQuotes(quotesMap);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // Refresh every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const totalStockValue = stocks.reduce((sum, stock) => sum + stock.purchaseValue, 0);
  const totalFundValue = funds.reduce((sum, fund) => sum + fund.value, 0);
  const totalValue = totalStockValue + totalFundValue;
  const stockPercentage = (totalStockValue / totalValue) * 100;

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
            Følg utviklingen av våre bærekraftige investeringer med live markedsdata
          </p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">
                Total porteføljeverdi
              </p>
              <p className="text-3xl font-serif font-bold text-foreground">
                {totalValue.toLocaleString("no-NO")} kr
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
                {(100 - stockPercentage).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Min. anbefalt: 90%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stocks Table */}
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
              onClick={fetchPrices}
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
                      Endring
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
                    
                    return (
                      <tr
                        key={stock.ticker}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <a
                            href={
                              stock.exchange === "OSE"
                                ? `https://www.oslobors.no/markedsaktivitet/#/details/${stock.ticker}.OSE/overview`
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
                            {stock.sector}
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
                          {quote ? (
                            <span className={`flex items-center justify-end gap-1 font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              {isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-foreground">
                          {stock.purchaseValue.toLocaleString("no-NO")} kr
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Funds */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-serif">Fond</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {funds.map((fund, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-muted/50 border border-border/50"
                >
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {fund.category}
                  </Badge>
                  <h4 className="font-medium text-foreground mb-2 text-sm">
                    {fund.name}
                  </h4>
                  <p className="text-lg font-serif font-bold text-foreground">
                    {fund.value.toLocaleString("no-NO")} kr
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PortfolioSection;
