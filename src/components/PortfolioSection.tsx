import { TrendingUp, TrendingDown, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Mock data - In production, this would fetch from OSEBX API
const stocks = [
  {
    ticker: "NEL",
    name: "Nel ASA",
    shares: 150,
    avgPrice: 12.5,
    currentPrice: 14.2,
    sector: "Hydrogen",
  },
  {
    ticker: "SCATC",
    name: "Scatec ASA",
    shares: 50,
    avgPrice: 78.0,
    currentPrice: 82.5,
    sector: "Solenergi",
  },
  {
    ticker: "ORK",
    name: "Orkla ASA",
    shares: 30,
    avgPrice: 85.0,
    currentPrice: 82.0,
    sector: "Forbruksvarer",
  },
  {
    ticker: "EQNR",
    name: "Equinor ASA",
    shares: 25,
    avgPrice: 290.0,
    currentPrice: 305.0,
    sector: "Energi",
  },
];

const funds = [
  {
    name: "KLP AksjeGlobal Mer Samfunnsansvar",
    value: 45000,
    return: 8.5,
    category: "Global ESG",
  },
  {
    name: "Storebrand Global ESG Plus",
    value: 35000,
    return: 7.2,
    category: "Global ESG",
  },
  {
    name: "DNB Grønt Norden",
    value: 28000,
    return: 5.8,
    category: "Nordisk Grønn",
  },
];

const PortfolioSection = () => {
  const calculateReturn = (avgPrice: number, currentPrice: number) => {
    return ((currentPrice - avgPrice) / avgPrice) * 100;
  };

  const totalStockValue = stocks.reduce(
    (sum, stock) => sum + stock.shares * stock.currentPrice,
    0
  );
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
            Følg utviklingen av våre bærekraftige investeringer på Oslo Børs
            (OSEBX)
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
            <CardTitle className="font-serif">Aksjer (OSEBX)</CardTitle>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <RefreshCw className="w-4 h-4 mr-2" />
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
                      Antall
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Kurs
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Avkastning
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Verdi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock) => {
                    const returnPct = calculateReturn(
                      stock.avgPrice,
                      stock.currentPrice
                    );
                    const isPositive = returnPct >= 0;
                    return (
                      <tr
                        key={stock.ticker}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <a
                            href={`https://www.oslobors.no/markedsaktivitet/#/details/${stock.ticker}.OSE/overview`}
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
                        <td className="py-4 px-4 text-right text-foreground">
                          {stock.shares}
                        </td>
                        <td className="py-4 px-4 text-right text-foreground">
                          {stock.currentPrice.toFixed(2)} kr
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              isPositive ? "stock-positive" : "stock-negative"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {isPositive ? "+" : ""}
                            {returnPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-foreground">
                          {(stock.shares * stock.currentPrice).toLocaleString(
                            "no-NO"
                          )}{" "}
                          kr
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
            <div className="grid md:grid-cols-3 gap-4">
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
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-lg font-serif font-bold text-foreground">
                        {fund.value.toLocaleString("no-NO")} kr
                      </p>
                    </div>
                    <span className="stock-positive font-medium text-sm flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />+{fund.return}%
                    </span>
                  </div>
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
