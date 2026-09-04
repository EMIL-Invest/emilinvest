import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import {
  Aksjeprofil,
  Periodetype,
  Regnskapsperiode,
  hentAlleProfiler,
  hentRegnskap,
  lagrePeriode,
  lagreProfil,
  slettPeriode,
} from "@/lib/aksjeprofiler";

/** Tallfeltene i profilen, slik de skal stå i skjemaet. */
const TALLFELT: { felt: keyof Aksjeprofil; navn: string; hint?: string }[] = [
  { felt: "borsverdi_mrd", navn: "Børsverdi (mrd)" },
  { felt: "pe", navn: "P/E" },
  { felt: "pb", navn: "P/B" },
  { felt: "ps", navn: "P/S" },
  { felt: "ev_ebitda", navn: "EV/EBITDA" },
  { felt: "ev_ebit", navn: "EV/EBIT" },
  { felt: "utbytte_prosent", navn: "Utbytte (%)" },
  { felt: "roe_prosent", navn: "ROE (%)" },
  { felt: "egenkapitalandel", navn: "Egenkapitalandel (%)" },
  { felt: "netto_gjeld_ebitda", navn: "NG/EBITDA (x)" },
];

const BELOPSFELT: { felt: keyof Regnskapsperiode; navn: string }[] = [
  { felt: "omsetning", navn: "Omsetning" },
  { felt: "ebitda", navn: "EBITDA" },
  { felt: "ebit", navn: "EBIT" },
  { felt: "resultat", navn: "Resultat" },
  { felt: "egenkapital", navn: "Egenkapital" },
  { felt: "netto_gjeld", navn: "Netto gjeld" },
];

/** Tomt felt skal bli NULL i basen, ikke 0. */
const tilTall = (v: string): number | null => {
  const t = v.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return isFinite(n) ? n : null;
};

