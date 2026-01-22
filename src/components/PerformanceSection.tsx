import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

type TimeFilter = "1M" | "3M" | "YTD" | "1Y" | "ALL";

interface HistoryPoint {
  date: string;
  portfolio_value: number;
  osebx_value: number | null;
  invested_capital: number | null;
}

const PerformanceSection = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("YTD");
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("portfolio_history")
        .select("*")
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching history:", error);
      } else {
        setHistory(data || []);
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const filters: { key: TimeFilter; label: string }[] = [
    { key: "1M", label: "1 mnd" },
    { key: "3M", label: "3 mnd" },
    { key: "YTD", label: "YTD" },
    { key: "1Y", label: "1 år" },
    { key: "ALL", label: "Alle" },
  ];

  const filteredData = useMemo(() => {
    if (history.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case "1M":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3M":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "YTD":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "1Y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "ALL":
      default:
        startDate = new Date(0);
        break;
    }

    const filtered = history.filter(h => new Date(h.date) >= startDate);
    
    if (filtered.length === 0) return [];

    // Time-weighted return calculation
    // Each investment is weighted from its entry point
    // This ensures new capital doesn't artificially inflate/deflate returns
    
    const firstPoint = filtered[0];
    const firstOsebx = firstPoint.osebx_value || 100;

    return filtered.map((h, index) => {
      // Calculate time-weighted portfolio return
      // Sum of weighted returns for each investment tranche
      let cumulativeWeightedReturn = 0;
      let totalWeight = 0;

      // For each data point, calculate the weighted return based on when capital was added
      const currentInvested = h.invested_capital || h.portfolio_value;
      const prevInvested = index > 0 ? (filtered[index - 1].invested_capital || filtered[index - 1].portfolio_value) : currentInvested;
      
      // Calculate the gain/loss relative to invested capital at each point
      const portfolioGainRatio = h.portfolio_value / currentInvested;
      const firstGainRatio = firstPoint.portfolio_value / (firstPoint.invested_capital || firstPoint.portfolio_value);
      
      // Normalize: ratio of current gain vs first point gain, then scale to 100
      const portfolioReturn = (portfolioGainRatio / firstGainRatio) * 100;
      
      // OSEBX: simple normalized return from first point
      const osebxReturn = h.osebx_value ? (h.osebx_value / firstOsebx) * 100 : null;

      return {
        date: new Date(h.date).toLocaleDateString("no-NO", { 
          day: "2-digit", 
          month: "short",
          year: timeFilter === "ALL" || timeFilter === "1Y" ? "2-digit" : undefined
        }),
        portfolio: Math.round(portfolioReturn * 100) / 100,
        osebx: osebxReturn ? Math.round(osebxReturn * 100) / 100 : null,
      };
    });
  }, [history, timeFilter]);

  const returns = useMemo(() => {
    if (filteredData.length < 2) return { portfolio: 0, osebx: 0 };
    const first = filteredData[0];
    const last = filteredData[filteredData.length - 1];
    return {
      portfolio: last.portfolio - 100,
      osebx: last.osebx ? last.osebx - 100 : 0,
    };
  }, [filteredData]);

  if (loading) {
    return (
      <section id="performance" className="py-24">
        <div className="section-container">
          <div className="text-center">
            <p className="text-muted-foreground">Laster historikk...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="performance" className="py-24">
      <div className="section-container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Utvikling
          </Badge>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Portefølje vs OSEBX
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sammenlign utviklingen av vår portefølje mot Oslo Børs hovedindeks
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="font-serif">Avkastning</CardTitle>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter.key}
                  variant={timeFilter === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFilter(filter.key)}
                  className={timeFilter === filter.key ? "bg-primary text-primary-foreground" : ""}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Ingen historiske data tilgjengelig for denne perioden.
                </p>
              </div>
            ) : (
              <>
                {/* Return Summary */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">EMIL Invest</p>
                    <p className={`text-2xl font-serif font-bold ${returns.portfolio >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {returns.portfolio >= 0 ? "+" : ""}{returns.portfolio.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">OSEBX</p>
                    <p className={`text-2xl font-serif font-bold ${returns.osebx >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {returns.osebx >= 0 ? "+" : ""}{returns.osebx.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="portfolio"
                        name="EMIL Invest"
                        stroke="hsl(158 64% 35%)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, fill: "hsl(158 64% 35%)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="osebx"
                        name="OSEBX"
                        stroke="hsl(200 65% 50%)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 4, fill: "hsl(200 65% 50%)" }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  * Verdier er normalisert til 100 ved periodens start for enkel sammenligning
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PerformanceSection;
