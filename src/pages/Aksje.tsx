import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ExternalLink, Info } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import {
  Aksjeprofil,
  Periodetype,
  REGNSKAPSLINJER,
  Regnskapsperiode,
  formatTall,
  hentProfil,
  hentRegnskap,
  margin,
} from "@/lib/aksjeprofiler";

/** Ett nøkkeltall i rutenettet øverst. */
const Tall = ({
  navn,
  verdi,
  enhet,
  hjelp,
}: {
  navn: string;
  verdi: number | null;
  enhet?: string;
  hjelp?: string;
}) => (
  <div className="p-5 border-b border-r border-border last:border-r-0">
    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-1.5" title={hjelp}>
      {navn}
    </p>
    <p className="font-serif text-2xl text-foreground tabular-nums">
      {formatTall(verdi, verdi !== null && Math.abs(verdi) < 100 ? 1 : 0)}
      {verdi !== null && enhet ? <span className="text-base text-muted-foreground"> {enhet}</span> : null}
    </p>
  </div>
);

const Aksje = () => {
  const { ticker = "" } = useParams();
  const { holdings, quotes, calculateHoldingValue, calculatePortfolioValue } = usePortfolioData();

  const [profil, setProfil] = useState<Aksjeprofil | null>(null);
  const [perioder, setPerioder] = useState<Regnskapsperiode[]>([]);
  const [laster, setLaster] = useState(true);
  const [feil, setFeil] = useState<string | null>(null);
  const [visning, setVisning] = useState<Periodetype>("ar");

  useEffect(() => {
    let avbrutt = false;
    const hent = async () => {
      setLaster(true);
      setFeil(null);
      try {
        const [p, r] = await Promise.all([hentProfil(ticker), hentRegnskap(ticker)]);
        if (avbrutt) return;
        setProfil(p);
        setPerioder(r);
        // Start på den perioden det faktisk finnes tall for
        if (!r.some((x) => x.periode_type === "ar") && r.some((x) => x.periode_type === "kvartal")) {
          setVisning("kvartal");
        }
      } catch (e) {
        if (!avbrutt) setFeil(e instanceof Error ? e.message : "Ukjent feil");
      } finally {
        if (!avbrutt) setLaster(false);
      }
    };
    hent();
    return () => {
      avbrutt = true;
    };
  }, [ticker]);

  const holding = holdings.find((h) => h.ticker === ticker);
  const quote = quotes[ticker];
  const valgte = useMemo(
    () => perioder.filter((p) => p.periode_type === visning),
    [perioder, visning],
  );
  const harAr = perioder.some((p) => p.periode_type === "ar");
  const harKvartal = perioder.some((p) => p.periode_type === "kvartal");

  const grafdata = useMemo(
    () =>
      valgte.map((p) => ({
        navn: p.periode_navn,
        Omsetning: p.omsetning,
        EBIT: p.ebit,
        "EBIT-margin": margin(p.ebit, p.omsetning),
      })),
    [valgte],
  );

  // Vår posisjon - bare hvis vi faktisk eier aksjen
  const posisjon = useMemo(() => {
    if (!holding) return null;
    const verdi = calculateHoldingValue(holding, quotes[holding.ticker]);
    const total = calculatePortfolioValue(holdings, quotes);
    return {
      verdi,
      andel: total > 0 ? (verdi / total) * 100 : 0,
      antall: holding.quantity,
    };
  }, [holding, holdings, quotes, calculateHoldingValue, calculatePortfolioValue]);

  const navn = profil?.name || holding?.name || ticker;
  const valuta = profil?.valuta || quote?.currency || "NOK";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <div className="section-container py-10 md:py-14">
          <Link
            to="/portefolje"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til porteføljen
          </Link>

          {/* Tittel */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="eyebrow mb-4">{profil?.sector || holding?.sector || "Aksje"}</p>
              <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-3">{navn}</h1>
              <p className="text-sm text-muted-foreground">
                {ticker}
                {profil?.exchange || holding?.exchange
                  ? ` · ${profil?.exchange || holding?.exchange}`
                  : ""}
                {profil?.nettside ? (
                  <>
                    {" · "}
                    <a
                      href={profil.nettside}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
                    >
                      Nettside <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                ) : null}
              </p>
            </div>

            {quote && (
              <div className="md:text-right">
                <p className="font-serif text-3xl text-foreground tabular-nums">
                  {quote.price.toLocaleString("no-NO", { maximumFractionDigits: 2 })}{" "}
                  <span className="text-lg text-muted-foreground">{quote.currency}</span>
                </p>
                <p
                  className={`text-sm tabular-nums ${
                    quote.changePercent >= 0 ? "stock-positive" : "stock-negative"
                  }`}
                >
                  {quote.changePercent >= 0 ? "+" : ""}
                  {formatTall(quote.changePercent, 2)} % i dag
                </p>
              </div>
            )}
          </div>

          {laster ? (
            <p className="text-muted-foreground py-16 text-center">Laster …</p>
          ) : feil ? (
            <div className="rounded-md border border-border bg-card p-6 md:p-8">
              <p className="text-muted-foreground">
                Klarte ikke å hente tallene: {feil}
              </p>
            </div>
          ) : !profil ? (
            /* Tomtilstand - profilen er ikke fylt inn ennå */
            <div
              className="rounded-md border border-border bg-card p-8 md:p-10 max-w-2xl"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div className="w-11 h-11 rounded-full border border-foreground/20 flex items-center justify-center mb-5">
                <Info className="w-5 h-5 text-foreground/70" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-3">
                Ingen analyse lagt inn ennå
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Komiteen har ikke fylt inn nøkkeltall, regnskap og bransjeforklaring
                for {navn} ennå. Selskapene legges inn etter hvert, og tallene
                oppdateres når nye kvartalsrapporter kommer.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Kort beskrivelse + vår posisjon */}
              <div className="grid lg:grid-cols-3 gap-6">
                {profil.kort_beskrivelse && (
                  <div
                    className="lg:col-span-2 rounded-md border border-border bg-card p-6 md:p-7"
                    style={{ boxShadow: "var(--shadow-soft)" }}
                  >
                    <h2 className="font-serif text-xl text-foreground mb-3">Kort om selskapet</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {profil.kort_beskrivelse}
                    </p>
                  </div>
                )}

                {posisjon && (
                  <div
                    className="rounded-md border border-border bg-card p-6 md:p-7"
                    style={{ boxShadow: "var(--shadow-soft)" }}
                  >
                    <h2 className="font-serif text-xl text-foreground mb-4">Vår posisjon</h2>
                    <dl className="space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Antall aksjer</dt>
                        <dd className="tabular-nums text-foreground">
                          {posisjon.antall.toLocaleString("no-NO")}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Verdi</dt>
                        <dd className="tabular-nums text-foreground">
                          {formatTall(posisjon.verdi)} kr
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Andel av porteføljen</dt>
                        <dd className="tabular-nums text-foreground">
                          {formatTall(posisjon.andel, 1)} %
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>

              {/* Nøkkeltall */}
              <section>
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
                  <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                    Nøkkeltall og multipler
                  </h2>
                  {profil.tall_per_dato && (
                    <p className="text-xs text-muted-foreground">
                      Tall per{" "}
                      {new Date(profil.tall_per_dato).toLocaleDateString("no-NO", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                      {profil.kilde ? ` · ${profil.kilde}` : ""}
                    </p>
                  )}
                </div>
                <div
                  className="rounded-md border border-border bg-card overflow-hidden grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <Tall navn="Børsverdi" verdi={profil.borsverdi_mrd} enhet={`mrd ${valuta}`} />
                  <Tall navn="P/E" verdi={profil.pe} hjelp="Pris delt på resultat per aksje" />
                  <Tall navn="P/B" verdi={profil.pb} hjelp="Pris delt på bokført egenkapital" />
                  <Tall navn="P/S" verdi={profil.ps} hjelp="Pris delt på omsetning" />
                  <Tall
                    navn="EV/EBITDA"
                    verdi={profil.ev_ebitda}
                    hjelp="Selskapsverdi delt på driftsresultat før av- og nedskrivninger"
                  />
                  <Tall navn="EV/EBIT" verdi={profil.ev_ebit} hjelp="Selskapsverdi delt på driftsresultat" />
                  <Tall navn="Utbytte" verdi={profil.utbytte_prosent} enhet="%" />
                  <Tall navn="Egenkapitalavkastning" verdi={profil.roe_prosent} enhet="%" />
                  <Tall navn="Egenkapitalandel" verdi={profil.egenkapitalandel} enhet="%" />
                  <Tall
                    navn="Netto gjeld / EBITDA"
                    verdi={profil.netto_gjeld_ebitda}
                    enhet="x"
                    hjelp="Hvor mange år med dagens driftsresultat gjelden utgjør"
                  />
                </div>

                {/* KI-forbehold. Står her, rett under tallene, fordi det er
                    her leseren faktisk trenger det - ikke nederst på siden. */}
                <div className="flex items-start gap-3 mt-4 px-1">
                  <AlertTriangle className="w-4 h-4 text-foreground/50 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                    Tallene på denne siden er hentet inn ved hjelp av kunstig
                    intelligens og er <span className="text-foreground">ikke kvalitetssikret</span>{" "}
                    mot selskapets offisielle rapporter. De kan inneholde feil.
                    Bruk dem som et utgangspunkt for egen research, ikke som fasit -
                    gå til selskapets kvartals- og årsrapport for tall du skal
                    stole på.
                  </p>
                </div>
              </section>

              {/* Regnskap */}
              {(harAr || harKvartal) && (
                <section>
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <h2 className="font-serif text-2xl md:text-3xl text-foreground">Regnskap</h2>
                    <div className="flex gap-2">
                      {harAr && (
                        <button
                          onClick={() => setVisning("ar")}
                          className={`px-4 py-2 rounded-[4px] text-sm font-medium border transition-colors ${
                            visning === "ar"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border bg-background text-foreground hover:bg-secondary/60"
                          }`}
                        >
                          År
                        </button>
                      )}
                      {harKvartal && (
                        <button
                          onClick={() => setVisning("kvartal")}
                          className={`px-4 py-2 rounded-[4px] text-sm font-medium border transition-colors ${
                            visning === "kvartal"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border bg-background text-foreground hover:bg-secondary/60"
                          }`}
                        >
                          Kvartal
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    className="rounded-md border border-border bg-card p-6 md:p-8"
                    style={{ boxShadow: "var(--shadow-soft)" }}
                  >
                    {/* Graf */}
                    {grafdata.length > 1 && (
                      <div className="h-72 -ml-2 mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={grafdata}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis
                              dataKey="navn"
                              stroke="hsl(var(--muted-foreground))"
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis
                              yAxisId="belop"
                              stroke="hsl(var(--muted-foreground))"
                              tick={{ fontSize: 12 }}
                              tickFormatter={(v) => formatTall(v)}
                            />
                            <YAxis
                              yAxisId="margin"
                              orientation="right"
                              stroke="hsl(var(--muted-foreground))"
                              tick={{ fontSize: 12 }}
                              tickFormatter={(v) => `${Math.round(v)} %`}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: 6,
                                fontSize: 13,
                              }}
                              formatter={(v: number, navn: string) =>
                                navn === "EBIT-margin"
                                  ? [`${formatTall(v, 1)} %`, navn]
                                  : [`${formatTall(v)} mill. ${valuta}`, navn]
                              }
                            />
                            <Legend wrapperStyle={{ fontSize: 13 }} />
                            <Bar
                              yAxisId="belop"
                              dataKey="Omsetning"
                              fill="hsl(var(--primary))"
                              radius={[3, 3, 0, 0]}
                              maxBarSize={44}
                            />
                            <Bar
                              yAxisId="belop"
                              dataKey="EBIT"
                              fill="hsl(var(--accent))"
                              radius={[3, 3, 0, 0]}
                              maxBarSize={44}
                            />
                            <Line
                              yAxisId="margin"
                              type="monotone"
                              dataKey="EBIT-margin"
                              stroke="hsl(150 6% 45%)"
                              strokeWidth={1.8}
                              strokeDasharray="6 5"
                              dot={{ r: 3 }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Tabell */}
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 pr-4 text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">
                              Mill. {valuta}
                            </th>
                            {valgte.map((p) => (
                              <th
                                key={p.id}
                                className="text-right py-3 px-3 text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium"
                              >
                                {p.periode_navn}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {REGNSKAPSLINJER.map(({ felt, navn: linjenavn }) => (
                            <tr key={felt} className="border-b border-border/60 last:border-0">
                              <td className="py-3 pr-4 text-muted-foreground">{linjenavn}</td>
                              {valgte.map((p) => (
                                <td key={p.id} className="py-3 px-3 text-right tabular-nums text-foreground">
                                  {formatTall(p[felt] as number | null)}
                                </td>
                              ))}
                            </tr>
                          ))}
                          <tr className="border-t border-border">
                            <td className="py-3 pr-4 text-muted-foreground">EBIT-margin</td>
                            {valgte.map((p) => {
                              const m = margin(p.ebit, p.omsetning);
                              return (
                                <td key={p.id} className="py-3 px-3 text-right tabular-nums text-foreground">
                                  {m === null ? "-" : `${formatTall(m, 1)} %`}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}

              {/* Bransjeforklaring */}
              {profil.bransjeforklaring && (
                <section>
                  <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-5">
                    Bransjen
                  </h2>
                  <div
                    className="rounded-md border border-border bg-card p-6 md:p-8"
                    style={{ boxShadow: "var(--shadow-soft)" }}
                  >
                    <div className="text-muted-foreground leading-relaxed space-y-4 max-w-3xl">
                      {profil.bransjeforklaring
                        .split(/\n\s*\n/)
                        .map((avsnitt, i) => <p key={i}>{avsnitt.trim()}</p>)}
                    </div>
                  </div>
                </section>
              )}

              {/* Ansvarsfraskrivelse */}
              <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-3xl">
                Tallene er samlet inn med KI-hjelp, lagt inn manuelt og oppdateres ikke
                automatisk - se datoen over nøkkeltallene for hvor ferske de er. Historisk
                avkastning er ingen garanti for framtidig avkastning, og ingenting på denne
                siden er investeringsrådgivning. Se{" "}
                <Link to="/vilkar" className="underline underline-offset-2 hover:text-foreground">
                  vilkårene
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Aksje;
