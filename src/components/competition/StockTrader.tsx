import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Search, TrendingUp, TrendingDown, RefreshCw, ShoppingCart, Clock, AlertTriangle } from "lucide-react";
import { OsloStock, StockQuote, PortfolioHolding } from "@/hooks/useCompetition";
import { KRAV_ANTALL_AKSJER } from "@/lib/konkurranseregler";

interface StockTraderProps {
  availableStocks: OsloStock[];
  quotes: Record<string, StockQuote>;
  holdings: PortfolioHolding[];
  cashBalance: number;
  onBuy: (ticker: string, quantity: number, price: number) => Promise<{ error: Error | null }>;
  onSell: (ticker: string, quantity: number, price: number) => Promise<{ error: Error | null }>;
  onRefreshQuotes: () => void;
  quotesLoading: boolean;
  checkTradingAllowed?: (ticker: string) => Promise<{ allowed: boolean; reason?: string; dailyCount?: number }>;
  maxDailyTransactions?: number;
  /** Har porteføljen vært gyldig? Da kan den ikke selges under 5 aksjer. */
  erKvalifisert?: boolean;
}

const StockTrader = ({ 
  availableStocks, 
  quotes, 
  holdings,
  cashBalance,
  onBuy,
  onSell,
  onRefreshQuotes,
  quotesLoading,
  checkTradingAllowed,
  maxDailyTransactions = 3,
  erKvalifisert = false,
}: StockTraderProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<OsloStock | null>(null);
  const [selectedHolding, setSelectedHolding] = useState<PortfolioHolding | null>(null);
  const [buyQuantity, setBuyQuantity] = useState("");
  const [sellQuantity, setSellQuantity] = useState("");
  const [isBuying, setIsBuying] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [tradingCheck, setTradingCheck] = useState<{ allowed: boolean; reason?: string; dailyCount?: number } | null>(null);
  const [checkingTrading, setCheckingTrading] = useState(false);

  const sectors = useMemo(() => {
    const uniqueSectors = new Set(availableStocks.map(s => s.sector).filter(Boolean));
    return Array.from(uniqueSectors).sort();
  }, [availableStocks]);

  const stockHoldings = holdings.filter(h => h.ticker !== "ASK");

  const filteredStocks = useMemo(() => {
    return availableStocks.filter(stock => {
      const matchesSearch = 
        stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.ticker.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Handle "mine" filter - only show stocks user owns
      if (sectorFilter === "mine") {
        const isOwned = stockHoldings.some(h => h.ticker === stock.ticker);
        return matchesSearch && isOwned;
      }
      
      const matchesSector = sectorFilter === "all" || stock.sector === sectorFilter;
      return matchesSearch && matchesSector;
    });
  }, [availableStocks, searchTerm, sectorFilter, stockHoldings]);

  const handleBuyClick = async (stock: OsloStock) => {
    setSelectedStock(stock);
    setBuyQuantity("");
    setTradingCheck(null);
    setBuyDialogOpen(true);
    
    // Check trading restrictions
    if (checkTradingAllowed) {
      setCheckingTrading(true);
      const check = await checkTradingAllowed(stock.ticker);
      setTradingCheck(check);
      setCheckingTrading(false);
    }
  };

  const isExpensiveStock = (ticker: string): boolean => {
    const quote = quotes[ticker];
    return quote ? quote.price > 30000 : false;
  };

  const handleBuy = async () => {
    if (!selectedStock) return;

    const allowFractional = isExpensiveStock(selectedStock.ticker);
    const quantity = parseFloat(buyQuantity);
    if (isNaN(quantity) || quantity <= 0 || (!allowFractional && !Number.isInteger(quantity)) || (allowFractional && quantity < 0.01)) {
      toast({
        title: "Ugyldig antall",
        description: "Angi et gyldig antall aksjer å kjøpe",
        variant: "destructive",
      });
      return;
    }

    const quote = quotes[selectedStock.ticker];
    if (!quote) {
      toast({
        title: "Mangler pris",
        description: "Kunne ikke hente aktuell pris. Prøv å oppdatere prisene.",
        variant: "destructive",
      });
      return;
    }

    const totalCost = quantity * quote.price;
    if (totalCost > cashBalance) {
      toast({
        title: "Ikke nok penger",
        description: `Dette kjøpet koster ${totalCost.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr, men du har bare ${cashBalance.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr tilgjengelig.`,
        variant: "destructive",
      });
      return;
    }

    // Check if adding new stock would exceed limit
    const existingHolding = stockHoldings.find(h => h.ticker === selectedStock.ticker);
    if (!existingHolding && stockHoldings.length >= 10) {
      toast({
        title: "Maksimalt antall aksjer",
        description: "Du kan ha maksimalt 10 ulike aksjer i porteføljen. Selg en aksje først.",
        variant: "destructive",
      });
      return;
    }

    setIsBuying(true);
    const { error } = await onBuy(selectedStock.ticker, quantity, quote.price);
    setIsBuying(false);

    if (error) {
      toast({
        title: "Kunne ikke kjøpe",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Kjøp gjennomført",
        description: `Kjøpte ${quantity} ${selectedStock.ticker} for ${totalCost.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr`,
      });
      setBuyDialogOpen(false);
    }
  };

  const handleSellClick = async (holding: PortfolioHolding) => {
    setSelectedHolding(holding);
    setSellQuantity("");
    setTradingCheck(null);
    setSellDialogOpen(true);
    
    // Check trading restrictions
    if (checkTradingAllowed) {
      setCheckingTrading(true);
      const check = await checkTradingAllowed(holding.ticker);
      setTradingCheck(check);
      setCheckingTrading(false);
    }
  };

  const handleSell = async () => {
    if (!selectedHolding) return;

    // Tillat desimalsalg både for dyre aksjer OG når beholdningen selv er
    // en desimal (kjøpt som brøkdel da kursen var >30 000, men kursen har
    // falt under grensen siden) - ellers blir slike poster usalgbare.
    const allowFractional = isExpensiveStock(selectedHolding.ticker) || !Number.isInteger(Number(selectedHolding.quantity));
    const quantity = parseFloat(sellQuantity);
    if (isNaN(quantity) || quantity <= 0 || (!allowFractional && !Number.isInteger(quantity))) {
      toast({
        title: "Ugyldig antall",
        description: "Angi et gyldig antall aksjer å selge",
        variant: "destructive",
      });
      return;
    }

    if (quantity > Number(selectedHolding.quantity)) {
      toast({
        title: "For mange aksjer",
        description: "Du kan ikke selge flere aksjer enn du eier",
        variant: "destructive",
      });
      return;
    }

    const quote = quotes[selectedHolding.ticker];
    if (!quote) {
      toast({
        title: "Mangler pris",
        description: "Kunne ikke hente aktuell pris. Prøv igjen.",
        variant: "destructive",
      });
      return;
    }

    setIsSelling(true);
    const { error } = await onSell(selectedHolding.ticker, quantity, quote.price);
    setIsSelling(false);

    if (error) {
      toast({
        title: "Kunne ikke selge",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Salg gjennomført",
        description: `Solgte ${quantity} ${selectedHolding.ticker} for ${(quantity * quote.price).toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr`,
      });
      setSellDialogOpen(false);
    }
  };

  /**
   * Vil dette salget tømme posisjonen og ta en gyldig portefølje under
   * 5 aksjer? Serveren avviser det uansett - men beskjeden skal komme
   * FØR man trykker, ikke som en avvist handel.
   */
  const sperretSalg = (holding: PortfolioHolding | null, antall: string): boolean => {
    if (!holding || !erKvalifisert) return false;
    const q = parseFloat(antall);
    if (isNaN(q)) return false;
    const tommerPosisjonen = q >= Number(holding.quantity);
    return tommerPosisjonen && stockHoldings.length <= KRAV_ANTALL_AKSJER;
  };

  const getMaxBuyable = (price: number): number => {
    if (price <= 0) return 0;
    if (price > 30000) return Math.floor((cashBalance / price) * 100) / 100; // 2 decimals for expensive
    return Math.floor(cashBalance / price);
  };

  return (
    <div className="space-y-6">
      {/* Handelsreglene vises ikke lenger som tekstblokk her - de ligger
          bak «Reglene»-knappen på forsiden av konkurransen, og håndheves
          uansett automatisk i databasen når man handler. */}

      {/* Cash balance reminder */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tilgjengelig kapital</p>
              <p className="text-2xl font-bold">{cashBalance.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr</p>
            </div>
            <Badge variant="outline">
              {stockHoldings.length}/10 aksjer i porteføljen
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Kjøp aksjer
          </CardTitle>
          <CardDescription>
            Velg aksjer fra Oslo Børs og de store internasjonale børsene
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter aksje..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Alle sektorer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle sektorer</SelectItem>
                <SelectItem value="mine" className="font-medium text-primary">
                  ⭐ Mine aksjer ({stockHoldings.length})
                </SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector} value={sector!}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={onRefreshQuotes}
              disabled={quotesLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${quotesLoading ? 'animate-spin' : ''}`} />
              Oppdater
            </Button>
          </div>

          {/* Stock list */}
          <div className="rounded-md border max-h-[500px] overflow-auto">
            {/* Mobil: kun navn og kjøpsknapp - kurs, endring og sektor
                kommer i dialogen når man trykker Kjøp. Da slipper man å
                bla bortover i en smal tabell. */}
            <ul className="md:hidden divide-y divide-border">
              {filteredStocks.map((stock) => {
                const quote = quotes[stock.ticker];
                const owned = stockHoldings.find(h => h.ticker === stock.ticker);
                return (
                  <li key={stock.id} className="flex items-center gap-3 py-2.5 px-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stock.ticker.replace('.OL', '')}</span>
                        {owned && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Eid</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{stock.name}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleBuyClick(stock)}
                      disabled={!quote}
                      className="flex-shrink-0"
                    >
                      Kjøp
                    </Button>
                  </li>
                );
              })}
            </ul>

            <div className="hidden md:block">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Aksje</TableHead>
                  <TableHead>Sektor</TableHead>
                  <TableHead className="text-right">Kurs</TableHead>
                  <TableHead className="text-right">Endring</TableHead>
                  <TableHead className="text-right">Handling</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.map((stock) => {
                  const quote = quotes[stock.ticker];
                  const owned = stockHoldings.find(h => h.ticker === stock.ticker);

                  return (
                    <TableRow key={stock.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{stock.ticker.replace('.OL', '')}</div>
                          <div className="text-sm text-muted-foreground">{stock.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {stock.sector || 'Annet'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {quote ? (
                          `${quote.price.toFixed(2)} kr`
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {quote ? (
                          <div className={`flex items-center justify-end gap-1 ${
                            quote.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {quote.changePercent >= 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {quote.changePercent >= 0 ? '+' : ''}
                            {quote.changePercent.toFixed(2)}%
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {owned && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSellClick(owned)}
                            >
                              Selg
                            </Button>
                          )}
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleBuyClick(stock)}
                            disabled={!quote}
                          >
                            Kjøp
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buy dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kjøp {selectedStock?.name}</DialogTitle>
            <DialogDescription>Ticker: {selectedStock?.ticker}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nøkkelinfo om aksjen - på mobil er dette første gang man ser
                kurs og utvikling (listen viser kun navn og kjøpsknapp) */}
            {selectedStock && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                <span className="font-mono font-semibold text-base">
                  {quotes[selectedStock.ticker]
                    ? `${quotes[selectedStock.ticker].price.toFixed(2)} kr`
                    : "-"}
                </span>
                {quotes[selectedStock.ticker] && (
                  <span className={`flex items-center gap-1 font-medium ${
                    quotes[selectedStock.ticker].changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {quotes[selectedStock.ticker].changePercent >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {quotes[selectedStock.ticker].changePercent >= 0 ? '+' : ''}
                    {quotes[selectedStock.ticker].changePercent.toFixed(2)}% i dag
                  </span>
                )}
                <Badge variant="secondary" className="text-xs">
                  {selectedStock.sector || 'Annet'}
                </Badge>
                {(() => {
                  const eid = stockHoldings.find(h => h.ticker === selectedStock.ticker);
                  return eid ? (
                    <span className="text-muted-foreground">
                      Du eier {Number(eid.quantity).toLocaleString('nb-NO')}
                    </span>
                  ) : null;
                })()}
              </div>
            )}
            {/* Trading status */}
            {checkingTrading ? (
              <div className="text-sm text-muted-foreground">Sjekker handelsstatus...</div>
            ) : tradingCheck && !tradingCheck.allowed ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{tradingCheck.reason}</AlertDescription>
              </Alert>
            ) : tradingCheck ? (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/30">
                  <Clock className="w-3 h-3 mr-1" />
                  Børsen er åpen
                </Badge>
                {tradingCheck.dailyCount !== undefined && (
                  <Badge variant="secondary">
                    {tradingCheck.dailyCount}/{maxDailyTransactions} transaksjoner i dag
                  </Badge>
                )}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium">Antall aksjer</label>
              <Input
                type="number"
                placeholder={selectedStock && isExpensiveStock(selectedStock.ticker) ? "Antall (desimaler tillatt)" : "Antall aksjer"}
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(e.target.value)}
                min={selectedStock && isExpensiveStock(selectedStock.ticker) ? 0.01 : 1}
                step={selectedStock && isExpensiveStock(selectedStock.ticker) ? 0.01 : 1}
                disabled={tradingCheck && !tradingCheck.allowed}
              />
              {selectedStock && quotes[selectedStock.ticker] && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Maks du kan kjøpe: {getMaxBuyable(quotes[selectedStock.ticker].price).toLocaleString('nb-NO', { maximumFractionDigits: isExpensiveStock(selectedStock.ticker) ? 4 : 0 })} {isExpensiveStock(selectedStock.ticker) ? 'enheter' : 'aksjer'}
                  </p>
                  {isExpensiveStock(selectedStock.ticker) && (
                    <p className="text-xs text-primary">
                      💡 Denne aksjen koster over 30 000 kr - du kan kjøpe deler av en aksje
                    </p>
                  )}
                </>
              )}
            </div>

            {buyQuantity && selectedStock && quotes[selectedStock.ticker] && (
              <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total kostnad:</span>
                  <span className="font-bold">
                    {(parseFloat(buyQuantity) * quotes[selectedStock.ticker].price).toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gjenstående kapital:</span>
                  <span>
                    {(cashBalance - (parseFloat(buyQuantity) * quotes[selectedStock.ticker].price)).toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleBuy}
              disabled={isBuying || checkingTrading || !!(tradingCheck && !tradingCheck.allowed)}
            >
              {isBuying ? "Kjøper..." : "Bekreft kjøp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selg {selectedHolding?.ticker.replace('.OL', '')}</DialogTitle>
            <DialogDescription>
              Du eier {selectedHolding ? Number(selectedHolding.quantity).toLocaleString('nb-NO') : 0} aksjer.
              Nåværende kurs: {selectedHolding && quotes[selectedHolding.ticker] 
                ? quotes[selectedHolding.ticker].price.toFixed(2) 
                : '-'} kr
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Trading status */}
            {checkingTrading ? (
              <div className="text-sm text-muted-foreground">Sjekker handelsstatus...</div>
            ) : tradingCheck && !tradingCheck.allowed ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{tradingCheck.reason}</AlertDescription>
              </Alert>
            ) : tradingCheck ? (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/30">
                  <Clock className="w-3 h-3 mr-1" />
                  Børsen er åpen
                </Badge>
                {tradingCheck.dailyCount !== undefined && (
                  <Badge variant="secondary">
                    {tradingCheck.dailyCount}/{maxDailyTransactions} transaksjoner i dag
                  </Badge>
                )}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium">Antall å selge</label>
              <Input
                type="number"
                placeholder={selectedHolding && isExpensiveStock(selectedHolding.ticker) ? "Antall (desimaler tillatt)" : "Antall aksjer"}
                value={sellQuantity}
                onChange={(e) => setSellQuantity(e.target.value)}
                min={selectedHolding && isExpensiveStock(selectedHolding.ticker) ? 0.01 : 1}
                step={selectedHolding && isExpensiveStock(selectedHolding.ticker) ? 0.01 : 1}
                max={selectedHolding ? Number(selectedHolding.quantity) : undefined}
                disabled={tradingCheck && !tradingCheck.allowed}
              />
              {selectedHolding && isExpensiveStock(selectedHolding.ticker) && (
                <p className="text-xs text-primary">
                  💡 Denne aksjen koster over 30 000 kr - du kan selge deler
                </p>
              )}
            </div>

            {/* Regelvarsel FØR man prøver: gyldig portefølje kan ikke gå under 5 aksjer */}
            {sperretSalg(selectedHolding, sellQuantity) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Dette salget ville tømt posisjonen og tatt porteføljen din under{" "}
                  {KRAV_ANTALL_AKSJER} aksjer - det tillater ikke reglene. Kjøp en
                  annen aksje først, eller selg bare deler av posisjonen.
                </AlertDescription>
              </Alert>
            )}

            {sellQuantity && selectedHolding && quotes[selectedHolding.ticker] && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Estimert salgsverdi:</p>
                <p className="text-2xl font-bold">
                  {(parseFloat(sellQuantity) * quotes[selectedHolding.ticker].price).toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSellDialogOpen(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleSell}
              disabled={
                isSelling ||
                checkingTrading ||
                !!(tradingCheck && !tradingCheck.allowed) ||
                sperretSalg(selectedHolding, sellQuantity)
              }
            >
              {isSelling ? "Selger..." : "Bekreft salg"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockTrader;
