import { supabase } from "@/integrations/supabase/client";
import {
  Frekvens, Kurspunkt, avkastninger, gjennomsnitt, standardavvik, regresjon, justertBeta, juster,
  annualiserAvkastning, annualiserVolatilitet, annualiserKovarians, kovariansmatrise, korrelasjonsmatrise,
  korrelasjon, PERIODER_PER_AAR,
} from "@/lib/finans/statistikk";
import type { Forutsetninger } from "./db";

/**
 * Markedsdata til analysene: henter kurshistorikk via edge-funksjonen
 * price-history, regner alt om til NOK, og lager statistikken kapittel
 * 10-12 trenger (avkastning, volatilitet, beta, kovarianser).
 *
 * Alt regnes i NOK fordi porteføljen måles i NOK: en amerikansk aksje
 * som står stille i dollar men faller i kroner, har gitt oss et tap.
 */

export interface Punkt { d: string; c: number }
export interface Kursserie { yahoo: string; currency: string; points: Punkt[] }
export interface HistorikkSvar {
  series: Record<string, Kursserie>;
  fx: Record<string, Punkt[]>;
  interval: string;
  range: string;
  hentet: string;
}

const INTERVALL: Record<Frekvens, "1d" | "1wk" | "1mo"> = { daglig: "1d", ukentlig: "1wk", maanedlig: "1mo" };

export const hentHistorikk = async (tickers: string[], f: Forutsetninger): Promise<HistorikkSvar> => {
  const unike = [...new Set([...tickers, f.markedsindeks])];
  const { data, error } = await supabase.functions.invoke("price-history", {
    body: { tickers: unike, interval: INTERVALL[f.frekvens], range: f.historikk },
  });
  if (error) throw new Error(error.message || "Kunne ikke hente kurshistorikk");
  if (data?.error) throw new Error(data.error);
  return data as HistorikkSvar;
};

/** Periodenøkkel - samme logikk som juster(), gjentatt her for valutakoblingen. */
const noekkel = (dato: string, frekvens: Frekvens): string => {
  const d = new Date(dato + "T00:00:00Z");
  if (frekvens === "maanedlig") return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  if (frekvens === "ukentlig") {
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dag = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - dag);
    const start = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const uke = Math.ceil(((t.getTime() - start.getTime()) / 86400000 + 1) / 7);
    return `${t.getUTCFullYear()}-U${String(uke).padStart(2, "0")}`;
  }
  return dato;
};

/** Regner en kursserie om til NOK med valutakurs fra samme periode (siste kjente hvis perioden mangler). */
export const tilNok = (points: Punkt[], fx: Punkt[] | undefined, frekvens: Frekvens): Kurspunkt[] => {
  if (!fx || fx.length === 0) return points.map((p) => ({ dato: p.d, kurs: p.c }));
  const fxMap = new Map<string, number>();
  for (const p of fx) fxMap.set(noekkel(p.d, frekvens), p.c);
  const fxNoekler = [...fxMap.keys()].sort();
  const ut: Kurspunkt[] = [];
  for (const p of points) {
    const k = noekkel(p.d, frekvens);
    let kurs = fxMap.get(k);
    if (kurs === undefined) {
      // siste valutakurs før perioden
      let kandidat: string | undefined;
      for (const fk of fxNoekler) {
        if (fk <= k) kandidat = fk;
        else break;
      }
      kurs = kandidat ? fxMap.get(kandidat) : undefined;
    }
    if (kurs !== undefined) ut.push({ dato: p.d, kurs: p.c * kurs });
  }
  return ut;
};

export interface Aksjestatistikk {
  ticker: string;
  valuta: string;
  antallPerioder: number;
  /** Avkastning per periode i NOK, på felles tidsakse. */
  avkastninger: number[];
  aarligAvkastning: number;
  aarligVolatilitet: number;
  beta: number;
  betaJustert: number;
  betaStandardfeil: number;
  r2: number;
  /** Jensens alfa (annualisert) - meravkastning utover CAPM med markedet som faktor. */
  alfaAarlig: number;
  korrelasjonMarked: number;
  sisteKursNok: number;
  sisteKursLokal: number;
}

