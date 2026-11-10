import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { visTicker } from "@/lib/utils";
import Selskapslogo from "./Selskapslogo";
import { kortNavn } from "@/lib/selskapslogoer";
import type { StockRow } from "@/components/PortfolioVisuals";
import { PERIODER, Periode, periodeStart, usePeriodeKurser } from "@/hooks/usePeriodeKurser";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Beholdningen som tabell: logo, andel av porteføljen, verdi, endring i dag
 * og utvikling i kroner for en valgfri periode (siden kjøp, 1 uke ... 1 år).
 */

const fmtKr = (n: number, fortegn = false) =>
  `${fortegn ? (n >= 0 ? "+" : "−") : ""}${Math.round(Math.abs(n)).toLocaleString("no-NO")} kr`;
const fmtPst = (n: number) =>
  `${n >= 0 ? "+" : "−"}${Math.abs(n).toLocaleString("no-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

const Beholdning = ({ stocks, totalVerdi }: { stocks: StockRow[]; totalVerdi: number }) => {
  const navigate = useNavigate();
  const [periode, setPeriode] = useState<Periode>("kjop");
  const kurser = usePeriodeKurser(periode !== "kjop");
  const stoerst = Math.max(...stocks.map((r) => r.value), 1);

  const utvikling = (r: StockRow): { kr: number; pst: number } | null => {
    const kost = r.holding.cost_basis || r.holding.purchase_price * r.holding.quantity;
    if (periode === "kjop") return kost > 0 ? { kr: r.value - kost, pst: (r.value / kost - 1) * 100 } : null;
    if (!kurser.klar || !r.quote?.price) return null;
    const start = kurser.kursINok(r.holding.ticker, periodeStart(periode));
    if (!start) return null;
    return { kr: (r.quote.price - start) * r.holding.quantity, pst: (r.quote.price / start - 1) * 100 };
  };

  const rader = stocks.map((r) => ({ r, u: utvikling(r) }));
  const sum = rader.reduce((s, { u }) => s + (u?.kr ?? 0), 0);
  const harAlle = rader.every(({ u }) => u);
  // Perioder lenger tilbake enn det eldste kjøpet viser aksjenes egen utvikling
  const forsteKjop = stocks
    .map((r) => r.holding.purchase_date)
    .filter(Boolean)
    .sort()[0] as string | undefined;
  const foerKjop = periode !== "kjop" && forsteKjop && periodeStart(periode) < forsteKjop;
  const periodeNavn = PERIODER.find((p) => p.id === periode)!.navn.toLowerCase();

  const th = "py-3 px-4 text-[13px] font-normal text-muted-foreground";

  return (
    <section className="section-container pb-16">
      <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">Beholdning</h2>
      <div className="border-y border-border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className={`${th} text-left pl-0`}>Selskap</th>
              <th className={`${th} text-left hidden md:table-cell w-[22%]`}>Andel</th>
              <th className={`${th} text-right hidden sm:table-cell`}>Verdi</th>
              <th className={`${th} text-right hidden md:table-cell`}>I dag</th>
              <th className={`${th} text-right pr-0`}>
                <Select value={periode} onValueChange={(v) => setPeriode(v as Periode)}>
                  <SelectTrigger
                    aria-label="Velg periode"
                    className="ml-auto h-8 w-auto gap-1.5 whitespace-nowrap [&>span]:line-clamp-none border-0 border-b border-competition rounded-none bg-transparent px-0 text-[13px] text-foreground focus:ring-0 focus:ring-offset-0"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {PERIODER.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.navn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </th>
            </tr>
          </thead>
          <tbody>
            {rader.map(({ r, u }) => {
              const andel = totalVerdi > 0 ? (r.value / totalVerdi) * 100 : 0;
              const idag = r.quote?.changePercent;
              return (
                <tr
                  key={r.holding.id}
                  onClick={() => navigate(`/aksje/${r.holding.ticker}`)}
                  className="border-b border-border/60 last:border-0 hover:bg-secondary/40 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3.5">
                      <Selskapslogo ticker={r.holding.ticker} navn={r.holding.name} storrelse={38} />
                      <div className="min-w-0">
                        {/* Lenken gjør raden tilgjengelig med tastatur og skjermleser */}
                        <Link
                          to={`/aksje/${r.holding.ticker}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-serif text-lg leading-tight text-foreground hover:underline underline-offset-2"
                        >
                          {kortNavn(r.holding.name)}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">
                          {visTicker(r.holding.ticker)}
                          {r.holding.sector ? ` · ${r.holding.sector}` : ""}
                          <span className="sm:hidden"> · {fmtKr(r.value)}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(r.value / stoerst) * 100}%`,
                            background: r.value === stoerst ? "hsl(var(--competition))" : "hsl(var(--band))",
                          }}
                        />
                      </div>
                      <span className="text-sm tabular-nums text-muted-foreground w-12 text-right">
                        {andel.toLocaleString("no-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums hidden sm:table-cell">{fmtKr(r.value)}</td>
                  <td
                    className={`py-3.5 px-4 text-right tabular-nums text-sm hidden md:table-cell ${
                      idag == null ? "text-muted-foreground" : idag >= 0 ? "text-opp" : "text-ned"
                    }`}
                  >
                    {idag == null ? "–" : fmtPst(idag)}
                  </td>
                  <td className="py-3.5 pl-4 text-right tabular-nums">
                    {u ? (
                      <>
                        <p className={`font-medium ${u.kr >= 0 ? "text-opp" : "text-ned"}`}>{fmtKr(u.kr, true)}</p>
                        <p className="text-xs text-muted-foreground">{fmtPst(u.pst)}</p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{kurser.laster ? "…" : "–"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {harAlle && (
            <tfoot>
              <tr className="border-t border-border">
                <td className="py-4 pr-4 text-sm text-muted-foreground" colSpan={1}>
                  Sum aksjer
                </td>
                <td className="hidden md:table-cell" />
                <td className="py-4 px-4 text-right tabular-nums hidden sm:table-cell">
                  {fmtKr(stocks.reduce((s, r) => s + r.value, 0))}
                </td>
                <td className="hidden md:table-cell" />
                <td className={`py-4 pl-4 text-right tabular-nums font-medium ${sum >= 0 ? "text-opp" : "text-ned"}`}>
                  {fmtKr(sum, true)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-3 max-w-2xl">
        {periode === "kjop"
          ? "Siden kjøp viser gevinst eller tap mot det vi betalte for aksjene."
          : foerKjop
            ? `Vi har eid aksjene kortere enn ${periodeNavn}, så tallene viser hvordan aksjene har gått i perioden, regnet på antallet vi eier i dag.`
            : "Utvikling for valgt periode, regnet på antallet vi eier i dag."}
        {kurser.feil && periode !== "kjop" && " Kurshistorikken kunne ikke hentes akkurat nå."}
      </p>
    </section>
  );
};

export default Beholdning;