const StockProfilesAdmin = () => {
  const { holdings } = usePortfolioData();
  const { toast } = useToast();

  const [profiler, setProfiler] = useState<Aksjeprofil[]>([]);
  const [valgt, setValgt] = useState<string | null>(null);
  const [skjema, setSkjema] = useState<Record<string, string>>({});
  const [perioder, setPerioder] = useState<Regnskapsperiode[]>([]);
  const [lagrer, setLagrer] = useState(false);
  const [laster, setLaster] = useState(true);

  // Ny regnskapsperiode
  const [nyType, setNyType] = useState<Periodetype>("ar");
  const [nyNavn, setNyNavn] = useState("");
  const [nySlutt, setNySlutt] = useState("");
  const [nyeBelop, setNyeBelop] = useState<Record<string, string>>({});

  const feil = (e: unknown) =>
    toast({
      title: "Feil",
      description: e instanceof Error ? e.message : "Ukjent feil",
      variant: "destructive",
    });

  const lastProfiler = async () => {
    try {
      setProfiler(await hentAlleProfiler());
    } catch (e) {
      feil(e);
    } finally {
      setLaster(false);
    }
  };

  useEffect(() => {
    lastProfiler();
  }, []);

  /** Aksjer i porteføljen, slått sammen med profilene som finnes. */
  const rader = useMemo(() => {
    const aksjer = holdings.filter((h) => h.holding_type === "stock");
    const fraProfiler = profiler
      .filter((p) => !aksjer.some((a) => a.ticker === p.ticker))
      .map((p) => ({ ticker: p.ticker, name: p.name, sector: p.sector, exchange: p.exchange }));
    return [...aksjer, ...fraProfiler].sort((a, b) => a.name.localeCompare(b.name, "no"));
  }, [holdings, profiler]);

  const velg = async (ticker: string) => {
    setValgt(ticker);
    const p = profiler.find((x) => x.ticker === ticker);
    const kilde = rader.find((r) => r.ticker === ticker);
    const s: Record<string, string> = {
      ticker,
      name: p?.name ?? kilde?.name ?? "",
      sector: p?.sector ?? kilde?.sector ?? "",
      exchange: p?.exchange ?? kilde?.exchange ?? "",
      valuta: p?.valuta ?? (ticker.endsWith(".OL") ? "NOK" : "USD"),
      nettside: p?.nettside ?? "",
      kort_beskrivelse: p?.kort_beskrivelse ?? "",
      bransjeforklaring: p?.bransjeforklaring ?? "",
      tall_per_dato: p?.tall_per_dato ?? "",
      kilde: p?.kilde ?? "",
    };
    TALLFELT.forEach(({ felt }) => {
      const v = p?.[felt];
      s[felt as string] = v === null || v === undefined ? "" : String(v);
    });
    setSkjema(s);
    try {
      setPerioder(await hentRegnskap(ticker));
    } catch (e) {
      feil(e);
    }
  };

  const lagre = async () => {
    if (!valgt) return;
    if (!skjema.name?.trim()) {
      toast({ title: "Mangler navn", description: "Selskapsnavn må fylles ut.", variant: "destructive" });
      return;
    }
    setLagrer(true);
    try {
      const profil: Partial<Aksjeprofil> = {
        ticker: valgt,
        name: skjema.name.trim(),
        sector: skjema.sector?.trim() || null,
        exchange: skjema.exchange?.trim() || null,
        valuta: skjema.valuta?.trim() || "NOK",
        nettside: skjema.nettside?.trim() || null,
        kort_beskrivelse: skjema.kort_beskrivelse?.trim() || null,
        bransjeforklaring: skjema.bransjeforklaring?.trim() || null,
        tall_per_dato: skjema.tall_per_dato?.trim() || null,
        kilde: skjema.kilde?.trim() || null,
      };
      TALLFELT.forEach(({ felt }) => {
        (profil as Record<string, unknown>)[felt as string] = tilTall(skjema[felt as string] ?? "");
      });
      await lagreProfil(profil);
      await lastProfiler();
      toast({ title: "Lagret", description: `${profil.name} er oppdatert.` });
    } catch (e) {
      feil(e);
    } finally {
      setLagrer(false);
    }
  };

  const leggTilPeriode = async () => {
    if (!valgt) return;
    if (!nyNavn.trim() || !nySlutt) {
      toast({
        title: "Mangler felt",
        description: "Periodenavn og sluttdato må fylles ut.",
        variant: "destructive",
      });
      return;
    }
    try {
      const rad: Partial<Regnskapsperiode> = {
        ticker: valgt,
        periode_type: nyType,
        periode_navn: nyNavn.trim(),
        periode_slutt: nySlutt,
      };
      BELOPSFELT.forEach(({ felt }) => {
        (rad as Record<string, unknown>)[felt as string] = tilTall(nyeBelop[felt as string] ?? "");
      });
      await lagrePeriode(rad);
      setPerioder(await hentRegnskap(valgt));
      setNyNavn("");
      setNySlutt("");
      setNyeBelop({});
      toast({ title: "Periode lagret", description: `${rad.periode_navn} er lagt inn.` });
    } catch (e) {
      feil(e);
    }
  };

  const fjernPeriode = async (id: string, navn: string) => {
    if (!valgt) return;
    try {
      await slettPeriode(id);
      setPerioder(await hentRegnskap(valgt));
      toast({ title: "Slettet", description: `${navn} er fjernet.` });
    } catch (e) {
      feil(e);
    }
  };

  const harProfil = (ticker: string) => profiler.some((p) => p.ticker === ticker);

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      {/* Venstre: selskapsliste */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Selskaper</CardTitle>
          <CardDescription>
            Aksjene i porteføljen. Grønn hake betyr at siden er fylt ut.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {laster ? (
            <p className="text-sm text-muted-foreground px-6 py-4">Laster …</p>
          ) : rader.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-4">
              Ingen aksjer i porteføljen ennå.
            </p>
          ) : (
            <ul>
              {rader.map((r) => (
                <li key={r.ticker}>
                  <button
                    onClick={() => velg(r.ticker)}
                    className={`w-full text-left px-6 py-3 flex items-center gap-3 border-l-2 transition-colors ${
                      valgt === r.ticker
                        ? "border-primary bg-secondary/60"
                        : "border-transparent hover:bg-secondary/40"
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-foreground truncate">
                        {r.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">{r.ticker}</span>
                    </span>
                    {harProfil(r.ticker) ? (
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Høyre: skjema */}
      {!valgt ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">
              Velg et selskap i listen for å fylle inn nøkkeltall og regnskap.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Grunnopplysninger */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {skjema.name || valgt}{" "}
                <Badge variant="secondary" className="ml-2 font-normal">
                  {valgt}
                </Badge>
              </CardTitle>
              <CardDescription>
                Alle felt er valgfrie bortsett fra navn. Tomme felt vises som «-» på siden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { n: "name", l: "Selskapsnavn" },
                  { n: "sector", l: "Sektor" },
                  { n: "exchange", l: "Børs" },
                  { n: "valuta", l: "Valuta" },
                ].map(({ n, l }) => (
                  <div key={n}>
                    <Label htmlFor={n}>{l}</Label>
                    <Input
                      id={n}
                      value={skjema[n] ?? ""}
                      onChange={(e) => setSkjema({ ...skjema, [n]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="nettside">Nettside</Label>
                  <Input
                    id="nettside"
                    placeholder="https://…"
                    value={skjema.nettside ?? ""}
                    onChange={(e) => setSkjema({ ...skjema, nettside: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tall_per_dato">Tall per (dato)</Label>
                  <Input
                    id="tall_per_dato"
                    type="date"
                    value={skjema.tall_per_dato ?? ""}
                    onChange={(e) => setSkjema({ ...skjema, tall_per_dato: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="kilde">Kilde</Label>
                  <Input
                    id="kilde"
                    placeholder="Q2 2026-rapport"
                    value={skjema.kilde ?? ""}
                    onChange={(e) => setSkjema({ ...skjema, kilde: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nøkkeltall */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nøkkeltall og multipler</CardTitle>
              <CardDescription>
                Bruk punktum eller komma som desimalskilletegn. La feltet stå tomt om tallet
                ikke er relevant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                {TALLFELT.map(({ felt, navn }) => (
                  <div key={felt as string}>
                    <Label htmlFor={felt as string}>{navn}</Label>
                    <Input
                      id={felt as string}
                      inputMode="decimal"
                      value={skjema[felt as string] ?? ""}
                      onChange={(e) => setSkjema({ ...skjema, [felt as string]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tekst */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tekst</CardTitle>
              <CardDescription>
                Tom linje mellom avsnittene gir nye avsnitt på siden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="kort_beskrivelse">Kort om selskapet</Label>
                <Textarea
                  id="kort_beskrivelse"
                  rows={3}
                  placeholder="Én til to setninger om hva selskapet gjør."
                  value={skjema.kort_beskrivelse ?? ""}
                  onChange={(e) => setSkjema({ ...skjema, kort_beskrivelse: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bransjeforklaring">Bransjeforklaring</Label>
                <Textarea
                  id="bransjeforklaring"
                  rows={10}
                  placeholder="Hvordan bransjen fungerer, hva som driver inntektene, hvem konkurrentene er."
                  value={skjema.bransjeforklaring ?? ""}
                  onChange={(e) => setSkjema({ ...skjema, bransjeforklaring: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={lagre} disabled={lagrer}>
              <Save className="w-4 h-4 mr-2" />
              {lagrer ? "Lagrer …" : "Lagre selskapet"}
            </Button>
            <a
              href={`/aksje/${valgt}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Se siden
            </a>
          </div>

          {/* Regnskap */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Regnskap</CardTitle>
              <CardDescription>
                Alle beløp i millioner {skjema.valuta || "NOK"}. Legger du inn en periode som
                finnes fra før, blir den overskrevet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {perioder.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        <th className="text-left py-2 pr-3 font-medium">Periode</th>
                        {BELOPSFELT.map(({ navn }) => (
                          <th key={navn} className="text-right py-2 px-2 font-medium">
                            {navn}
                          </th>
                        ))}
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {perioder.map((p) => (
                        <tr key={p.id} className="border-b border-border/60 last:border-0">
                          <td className="py-2.5 pr-3">
                            <span className="text-foreground">{p.periode_navn}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {p.periode_type === "ar" ? "år" : "kvartal"}
                            </span>
                          </td>
                          {BELOPSFELT.map(({ felt }) => (
                            <td key={felt as string} className="py-2.5 px-2 text-right tabular-nums">
                              {p[felt] === null ? "-" : Number(p[felt]).toLocaleString("no-NO")}
                            </td>
                          ))}
                          <td className="py-2.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => fjernPeriode(p.id, p.periode_navn)}
                              aria-label={`Slett ${p.periode_navn}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Ny periode */}
              <div className="rounded-md border border-border p-4 space-y-4">
                <p className="text-sm font-medium text-foreground">Legg inn periode</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="periode_type">Type</Label>
                    <div className="flex gap-2 mt-2">
                      {(["ar", "kvartal"] as Periodetype[]).map((t) => (
                        <Button
                          key={t}
                          type="button"
                          variant={nyType === t ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNyType(t)}
                        >
                          {t === "ar" ? "År" : "Kvartal"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="periode_navn">Navn</Label>
                    <Input
                      id="periode_navn"
                      placeholder={nyType === "ar" ? "2025" : "Q2 2026"}
                      value={nyNavn}
                      onChange={(e) => setNyNavn(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periode_slutt">Periodeslutt</Label>
                    <Input
                      id="periode_slutt"
                      type="date"
                      value={nySlutt}
                      onChange={(e) => setNySlutt(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                  {BELOPSFELT.map(({ felt, navn }) => (
                    <div key={felt as string}>
                      <Label htmlFor={`ny_${felt as string}`}>{navn}</Label>
                      <Input
                        id={`ny_${felt as string}`}
                        inputMode="decimal"
                        value={nyeBelop[felt as string] ?? ""}
                        onChange={(e) =>
                          setNyeBelop({ ...nyeBelop, [felt as string]: e.target.value })
                        }
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={leggTilPeriode} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Legg til periode
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StockProfilesAdmin;
