import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Forutsetninger, LagretVerdsettelse } from "@/lib/analyse/db";
import { hentVerdsettelser, slettVerdsettelse } from "@/lib/analyse/db";
import type { VerdsettelseInputs, VerdsettelseResultater } from "@/lib/analyse/verdsettelse";
import { ANBEFALING_TEKST, beloep, prosent } from "@/lib/finans/konklusjon";
import VerdsettelseVerksted from "./VerdsettelseVerksted";

type Rad = LagretVerdsettelse<VerdsettelseInputs, VerdsettelseResultater>;

/**
 * Oversikten over lagrede verdsettelser. Åpner ekspertvisningen for en
 * eksisterende analyse eller en ny.
 */
const Verdsettelser = ({ forutsetninger, tickerForslag }: { forutsetninger: Forutsetninger; tickerForslag: { ticker: string; navn: string }[] }) => {
  const { toast } = useToast();
  const [rader, setRader] = useState<Rad[]>([]);
  const [laster, setLaster] = useState(true);
  const [aapen, setAapen] = useState<Rad | null | "ny">(null);

  const last = useCallback(async () => {
    try {
      setRader(await hentVerdsettelser<VerdsettelseInputs, VerdsettelseResultater>());
    } catch (e) {
      toast({ title: "Kunne ikke hente verdsettelser", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setLaster(false);
    }
  }, [toast]);

  useEffect(() => {
    last();
  }, [last]);

  if (aapen !== null) {
    return (
      <VerdsettelseVerksted
        lagret={aapen === "ny" ? null : aapen}
        forutsetninger={forutsetninger}
        tickerForslag={tickerForslag}
        onTilbake={() => setAapen(null)}
        onLagret={last}
      />
    );
  }

  const slett = async (r: Rad) => {
    if (!confirm(`Slette verdsettelsen av ${r.selskapsnavn}?`)) return;
    try {
      await slettVerdsettelse(r.id);
      await last();
    } catch (e) {
      toast({ title: "Kunne ikke slette", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl">Verdsettelser</h2>
          <p className="text-sm text-muted-foreground">DCF, utbyttemodell og multipler i samme modell - med presentasjonsvisning for komiteen.</p>
        </div>
        <Button onClick={() => setAapen("ny")}><Plus className="w-4 h-4 mr-1" />Ny verdsettelse</Button>
      </div>

      {laster ? (
        <p className="text-sm text-muted-foreground">Laster...</p>
      ) : rader.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center text-muted-foreground">
          <p>Ingen verdsettelser ennå.</p>
          <p className="text-sm mt-1">Start med en aksje dere eier - «Fyll fra aksjesiden» henter regnskapstallene.</p>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-card text-muted-foreground text-xs">
              <tr>
                <th className="text-left font-normal px-4 py-2">Selskap</th>
                <th className="text-left font-normal px-4 py-2">Vurdering</th>
                <th className="text-right font-normal px-4 py-2">Verdi</th>
                <th className="text-right font-normal px-4 py-2">Kurs da</th>
                <th className="text-right font-normal px-4 py-2">Oppside</th>
                <th className="text-left font-normal px-4 py-2">Status</th>
                <th className="text-left font-normal px-4 py-2">Oppdatert</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rader.map((r) => {
                const s = r.resultater?.samlet;
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-card/60 cursor-pointer" onClick={() => setAapen(r)}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.selskapsnavn}</p>
                      <p className="text-xs text-muted-foreground">{r.ticker}</p>
                    </td>
                    <td className="px-4 py-3">
                      {r.anbefaling ? (
                        <span className={r.anbefaling === "kjop" ? "stock-positive" : r.anbefaling === "selg" ? "stock-negative" : "text-foreground"}>
                          {ANBEFALING_TEKST[r.anbefaling].tittel}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{s ? beloep(s.sentralverdi, r.valuta, 0) : "-"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{beloep(r.inputs?.aksjekurs, r.valuta, 2)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${s ? (s.oppside >= 0 ? "stock-positive" : "stock-negative") : ""}`}>{s ? prosent(s.oppside) : "-"}</td>
                    <td className="px-4 py-3"><Badge variant={r.status === "ferdig" ? "default" : "secondary"}>{r.status === "ferdig" ? "Ferdig" : "Utkast"}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.updated_at).toLocaleDateString("no-NO")}</td>
                    <td className="px-2 py-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); slett(r); }}><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Verdsettelser;
