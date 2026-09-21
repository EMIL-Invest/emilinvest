import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PortefoljeResultat } from "@/lib/analyse/portefoljeanalyse";
import { forklarPortefolje } from "@/lib/analyse/portefoljeanalyse";
import { prosent, sats, tall } from "@/lib/finans/konklusjon";
import { EffisientFrontGraf } from "./Grafer";

/**
 * Presentasjonsvisning for porteføljeanalysen - fire tall, én figur, og
 * klarspråk om hva de betyr. Detaljene ligger i ekspertvisningen.
 */
const Kort = ({ tittel, verdi, forklaring, tone }: { tittel: string; verdi: string; forklaring: string; tone?: "god" | "daarlig" }) => (
  <div className="rounded-md border border-border bg-card p-5">
    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{tittel}</p>
    <p className={`font-serif text-3xl tabular-nums mt-1 ${tone === "god" ? "stock-positive" : tone === "daarlig" ? "stock-negative" : "text-foreground"}`}>{verdi}</p>
    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{forklaring}</p>
  </div>
);

const PresentasjonPortefolje = ({ open, onClose, r }: { open: boolean; onClose: () => void; r: PortefoljeResultat }) => {
  const p = r.portefolje;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 bg-background">
        <DialogTitle className="sr-only">Porteføljeanalyse for komiteen</DialogTitle>
        <div className="p-8 md:p-12">
          <p className="eyebrow mb-3">Porteføljeanalyse · {new Date(r.beregnet).toLocaleDateString("no-NO", { day: "numeric", month: "long", year: "numeric" })}</p>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">Hvordan ser risikoen vår ut?</h2>
          <p className="text-muted-foreground mt-2">
            {r.posisjoner.length} aksjer, {tall(r.totalVerdiNok)} kr totalt. Tallene bygger på {r.periode.antall} {r.parametre.frekvens === "ukentlig" ? "uker" : r.parametre.frekvens === "maanedlig" ? "måneder" : "dager"} med kurshistorikk mot {r.marked.ticker.replace(".OL", "")}.
          </p>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
            <Kort tittel="Beta" verdi={p.beta.toFixed(2)} forklaring={p.beta > 1.1 ? "Porteføljen svinger mer enn børsen. Vi tjener mer i oppgang og taper mer i nedgang." : p.beta < 0.9 ? "Porteføljen svinger mindre enn børsen. Roligere, men også mindre å hente i en oppgang." : "Porteføljen svinger omtrent som børsen."} />
            <Kort tittel="Svingninger per år" verdi={sats(p.volatilitet, 0)} forklaring={`Et normalt år kan ende alt fra ${prosent(p.forventetAvkastning - p.volatilitet, 0)} til ${prosent(p.forventetAvkastning + p.volatilitet, 0)}. Børsen selv svinger ${sats(r.marked.volatilitet, 0)}.`} />
            <Kort tittel="Diversifisering" verdi={sats(p.diversifiseringsgevinst, 0)} forklaring="Så mye risiko forsvinner fordi aksjene ikke beveger seg i takt. Det er gratis - markedet betaler ikke for risiko som kan spres bort." tone="god" />
            <Kort
              tittel="Avkastning per risiko"
              verdi={isFinite(p.sharpe) ? p.sharpe.toFixed(2) : "-"}
              forklaring={`Sharpe-ratio. Børsen ligger på ${isFinite(r.marked.sharpe) ? r.marked.sharpe.toFixed(2) : "-"}. ${p.sharpe > r.marked.sharpe ? "Vi får bedre betalt for risikoen enn et indeksfond." : "Et indeksfond ville gitt mer avkastning per enhet risiko."}`}
              tone={p.sharpe > r.marked.sharpe ? "god" : "daarlig"}
            />
          </div>

          <div className="mt-8 rounded-md border border-border bg-card p-5">
            <p className="text-sm font-medium mb-1">Risiko og forventet avkastning</p>
            <p className="text-xs text-muted-foreground mb-3">Hver prikk er en aksje. Den grønne linjen er det beste man kan få til med disse aksjene. Den mørke prikken er oss i dag - jo nærmere linjen, jo bedre bruker vi risikoen.</p>
            <EffisientFrontGraf r={r} stor />
          </div>

          <div className="mt-8 space-y-3">
            {forklarPortefolje(r).map((t, i) => (
              <p key={i} className="text-base leading-relaxed">{t}</p>
            ))}
          </div>

          {r.posisjoner.some((x) => x.vurdering) && (
            <div className="mt-8">
              <p className="text-sm font-medium mb-2">Hva verdsettelsene våre sier om posisjonene</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {r.posisjoner.filter((x) => x.vurdering).map((x) => (
                  <div key={x.ticker} className="rounded-md border border-border bg-card px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{x.navn}</p>
                      <p className="text-xs text-muted-foreground">{sats(x.vekt, 0)} av porteføljen</p>
                    </div>
                    <p className={`font-serif text-2xl tabular-nums ${x.vurdering!.oppside >= 0 ? "stock-positive" : "stock-negative"}`}>{prosent(x.vurdering!.oppside, 0)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-10 leading-relaxed border-t border-border pt-4">
            Internt arbeidsdokument for EMIL Invest. Risikotall bygger på historiske kurser og forventet avkastning på CAPM - begge er estimater. Dette er ikke investeringsrådgivning.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PresentasjonPortefolje;
