import { useCallback, useEffect, useState } from "react";
import { Eye, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Holding, StockQuote } from "@/hooks/usePortfolioData";
import type { Forutsetninger } from "@/lib/analyse/db";
import { hentPortefoljeanalyser, hentVerdsettelser, lagrePortefoljeanalyse } from "@/lib/analyse/db";
import { beregnMarkedsstatistikk, hentHistorikk } from "@/lib/analyse/markedsdata";
import { PortefoljeParametre, PortefoljeResultat, analyserPortefolje, standardParametre } from "@/lib/analyse/portefoljeanalyse";
import type { VerdsettelseInputs, VerdsettelseResultater } from "@/lib/analyse/verdsettelse";
import { ANBEFALING_TEKST, prosent, sats, tall } from "@/lib/finans/konklusjon";
import { Forklar, Nokkeltall, Retning, Seksjon, Tallfelt } from "./felles";
import Korrelasjonsmatrise from "./Korrelasjonsmatrise";
import { EffisientFrontGraf, SmlGraf } from "./Grafer";
import PresentasjonPortefolje from "./PresentasjonPortefolje";

/**
 * Porteføljeanalysen i ekspertvisning. Henter kurshistorikk for alle
 * aksjer i porteføljen, regner risiko, beta, alfa og effisient front, og
 * kobler på de lagrede verdsettelsene.
 */
interface Props {
  holdings: Holding[];
  quotes: Record<string, StockQuote>;
  forutsetninger: Forutsetninger;
}

