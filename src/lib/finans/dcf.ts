/**
 * Diskontert fri kontantstrøm (DCF) med WACC - kapittel 9.3 og 18.2 i
 * Berk & DeMarzo, oppsatt som den finansielle modellen i kapittel 19.
 *
 *   FCF_t = EBIT_t × (1 - tau_c) + Avskrivninger_t - CapEx_t - ΔNWC_t   (lign. 9.20)
 *   V_0   = sum PV(FCF_t) + PV(V_N),  V_N = FCF_{N+1} / (r_wacc - g)     (lign. 9.24)
 *   P_0   = (V_0 + Kontanter - Gjeld) / Aksjer                          (lign. 9.22)
 *
 * Beløp i millioner av selskapets rapporteringsvaluta. Kurs og verdi per
 * aksje i samme valuta, så oppsiden er valutanøytral.
 */

export interface DcfInput {
  /** Omsetning siste regnskapsår (år 0). */
  omsetning0: number;
  /** Antall eksplisitte prognoseår, typisk 5-10. */
  aar: number;
  /** Omsetningsvekst per år. Kortere liste enn `aar` fylles ut med siste verdi. */
  vekst: number[];
  /** EBIT-margin per år. Kortere liste fylles ut med siste verdi. */
  ebitMargin: number[];
  skattesats: number;
  /** Avskrivninger i prosent av omsetning. */
  avskrivningPst: number;
  /** Investeringer (CapEx) i prosent av omsetning. */
  capexPst: number;
  /** Netto arbeidskapital i prosent av omsetning. ΔNWC = pst × Δomsetning. */
  arbeidskapitalPst: number;
  /** Evig vekst etter prognoseperioden. Må være lavere enn WACC. */
  terminalvekst: number;
  wacc: number;
  /** Netto gjeld i dag (rentebærende gjeld minus kontanter). Negativ = netto kontanter. */
  nettoGjeld: number;
  /** Minoritetsinteresser o.l. som trekkes fra før egenkapitalen. */
  andreFratrekk?: number;
  /** Antall utestående aksjer (millioner). */
  antallAksjer: number;
  /** Dagens aksjekurs. */
  aksjekurs: number;
}

export interface DcfAar {
  aar: number;
  omsetning: number;
  vekst: number;
  ebit: number;
  ebitMargin: number;
  skatt: number;
  /** Unlevered net income = EBIT × (1 - tau) */
  nopat: number;
  avskrivning: number;
  capex: number;
  deltaNwc: number;
  fcf: number;
  diskonteringsfaktor: number;
  pv: number;
}

export interface DcfResultat {
  aar: DcfAar[];
  sumPvFcf: number;
  /** FCF i første år etter prognoseperioden. */
  fcfTerminal: number;
  terminalverdi: number;
  pvTerminalverdi: number;
  /** Enterprise value. */
  ev: number;
  egenkapitalverdi: number;
  verdiPerAksje: number;
  /** (verdi - kurs) / kurs */
  oppside: number;
  /** Hvor stor andel av EV som ligger i terminalverdien. */
  terminalAndel: number;
  /** Implisitt EV/EBITDA på siste prognoseår - sanity check mot multipler. */
  implisittEvEbitda: number;
  gyldig: boolean;
  feil?: string;
}

const fyll = (liste: number[], n: number, fallback: number): number[] => {
  const ut: number[] = [];
  for (let i = 0; i < n; i++) ut.push(liste[i] ?? liste[liste.length - 1] ?? fallback);
  return ut;
};

