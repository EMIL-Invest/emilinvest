import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { visTicker } from "@/lib/utils";
import Selskapslogo from "./Selskapslogo";
import { kortNavn } from "@/lib/selskapslogoer";
import type { StockRow } from "@/components/PortfolioVisuals";

/**
 * Kartet: én rute per aksje. Størrelsen er hvor mye av porteføljen aksjen
 * utgjør, fargen er om den går opp (grønn) eller ned (rød). Logoen står
 * midt i ruta.
 */

type Visning = "idag" | "kjop";

interface Rute {
  rad: StockRow;
  vekt: number;
  endring: number; // prosent
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Squarified treemap (Bruls, Huizing og van Wijk) i et w x h-rektangel. */
function squarify<T extends { areal: number }>(
  elementer: T[],
  x: number,
  y: number,
  w: number,
  h: number,
): (T & { x: number; y: number; w: number; h: number })[] {
  const ut: (T & { x: number; y: number; w: number; h: number })[] = [];
  let rest = [...elementer];
  while (rest.length > 0) {
    const kort = Math.min(w, h);
    let rad: T[] = [];
    let best = Infinity;
    for (const e of rest) {
      const prov = [...rad, e];
      const sum = prov.reduce((s, r) => s + r.areal, 0);
      const maks = Math.max(...prov.map((r) => r.areal));
      const min = Math.min(...prov.map((r) => r.areal));
      const verst = Math.max((kort * kort * maks) / (sum * sum), (sum * sum) / (kort * kort * min));
      if (verst > best) break;
      best = verst;
      rad = prov;
    }
    const sum = rad.reduce((s, r) => s + r.areal, 0);
    const tykk = sum / kort;
    let pos = 0;
    for (const r of rad) {
      const len = r.areal / tykk;
      if (w >= h) ut.push({ ...r, x, y: y + pos, w: tykk, h: len });
      else ut.push({ ...r, x: x + pos, y, w: len, h: tykk });
      pos += len;
    }
    if (w >= h) {
      x += tykk;
      w -= tykk;
    } else {
      y += tykk;
      h -= tykk;
    }
    rest = rest.slice(rad.length);
  }
  return ut;
}

/** Dempet grønn/rød, sterkere jo større utslaget er. Fast fargetone per
 *  retning, så det aldri glir over i gult/brunt underveis. */
const farge = (endring: number, tak: number) => {
  const t = 0.3 + 0.7 * Math.min(Math.abs(endring) / tak, 1);
  if (endring >= 0) return `hsl(148 ${14 + 30 * t}% ${24 + 6 * t}%)`;
  return `hsl(8 ${16 + 34 * t}% ${26 + 12 * t}%)`;
};

const fmtPst = (n: number) =>
  `${n >= 0 ? "+" : "−"}${Math.abs(n).toLocaleString("no-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

const Porteforljekart = ({ stocks, totalVerdi }: { stocks: StockRow[]; totalVerdi: number }) => {
  const totalAksjer = stocks.reduce((s, r) => s + Math.max(r.value, 0), 0);
  const [visning, setVisning] = useState<Visning>("idag");
  const boks = useRef<HTMLDivElement>(null);
  const [bredde, setBredde] = useState(0);

  useEffect(() => {
    const el = boks.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBredde(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hoyde = bredde < 640 ? Math.round(bredde * 1.35) : Math.round(Math.min(560, bredde * 0.48));

  const ruter: Rute[] = useMemo(() => {
    if (!bredde || totalAksjer <= 0) return [];
    const elementer = stocks
      .filter((r) => r.value > 0)
      .map((r) => {
        const kost = r.holding.cost_basis || r.holding.purchase_price * r.holding.quantity;
        const endring =
          visning === "idag" ? r.quote?.changePercent ?? 0 : kost > 0 ? (r.value / kost - 1) * 100 : 0;
        return { rad: r, vekt: totalVerdi > 0 ? (r.value / totalVerdi) * 100 : 0, endring, areal: (r.value / totalAksjer) * bredde * hoyde };
      })
      .sort((a, b) => b.areal - a.areal);
    return squarify(elementer, 0, 0, bredde, hoyde);
  }, [stocks, totalAksjer, totalVerdi, visning, bredde, hoyde]);

  const tak = visning === "idag" ? 2.5 : 12;

  const knapp = (id: Visning, tekst: string) => (
    <button
      type="button"
      onClick={() => setVisning(id)}
      aria-pressed={visning === id}
      className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
        visning === id
          ? "bg-band text-white border-transparent"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {tekst}
    </button>
  );

  return (
    <section className="section-container pt-14 md:pt-20 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground">Alle aksjene på ett blikk</h2>
          <p className="text-muted-foreground mt-2">
            Jo større rute, jo mer av porteføljen. Grønn er opp, rød er ned.
          </p>
        </div>
        <div className="flex gap-2">
          {knapp("idag", "I dag")}
          {knapp("kjop", "Siden kjøp")}
        </div>
      </div>

      <div ref={boks} className="relative w-full" style={{ height: hoyde || 400 }}>
        {ruter.map(({ rad, vekt, endring, x, y, w, h }) => {
          const kort = Math.min(w, h);
          const liten = kort < 96 || h < 125;
          const visMeta = !liten && h >= 165 && w >= 130;
          const logo = Math.max(28, Math.min(72, kort * 0.34));
          return (
            <Link
              key={rad.holding.id}
              to={`/aksje/${rad.holding.ticker}`}
              className="absolute group focus-visible:outline-none"
              style={{ left: x, top: y, width: w, height: h, padding: 1.5 }}
              aria-label={`${rad.holding.name}: ${vekt.toFixed(1)} % av porteføljen, ${fmtPst(endring)} ${
                visning === "idag" ? "i dag" : "siden kjøp"
              }`}
            >
              <div
                className="w-full h-full flex flex-col items-center justify-center text-center text-white px-2 transition-[filter] group-hover:brightness-110 group-focus-visible:ring-2 group-focus-visible:ring-competition group-focus-visible:ring-inset"
                style={{ background: farge(endring, tak) }}
              >
                <Selskapslogo ticker={rad.holding.ticker} navn={rad.holding.name} storrelse={logo} />
                {!liten && (
                  <p className="font-serif text-base md:text-lg leading-tight mt-3 line-clamp-2">
                    {kortNavn(rad.holding.name)}
                  </p>
                )}
                <p className={`font-semibold tabular-nums ${liten ? "text-xs mt-1.5" : "text-sm md:text-base mt-1"}`}>
                  {fmtPst(endring)}
                </p>
                {visMeta && (
                  <p className="text-[11px] text-white/60 tabular-nums mt-0.5">
                    {visTicker(rad.holding.ticker)} · {vekt.toLocaleString("no-NO", { maximumFractionDigits: 1 })} %
                    av porteføljen
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">Trykk på en aksje for kurs og nøkkeltall.</p>
    </section>
  );
};

export default Porteforljekart;
