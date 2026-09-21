import type { Holding, StockQuote } from "@/hooks/usePortfolioData";
import type { Forutsetninger, LagretVerdsettelse } from "./db";
import type { Markedsstatistikk } from "./markedsdata";
import type { VerdsettelseInputs, VerdsettelseResultater } from "./verdsettelse";
import { kravCAPM } from "@/lib/finans/kapitalkostnad";
import {
  Frontpunkt, dekomponerRisiko, effisientFrontLangKun, kravMotPortefolje, minVariansLangKun, portefoljeNokkeltall,
  tangentLangKun,
} from "@/lib/finans/portefolje";
import type { Anbefaling } from "@/lib/finans/konklusjon";

/**
 * Porteføljeanalysen - kapittel 10-13 anvendt på EMIL Invests faktiske
 * portefølje. Alt regnes i NOK og annualisert.
 *
 * Forventet avkastning: standard er CAPM (r_f + β × MRP), slik boka
 * anbefaler i kap. 12 - historiske snitt er for støyete til å brukes som
 * forventning (kap. 10.4). Kovariansene er derimot historiske.
 */

export type ForventetKilde = "capm" | "historisk";

export interface PortefoljeParametre {
  forventetKilde: ForventetKilde;
  betaVariant: "historisk" | "justert";
  risikofriRente: number;
  markedspremie: number;
  frekvens: Forutsetninger["frekvens"];
  historikk: Forutsetninger["historikk"];
  markedsindeks: string;
}

export interface Posisjon {
  ticker: string;
  navn: string;
  sektor: string | null;
  verdiNok: number;
  vekt: number;
  beta: number;
  betaJustert: number;
  betaStandardfeil: number;
  r2: number;
  volatilitet: number;
  historiskAvkastning: number;
  capmKrav: number;
  /** Historisk avkastning minus CAPM-krav - «har aksjen levert for risikoen?» */
  alfa: number;
  /** Jensens alfa fra regresjonen (annualisert). */
  jensenAlfa: number;
  korrelasjonMarked: number;
  /** Andel av porteføljens varians denne posisjonen står for. */
  risikobidrag: number;
  /** Forventet avkastning minus kravet mot vår egen portefølje (lign. 11.19). > 0 = øk, < 0 = reduser. */
  differanseMotPortefolje: number;
  vurdering: { oppside: number; anbefaling: Anbefaling | null; dato: string; verdi: number; kurs: number } | null;
}

export interface PortefoljeResultat {
  parametre: PortefoljeParametre;
  beregnet: string;
  periode: { fra: string; til: string; antall: number };
  posisjoner: Posisjon[];
  /** Andel av total porteføljeverdi som analysen dekker (aksjer med historikk). */
  dekning: number;
  totalVerdiNok: number;
  portefolje: {
    forventetAvkastning: number;
    volatilitet: number;
    sharpe: number;
    beta: number;
    andelSystematisk: number;
    diversifiseringsgevinst: number;
    vektetSnittVolatilitet: number;
    capmKrav: number;
    alfa: number;
  };
  marked: { ticker: string; historiskAvkastning: number; volatilitet: number; sharpe: number };
  korrelasjon: number[][];
  front: Frontpunkt[];
  tangent: { vekter: number[]; forventetAvkastning: number; volatilitet: number; sharpe: number };
  minVarians: { vekter: number[]; forventetAvkastning: number; volatilitet: number };
  forslag: { ticker: string; naa: number; tangent: number; endring: number }[];
  samletOppside: { vektetOppside: number; dekningAndel: number; antall: number } | null;
  manglende: string[];
}

export const standardParametre = (f: Forutsetninger): PortefoljeParametre => ({
  forventetKilde: "capm",
  betaVariant: "justert",
  risikofriRente: f.risikofriRente,
  markedspremie: f.markedspremie,
  frekvens: f.frekvens,
  historikk: f.historikk,
  markedsindeks: f.markedsindeks,
});

