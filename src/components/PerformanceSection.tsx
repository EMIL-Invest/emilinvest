import { useState } from "react";
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

type TimeFilter = "1D" | "1W" | "1M" | "YTD" | "1Y" | "ALL";

// Mock performance data - In production, this would fetch from an API
const generatePerformanceData = (filter: TimeFilter) => {
  const baseDate = new Date("2024-01-01");
  const now = new Date();
  
  let dataPoints: { date: string; portfolio: number; osebx: number }[] = [];
  let startValue = 100;
  let portfolioValue = startValue;
  let osebxValue = startValue;
  
  const getDaysForFilter = (filter: TimeFilter): number => {
    switch (filter) {
      case "1D": return 1;
      case "1W": return 7;
      case "1M": return 30;
      case "YTD": {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      }
      case "1Y": return 365;
      case "ALL": return Math.floor((now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
      default: return 365;
    }
  };
  
  const days = getDaysForFilter(filter);
  const interval = filter === "1D" ? 1 : filter === "1W" ? 1 : filter === "1M" ? 1 : Math.max(1, Math.floor(days / 50));
  
  for (let i = 0; i <= days; i += interval) {
    const currentDate = new Date(now.getTime() - (days - i) * 24 * 60 * 60 * 1000);
    
    // Simulate random walk with slight upward bias
    portfolioValue += (Math.random() - 0.48) * 2;
    osebxValue += (Math.random() - 0.49) * 1.5;
    
    const formatDate = (date: Date) => {
      if (filter === "1D") {
        return date.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" });
      } else if (filter === "1W" || filter === "1M") {
        return date.toLocaleDateString("no-NO", { day: "2-digit", month: "short" });
      } else {
        return date.toLocaleDateString("no-NO", { month: "short", year: "2-digit" });
      }
    };
    
    dataPoints.push({
      date: formatDate(currentDate),
      portfolio: Math.round(portfolioValue * 100) / 100,
      osebx: Math.round(osebxValue * 100) / 100,
    });
  }
  
  return dataPoints;
};

const calculateReturns = (data: { portfolio: number; osebx: number }[]) => {
  if (data.length < 2) return { portfolio: 0, osebx: 0 };
  const first = data[0];
  const last = data[data.length - 1];
  return {
    portfolio: ((last.portfolio - first.portfolio) / first.portfolio) * 100,
    osebx: ((last.osebx - first.osebx) / first.osebx) * 100,
  };
};

const PerformanceSection = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("YTD");
  const data = generatePerformanceData(timeFilter);
  const returns = calculateReturns(data);

  const filters: { key: TimeFilter; label: string }[] = [
    { key: "1D", label: "1 dag" },
    { key: "1W", label: "1 uke" },
    { key: "1M", label: "1 mnd" },
    { key: "YTD", label: "YTD" },
    { key: "1Y", label: "1 år" },
    { key: "ALL", label: "Alle" },
  ];

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
            <CardTitle className="font-serif">Avkastning siden 2024</CardTitle>
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
                <LineChart data={data}>
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
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="osebx"
                    name="OSEBX"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              * Verdier er normalisert til 100 ved periodens start for enkel sammenligning
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PerformanceSection;
