import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Eye, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Aksjeprofil, hentAlleProfiler, hentProfil, hentRegnskap } from "@/lib/aksjeprofiler";
import type { Forutsetninger, LagretVerdsettelse } from "@/lib/analyse/db";
import { lagreVerdsettelse } from "@/lib/analyse/db";
import { beregnMarkedsstatistikk, hentHistorikk } from "@/lib/analyse/markedsdata";
import {
  VerdsettelseInputs, VerdsettelseResultater, beregnVerdsettelse, fyllFraProfil, tomInputs, valgtBeta,
} from "@/lib/analyse/verdsettelse";
import { MULTIPPEL_NAVN, Multippel, Peer } from "@/lib/finans/multipler";
import { sats, tall } from "@/lib/finans/konklusjon";
import { Forklar, Seksjon, Tallfelt } from "./felles";
import VerdsettelseResultat from "./VerdsettelseResultat";
import PresentasjonVerdsettelse from "./PresentasjonVerdsettelse";

/**
 * Ekspertvisningen: alle forutsetninger til venstre, alle resultater til
 * høyre, regnet på nytt for hvert tastetrykk. Analytikeren jobber her og
 * trykker «Vis for komiteen» når tallene skal fram i møtet.
 */
interface Props {
  lagret: LagretVerdsettelse<VerdsettelseInputs, VerdsettelseResultater> | null;
  forutsetninger: Forutsetninger;
  tickerForslag: { ticker: string; navn: string }[];
  onTilbake: () => void;
  onLagret: () => void;
}

type Sett = <K extends keyof VerdsettelseInputs>(k: K, v: VerdsettelseInputs[K]) => void;