const Portefoljeanalyse = ({ holdings, quotes, forutsetninger }: Props) => {
  const { toast } = useToast();
  const [param, setParam] = useState<PortefoljeParametre>(() => standardParametre(forutsetninger));
  const [res, setRes] = useState<PortefoljeResultat | null>(null);
  const [kjoerer, setKjoerer] = useState(false);
  const [visPres, setVisPres] = useState(false);
  const [sisteLagret, setSisteLagret] = useState<string | null>(null);

  useEffect(() => {
    setParam(standardParametre(forutsetninger));
  }, [forutsetninger]);

  useEffect(() => {
    // Vis siste lagrede analyse mens brukeren venter på en ny
    hentPortefoljeanalyser<PortefoljeParametre, PortefoljeResultat>()
      .then((liste) => {
        if (liste[0]) {
          setRes(liste[0].resultater);
          setSisteLagret(liste[0].created_at);
        }
      })
      .catch(() => undefined);
  }, []);

  const aksjer = holdings.filter((h) => h.holding_type === "stock");

  const kjoer = useCallback(async () => {
    if (aksjer.length < 2) {
      toast({ title: "Trenger minst to aksjer", description: "Porteføljeanalysen handler om samvariasjon - med én aksje er det ingenting å analysere." });
      return;
    }
    setKjoerer(true);
    try {
      const f: Forutsetninger = { ...forutsetninger, frekvens: param.frekvens, historikk: param.historikk, markedsindeks: param.markedsindeks };
      const [svar, verdsettelser] = await Promise.all([
        hentHistorikk(aksjer.map((h) => h.ticker), f),
        hentVerdsettelser<VerdsettelseInputs, VerdsettelseResultater>(),
      ]);
      const stat = beregnMarkedsstatistikk(svar, aksjer.map((h) => h.ticker), f);
      const r = analyserPortefolje(holdings, quotes, stat, verdsettelser, param);
      setRes(r);
      setSisteLagret(null);
      if (r.manglende.length) toast({ title: "Mangler historikk for", description: r.manglende.join(", ") });
    } catch (e) {
      toast({ title: "Analysen feilet", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setKjoerer(false);
    }
  }, [aksjer, holdings, quotes, forutsetninger, param, toast]);

  const lagre = async () => {
    if (!res) return;
    try {
      await lagrePortefoljeanalyse({
        tittel: `Porteføljeanalyse ${new Date(res.beregnet).toLocaleDateString("no-NO")}`,
        parametre: res.parametre,
        resultater: res,
        notat: null,
      });
      setSisteLagret(res.beregnet);
      toast({ title: "Analysen er lagret" });
    } catch (e) {
      toast({ title: "Lagring feilet", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  const oppd = <K extends keyof PortefoljeParametre>(k: K, v: PortefoljeParametre[K]) => setParam((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h2 className="font-serif text-2xl">Porteføljeanalyse</h2>
          <p className="text-sm text-muted-foreground">Risiko, diversifisering, beta, alfa og effisient front for aksjene dere eier - i NOK.</p>
        </div>
        <div className="flex-1" />
        <div className="w-40">
          <Label className="text-xs text-muted-foreground">Forventet avkastning<Forklar tekst="CAPM er bokas anbefaling: historiske snitt er for støyete som forventning (kap. 10.4), men fine til kovarianser." kap="kap. 12" /></Label>
          <Select value={param.forventetKilde} onValueChange={(v) => oppd("forventetKilde", v as PortefoljeParametre["forventetKilde"])}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="capm">CAPM (anbefalt)</SelectItem>
              <SelectItem value="historisk">Historisk snitt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <Label className="text-xs text-muted-foreground">Beta</Label>
          <Select value={param.betaVariant} onValueChange={(v) => oppd("betaVariant", v as PortefoljeParametre["betaVariant"])}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="justert">Justert</SelectItem>
              <SelectItem value="historisk">Rå historisk</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-28">
          <Label className="text-xs text-muted-foreground">Historikk</Label>
          <Select value={param.historikk} onValueChange={(v) => oppd("historikk", v as PortefoljeParametre["historikk"])}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{(["1y", "2y", "3y", "5y", "10y"] as const).map((h) => <SelectItem key={h} value={h}>{h.replace("y", " år")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Tallfelt label="Risikofri" verdi={param.risikofriRente} onChange={(v) => oppd("risikofriRente", v ?? 0.04)} prosent className="w-24" />
        <Tallfelt label="MRP" verdi={param.markedspremie} onChange={(v) => oppd("markedspremie", v ?? 0.05)} prosent className="w-24" />
        <Button onClick={kjoer} disabled={kjoerer}><Play className="w-4 h-4 mr-1" />{kjoerer ? "Henter og regner..." : "Kjør analyse"}</Button>
        {res && (
          <>
            <Button variant="outline" onClick={lagre} disabled={!!sisteLagret}><Save className="w-4 h-4 mr-1" />{sisteLagret ? "Lagret" : "Lagre"}</Button>
            <Button className="bg-competition text-competition-foreground hover:bg-competition/90" onClick={() => setVisPres(true)}><Eye className="w-4 h-4 mr-1" />Vis for komiteen</Button>
          </>
        )}
      </div>

      {!res ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center text-muted-foreground">
          <p>Ingen analyse ennå. Trykk «Kjør analyse» - den henter {param.historikk.replace("y", " år")} kurshistorikk for {aksjer.length} aksjer og OSEBX.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Beregnet {new Date(res.beregnet).toLocaleString("no-NO")} · {res.periode.antall} perioder ({res.periode.fra} - {res.periode.til}) · dekker {sats(res.dekning, 0)} av porteføljeverdien
            {res.manglende.length > 0 && <span className="text-amber-700"> · mangler historikk for {res.manglende.join(", ")}</span>}
            {sisteLagret && <span> · lagret analyse</span>}
          </p>

          <Seksjon tittel="Porteføljen samlet" beskrivelse="Annualiserte tall. Forventet avkastning etter valgt metode, risiko fra historiske samvariasjoner.">
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
              <Nokkeltall etikett="Forventet avk." verdi={sats(res.portefolje.forventetAvkastning)} under={res.parametre.forventetKilde === "capm" ? "CAPM" : "historisk"} />
              <Nokkeltall etikett="Volatilitet" verdi={sats(res.portefolje.volatilitet)} under={`marked ${sats(res.marked.volatilitet)}`} />
              <Nokkeltall etikett="Sharpe" verdi={isFinite(res.portefolje.sharpe) ? res.portefolje.sharpe.toFixed(2) : "-"} under={`marked ${isFinite(res.marked.sharpe) ? res.marked.sharpe.toFixed(2) : "-"}`} tone={res.portefolje.sharpe >= res.marked.sharpe ? "god" : "daarlig"} />
              <Nokkeltall etikett="Beta" verdi={res.portefolje.beta.toFixed(2)} under="mot OSEBX" />
              <Nokkeltall etikett="Systematisk andel" verdi={sats(res.portefolje.andelSystematisk, 0)} under="av variansen" />
              <Nokkeltall etikett="Diversifisering" verdi={sats(res.portefolje.diversifiseringsgevinst, 0)} under={`snitt-vol ${sats(res.portefolje.vektetSnittVolatilitet, 0)}`} tone="god" />
              <Nokkeltall etikett="CAPM-krav" verdi={sats(res.portefolje.capmKrav)} under="for porteføljen" />
              <Nokkeltall etikett="Historisk alfa" verdi={prosent(res.portefolje.alfa)} under="hist. − krav" tone={res.portefolje.alfa >= 0 ? "god" : "daarlig"} />
            </div>
          </Seksjon>

          <div className="grid xl:grid-cols-2 gap-4">
            <Seksjon tittel="Effisient front" beskrivelse="Grønn linje: beste kombinasjoner av aksjene dere eier (bare lange posisjoner). Rute = tangentporteføljen med høyest Sharpe.">
              <EffisientFrontGraf r={res} />
            </Seksjon>
            <Seksjon tittel="Verdipapirmarkedslinjen (SML)" beskrivelse="Historisk avkastning mot beta. Linjen er CAPM-kravet. Over linjen = har levert mer enn risikoen tilsier.">
              <SmlGraf r={res} />
            </Seksjon>
          </div>

          <Seksjon tittel="Posisjonene" beskrivelse="β mot OSEBX i NOK. Alfa = historisk avkastning − CAPM-krav. Risikobidrag = andel av porteføljens varians. Δ mot portefølje: forventet avkastning minus kravet vår egen portefølje setter (lign. 11.19) - positiv betyr «øk», negativ «reduser».">
            <div className="overflow-x-auto">
              <table className="w-full text-xs tabular-nums">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-1.5 font-normal">Aksje</th>
                    <th className="text-right py-1.5 px-2 font-normal">Vekt</th>
                    <th className="text-right py-1.5 px-2 font-normal">β (±SE)</th>
                    <th className="text-right py-1.5 px-2 font-normal">R²</th>
                    <th className="text-right py-1.5 px-2 font-normal">Vol</th>
                    <th className="text-right py-1.5 px-2 font-normal">Hist. avk.</th>
                    <th className="text-right py-1.5 px-2 font-normal">CAPM-krav</th>
                    <th className="text-right py-1.5 px-2 font-normal">Alfa</th>
                    <th className="text-right py-1.5 px-2 font-normal">Risikobidrag</th>
                    <th className="text-right py-1.5 px-2 font-normal">Δ mot portef.</th>
                    <th className="text-right py-1.5 pl-2 font-normal">Verdsettelse</th>
                  </tr>
                </thead>
                <tbody>
                  {res.posisjoner.map((p) => (
                    <tr key={p.ticker} className="border-b border-border/50">
                      <td className="py-1.5"><span className="font-medium">{p.navn}</span> <span className="text-muted-foreground">{p.ticker.replace(".OL", "")}</span></td>
                      <td className="text-right py-1.5 px-2">{sats(p.vekt, 1)}</td>
                      <td className="text-right py-1.5 px-2">{(res.parametre.betaVariant === "justert" ? p.betaJustert : p.beta).toFixed(2)} <span className="text-muted-foreground">±{p.betaStandardfeil.toFixed(2)}</span></td>
                      <td className="text-right py-1.5 px-2">{(p.r2 * 100).toFixed(0)} %</td>
                      <td className="text-right py-1.5 px-2">{sats(p.volatilitet, 0)}</td>
                      <td className="text-right py-1.5 px-2"><Retning v={p.historiskAvkastning} /></td>
                      <td className="text-right py-1.5 px-2">{sats(p.capmKrav)}</td>
                      <td className="text-right py-1.5 px-2"><Retning v={p.alfa} /></td>
                      <td className="text-right py-1.5 px-2">{sats(p.risikobidrag, 0)}</td>
                      <td className="text-right py-1.5 px-2"><Retning v={p.differanseMotPortefolje} /></td>
                      <td className="text-right py-1.5 pl-2">
                        {p.vurdering ? (
                          <span className={p.vurdering.anbefaling === "kjop" ? "stock-positive" : p.vurdering.anbefaling === "selg" ? "stock-negative" : ""}>
                            {p.vurdering.anbefaling ? ANBEFALING_TEKST[p.vurdering.anbefaling].tittel : ""} {prosent(p.vurdering.oppside, 0)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seksjon>

          <div className="grid xl:grid-cols-2 gap-4">
            <Seksjon tittel="Korrelasjoner" beskrivelse="Samvariasjon mellom aksjene, på de samme periodene.">
              <Korrelasjonsmatrise tickere={res.posisjoner.map((p) => p.ticker)} matrise={res.korrelasjon} />
            </Seksjon>
            <Seksjon
              tittel="Vekter: i dag mot tangentporteføljen"
              beskrivelse={`Tangentporteføljen har Sharpe ${res.tangent.sharpe.toFixed(2)} mot ${res.portefolje.sharpe.toFixed(2)} i dag. Den bygger på historiske samvariasjoner - bruk den som retning, ikke fasit.`}
            >
              <table className="w-full text-xs tabular-nums">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-1.5 font-normal">Aksje</th>
                    <th className="text-right py-1.5 px-2 font-normal">I dag</th>
                    <th className="text-right py-1.5 px-2 font-normal">Tangent</th>
                    <th className="text-right py-1.5 px-2 font-normal">Min. varians</th>
                    <th className="text-right py-1.5 pl-2 font-normal">Endring</th>
                  </tr>
                </thead>
                <tbody>
                  {res.forslag.map((f) => {
                    const i = res.posisjoner.findIndex((p) => p.ticker === f.ticker);
                    return (
                      <tr key={f.ticker} className="border-b border-border/50">
                        <td className="py-1.5">{f.ticker.replace(".OL", "")}</td>
                        <td className="text-right py-1.5 px-2">{sats(f.naa, 0)}</td>
                        <td className="text-right py-1.5 px-2">{sats(f.tangent, 0)}</td>
                        <td className="text-right py-1.5 px-2 text-muted-foreground">{sats(res.minVarians.vekter[i] ?? NaN, 0)}</td>
                        <td className="text-right py-1.5 pl-2"><Retning v={f.endring} desimaler={0} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {res.samletOppside && (
                <p className="text-sm mt-4">
                  Verdsettelsene dekker {sats(res.samletOppside.dekningAndel, 0)} av aksjeporteføljen ({res.samletOppside.antall} aksjer) og gir samlet vektet oppside{" "}
                  <span className={res.samletOppside.vektetOppside >= 0 ? "stock-positive" : "stock-negative"}>{prosent(res.samletOppside.vektetOppside)}</span>.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-3">Total porteføljeverdi {tall(res.totalVerdiNok)} kr; analysen dekker aksjene ({sats(res.dekning, 0)}). Fond og kontanter er ikke med.</p>
            </Seksjon>
          </div>

          <PresentasjonPortefolje open={visPres} onClose={() => setVisPres(false)} r={res} />
        </>
      )}
    </div>
  );
};

export default Portefoljeanalyse;
