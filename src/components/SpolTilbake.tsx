import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HANDELSTYPER, type Handel, hentHandler } from "@/lib/handelslogg";
import { visTicker } from "@/lib/utils";

/**
 * «Spol tilbake»: dra i tidslinjen og se porteføljen slik den var på en
 * valgt dag - hvilke aksjer vi eide, hvor mye de var verdt og hvor mye hver
 * aksje har bidratt med så langt. Bygger på de daglige snapshotene
 * (portfolio_stock_snapshots) og handelsloggen (portfolio_transactions).
 *
 * Bidrag for en aksje på dag D = verdien D + alle kontantstrømmer for aksjen
 * t.o.m. D (kjøp er negative, salg og utbytte positive). For en solgt aksje
 * blir det realisert gevinst/tap.
 */

interface Snap {
  date: string;
  ticker: string;
  name: string;
  quantity: number;
  value_nok: number;
}

const kr = (n: number) => `${Math.round(n).toLocaleString("no-NO")} kr`;
const fortegnKr = (n: number) => `${n >= 0 ? "+" : "−"}${kr(Math.abs(n))}`;
const datoTekst = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("no-NO", { day: "numeric", month: "long", year: "numeric" });

const SpolTilbake = () => {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [handler, setHandler] = useState<Handel[]>([]);
  const [laster, setLaster] = useState(true);
  const [indeks, setIndeks] = useState<number | null>(null);

  useEffect(() => {
    let aktiv = true;
    (async () => {
      const [{ data }, h] = await Promise.all([
        supabase
          .from("portfolio_stock_snapshots")
          .select("date, ticker, name, quantity, value_nok")
          .neq("ticker", "OSEBX")
          .order("date", { ascending: true }),
        hentHandler(),
      ]);
      if (!aktiv) return;
      setSnaps(
        (data ?? []).map((s) => ({ ...s, quantity: Number(s.quantity), value_nok: Number(s.value_nok) })),
      );
      setHandler([...h].reverse()); // eldste først
      setLaster(false);
    })();
    return () => {
      aktiv = false;
    };
  }, []);

  const datoer = useMemo(() => [...new Set(snaps.map((s) => s.date))].sort(), [snaps]);
  const i = indeks ?? datoer.length - 1;
  const dato = datoer[i];

  const visning = useMemo(() => {
    if (!dato) return null;
    const dagens = snaps.filter((s) => s.date === dato);
    const kontanter = dagens.find((s) => s.ticker === "KONTANTER")?.value_nok ?? 0;
    const aksjer = dagens.filter((s) => s.ticker !== "KONTANTER" && s.quantity > 0);
    const total = aksjer.reduce((s, a) => s + a.value_nok, 0) + kontanter;

    const strom = (t: string) =>
      handler.filter((h) => h.ticker === t && h.trade_date <= dato).reduce((s, h) => s + h.belop_nok, 0);

    const rader = aksjer
      .map((a) => ({
        ...a,
        andel: total > 0 ? (a.value_nok / total) * 100 : 0,
        // Uten handelslogg for aksjen kan vi ikke regne bidrag
        bidrag: handler.some((h) => h.ticker === a.ticker) ? a.value_nok + strom(a.ticker) : null,
      }))
      .sort((a, b) => b.value_nok - a.value_nok);

    // Aksjer vi har eid før, men ikke eier denne dagen
    const eide = new Set(aksjer.map((a) => a.ticker));
    const solgte = [...new Set(handler.filter((h) => h.trade_date <= dato && h.ticker).map((h) => h.ticker!))]
      .filter((t) => !eide.has(t) && handler.some((h) => h.ticker === t && h.type === "salg" && h.trade_date <= dato))
      .map((t) => {
        const siste = [...handler].reverse().find((h) => h.ticker === t && h.type === "salg" && h.trade_date <= dato)!;
        return { ticker: t, name: siste.name || visTicker(t), solgt: siste.trade_date, bidrag: strom(t) };
      });

    // Hendelser t.o.m. valgt dag, gruppert per dag (nyeste først)
    const perDag = new Map<string, Handel[]>();
    for (const h of handler) {
      if (h.trade_date > dato || h.type === "gebyr") continue;
      perDag.set(h.trade_date, [...(perDag.get(h.trade_date) ?? []), h]);
    }
    const hendelser = [...perDag.entries()].reverse().slice(0, 5);

    const maksAndel = Math.max(1, ...rader.map((r) => r.andel));
    return { rader, solgte, total, kontanter, hendelser, maksAndel };
  }, [dato, snaps, handler]);

  const hendelseTekst = (liste: Handel[]) => {
    const kjop = liste.filter((h) => h.type === "kjop");
    const andre = liste.filter((h) => h.type !== "kjop");
    const deler: string[] = [];
    if (kjop.length > 3) deler.push(`Kjøpte ${kjop.length} aksjer`);
    else for (const h of kjop) deler.push(`Kjøpte ${h.name || visTicker(h.ticker ?? "")}`);
    for (const h of andre) {
      const navn = h.name || visTicker(h.ticker ?? "");
      deler.push(h.type === "salg" ? `Solgte ${navn}` : `${HANDELSTYPER[h.type]} fra ${navn} (${kr(h.belop_nok)})`);
    }
    return deler.join(" · ");
  };

  if (laster || !visning || !dato) return null;

  return (
    <section className="section-container pb-16">
      <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-2">Spol tilbake</h2>
      <p className="text-muted-foreground mb-6 max-w-2xl">
        Dra i tidslinjen for å se porteføljen slik den var en bestemt dag, og hvor mye hver aksje hadde bidratt med.
      </p>

      <div className="rounded-md border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Porteføljen</p>
            <p className="font-serif text-3xl text-foreground">{datoTekst(dato)}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Verdi</p>
            <p className="font-serif text-3xl tabular-nums text-foreground">{kr(visning.total)}</p>
          </div>
        </div>

        {datoer.length > 1 ? (
          <div className="mb-8">
            <input
              type="range"
              min={0}
              max={datoer.length - 1}
              value={i}
              onChange={(e) => setIndeks(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Velg dato"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{datoTekst(datoer[0])}</span>
              <span>{datoTekst(datoer[datoer.length - 1])}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-8">
            Porteføljen startet {datoTekst(datoer[0])}. Tidslinjen fylles på med én dag hver hverdag.
          </p>
        )}

        <div className="divide-y divide-border/60">
          {visning.rader.map((r) => (
            <div key={r.ticker} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] md:grid-cols-[12rem_1fr_9rem_8rem] items-center gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground">{visTicker(r.ticker)} · {r.quantity.toLocaleString("no-NO")} stk</p>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="h-3 rounded-sm bg-primary transition-all duration-300"
                  style={{ width: `${(r.andel / visning.maksAndel) * 100}%` }}
                />
                <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                  {r.andel.toFixed(1).replace(".", ",")} %
                </span>
              </div>
              <p className="hidden md:block text-sm text-right tabular-nums">{kr(r.value_nok)}</p>
              <p
                className={`text-sm text-right tabular-nums ${
                  r.bidrag === null ? "text-muted-foreground" : r.bidrag >= 0 ? "stock-positive" : "stock-negative"
                }`}
                title="Bidrag så langt: verdi + salg og utbytte − kjøp"
              >
                {r.bidrag === null ? "-" : fortegnKr(r.bidrag)}
              </p>
            </div>
          ))}
          {visning.kontanter >= 1 && (
            <div className="flex justify-between py-2.5 text-sm">
              <span className="text-muted-foreground">Kontanter</span>
              <span className="tabular-nums">{kr(visning.kontanter)}</span>
            </div>
          )}
        </div>

        {visning.solgte.length > 0 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Solgt tidligere</p>
            <div className="divide-y divide-border/60">
              {visning.solgte.map((s) => (
                <div key={s.ticker} className="flex justify-between gap-4 py-2 text-sm">
                  <span>
                    {s.name} <span className="text-muted-foreground">· solgt {datoTekst(s.solgt)}</span>
                  </span>
                  <span className={`tabular-nums ${s.bidrag >= 0 ? "stock-positive" : "stock-negative"}`}>
                    {fortegnKr(s.bidrag)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {visning.hendelser.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Hendelser</p>
            <ul className="space-y-1 text-sm">
              {visning.hendelser.map(([d, liste]) => (
                <li key={d} className={d === dato ? "text-foreground font-medium" : "text-muted-foreground"}>
                  <span className="tabular-nums">{datoTekst(d)}</span>: {hendelseTekst(liste)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default SpolTilbake;
