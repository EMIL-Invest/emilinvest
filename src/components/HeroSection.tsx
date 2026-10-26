import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useIndekser, INDEKS_NOEKLER, IndeksNoekkel, kursPaa, dagsendring } from "@/hooks/useIndekser";
import Kurve, { KurvePunkt } from "@/components/forside/Kurve";
import KursStripe, { KursPost } from "@/components/forside/KursStripe";
import KonkurranseKolonne from "@/components/forside/KonkurranseKolonne";
import heroPhoto from "@/assets/hero-bue.jpg";

/**
 * Toppen av forsiden, i tre lag:
 *   1) Kurslinje og intro med gruppebildet i bue (døråpningen på Hovedbygningen)
 *   2) Kurven: overgangen fra lys bakgrunn til grønt er porteføljens utvikling
 *   3) Grønt felt med porteføljens verdi og indeksvalg, og konkurransen ved siden av
 */

const prosent = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1).replace(".", ",")} %`;
const kortDato = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("no-NO", { day: "numeric", month: "long" });

const HeroSection = () => {
  const { holdings, quotes, history, loading, lastUpdated, calculatePortfolioValue } = usePortfolioData();
  const { serier } = useIndekser();
  const [valgt, setValgt] = useState<IndeksNoekkel>("verden");

  const verdi = calculatePortfolioValue(holdings, quotes);

  // Dagens bevegelse: sum av dagsendring (NOK) per aksje vi eier
  const dagKr = holdings
    .filter((h) => h.holding_type === "stock")
    .reduce((sum, h) => {
      const q = quotes[h.ticker];
      return q ? sum + q.change * h.quantity : sum;
    }, 0);

  // Porteføljens historikk, med dagens live-verdi som siste punkt
  const porteRaa = useMemo(() => {
    const rader = history.map((h) => ({ d: h.date, v: Number(h.portfolio_value) })).filter((r) => r.v > 0);
    if (!loading && verdi > 0 && rader.length > 0) {
      const idag = new Date().toISOString().slice(0, 10);
      if (rader[rader.length - 1].d === idag) rader[rader.length - 1] = { d: idag, v: verdi };
      else rader.push({ d: idag, v: verdi });
    }
    return rader;
  }, [history, loading, verdi]);

  const start = porteRaa[0];
  const porte: KurvePunkt[] = start ? porteRaa.map((r) => ({ d: r.d, v: (r.v / start.v) * 100 })) : [];
  const porteEndring = porte.length > 1 ? porte[porte.length - 1].v - 100 : null;

  // Indeksene på de samme datoene som porteføljen, normalisert til 100 ved start
  const indeksPaaDatoer = (k: IndeksNoekkel): number[] => {
    const s = serier[k];
    if (!s || !start) return [];
    const startKurs = kursPaa(s.punkter, start.d) ?? s.punkter[0]?.c;
    if (!startKurs) return [];
    return porteRaa.map((r) => ((kursPaa(s.punkter, r.d) ?? startKurs) / startKurs) * 100);
  };
  const tilgjengelige = INDEKS_NOEKLER.filter((k) => serier[k]);
  const aktiv = tilgjengelige.includes(valgt) ? valgt : tilgjengelige[0];
  const indeks = aktiv ? indeksPaaDatoer(aktiv) : [];
  const indeksEndring = indeks.length > 1 ? indeks[indeks.length - 1] - 100 : null;

  // Kurslinjen: våre aksjer, deretter indeksene
  const kurser: KursPost[] = [
    ...holdings
      .filter((h) => h.holding_type === "stock")
      .map((h) => ({ navn: h.ticker, endring: quotes[h.ticker]?.changePercent ?? null })),
    ...INDEKS_NOEKLER.filter((k) => serier[k]).map((k) => ({ navn: serier[k]!.navn, endring: dagsendring(serier[k]!.punkter) })),
  ];

  const siden = start ? `siden ${kortDato(start.d)}` : "";

  return (
    <section id="home" className="pt-16">
      <KursStripe poster={loading ? [] : kurser} />

      {/* 1) Intro og bilde */}
      <div className="section-container">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-6 lg:gap-14 items-end pt-6 lg:pt-12">
          <div className="lg:pb-9">
            <h1 className="font-serif font-normal text-[38px] sm:text-5xl lg:text-[54px] leading-[1.03] tracking-[-0.015em] text-primary">
              Energi- og miljøingeniørenes investeringskomité
            </h1>
            <p className="text-[16.5px] md:text-lg leading-relaxed text-muted-foreground mt-5 mb-7 max-w-[30em]">
              Vi er studenter ved NTNU som forvalter linjeforeningens midler med et langsiktig perspektiv. Alt vi
              investerer i, og hvorfor, ligger åpent her.
            </p>
            <a
              href="#team"
              className="text-foreground underline decoration-2 underline-offset-[6px]"
              style={{ textDecorationColor: "hsl(var(--competition))" }}
            >
              Bli kjent med komiteen
            </a>
          </div>
          <figure className="order-first lg:order-none">
            {/* Buen speiler døråpningen bak gjengen. Utsnittet har luft over hodene,
                så ingen blir kuttet av buen - heller ikke de ytterste. */}
            <img
              src={heroPhoto}
              alt="Investeringskomiteen foran Hovedbygningen på Gløshaugen"
              className="w-full aspect-[1220/780] object-cover"
              style={{ borderRadius: "50% 50% 0 0 / 30% 30% 0 0" }}
            />
          </figure>
        </div>
      </div>

      {/* 2) Kurven */}
      {porte.length > 1 ? (
        <Kurve
          portefolje={porte}
          indeks={indeks}
          etikett={porteEndring === null ? "" : prosent(porteEndring)}
          undertekst={`porteføljen ${siden}`}
        />
      ) : (
        <div className="h-[170px] md:h-[240px] flex items-end">
          <div className="w-full h-16" style={{ background: "hsl(var(--band))" }} />
        </div>
      )}

      {/* 3) Grønt felt */}
      <div id="portefolje-topp" className="text-white -mt-px" style={{ background: "hsl(var(--band))" }}>
        <div className="section-container grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-20 pt-5 md:pt-7 pb-16 md:pb-20">
          <div>
            <div className="flex justify-between text-sm text-white/65">
              <span>Porteføljens verdi nå</span>
              {lastUpdated && (
                <span>oppdatert {lastUpdated.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}</span>
              )}
            </div>
            <p className="font-serif text-5xl md:text-[62px] leading-none tracking-[-0.01em] mt-3 mb-2.5 tabular-nums">
              {loading ? "…" : Math.round(verdi).toLocaleString("no-NO")}
              <span className="text-2xl ml-1.5 opacity-70">kr</span>
            </p>
            {!loading && (
              <p className="flex flex-wrap gap-x-6 gap-y-1 text-[14.5px] text-white/65">
                <span>
                  I dag{" "}
                  <b className={`font-semibold ${dagKr >= 0 ? "text-[#93D2A3]" : "text-[#F0A493]"}`}>
                    {dagKr >= 0 ? "+" : "−"}
                    {Math.abs(Math.round(dagKr)).toLocaleString("no-NO")} kr
                  </b>
                </span>
                {porteEndring !== null && (
                  <span>
                    Porteføljen{" "}
                    <b className={`font-semibold ${porteEndring >= 0 ? "text-[#93D2A3]" : "text-[#F0A493]"}`}>
                      {prosent(porteEndring)}
                    </b>
                  </span>
                )}
                {aktiv && indeksEndring !== null && (
                  <span>
                    {serier[aktiv]!.navn} <b className="font-semibold text-white">{prosent(indeksEndring)}</b>
                  </span>
                )}
              </p>
            )}

            {tilgjengelige.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6 mb-2.5" role="group" aria-label="Sammenlign med indeks">
                {tilgjengelige.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setValgt(k)}
                    aria-pressed={k === aktiv}
                    className={`text-[13.5px] px-3.5 py-1.5 rounded-full border transition-[transform,background-color,border-color,color] duration-150 hover:scale-105 active:scale-95 motion-reduce:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      k === aktiv
                        ? "font-semibold border-transparent text-[hsl(var(--competition-foreground))]"
                        : "border-white/25 text-white/80 hover:border-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                    style={k === aktiv ? { background: "hsl(var(--competition))" } : undefined}
                  >
                    {serier[k]!.navn}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[13.5px] text-white/55 mb-6 max-w-lg">
              Den mørke kanten er porteføljen {siden}.
              {aktiv ? ` Den svake ryggen er ${serier[aktiv]!.navn}, regnet om til kroner.` : ""}
            </p>
            <Link
              to="/portefolje"
              className="text-white underline decoration-2 underline-offset-[6px]"
              style={{ textDecorationColor: "hsl(var(--competition))" }}
            >
              Se hele porteføljen
            </Link>
          </div>

          <KonkurranseKolonne />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
