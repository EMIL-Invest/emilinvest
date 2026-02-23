import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

interface StockSnapshot {
  date: string;
  ticker: string;
  name: string;
  price: number;
  currency: string;
  exchange_rate: number;
  quantity: number;
  value_nok: number;
}

const ExcelExport = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      // Fetch all stock snapshots
      const { data: snapshots, error } = await supabase
        .from("portfolio_stock_snapshots")
        .select("*")
        .order("date", { ascending: true })
        .order("ticker", { ascending: true });

      if (error) throw error;

      if (!snapshots || snapshots.length === 0) {
        toast({
          title: "Ingen data",
          description: "Det finnes ingen historiske snapshots ennå. Data samles automatisk hver dag kl. 09:00.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Get unique dates and tickers
      const dates = [...new Set(snapshots.map((s: StockSnapshot) => s.date))].sort();
      const tickers = [...new Set(snapshots.map((s: StockSnapshot) => s.ticker))];

      // Build lookup: ticker+date -> snapshot
      const lookup: Record<string, StockSnapshot> = {};
      for (const s of snapshots as StockSnapshot[]) {
        lookup[`${s.ticker}_${s.date}`] = s;
      }

      // Get names
      const nameMap: Record<string, string> = {};
      for (const s of snapshots as StockSnapshot[]) {
        nameMap[s.ticker] = s.name;
      }

      // --- Sheet 1: Aksjekurser ---
      const priceRows: Record<string, unknown>[] = [];
      for (const ticker of tickers) {
        const row: Record<string, unknown> = { Ticker: ticker, Navn: nameMap[ticker] };
        for (const date of dates) {
          const snap = lookup[`${ticker}_${date}`];
          row[date] = snap ? snap.price : "";
        }
        priceRows.push(row);
      }

      // --- Sheet 2: Verdier i NOK ---
      const valueRows: Record<string, unknown>[] = [];
      for (const ticker of tickers) {
        const row: Record<string, unknown> = { Ticker: ticker, Navn: nameMap[ticker] };
        for (const date of dates) {
          const snap = lookup[`${ticker}_${date}`];
          row[date] = snap ? snap.value_nok : "";
        }
        valueRows.push(row);
      }

      // --- Sheet 3: Antall aksjer ---
      const qtyRows: Record<string, unknown>[] = [];
      for (const ticker of tickers) {
        const row: Record<string, unknown> = { Ticker: ticker, Navn: nameMap[ticker] };
        for (const date of dates) {
          const snap = lookup[`${ticker}_${date}`];
          row[date] = snap ? snap.quantity : "";
        }
        qtyRows.push(row);
      }

      // Create workbook
      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.json_to_sheet(priceRows);
      XLSX.utils.book_append_sheet(wb, ws1, "Aksjekurser");

      const ws2 = XLSX.utils.json_to_sheet(valueRows);
      XLSX.utils.book_append_sheet(wb, ws2, "Verdier (NOK)");

      const ws3 = XLSX.utils.json_to_sheet(qtyRows);
      XLSX.utils.book_append_sheet(wb, ws3, "Antall");

      // Download
      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `EMIL_Invest_Portefolje_${today}.xlsx`);

      toast({
        title: "Excel lastet ned!",
        description: `Filen inneholder data for ${tickers.length} aksjer over ${dates.length} datoer.`,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Feil ved eksport",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Excel-eksport
            </CardTitle>
            <CardDescription>
              Last ned historiske porteføljedata som Excel. Data oppdateres automatisk daglig kl. 09:00.
            </CardDescription>
          </div>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {loading ? "Genererer..." : "Last ned Excel"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Excel-filen inneholder tre ark:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Aksjekurser</strong> – kurs per aksje per dato (i originalvaluta)</li>
            <li><strong>Verdier (NOK)</strong> – total verdi per aksje per dato (kurs × antall × valutakurs)</li>
            <li><strong>Antall</strong> – antall aksjer per dato</li>
          </ul>
          <p className="mt-3">Oslo Børs (OSEBX) er inkludert som en egen rad i alle ark.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelExport;
