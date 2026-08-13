import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import type { Holding, StockQuote } from "@/hooks/usePortfolioData";

/**
 * Visualiseringer for porteføljesiden: fordeling (smultring + fakta +
 * posisjonsbrikker) og bidrag per posisjon (liggende stolper).
 * Egen palett i grønt og sand — dus og rolig, med gull for kontanter/fond.
 */

export interface StockRow {
  holding: Holding;
  quote: StockQuote | undefined;
  value: number;
}

export interface OtherRow {
  holding: Holding;
  value: number;
}

const STOCK_COLORS = [
  "hsl(153 20% 30%)",
  "hsl(150 14% 44%)",
  "hsl(148 11% 57%)",
  "hsl(110 9% 52%)",
  "hsl(45 18% 66%)",
  "hsl(160 16% 38%)",
  "hsl(146 9% 68%)",
  "hsl(42 14% 56%)",
  "hsl(100 8% 62%)",
  "hsl(155 10% 50%)",
  "hsl(50 12% 76%)",
  "hsl(150 6% 74%)",
];
const OTHER_COLOR = "hsl(38 50% 56%)";

const formatKr = (n: number) => `${Math.round(n).toLocaleString("no-NO")} kr`;

/* ---------- Fordeling: smultring + fakta + brikker ---------- */