export interface Markedsstatistikk {
  frekvens: Frekvens;
  perioder: string[];
  fra: string;
  til: string;
  aksjer: Aksjestatistikk[];
  marked: { ticker: string; avkastninger: number[]; aarligAvkastning: number; aarligVolatilitet: number };
  /** Annualisert kovariansmatrise i aksjenes rekkefølge. */
  kovAarlig: number[][];
  korrelasjon: number[][];
  manglende: string[];
}

/**
 * Bygger all statistikk fra svaret. Aksjer uten data havner i `manglende`,
 * så porteføljeanalysen kan fortelle hvilke posisjoner den ikke fikk med.
 */
export const beregnMarkedsstatistikk = (
  svar: HistorikkSvar,
  tickers: string[],
  f: Forutsetninger,
): Markedsstatistikk => {
  const frekvens = f.frekvens;
  const rfPerPeriode = f.risikofriRente / PERIODER_PER_AAR[frekvens];
  const nok: Record<string, Kurspunkt[]> = {};
  const manglende: string[] = [];
  const indeks = svar.series[f.markedsindeks];
  if (!indeks) throw new Error(`Fikk ikke kurshistorikk for markedsindeksen ${f.markedsindeks}`);
  nok[f.markedsindeks] = indeks.points.map((p) => ({ dato: p.d, kurs: p.c }));

  for (const t of tickers) {
    const s = svar.series[t];
    if (!s || s.points.length < 10) {
      manglende.push(t);
      continue;
    }
    const serie = s.currency === "NOK" || !s.currency ? s.points.map((p) => ({ dato: p.d, kurs: p.c })) : tilNok(s.points, svar.fx[s.currency], frekvens);
    if (serie.length < 10) manglende.push(t);
    else nok[t] = serie;
  }

  const { noekler, kurser } = juster(nok, frekvens);
  const rM = avkastninger(kurser[f.markedsindeks]);
  const rMEks = rM.map((r) => r - rfPerPeriode);
  const med = tickers.filter((t) => kurser[t]);

  const aksjer: Aksjestatistikk[] = med.map((t) => {
    const r = avkastninger(kurser[t]);
    const rEks = r.map((x) => x - rfPerPeriode);
    const reg = regresjon(rEks, rMEks);
    const s = svar.series[t];
    return {
      ticker: t,
      valuta: s.currency || "NOK",
      antallPerioder: r.length,
      avkastninger: r,
      aarligAvkastning: annualiserAvkastning(gjennomsnitt(r), frekvens),
      aarligVolatilitet: annualiserVolatilitet(standardavvik(r), frekvens),
      beta: reg.beta,
      betaJustert: justertBeta(reg.beta),
      betaStandardfeil: reg.betaStandardfeil,
      r2: reg.r2,
      alfaAarlig: annualiserAvkastning(reg.alfa, frekvens),
      korrelasjonMarked: korrelasjon(r, rM),
      sisteKursNok: kurser[t][kurser[t].length - 1],
      sisteKursLokal: s.points[s.points.length - 1].c,
    };
  });

  const serier = aksjer.map((a) => a.avkastninger);
  const kovAarlig = kovariansmatrise(serier).map((rad) => rad.map((c) => annualiserKovarians(c, frekvens)));

  return {
    frekvens,
    perioder: noekler,
    fra: noekler[0] ?? "",
    til: noekler[noekler.length - 1] ?? "",
    aksjer,
    marked: {
      ticker: f.markedsindeks,
      avkastninger: rM,
      aarligAvkastning: annualiserAvkastning(gjennomsnitt(rM), frekvens),
      aarligVolatilitet: annualiserVolatilitet(standardavvik(rM), frekvens),
    },
    kovAarlig,
    korrelasjon: korrelasjonsmatrise(serier),
    manglende,
  };
};
