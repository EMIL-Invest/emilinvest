import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ExcelJS from "exceljs";

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

      const dates = [...new Set(snapshots.map((s: StockSnapshot) => s.date))].sort();
      const tickers = [...new Set(snapshots.map((s: StockSnapshot) => s.ticker))];

      const lookup: Record<string, StockSnapshot> = {};
      for (const s of snapshots as StockSnapshot[]) {
        lookup[`${s.ticker}_${s.date}`] = s;
      }

      const nameMap: Record<string, string> = {};
      for (const s of snapshots as StockSnapshot[]) {
        nameMap[s.ticker] = s.name;
      }

      const wb = new ExcelJS.Workbook();

      const addSheet = (
        sheetName: string,
        getValue: (snap: StockSnapshot) => number
      ) => {
        const ws = wb.addWorksheet(sheetName);
        ws.addRow(["Ticker", "Navn", ...dates]);

        // Bold header row
        ws.getRow(1).font = { bold: true };

        for (const ticker of tickers) {
          const row: (string | number)[] = [ticker, nameMap[ticker]];
          for (const date of dates) {
            const snap = lookup[`${ticker}_${date}`];
            row.push(snap ? getValue(snap) : 0);
          }
          ws.addRow(row);
        }
      };

      addSheet("Aksjekurser", (s) => s.price);
      addSheet("Verdier (NOK)", (s) => s.value_nok);
      addSheet("Antall", (s) => s.quantity);

      // Generate and download
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `EMIL_Invest_Portefolje_${today}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Excel lastet ned!",
        description: `Filen inneholder data for ${tickers.length} aksjer over ${dates.length} datoer.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Feil ved eksport",
        description: error instanceof Error ? error.message : "Ukjent feil",
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
