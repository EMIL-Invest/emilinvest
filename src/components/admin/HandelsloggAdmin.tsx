import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Holding } from "@/hooks/usePortfolioData";
import {
  HANDELSTYPER,
  type Handel,
  type HandelsType,
  hentHandler,
  hentKontanter,
  kontantEffekt,
  registrerHandel,
  slettHandel,
} from "@/lib/handelslogg";
import { visTicker } from "@/lib/utils";

interface Props {
  holdings: Holding[];
  onRefresh: () => void;
}

const iDag = () => new Date().toISOString().slice(0, 10);
const kr = (n: number) => `${Math.round(n).toLocaleString("nb-NO")} kr`;
const tall = (s: string) => parseFloat(s.replace(/\s/g, "").replace(",", ".")) || 0;
const NY = "__ny__";

const tomt = {
  type: "kjop" as HandelsType,
  dato: iDag(),
  ticker: "",
  nyTicker: "",
  navn: "",
  sektor: "",
  bors: "OSE",
  antall: "",
  kurs: "",
  kurtasje: "",
  beloep: "",
  notat: "",
};

const HandelsloggAdmin = ({ holdings, onRefresh }: Props) => {
  const { toast } = useToast();
  const [handler, setHandler] = useState<Handel[]>([]);
  const [kontanter, setKontanter] = useState<number | null>(null);
  const [laster, setLaster] = useState(true);
  const [lagrer, setLagrer] = useState(false);
  const [f, setF] = useState(tomt);

  const aksjer = useMemo(() => holdings.filter((h) => h.holding_type === "stock"), [holdings]);
  const sett = (k: keyof typeof tomt, v: string) => setF((x) => ({ ...x, [k]: v }));

  const last = useCallback(async () => {
    setLaster(true);
    const [h, k] = await Promise.all([hentHandler(), hentKontanter()]);
    setHandler(h);
    setKontanter(k);
    setLaster(false);
  }, []);

  useEffect(() => {
    last();
  }, [last]);

  const medAksje = f.type === "kjop" || f.type === "salg" || f.type === "utbytte";
  const medAntall = f.type === "kjop" || f.type === "salg";
  const nyAksje = f.type === "kjop" && f.ticker === NY;
  const ticker = nyAksje ? f.nyTicker.trim().toUpperCase() : f.ticker;

  const effekt = kontantEffekt(f.type, tall(f.antall), tall(f.kurs), tall(f.kurtasje), tall(f.beloep));

  const lagre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (medAksje && !ticker) return toast({ title: "Velg aksje", variant: "destructive" });
    if (medAntall && !(tall(f.antall) > 0 && tall(f.kurs) > 0))
      return toast({ title: "Fyll inn antall og kurs", variant: "destructive" });
    if (!medAntall && !(tall(f.beloep) > 0)) return toast({ title: "Fyll inn beløp", variant: "destructive" });

    setLagrer(true);
    try {
      await registrerHandel(
        {
          trade_date: f.dato,
          type: f.type,
          ticker: medAksje ? ticker : null,
          name: nyAksje ? f.navn : null,
          quantity: medAntall ? tall(f.antall) : null,
          price_nok: medAntall ? tall(f.kurs) : null,
          fees_nok: tall(f.kurtasje),
          belop_nok: Math.round(effekt * 100) / 100,
          note: f.notat || null,
        },
        holdings,
        nyAksje ? { name: f.navn, sector: f.sektor || null, exchange: f.bors } : undefined,
      );
      toast({ title: "Lagret", description: `${HANDELSTYPER[f.type]} er ført i loggen.` });
      setF({ ...tomt, dato: f.dato });
      await last();
      onRefresh();
    } catch (err) {
      toast({ title: "Feil", description: err instanceof Error ? err.message : "Ukjent feil", variant: "destructive" });
    } finally {
      setLagrer(false);
    }
  };

  const slett = async (h: Handel) => {
    if (!confirm("Slette linjen fra loggen? Beholdningen endres ikke - rett den under Portefølje hvis nødvendig.")) return;
    try {
      await slettHandel(h.id);
      await last();
      onRefresh();
    } catch (err) {
      toast({ title: "Feil", description: err instanceof Error ? err.message : "Ukjent feil", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Før en handel</CardTitle>
          <CardDescription>
            Kjøp og salg oppdaterer beholdningen automatisk. Alle beløp i kroner. Innskudd og uttak av penger føres
            under Historikk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={lagre} className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Type</Label>
              <Select value={f.type} onValueChange={(v) => setF({ ...tomt, dato: f.dato, type: v as HandelsType })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(HANDELSTYPER) as HandelsType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {HANDELSTYPER[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dato</Label>
              <Input type="date" className="mt-1" value={f.dato} onChange={(e) => sett("dato", e.target.value)} />
            </div>
            {medAksje && (
              <div>
                <Label>Aksje</Label>
                <Select value={f.ticker} onValueChange={(v) => sett("ticker", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Velg aksje" />
                  </SelectTrigger>
                  <SelectContent>
                    {aksjer.map((h) => (
                      <SelectItem key={h.id} value={h.ticker}>
                        {h.name} ({visTicker(h.ticker)})
                      </SelectItem>
                    ))}
                    {f.type === "kjop" && <SelectItem value={NY}>+ Ny aksje</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            )}

            {nyAksje && (
              <>
                <div>
                  <Label>Ticker (Yahoo-format)</Label>
                  <Input className="mt-1" placeholder="EQNR.OL" value={f.nyTicker} onChange={(e) => sett("nyTicker", e.target.value)} />
                </div>
                <div>
                  <Label>Selskapsnavn</Label>
                  <Input className="mt-1" placeholder="Equinor" value={f.navn} onChange={(e) => sett("navn", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Sektor</Label>
                    <Input className="mt-1" value={f.sektor} onChange={(e) => sett("sektor", e.target.value)} />
                  </div>
                  <div>
                    <Label>Børs</Label>
                    <Input className="mt-1" value={f.bors} onChange={(e) => sett("bors", e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {medAntall ? (
              <>
                <div>
                  <Label>Antall</Label>
                  <Input className="mt-1" inputMode="decimal" value={f.antall} onChange={(e) => sett("antall", e.target.value)} />
                </div>
                <div>
                  <Label>Kurs per aksje (kr)</Label>
                  <Input className="mt-1" inputMode="decimal" value={f.kurs} onChange={(e) => sett("kurs", e.target.value)} />
                </div>
              </>
            ) : (
              <div>
                <Label>{f.type === "utbytte" ? "Utbytte totalt (kr)" : "Beløp (kr)"}</Label>
                <Input className="mt-1" inputMode="decimal" value={f.beloep} onChange={(e) => sett("beloep", e.target.value)} />
              </div>
            )}
            <div>
              <Label>{f.type === "utbytte" ? "Kildeskatt / gebyr (kr)" : "Kurtasje (kr)"}</Label>
              <Input className="mt-1" inputMode="decimal" placeholder="0" value={f.kurtasje} onChange={(e) => sett("kurtasje", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Notat</Label>
              <Input className="mt-1" value={f.notat} onChange={(e) => sett("notat", e.target.value)} />
            </div>

            <div className="md:col-span-3 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Kontanter endres med{" "}
                <span className={effekt >= 0 ? "stock-positive" : "stock-negative"}>
                  {effekt >= 0 ? "+" : "−"}
                  {kr(Math.abs(effekt))}
                </span>
              </p>
              <Button type="submit" disabled={lagrer}>
                {lagrer ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Lagre
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Handelslogg</CardTitle>
            <CardDescription>Alle handler, utbytter og gebyrer siden oppstart.</CardDescription>
          </div>
          {kontanter !== null && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Kontanter</p>
              <p className={`font-serif text-2xl tabular-nums ${kontanter < -0.5 ? "stock-negative" : ""}`}>{kr(kontanter)}</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {kontanter !== null && kontanter < -0.5 && (
            <p className="text-sm stock-negative mb-4">
              Kontantene er negative. Registrer innskuddet under Historikk, eller sjekk at handlene stemmer.
            </p>
          )}
          {laster ? (
            <p className="text-muted-foreground text-sm">Laster…</p>
          ) : handler.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Ingen handler ennå. Finnes ikke tabellen, må skriptet 32_handelslogg.sql kjøres i Supabase.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4 font-normal">Dato</th>
                    <th className="py-2 pr-4 font-normal">Type</th>
                    <th className="py-2 pr-4 font-normal">Aksje</th>
                    <th className="py-2 pr-4 font-normal text-right">Antall</th>
                    <th className="py-2 pr-4 font-normal text-right">Kurs</th>
                    <th className="py-2 pr-4 font-normal text-right">Kurtasje</th>
                    <th className="py-2 pr-4 font-normal text-right">Kontanter</th>
                    <th className="py-2 font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {handler.map((h) => (
                    <tr key={h.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 tabular-nums whitespace-nowrap">{h.trade_date}</td>
                      <td className="py-2 pr-4">{HANDELSTYPER[h.type]}</td>
                      <td className="py-2 pr-4">
                        {h.name || (h.ticker ? visTicker(h.ticker) : "-")}
                        {h.note && <span className="block text-xs text-muted-foreground">{h.note}</span>}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">{h.quantity ?? ""}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {h.price_nok !== null ? h.price_nok.toLocaleString("nb-NO", { maximumFractionDigits: 2 }) : ""}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">{h.fees_nok ? kr(h.fees_nok) : ""}</td>
                      <td className={`py-2 pr-4 text-right tabular-nums ${h.belop_nok >= 0 ? "stock-positive" : "stock-negative"}`}>
                        {h.belop_nok >= 0 ? "+" : "−"}
                        {kr(Math.abs(h.belop_nok))}
                      </td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" size="icon" onClick={() => slett(h)} aria-label="Slett linje">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HandelsloggAdmin;