export const dcf = (inn: DcfInput): DcfResultat => {
  const n = Math.max(1, Math.round(inn.aar));
  const vekst = fyll(inn.vekst, n, 0);
  const marg = fyll(inn.ebitMargin, n, 0);
  const rader: DcfAar[] = [];
  let omsetningForrige = inn.omsetning0;
  let sumPv = 0;

  for (let t = 1; t <= n; t++) {
    const omsetning = omsetningForrige * (1 + vekst[t - 1]);
    const ebit = omsetning * marg[t - 1];
    const skatt = ebit * inn.skattesats;
    const nopat = ebit - skatt;
    const avskrivning = omsetning * inn.avskrivningPst;
    const capex = omsetning * inn.capexPst;
    const deltaNwc = (omsetning - omsetningForrige) * inn.arbeidskapitalPst;
    const fcf = nopat + avskrivning - capex - deltaNwc;
    const df = 1 / Math.pow(1 + inn.wacc, t);
    const pv = fcf * df;
    sumPv += pv;
    rader.push({
      aar: t, omsetning, vekst: vekst[t - 1], ebit, ebitMargin: marg[t - 1], skatt, nopat,
      avskrivning, capex, deltaNwc, fcf, diskonteringsfaktor: df, pv,
    });
    omsetningForrige = omsetning;
  }

  const siste = rader[rader.length - 1];
  const gyldig = inn.wacc > inn.terminalvekst && inn.antallAksjer > 0;
  const fcfTerminal = siste.fcf * (1 + inn.terminalvekst);
  const terminalverdi = gyldig ? fcfTerminal / (inn.wacc - inn.terminalvekst) : NaN;
  const pvTerminalverdi = terminalverdi * siste.diskonteringsfaktor;
  const ev = sumPv + pvTerminalverdi;
  const egenkapitalverdi = ev - inn.nettoGjeld - (inn.andreFratrekk ?? 0);
  const verdiPerAksje = egenkapitalverdi / inn.antallAksjer;
  const ebitdaSiste = siste.ebit + siste.avskrivning;

  return {
    aar: rader,
    sumPvFcf: sumPv,
    fcfTerminal,
    terminalverdi,
    pvTerminalverdi,
    ev,
    egenkapitalverdi,
    verdiPerAksje,
    oppside: inn.aksjekurs > 0 ? verdiPerAksje / inn.aksjekurs - 1 : NaN,
    terminalAndel: ev !== 0 ? pvTerminalverdi / ev : NaN,
    implisittEvEbitda: ebitdaSiste > 0 ? terminalverdi / ebitdaSiste : NaN,
    gyldig,
    feil: !gyldig
      ? inn.wacc <= inn.terminalvekst
        ? "WACC må være høyere enn terminalveksten - ellers blir terminalverdien uendelig."
        : "Antall aksjer må være større enn null."
      : undefined,
  };
};

/**
 * Sensitivitetstabell (kap. 19.5): verdi per aksje for hver kombinasjon
 * av WACC (rader) og terminalvekst (kolonner). NaN der WACC <= g.
 */
export const sensitivitet = (
  inn: DcfInput,
  waccVerdier: number[],
  vekstVerdier: number[],
): { wacc: number[]; vekst: number[]; verdier: number[][] } => ({
  wacc: waccVerdier,
  vekst: vekstVerdier,
  verdier: waccVerdier.map((w) =>
    vekstVerdier.map((g) => {
      const r = dcf({ ...inn, wacc: w, terminalvekst: g });
      return r.gyldig ? r.verdiPerAksje : NaN;
    }),
  ),
});

/** Jevnt fordelte verdier rundt et senter, f.eks. WACC ± 2 prosentpoeng i steg på 0,5. */
export const rutenett = (senter: number, steg: number, antallHverSide: number): number[] => {
  const ut: number[] = [];
  for (let i = -antallHverSide; i <= antallHverSide; i++) ut.push(+(senter + i * steg).toFixed(6));
  return ut;
};

export interface Scenario {
  navn: string;
  /** Legges til hver årlig vekstrate (prosentpoeng som desimal). */
  vekstJustering: number;
  /** Legges til EBIT-marginen. */
  marginJustering: number;
  /** Legges til terminalveksten. */
  terminalvekstJustering: number;
  /** Legges til WACC. */
  waccJustering: number;
}

export const STANDARD_SCENARIOER: Scenario[] = [
  { navn: "Pessimistisk", vekstJustering: -0.03, marginJustering: -0.02, terminalvekstJustering: -0.005, waccJustering: 0.01 },
  { navn: "Basis", vekstJustering: 0, marginJustering: 0, terminalvekstJustering: 0, waccJustering: 0 },
  { navn: "Optimistisk", vekstJustering: 0.03, marginJustering: 0.02, terminalvekstJustering: 0.005, waccJustering: -0.01 },
];

export const kjoerScenario = (inn: DcfInput, s: Scenario): DcfResultat =>
  dcf({
    ...inn,
    vekst: inn.vekst.map((v) => v + s.vekstJustering),
    ebitMargin: inn.ebitMargin.map((m) => m + s.marginJustering),
    terminalvekst: inn.terminalvekst + s.terminalvekstJustering,
    wacc: inn.wacc + s.waccJustering,
  });

/**
 * Hvilken WACC gjør at DCF-verdien treffer dagens kurs? Nyttig for å
 * snu spørsmålet: «hvor høyt avkastningskrav priser markedet inn?»
 * Løses med halvering på intervallet (g + 0,1 pp, 60 %).
 */
export const implisittWacc = (inn: DcfInput): number => {
  let lav = inn.terminalvekst + 0.001;
  let hoey = 0.6;
  const f = (w: number) => dcf({ ...inn, wacc: w }).verdiPerAksje - inn.aksjekurs;
  if (!(f(lav) > 0 && f(hoey) < 0)) return NaN;
  for (let i = 0; i < 80; i++) {
    const m = (lav + hoey) / 2;
    if (f(m) > 0) lav = m;
    else hoey = m;
  }
  return (lav + hoey) / 2;
};