export const analyserPortefolje = (
  holdings: Holding[],
  quotes: Record<string, StockQuote>,
  stat: Markedsstatistikk,
  verdsettelser: LagretVerdsettelse<VerdsettelseInputs, VerdsettelseResultater>[],
  p: PortefoljeParametre,
): PortefoljeResultat => {
  // Samme verdilogikk som usePortfolioData: kurser fra stock-prices er i NOK,
  // fond og annet uten live-kurs verdsettes til kostbasis.
  const verdi = (h: Holding) => {
    const q = quotes[h.ticker];
    if (h.holding_type === "stock" && q && q.price > 0) return q.price * h.quantity;
    return h.cost_basis || h.purchase_price * h.quantity;
  };
  const totalVerdi = holdings.reduce((s, h) => s + verdi(h), 0);

  // Bare aksjer vi har statistikk for
  const medStat = holdings.filter((h) => h.holding_type === "stock" && stat.aksjer.some((a) => a.ticker === h.ticker));
  const verdier = medStat.map(verdi);
  const dekket = verdier.reduce((s, v) => s + v, 0);
  const vekter = verdier.map((v) => (dekket > 0 ? v / dekket : 0));
  const aksjer = medStat.map((h) => stat.aksjer.find((a) => a.ticker === h.ticker)!);
  const idx = aksjer.map((a) => stat.aksjer.indexOf(a));
  const kov = idx.map((i) => idx.map((j) => stat.kovAarlig[i][j]));
  const korr = idx.map((i) => idx.map((j) => stat.korrelasjon[i][j]));

  const betaer = aksjer.map((a) => (p.betaVariant === "justert" ? a.betaJustert : a.beta));
  const capm = betaer.map((b) => kravCAPM(p.risikofriRente, b, p.markedspremie));
  const forventet = p.forventetKilde === "capm" ? capm : aksjer.map((a) => a.aarligAvkastning);

  const n = portefoljeNokkeltall(vekter, forventet, kov, p.risikofriRente);
  const variansMarked = stat.marked.aarligVolatilitet ** 2;
  const dek = dekomponerRisiko(vekter, kov, betaer, variansMarked);
  const mot = kravMotPortefolje(vekter, forventet, kov, p.risikofriRente);

  // Nyeste ferdige verdsettelse per ticker (utkast teller hvis ingen ferdig)
  const sisteVurdering = (ticker: string) => {
    const kand = verdsettelser.filter((v) => v.ticker === ticker && v.resultater?.samlet);
    if (kand.length === 0) return null;
    const ferdige = kand.filter((v) => v.status === "ferdig");
    const v = (ferdige.length ? ferdige : kand).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    const s = v.resultater.samlet!;
    return { oppside: s.oppside, anbefaling: v.anbefaling, dato: v.updated_at, verdi: s.sentralverdi, kurs: v.inputs.aksjekurs };
  };

  const posisjoner: Posisjon[] = medStat.map((h, i) => ({
    ticker: h.ticker,
    navn: h.name,
    sektor: h.sector,
    verdiNok: verdier[i],
    vekt: vekter[i],
    beta: aksjer[i].beta,
    betaJustert: aksjer[i].betaJustert,
    betaStandardfeil: aksjer[i].betaStandardfeil,
    r2: aksjer[i].r2,
    volatilitet: aksjer[i].aarligVolatilitet,
    historiskAvkastning: aksjer[i].aarligAvkastning,
    capmKrav: capm[i],
    alfa: aksjer[i].aarligAvkastning - capm[i],
    jensenAlfa: aksjer[i].alfaAarlig,
    korrelasjonMarked: aksjer[i].korrelasjonMarked,
    risikobidrag: dek.risikobidrag[i],
    differanseMotPortefolje: mot.differanse[i],
    vurdering: sisteVurdering(h.ticker),
  }));

  // Optimering
  let front: Frontpunkt[] = [];
  let tangentW = vekter;
  let minW = vekter;
  if (vekter.length >= 2) {
    try {
      front = effisientFrontLangKun(forventet, kov, 30);
      tangentW = tangentLangKun(forventet, kov, p.risikofriRente);
      minW = minVariansLangKun(kov);
    } catch {
      /* singulær matrise e.l. - vis analysen uten front */
    }
  }
  const tn = portefoljeNokkeltall(tangentW, forventet, kov, p.risikofriRente);
  const mn = portefoljeNokkeltall(minW, forventet, kov, p.risikofriRente);

  const forslag = medStat
    .map((h, i) => ({ ticker: h.ticker, naa: vekter[i], tangent: tangentW[i], endring: tangentW[i] - vekter[i] }))
    .sort((a, b) => Math.abs(b.endring) - Math.abs(a.endring));

  const medVurdering = posisjoner.filter((x) => x.vurdering);
  const vurdertVerdi = medVurdering.reduce((s, x) => s + x.verdiNok, 0);
  const samletOppside =
    medVurdering.length > 0
      ? {
          vektetOppside: medVurdering.reduce((s, x) => s + (x.verdiNok / vurdertVerdi) * x.vurdering!.oppside, 0),
          dekningAndel: dekket > 0 ? vurdertVerdi / dekket : 0,
          antall: medVurdering.length,
        }
      : null;

  const markedSharpe = stat.marked.aarligVolatilitet > 0 ? (stat.marked.aarligAvkastning - p.risikofriRente) / stat.marked.aarligVolatilitet : NaN;
  const capmKravP = kravCAPM(p.risikofriRente, dek.betaPortefolje, p.markedspremie);
  const histP = vekter.reduce((s, w, i) => s + w * aksjer[i].aarligAvkastning, 0);

  return {
    parametre: p,
    beregnet: new Date().toISOString(),
    periode: { fra: stat.fra, til: stat.til, antall: stat.perioder.length },
    posisjoner,
    dekning: totalVerdi > 0 ? dekket / totalVerdi : 0,
    totalVerdiNok: totalVerdi,
    portefolje: {
      forventetAvkastning: n.forventetAvkastning,
      volatilitet: n.volatilitet,
      sharpe: n.sharpe,
      beta: dek.betaPortefolje,
      andelSystematisk: dek.andelSystematisk,
      diversifiseringsgevinst: dek.diversifiseringsgevinst,
      vektetSnittVolatilitet: dek.vektetSnittVolatilitet,
      capmKrav: capmKravP,
      alfa: histP - capmKravP,
    },
    marked: { ticker: stat.marked.ticker, historiskAvkastning: stat.marked.aarligAvkastning, volatilitet: stat.marked.aarligVolatilitet, sharpe: markedSharpe },
    korrelasjon: korr,
    front,
    tangent: { vekter: tangentW, forventetAvkastning: tn.forventetAvkastning, volatilitet: tn.volatilitet, sharpe: tn.sharpe },
    minVarians: { vekter: minW, forventetAvkastning: mn.forventetAvkastning, volatilitet: mn.volatilitet },
    forslag,
    samletOppside,
    manglende: stat.manglende,
  };
};

