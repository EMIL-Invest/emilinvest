import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Briefcase, Wallet } from "lucide-react";
import { PortfolioHolding, StockQuote } from "@/hooks/useCompetition";

interface PortfolioManagerProps {
  holdings: PortfolioHolding[];
  quotes: Record<string, StockQuote>;
  onSell: (ticker: string, quantity: number, price: number) => Promise<{ error: Error | null }>;
}

const PortfolioManager = ({ holdings, quotes, onSell }: PortfolioManagerProps) => {
  const { toast } = useToast();
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<PortfolioHolding | null>(null);
  const [sellQuantity, setSellQuantity] = useState("");
  const [isSelling, setIsSelling] = useState(false);

  const stockHoldings = holdings.filter(h => h.ticker !== "ASK");
  const cashHolding = holdings.find(h => h.ticker === "ASK");

  const handleSellClick = (holding: PortfolioHolding) => {
    setSelectedHolding(holding);
    setSellQuantity("");
    setSellDialogOpen(true);
  };

  const handleSell = async () => {
    if (!selectedHolding) return;

    // Samme desimallogikk som i StockTrader: heltall for vanlige aksjer,
    // desimaler tillatt når beholdningen selv er en brøkdel (dyre aksjer).
    const allowFractional = !Number.isInteger(Number(selectedHolding.quantity));
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

  const calculateHoldingValue = (holding: PortfolioHolding): number => {
    const quote = quotes[holding.ticker];
    if (quote) {
      return quote.price * Number(holding.quantity);
    }
    return Number(holding.average_purchase_price) * Number(holding.quantity);
  };

  const calculateReturn = (holding: PortfolioHolding): number => {
    const quote = quotes[holding.ticker];
    if (!quote) return 0;
    
    const currentValue = quote.price * Number(holding.quantity);
    const costBasis = Number(holding.average_purchase_price) * Number(holding.quantity);
    return ((currentValue - costBasis) / costBasis) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Cash balance card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5" />
            ASK-konto (kontanter)
          </CardTitle>
          <CardDescription>
            Penger som ikke er investert i aksjer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {(cashHolding ? Number(cashHolding.quantity) : 0).toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
          </div>
        </CardContent>
      </Card>

      {/* Stock holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Mine aksjer
          </CardTitle>
          <CardDescription>
            {stockHoldings.length} av 10 mulige aksjer i porteføljen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stockHoldings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Du har ingen aksjer ennå.</p>
              <p className="text-sm">Gå til "Kjøp/Selg" for å handle aksjer.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aksje</TableHead>
                  <TableHead className="text-right">Antall</TableHead>
                  <TableHead className="text-right">Snitt kjøpskurs</TableHead>
                  <TableHead className="text-right">Nåværende kurs</TableHead>
                  <TableHead className="text-right">Verdi</TableHead>
                  <TableHead className="text-right">Avkastning (kr)</TableHead>
                  <TableHead className="text-right">Avkastning (%)</TableHead>
                  <TableHead className="text-right">Handling</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockHoldings.map((holding) => {
                  const quote = quotes[holding.ticker];
                  const currentValue = calculateHoldingValue(holding);
                  const returnPct = calculateReturn(holding);

                  return (
                    <TableRow key={holding.id}>
                      <TableCell>
                        <div className="font-medium">{holding.ticker.replace('.OL', '')}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(holding.quantity).toLocaleString('nb-NO')}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(holding.average_purchase_price).toFixed(2)} kr
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {quote ? (
                          `${quote.price.toFixed(2)} kr`
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {currentValue.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                      </TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const currentVal = calculateHoldingValue(holding);
                          const costBasis = Number(holding.average_purchase_price) * Number(holding.quantity);
                          const returnKr = currentVal - costBasis;
                          return (
                            <div className={`font-mono ${returnKr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {returnKr >= 0 ? '+' : ''}{returnKr.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`flex items-center justify-end gap-1 ${
                          returnPct >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {returnPct >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSellClick(holding)}
                        >
                          Selg
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sell dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selg {selectedHolding?.ticker}</DialogTitle>
            <DialogDescription>
              Du eier {selectedHolding ? Number(selectedHolding.quantity).toLocaleString('nb-NO') : 0} aksjer.
              Nåværende kurs: {selectedHolding && quotes[selectedHolding.ticker] 
                ? quotes[selectedHolding.ticker].price.toFixed(2) 
                : '-'} kr
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Antall å selge</label>
              <Input
                type="number"
                placeholder="Antall aksjer"
                value={sellQuantity}
                onChange={(e) => setSellQuantity(e.target.value)}
                min={1}
                max={selectedHolding ? Number(selectedHolding.quantity) : undefined}
              />
            </div>

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
            <Button onClick={handleSell} disabled={isSelling}>
              {isSelling ? "Selger..." : "Bekreft salg"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortfolioManager;