export const AllocationSection = ({
  stocks,
  other,
  totalValue,
}: {
  stocks: StockRow[];
  other: OtherRow[];
  totalValue: number;
}) => {
  // Hvilket kakestykke pekes det på? De andre fader ut så det aktive står frem.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  if (totalValue <= 0 || stocks.length + other.length === 0) return null;

  const stockValue = stocks.reduce((s, r) => s + r.value, 0);
  const stockShare = (stockValue / totalValue) * 100;

  const slices = [
    ...stocks.map((r, i) => ({
      name: r.holding.name,
      ticker: r.holding.ticker,
      value: r.value,
      share: (r.value / totalValue) * 100,
      color: STOCK_COLORS[i % STOCK_COLORS.length],
      // Bare aksjer har egen side med nøkkeltall og regnskap
      lenke: `/aksje/${r.holding.ticker}`,
    })),
    ...other.map((r) => ({
      name: r.holding.name,
      ticker: r.holding.holding_type === "fund" ? "Fond" : r.holding.name,
      value: r.value,
      share: (r.value / totalValue) * 100,
      color: OTHER_COLOR,
      lenke: null as string | null,
    })),
  ];

  const facts = [
    { label: "Aksjer", value: `${stockShare.toFixed(1).replace(".", ",")} %` },
    { label: "Fond og bank", value: `${(100 - stockShare).toFixed(1).replace(".", ",")} %` },
    { label: "Posisjoner", value: String(slices.length) },
  ];

  return (
    <div className="section-container pb-16">
      <div
        className="rounded-md border border-border bg-card"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        <div className="grid lg:grid-cols-[1fr_1.6fr]">
          {/* Venstre: fakta */}
          <div className="p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-border">
            <p className="eyebrow mb-3">Porteføljefakta</p>
            <p className="text-sm text-muted-foreground mb-8">
              Fordelingen mellom aksjer, fond og bankinnskudd — live.
            </p>
            {facts.map((fact, i) => (
              <div key={fact.label} className={i > 0 ? "pt-6 mt-6 border-t border-border" : ""}>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                  {fact.label}
                </p>
                <p className="font-serif text-3xl md:text-4xl text-foreground tabular-nums">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>

          {/* Høyre: smultring + brikker */}
          <div className="p-8 md:p-10">
            <div className="relative h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="95%"
                    paddingAngle={1.5}
                    strokeWidth={0}
                    onMouseEnter={(_: unknown, index: number) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={(_: unknown, index: number) => {
                      const lenke = slices[index]?.lenke;
                      if (lenke) navigate(lenke);
                    }}
                  >
                    {slices.map((slice, i) => (
                      <Cell
                        key={slice.name}
                        fill={slice.color}
                        fillOpacity={activeIndex === null || activeIndex === i ? 1 : 0.22}
                        style={{
                          transition: "fill-opacity 0.25s ease",
                          cursor: slice.lenke ? "pointer" : "default",
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    content={({ active, payload }: any) =>
                      active && payload?.length ? (
                        <div className="rounded-md border border-border bg-card px-4 py-3 shadow-md">
                          <p className="font-medium text-foreground text-sm">{payload[0].payload.name}</p>
                          <p className="text-sm text-muted-foreground tabular-nums">
                            {payload[0].payload.share.toFixed(1).replace(".", ",")} % · {formatKr(payload[0].payload.value)}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Senterteksten */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.22em] text-muted-foreground mb-1">
                  Aksjeandel
                </p>
                <p className="font-serif text-3xl md:text-4xl text-foreground tabular-nums">
                  {stockShare.toFixed(1).replace(".", ",")} %
                </p>
              </div>
            </div>

            {/* Posisjonsbrikker */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mt-8">
              {slices.map((slice, i) => {
                const klasser = `flex items-center justify-between gap-2 rounded-[4px] border bg-background px-3 py-2 transition-all duration-200 ${
                  slice.lenke ? "cursor-pointer hover:border-foreground/40" : "cursor-default"
                } ${
                  activeIndex === i
                    ? "border-foreground/40 shadow-sm"
                    : activeIndex !== null
                    ? "border-border opacity-45"
                    : "border-border"
                }`;
                const pek = {
                  onMouseEnter: () => setActiveIndex(i),
                  onMouseLeave: () => setActiveIndex(null),
                };
                const innhold = (
                  <>
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: slice.color }}
                    />
                    <span className="text-xs font-medium text-foreground truncate">{slice.ticker}</span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {slice.share.toFixed(1).replace(".", ",")} %
                  </span>
                  </>
                );
                // Aksjer lenker til sin egen side; fond og bank har ingen.
                return slice.lenke ? (
                  <Link key={slice.name} to={slice.lenke} className={klasser} {...pek}>
                    {innhold}
                  </Link>
                ) : (
                  <div key={slice.name} className={klasser} {...pek}>
                    {innhold}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Bidrag per posisjon: liggende stolper ---------- */

export const ContributionSection = ({ stocks }: { stocks: StockRow[] }) => {
  const [mode, setMode] = useState<"kr" | "pct">("kr");

  const rows = stocks
    .map((r) => {
      const cost = r.holding.cost_basis || r.holding.purchase_price * r.holding.quantity;
      const gain = r.value - cost;
      const pct = cost > 0 ? (gain / cost) * 100 : 0;
      return { ticker: r.holding.ticker, name: r.holding.name, gain, pct };
    })
    .sort((a, b) => (mode === "kr" ? b.gain - a.gain : b.pct - a.pct));

  if (rows.length === 0) return null;

  const best = rows[0];
  const worst = rows[rows.length - 1];
  const positive = "hsl(153 20% 32%)";
  const negative = "hsl(14 55% 45%)";
  // Rett etter en nullstilling er kostprisen lik dagens kurs, og alle
  // stolpene blir null. Da er grafen bare fem tomme linjer, så vi sier
  // det med ord i stedet.
  // Terskelen er relativ, ikke i kroner: kostprisen settes fra
  // markedsverdien avrundet til hele kroner, så en fersk nullstilling gir
  // noen få øre i utslag per posisjon. 0,05 % er godt under det som er
  // synlig i en graf, og passeres med god margin så snart kursen rører seg.
  const alleNull = rows.every((r) => Math.abs(r.pct) < 0.05);

  return (
    <div className="section-container pb-16">
      <div className="grid lg:grid-cols-[1fr_2.2fr] gap-10 lg:gap-14 items-start">
        {/* Venstre: forklaring */}
        <div className="lg:sticky lg:top-24">
          <p className="eyebrow mb-5">Bidrag per posisjon</p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
            Avkastning per aksje
          </h2>
          <div className="w-10 h-px bg-foreground/30 mb-6" />
          <p className="text-muted-foreground leading-relaxed">
            Stolpene viser urealisert gevinst og tap per posisjon — hvem som
            drar lasset, og hvem som skuffer. Målt fra kursen da komiteen tok
            over porteføljen dette semesteret, samme utgangspunkt som grafen
            lenger ned. Bytt mellom kroner og prosentvis avkastning.
          </p>
        </div>

        {/* Høyre: grafen */}
        <div
          className="rounded-md border border-border bg-card p-6 md:p-8"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          {alleNull ? (
            <p className="text-muted-foreground leading-relaxed py-6">
              Kostprisene er nettopp nullstilt, så alle posisjonene står på
              null. Stolpene begynner å bevege seg fra neste kursoppdatering,
              og etter noen dager ser du hvilke selskaper som trekker
              porteføljen opp og ned.
            </p>
          ) : (
          <>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex gap-8">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  Størst bidrag
                </p>
                <p className="font-serif text-2xl text-foreground">
                  {best.ticker}{" "}
                  <span className="text-sm font-sans text-muted-foreground tabular-nums">
                    {mode === "kr" ? formatKr(best.gain) : `${best.pct >= 0 ? "+" : ""}${best.pct.toFixed(1)} %`}
                  </span>
                </p>
              </div>
              <div className="border-l border-border pl-8">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  Svakest bidrag
                </p>
                <p className="font-serif text-2xl text-foreground">
                  {worst.ticker}{" "}
                  <span className="text-sm font-sans text-muted-foreground tabular-nums">
                    {mode === "kr" ? formatKr(worst.gain) : `${worst.pct >= 0 ? "+" : ""}${worst.pct.toFixed(1)} %`}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("kr")}
                className={`px-4 py-1.5 rounded-[4px] text-sm font-medium border transition-colors ${
                  mode === "kr"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Kroner
              </button>
              <button
                onClick={() => setMode("pct")}
                className={`px-4 py-1.5 rounded-[4px] text-sm font-medium border transition-colors ${
                  mode === "pct"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Prosent
              </button>
            </div>
          </div>

          <div style={{ height: rows.length * 38 + 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    mode === "kr"
                      ? `${Math.round(v / 1000).toLocaleString("no-NO")}k`
                      : `${v} %`
                  }
                />
                <YAxis
                  type="category"
                  dataKey="ticker"
                  width={64}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <ReferenceLine x={0} stroke="hsl(var(--border))" />
                <Tooltip
                  cursor={{ fill: "hsl(var(--secondary) / 0.6)" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  content={({ active, payload }: any) =>
                    active && payload?.length ? (
                      <div className="rounded-md border border-border bg-card px-4 py-3 shadow-md">
                        <p className="font-medium text-foreground text-sm">{payload[0].payload.name}</p>
                        <p className="text-sm text-muted-foreground tabular-nums">
                          {formatKr(payload[0].payload.gain)} ·{" "}
                          {payload[0].payload.pct >= 0 ? "+" : ""}
                          {payload[0].payload.pct.toFixed(1)} %
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey={mode === "kr" ? "gain" : "pct"} radius={[2, 2, 2, 2]} barSize={16}>
                  {rows.map((row) => (
                    <Cell key={row.ticker} fill={row.gain >= 0 ? positive : negative} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          </>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Urealisert gevinst/tap målt mot kostpris, altså kursen porteføljen
            ble nullstilt til. Live-kurser fra Oslo Børs.
          </p>
        </div>
      </div>
    </div>
  );
};