/** Klarspråk til presentasjonen. */
export const forklarPortefolje = (r: PortefoljeResultat): string[] => {
  const ut: string[] = [];
  const p = r.portefolje;
  const pst = (v: number) => `${(v * 100).toFixed(0)} %`;
  ut.push(
    `Porteføljen svinger ${p.beta > 1.1 ? "mer enn" : p.beta < 0.9 ? "mindre enn" : "omtrent som"} Oslo Børs (beta ${p.beta.toFixed(2)}). Faller børsen 10 %, må vi regne med at porteføljen beveger seg rundt ${(p.beta * 10).toFixed(0)} %.`,
  );
  ut.push(
    `${pst(p.andelSystematisk)} av risikoen er markedsrisiko som ikke kan diversifiseres bort. Resten, ${pst(1 - p.andelSystematisk)}, er selskapsspesifikk - den forsvinner med flere og mer ulike aksjer, og markedet betaler ikke for å bære den.`,
  );
  ut.push(
    `Diversifiseringen fjerner ${pst(p.diversifiseringsgevinst)} av risikoen: hadde aksjene beveget seg i takt, ville svingningene vært ${pst(p.vektetSnittVolatilitet)} i året, men de er ${pst(p.volatilitet)}.`,
  );
  if (isFinite(p.sharpe) && isFinite(r.marked.sharpe)) {
    ut.push(
      p.sharpe > r.marked.sharpe
        ? `Sharpe-ratioen (avkastning per enhet risiko) er ${p.sharpe.toFixed(2)} mot ${r.marked.sharpe.toFixed(2)} for børsen - vi får bedre betalt for risikoen vi tar.`
        : `Sharpe-ratioen (avkastning per enhet risiko) er ${p.sharpe.toFixed(2)} mot ${r.marked.sharpe.toFixed(2)} for børsen - et indeksfond ville gitt mer avkastning per enhet risiko.`,
    );
  }
  if (r.tangent.sharpe > p.sharpe + 0.02 && r.forslag.length > 0) {
    const topp = r.forslag.slice(0, 2).map((f) => `${f.endring > 0 ? "mer" : "mindre"} ${f.ticker}`).join(" og ");
    ut.push(`Med samme aksjer, men andre vekter, kunne Sharpe blitt ${r.tangent.sharpe.toFixed(2)}. Den største forbedringen ligger i ${topp}. Husk at dette bygger på historiske samvariasjoner som kan endre seg.`);
  }
  if (r.samletOppside) {
    ut.push(
      `Verdsettelsene våre dekker ${pst(r.samletOppside.dekningAndel)} av aksjeporteføljen og gir samlet ${r.samletOppside.vektetOppside >= 0 ? "en oppside" : "en nedside"} på ${pst(Math.abs(r.samletOppside.vektetOppside))}.`,
    );
  }
  return ut;
};