const VerdsettelseVerksted = ({ lagret, forutsetninger, tickerForslag, onTilbake, onLagret }: Props) => {
  const { toast } = useToast();
  const [inn, setInn] = useState<VerdsettelseInputs>(() => lagret?.inputs ?? tomInputs(forutsetninger));
  const [id, setId] = useState<string | undefined>(lagret?.id);
  const [status, setStatus] = useState<"utkast" | "ferdig">(lagret?.status ?? "utkast");
  const [markedsinfo, setMarkedsinfo] = useState<string | null>(null);
  const [henter, setHenter] = useState<"marked" | "profil" | null>(null);
  const [lagrer, setLagrer] = useState(false);
  const [visPresentasjon, setVisPresentasjon] = useState(false);
  const [profiler, setProfiler] = useState<Aksjeprofil[]>([]);

  useEffect(() => {
    hentAlleProfiler().then(setProfiler).catch(() => setProfiler([]));
  }, []);

  const res = useMemo(() => beregnVerdsettelse(inn, forutsetninger.terskler), [inn, forutsetninger.terskler]);

  const sett: Sett = (k, v) => setInn((f) => ({ ...f, [k]: v }));
  const settKapital = <K extends keyof VerdsettelseInputs["kapital"]>(k: K, v: VerdsettelseInputs["kapital"][K]) =>
    setInn((f) => ({ ...f, kapital: { ...f.kapital, [k]: v } }));
  const settDcf = <K extends keyof VerdsettelseInputs["dcf"]>(k: K, v: VerdsettelseInputs["dcf"][K]) =>
    setInn((f) => ({ ...f, dcf: { ...f.dcf, [k]: v } }));
  const settUtb = <K extends keyof VerdsettelseInputs["utbytte"]>(k: K, v: VerdsettelseInputs["utbytte"][K]) =>
    setInn((f) => ({ ...f, utbytte: { ...f.utbytte, [k]: v } }));
  const settMult = <K extends keyof VerdsettelseInputs["multipler"]>(k: K, v: VerdsettelseInputs["multipler"][K]) =>
    setInn((f) => ({ ...f, multipler: { ...f.multipler, [k]: v } }));

  const n = (v: number | null, fallback = 0) => (v === null ? fallback : v);

  /** Kurs fra stock-prices (samme kilde som resten av siden). */
  const hentKurs = async (ticker: string): Promise<{ price: number; currency: string } | null> => {
    const { data } = await supabase.functions.invoke("stock-prices", { body: { tickers: [ticker] } });
    const q = data?.quotes?.[0];
    return q && q.price > 0 ? { price: q.price, currency: q.currency } : null;
  };

  const fyllFraAksjeside = async () => {
    if (!inn.ticker) return;
    setHenter("profil");
    try {
      const [profil, regnskap, kurs] = await Promise.all([hentProfil(inn.ticker), hentRegnskap(inn.ticker), hentKurs(inn.ticker)]);
      if (!profil && regnskap.length === 0) {
        toast({ title: "Fant ingen aksjeside", description: `Legg inn ${inn.ticker} under Aksjesider først, eller fyll inn tallene manuelt.`, variant: "destructive" });
        return;
      }
      setInn((f) => fyllFraProfil(f, profil, regnskap, kurs?.price ?? null));
      toast({ title: "Fylt inn fra aksjesiden", description: "Sjekk tallene - særlig vekst og marginer er bare et utgangspunkt." });
    } catch (e) {
      toast({ title: "Kunne ikke hente", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setHenter(null);
    }
  };

  const hentMarked = async () => {
    if (!inn.ticker) return;
    setHenter("marked");
    try {
      const [svar, kurs] = await Promise.all([hentHistorikk([inn.ticker], forutsetninger), hentKurs(inn.ticker)]);
      const stat = beregnMarkedsstatistikk(svar, [inn.ticker], forutsetninger);
      const a = stat.aksjer[0];
      if (!a) throw new Error(`Fikk ikke kurshistorikk for ${inn.ticker}`);
      setInn((f) => ({
        ...f,
        aksjekurs: kurs?.price ?? f.aksjekurs,
        valuta: kurs?.currency && kurs.currency !== "GBp" ? kurs.currency : f.valuta,
        kapital: { ...f.kapital, betaHistorisk: +a.beta.toFixed(3), betaJustert: +a.betaJustert.toFixed(3) },
      }));
      setMarkedsinfo(
        `${a.antallPerioder} ${stat.frekvens === "ukentlig" ? "uker" : stat.frekvens === "maanedlig" ? "måneder" : "dager"} (${stat.fra} - ${stat.til}) mot ${stat.marked.ticker}: beta ${a.beta.toFixed(2)} ± ${a.betaStandardfeil.toFixed(2)}, R² ${(a.r2 * 100).toFixed(0)} %, volatilitet ${sats(a.aarligVolatilitet)} p.a.`,
      );
    } catch (e) {
      toast({ title: "Kunne ikke hente markedsdata", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setHenter(null);
    }
  };

  const lagre = async (nyStatus: "utkast" | "ferdig") => {
    if (!inn.ticker || !inn.selskapsnavn) {
      toast({ title: "Mangler ticker eller navn", variant: "destructive" });
      return;
    }
    setLagrer(true);
    try {
      const rad = await lagreVerdsettelse<VerdsettelseInputs, VerdsettelseResultater>({
        ...(id ? { id } : {}),
        ticker: inn.ticker.toUpperCase(),
        selskapsnavn: inn.selskapsnavn,
        valuta: inn.valuta,
        status: nyStatus,
        inputs: inn,
        resultater: res,
        anbefaling: res.samlet?.anbefaling ?? null,
        konklusjon: res.samlet ? `${res.samlet.anbefaling}: verdi ${res.samlet.sentralverdi.toFixed(1)} vs kurs ${inn.aksjekurs}` : null,
        notat: inn.notat || null,
      });
      setId(rad.id);
      setStatus(nyStatus);
      toast({ title: nyStatus === "ferdig" ? "Verdsettelsen er merket ferdig" : "Utkast lagret" });
      onLagret();
    } catch (e) {
      toast({ title: "Lagring feilet", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setLagrer(false);
    }
  };

  /* --- hjelpere for årsrader --- */
  const settAar = (antall: number) => {
    setInn((f) => {
      const fyll = (liste: number[]) => Array.from({ length: antall }, (_, i) => liste[i] ?? liste[liste.length - 1] ?? 0);
      return { ...f, dcf: { ...f.dcf, aar: antall, vekst: fyll(f.dcf.vekst), ebitMargin: fyll(f.dcf.ebitMargin) } };
    });
  };
  const settRad = (felt: "vekst" | "ebitMargin", i: number, v: number | null) =>
    setInn((f) => {
      const liste = [...f.dcf[felt]];
      liste[i] = n(v);
      return { ...f, dcf: { ...f.dcf, [felt]: liste } };
    });

  /* --- peers --- */
  const settPeer = (i: number, felt: keyof Peer, v: string | number | null) =>
    settMult("peers", inn.multipler.peers.map((p, j) => (j === i ? { ...p, [felt]: v } : p)));
  const leggTilPeerFraProfil = (ticker: string) => {
    const p = profiler.find((x) => x.ticker === ticker);
    if (!p) return;
    settMult("peers", [...inn.multipler.peers, { navn: p.name, pe: p.pe, evEbitda: p.ev_ebitda, evEbit: p.ev_ebit, pb: p.pb, ps: p.ps }]);
  };
  const toggleMultippel = (m: Multippel) =>
    settMult("valgte", inn.multipler.valgte.includes(m) ? inn.multipler.valgte.filter((x) => x !== m) : [...inn.multipler.valgte, m]);

  const opptatt = henter !== null || lagrer;

  return (
    <div className="space-y-4">
      {/* Handlingslinje */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onTilbake}><ArrowLeft className="w-4 h-4 mr-1" />Alle verdsettelser</Button>
        <div className="flex-1" />
        {status === "ferdig" && <Badge variant="secondary">Ferdig</Badge>}
        <Button variant="outline" size="sm" onClick={fyllFraAksjeside} disabled={opptatt || !inn.ticker}>
          <Download className="w-4 h-4 mr-1" />{henter === "profil" ? "Henter..." : "Fyll fra aksjesiden"}
        </Button>
        <Button variant="outline" size="sm" onClick={hentMarked} disabled={opptatt || !inn.ticker}>
          <RefreshCw className={`w-4 h-4 mr-1 ${henter === "marked" ? "animate-spin" : ""}`} />Hent beta og kurs
        </Button>
        <Button variant="outline" size="sm" onClick={() => lagre("utkast")} disabled={opptatt}><Save className="w-4 h-4 mr-1" />Lagre utkast</Button>
        <Button size="sm" onClick={() => lagre("ferdig")} disabled={opptatt}>Merk ferdig</Button>
        <Button size="sm" className="bg-competition text-competition-foreground hover:bg-competition/90" onClick={() => setVisPresentasjon(true)} disabled={!res.samlet}>
          <Eye className="w-4 h-4 mr-1" />Vis for komiteen
        </Button>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-4 items-start">
        {/* ------------------------------ INPUT ------------------------------ */}
        <div className="space-y-4">
          <Seksjon tittel="1. Selskapet" beskrivelse="Kurs og antall aksjer gir markedsverdien. Netto gjeld trekkes fra enterprise value.">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Ticker</Label>
                <Input list="ticker-forslag" value={inn.ticker} onChange={(e) => sett("ticker", e.target.value.toUpperCase())} placeholder="EQNR" className="h-9 mt-1" />
                <datalist id="ticker-forslag">
                  {tickerForslag.map((t) => <option key={t.ticker} value={t.ticker}>{t.navn}</option>)}
                </datalist>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Selskapsnavn</Label>
                <Input value={inn.selskapsnavn} onChange={(e) => sett("selskapsnavn", e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Valuta</Label>
                <Input value={inn.valuta} onChange={(e) => sett("valuta", e.target.value.toUpperCase())} className="h-9 mt-1" />
              </div>
              <Tallfelt label="Aksjekurs" verdi={inn.aksjekurs || null} onChange={(v) => sett("aksjekurs", n(v))} suffix={inn.valuta} />
              <Tallfelt label="Antall aksjer" verdi={inn.antallAksjer || null} onChange={(v) => sett("antallAksjer", n(v))} suffix="mill" forklaring="Utestående aksjer i millioner. Fylles fra børsverdi / kurs når du henter fra aksjesiden." />
              <Tallfelt label="Netto gjeld" verdi={inn.nettoGjeld} onChange={(v) => sett("nettoGjeld", n(v))} suffix="mill" forklaring="Rentebærende gjeld minus kontanter. Negativ hvis selskapet har mer kontanter enn gjeld. Trekkes fra EV for å komme til egenkapitalverdien." kap="lign. 9.22" />
              <Tallfelt label="Andre fratrekk" verdi={inn.andreFratrekk} onChange={(v) => sett("andreFratrekk", n(v))} suffix="mill" forklaring="Minoritetsinteresser, preferanseaksjer o.l. som har krav før aksjonærene." />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Markedsverdi egenkapital: <span className="text-foreground">{tall(res.markedsverdi)} mill</span></p>
          </Seksjon>

          <Seksjon tittel="2. Avkastningskrav" beskrivelse="Beta måles mot OSEBX. Justert beta trekkes en tredjedel mot 1 fordi historiske estimater har målefeil.">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(["historisk", "justert", "manuell"] as const).map((k) => {
                const verdi = k === "historisk" ? inn.kapital.betaHistorisk : k === "justert" ? inn.kapital.betaJustert : inn.kapital.betaManuell;
                const aktiv = inn.kapital.betaKilde === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => settKapital("betaKilde", k)}
                    className={`rounded-md border px-3 py-2 text-left ${aktiv ? "border-foreground bg-background" : "border-border hover:border-foreground/40"}`}
                  >
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{k === "historisk" ? "Historisk β" : k === "justert" ? "Justert β" : "Manuell β"}</p>
                    <p className="font-serif text-xl tabular-nums">{verdi === null || !isFinite(verdi) ? "-" : verdi.toFixed(2)}</p>
                  </button>
                );
              })}
            </div>
            {markedsinfo && <p className="text-xs text-muted-foreground mb-3">{markedsinfo}</p>}
            {!inn.kapital.betaHistorisk && <p className="text-xs text-muted-foreground mb-3">Trykk «Hent beta og kurs» for å estimere beta fra {forutsetninger.historikk} {forutsetninger.frekvens} historikk.</p>}
            <div className="grid grid-cols-2 gap-3">
              <Tallfelt label="Manuell beta" verdi={inn.kapital.betaManuell} onChange={(v) => settKapital("betaManuell", n(v, 1))} desimaler={2} forklaring="Bruk f.eks. bransjebeta eller beta fra en analytikerrapport når historikken er kort eller støyete." kap="kap. 12.3-12.4" />
              <Tallfelt label="Risikofri rente" verdi={inn.kapital.risikofriRente} onChange={(v) => settKapital("risikofriRente", n(v))} prosent forklaring="Renten på en sikker plassering med samme horisont, typisk 10-årig statsobligasjon." kap="kap. 12.1" />
              <Tallfelt label="Markedspremie" verdi={inn.kapital.markedspremie} onChange={(v) => settKapital("markedspremie", n(v))} prosent forklaring="Hvor mye mer enn risikofri rente investorer forventer for å eie hele markedet. Boka bruker 4-6 %." kap="kap. 12.2" />
              <Tallfelt label="Gjeldskostnad (før skatt)" verdi={inn.kapital.gjeldskostnad} onChange={(v) => settKapital("gjeldskostnad", n(v))} prosent forklaring="Forventet avkastning på selskapets gjeld - ikke kupongrenten, men rente justert for tapsrisiko." kap="kap. 12.4" />
              <Tallfelt label="Skattesats" verdi={inn.kapital.skattesats} onChange={(v) => settKapital("skattesats", n(v))} prosent desimaler={0} />
              <Tallfelt label="Overstyr WACC" verdi={inn.kapital.waccManuell} onChange={(v) => settKapital("waccManuell", v)} prosent forklaring="La stå tom for å bruke den utregnede WACC-en. Fyll inn for å teste et bestemt krav." />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              rₑ = {sats(inn.kapital.risikofriRente)} + {valgtBeta(inn.kapital).toFixed(2)} × {sats(inn.kapital.markedspremie)} = <span className="text-foreground">{sats(res.wacc.rE)}</span>
              {" · "}WACC = <span className="text-foreground">{sats(res.waccBrukt)}</span>
            </p>
          </Seksjon>

          <Seksjon
            tittel="3. Fri kontantstrøm (DCF)"
            beskrivelse="Prognose år for år. Beløp i millioner. Passer ikke for banker og forsikring - bruk utbyttemodell og P/B der. Husk særskatt (78 %) for oljeselskaper."
            hoyre={<Switch checked={inn.dcf.bruk} onCheckedChange={(v) => settDcf("bruk", v)} />}
          >
            {inn.dcf.bruk && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Tallfelt label="Omsetning siste år" verdi={inn.dcf.omsetning0 || null} onChange={(v) => settDcf("omsetning0", n(v))} suffix="mill" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Prognoseår</Label>
                    <Select value={String(inn.dcf.aar)} onValueChange={(v) => settAar(Number(v))}>
                      <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{[3, 4, 5, 6, 7, 8, 10].map((a) => <SelectItem key={a} value={String(a)}>{a} år</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left font-normal py-1">År</th>
                        {inn.dcf.vekst.map((_, i) => <th key={i} className="font-normal py-1 px-1 text-center">{i + 1}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-1 pr-2 whitespace-nowrap">Vekst %<Forklar tekst="Omsetningsvekst per år. Start gjerne med historisk vekst og la den nærme seg terminalveksten." /></td>
                        {inn.dcf.vekst.map((g, i) => (
                          <td key={i} className="px-1">
                            <Input inputMode="decimal" className="h-8 text-center px-1 tabular-nums" value={(g * 100).toLocaleString("no-NO", { maximumFractionDigits: 1, useGrouping: false })}
                              onChange={(e) => { const x = Number(e.target.value.replace(",", ".")); if (isFinite(x)) settRad("vekst", i, x / 100); }} />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-1 pr-2 whitespace-nowrap">EBIT-margin %<Forklar tekst="Driftsresultat i prosent av omsetning. Sjekk mot historikken på aksjesiden." /></td>
                        {inn.dcf.ebitMargin.map((m, i) => (
                          <td key={i} className="px-1">
                            <Input inputMode="decimal" className="h-8 text-center px-1 tabular-nums" value={(m * 100).toLocaleString("no-NO", { maximumFractionDigits: 1, useGrouping: false })}
                              onChange={(e) => { const x = Number(e.target.value.replace(",", ".")); if (isFinite(x)) settRad("ebitMargin", i, x / 100); }} />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Tallfelt label="Avskrivninger" verdi={inn.dcf.avskrivningPst} onChange={(v) => settDcf("avskrivningPst", n(v))} prosent forklaring="Prosent av omsetning. Legges tilbake fordi det ikke er en kontantutgift." kap="lign. 9.20" />
                  <Tallfelt label="Investeringer (CapEx)" verdi={inn.dcf.capexPst} onChange={(v) => settDcf("capexPst", n(v))} prosent forklaring="Prosent av omsetning. Bør ligge over avskrivningene i et selskap som vokser." />
                  <Tallfelt label="Arbeidskapital" verdi={inn.dcf.arbeidskapitalPst} onChange={(v) => settDcf("arbeidskapitalPst", n(v))} prosent forklaring="Netto arbeidskapital i prosent av omsetning. Bare ENDRINGEN binder kontanter." kap="kap. 8.2" />
                  <Tallfelt label="Terminalvekst" verdi={inn.dcf.terminalvekst} onChange={(v) => settDcf("terminalvekst", n(v))} prosent forklaring="Evig vekst etter prognoseperioden. Kan ikke overstige økonomiens langsiktige vekst (2-3 %) - da ville selskapet bli større enn økonomien." kap="lign. 9.24" />
                </div>
              </>
            )}
          </Seksjon>

          <Seksjon
            tittel="4. Utbyttemodell"
            beskrivelse="For selskaper som betaler stabilt utbytte. Bruker egenkapitalkravet rₑ fra CAPM."
            hoyre={<Switch checked={inn.utbytte.bruk} onCheckedChange={(v) => settUtb("bruk", v)} />}
          >
            {inn.utbytte.bruk && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Modell</Label>
                  <Select value={inn.utbytte.modell} onValueChange={(v) => settUtb("modell", v as VerdsettelseInputs["utbytte"]["modell"])}>
                    <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gordon">Gordon - konstant vekst (lign. 9.6)</SelectItem>
                      <SelectItem value="flerfase">Flerfase - høy vekst først, så konstant (lign. 9.13)</SelectItem>
                      <SelectItem value="total">Total payout - utbytte + tilbakekjøp (lign. 9.16)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {inn.utbytte.modell === "gordon" && <Tallfelt label="Utbytte neste år (Div₁)" verdi={inn.utbytte.utbytteNesteAar || null} onChange={(v) => settUtb("utbytteNesteAar", n(v))} suffix={inn.valuta} />}
                {inn.utbytte.modell === "flerfase" && (
                  <>
                    <Tallfelt label="Utbytte i dag (Div₀)" verdi={inn.utbytte.utbytteIDag || null} onChange={(v) => settUtb("utbytteIDag", n(v))} suffix={inn.valuta} />
                    <div>
                      <Label className="text-xs text-muted-foreground">Vekst fase 1 (% per år, kommaseparert)</Label>
                      <Input className="h-9 mt-1" value={inn.utbytte.vekstFase1.map((g) => (g * 100).toFixed(1).replace(".", ",")).join(", ")}
                        onChange={(e) => settUtb("vekstFase1", e.target.value.split(/[,;]\s*/).map((x) => Number(x.replace(",", ".")) / 100).filter(isFinite))} />
                    </div>
                  </>
                )}
                {inn.utbytte.modell === "total" && <Tallfelt label="Utbytte + tilbakekjøp neste år" verdi={inn.utbytte.totalUtbetalingNesteAar || null} onChange={(v) => settUtb("totalUtbetalingNesteAar", n(v))} suffix="mill" />}
                <Tallfelt label={inn.utbytte.modell === "flerfase" ? "Evig vekst etter fase 1" : "Vekst g"} verdi={inn.utbytte.vekst} onChange={(v) => settUtb("vekst", n(v))} prosent forklaring="Bærekraftig vekst = tilbakeholdt andel × egenkapitalavkastning (ROE)." kap="lign. 9.12" />
              </div>
            )}
          </Seksjon>

          <Seksjon
            tittel="5. Multipler mot peers"
            beskrivelse="Legg inn sammenlignbare selskaper. Medianen brukes på våre tall."
            hoyre={<Switch checked={inn.multipler.bruk} onCheckedChange={(v) => settMult("bruk", v)} />}
          >
            {inn.multipler.bruk && (
              <>
                <p className="text-xs text-muted-foreground mb-2">Selskapets egne tall (siste år, mill):</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(["resultat", "ebitda", "ebit", "egenkapital", "omsetning"] as const).map((k) => (
                    <Tallfelt key={k} label={{ resultat: "Resultat", ebitda: "EBITDA", ebit: "EBIT", egenkapital: "Egenkapital", omsetning: "Omsetning" }[k]} verdi={inn.multipler.tall[k]} onChange={(v) => settMult("tall", { ...inn.multipler.tall, [k]: v })} />
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-muted-foreground flex-1">Peers</p>
                  {profiler.length > 0 && (
                    <Select onValueChange={leggTilPeerFraProfil}>
                      <SelectTrigger className="h-8 w-56 text-xs"><SelectValue placeholder="Legg til fra aksjesidene" /></SelectTrigger>
                      <SelectContent>
                        {profiler.filter((p) => p.ticker !== inn.ticker).map((p) => (
                          <SelectItem key={p.ticker} value={p.ticker}>{p.name}{p.sector ? ` · ${p.sector}` : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="outline" size="sm" className="h-8" onClick={() => settMult("peers", [...inn.multipler.peers, { navn: "" }])}><Plus className="w-3.5 h-3.5 mr-1" />Ny</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left font-normal py-1">Selskap</th>
                        {(["pe", "evEbitda", "evEbit", "pb", "ps"] as Multippel[]).map((m) => (
                          <th key={m} className="font-normal py-1 px-1">
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={inn.multipler.valgte.includes(m)} onChange={() => toggleMultippel(m)} className="accent-[#24332C]" />
                              {MULTIPPEL_NAVN[m]}
                            </label>
                          </th>
                        ))}
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {inn.multipler.peers.map((p, i) => (
                        <tr key={i}>
                          <td className="py-1 pr-1"><Input className="h-8" value={p.navn} onChange={(e) => settPeer(i, "navn", e.target.value)} /></td>
                          {(["pe", "evEbitda", "evEbit", "pb", "ps"] as const).map((m) => (
                            <td key={m} className="px-1">
                              <Input inputMode="decimal" className="h-8 w-16 text-right tabular-nums px-1" value={p[m] === null || p[m] === undefined ? "" : String(p[m]).replace(".", ",")}
                                onChange={(e) => { const t = e.target.value.trim().replace(",", "."); settPeer(i, m, t === "" ? null : isFinite(Number(t)) ? Number(t) : p[m] ?? null); }} />
                            </td>
                          ))}
                          <td><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => settMult("peers", inn.multipler.peers.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Avkrysset i overskriften = teller i snittet. EV-multipler trekker fra netto gjeld automatisk.</p>
              </>
            )}
          </Seksjon>

          <Seksjon tittel="6. Vekting og vurdering" beskrivelse="Hvor mye hver metode skal telle i den samlede verdien. Metoder som er slått av, ignoreres.">
            <div className="grid grid-cols-3 gap-3">
              <Tallfelt label="DCF" verdi={inn.vekter.dcf} onChange={(v) => sett("vekter", { ...inn.vekter, dcf: n(v) })} prosent desimaler={0} />
              <Tallfelt label="Multipler" verdi={inn.vekter.multipler} onChange={(v) => sett("vekter", { ...inn.vekter, multipler: n(v) })} prosent desimaler={0} />
              <Tallfelt label="Utbytte" verdi={inn.vekter.utbytte} onChange={(v) => sett("vekter", { ...inn.vekter, utbytte: n(v) })} prosent desimaler={0} />
            </div>
            <div className="mt-4">
              <Label className="text-xs text-muted-foreground">Analytikerens vurdering (vises for komiteen)</Label>
              <Textarea value={inn.notat} onChange={(e) => sett("notat", e.target.value)} rows={5} className="mt-1" placeholder="Hva er investeringstesen? Hva må gå riktig? Hva er den største risikoen?" />
            </div>
          </Seksjon>
        </div>

        {/* ---------------------------- RESULTAT ---------------------------- */}
        <div className="xl:sticky xl:top-4">
          <VerdsettelseResultat inn={inn} res={res} />
        </div>
      </div>

      <PresentasjonVerdsettelse open={visPresentasjon} onClose={() => setVisPresentasjon(false)} inn={inn} res={res} />
    </div>
  );
};

export default VerdsettelseVerksted;
