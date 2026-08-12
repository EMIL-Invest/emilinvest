import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioHolding, StockQuote } from "@/hooks/useCompetition";

interface ParticipantPortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantId: string;
  displayName: string;
  quotes: Record<string, StockQuote>;
}

const ParticipantPortfolioDialog = ({ 
  open, 
  onOpenChange, 
  participantId, 
  displayName,
  quotes 
}: ParticipantPortfolioDialogProps) => {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHoldings = async () => {
      if (!open || !participantId) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from("competition_portfolios")
        .select("*")
        .eq("participant_id", participantId);
      
      if (error) {
        console.error("Error fetching participant holdings:", error);
      } else {
        setHoldings(data || []);
      }
      setLoading(false);
    };

    fetchHoldings();
  }, [open, participantId]);

  const stockHoldings = holdings.filter(h => h.ticker !== "ASK");
  const cashHolding = holdings.find(h => h.ticker === "ASK");
  const cashBalance = cashHolding ? Number(cashHolding.quantity) : 0;

  const calculateTotalValue = () => {
    let total = cashBalance;
    for (const holding of stockHoldings) {
      const quote = quotes[holding.ticker];
      if (quote) {
        total += quote.price * Number(holding.quantity);
      } else {
        total += Number(holding.average_purchase_price) * Number(holding.quantity);
      }
    }
    return total;
  };

  const totalValue = calculateTotalValue();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{displayName} sin portefølje</DialogTitle>
          <DialogDescription>
            Total verdi: {totalValue.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cash balance */}
            <div className="p-4 rounded-lg bg-secondary/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Kontanter (ASK)</span>
              </div>
              <span className="font-mono font-bold">
                {cashBalance.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
              </span>
            </div>

            {/* Holdings table */}
            {stockHoldings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aksje</TableHead>
                    <TableHead className="text-right">Antall</TableHead>
                    <TableHead className="text-right">Kurs</TableHead>
                    <TableHead className="text-right">Verdi</TableHead>
                    <TableHead className="text-right">Avkastning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockHoldings.map((holding) => {
                    const quote = quotes[holding.ticker];
                    const currentPrice = quote?.price || Number(holding.average_purchase_price);
                    const value = currentPrice * Number(holding.quantity);
                    const returnPercent = ((currentPrice - Number(holding.average_purchase_price)) / Number(holding.average_purchase_price)) * 100;

                    return (
                      <TableRow key={holding.id}>
                        <TableCell>
                          <div className="font-medium">{holding.ticker.replace('.OL', '')}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(holding.quantity).toLocaleString('nb-NO')}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {currentPrice.toFixed(2)} kr
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {value.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`flex items-center justify-end gap-1 ${
                            returnPercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {returnPercent >= 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {returnPercent >= 0 ? '+' : ''}
                            {returnPercent.toFixed(2)}%
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Ingen aksjer i porteføljen ennå
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantPortfolioDialog;
