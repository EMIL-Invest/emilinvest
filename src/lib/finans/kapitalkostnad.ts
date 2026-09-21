/**
 * Kapitalkostnad - CAPM, unlevering/relevering av beta og WACC.
 * Kapittel 11.7, 12 og 18.2 i Berk & DeMarzo. Alle satser er desimaltall.
 */

/** CAPM: r_i = r_f + beta_i × (E[R_Mkt] - r_f), lign. 11.22 / 12.1. */
export const kravCAPM = (rf: number, beta: number, markedspremie: number): number =>
  rf + beta * markedspremie;

/** Alfa = faktisk (forventet) avkastning minus CAPM-kravet, kap. 13.1. */
export const alfa = (forventet: number, krav: number): number => forventet - krav;

/**
 * Unlevered beta (aktiva-beta): beta_U = E/(E+D) beta_E + D/(E+D) beta_D,
 * lign. 12.9. D er netto gjeld (gjeld minus kontanter), som i boka.
 */
export const unleverBeta = (betaE: number, E: number, D: number, betaD = 0): number => {
  const V = E + D;
  if (V <= 0) return betaE;
  return (E / V) * betaE + (D / V) * betaD;
};

/** Relevering: beta_E = beta_U + (D/E)(beta_U - beta_D), lign. 12.10 omskrevet. */
export const releverBeta = (betaU: number, E: number, D: number, betaD = 0): number =>
  E <= 0 ? betaU : betaU + (D / E) * (betaU - betaD);

/**
 * Gjeldskostnad fra effektiv rente justert for forventet tap:
 * r_D = ytm - p(mislighold) × forventet tapsrate, lign. 12.7.
 * Standard i boka: tapsrate 60 % (recovery 40 %).
 */
export const gjeldskostnadFraYTM = (ytm: number, misligholdssannsynlighet: number, tapsrate = 0.6): number =>
  ytm - misligholdssannsynlighet * tapsrate;

/** Gjeldskostnad via CAPM med gjeldsbeta (tabell 12.3 gir typiske betaer per rating). */
export const gjeldskostnadFraBeta = (rf: number, betaD: number, markedspremie: number): number =>
  kravCAPM(rf, betaD, markedspremie);

export interface WaccInput {
  /** Markedsverdi egenkapital */
  E: number;
  /** Netto gjeld (gjeld minus overskuddslikviditet) */
  D: number;
  rE: number;
  rD: number;
  skattesats: number;
}

/**
 * WACC etter skatt: r_wacc = E/(E+D) r_E + D/(E+D) r_D (1 - tau_c), lign. 12.13 / 18.1.
 * Med netto gjeld <= 0 (netto kontanter) er WACC = r_E, siden det ikke
 * finnes rentekostnad å trekke skatt fra.
 */
export const wacc = ({ E, D, rE, rD, skattesats }: WaccInput): number => {
  const gjeld = Math.max(D, 0);
  const V = E + gjeld;
  if (V <= 0) return rE;
  return (E / V) * rE + (gjeld / V) * rD * (1 - skattesats);
};

/** Førskatt-WACC (unlevered cost of capital r_U), brukes i APV, lign. 18.6. */
export const unleveredKapitalkostnad = ({ E, D, rE, rD }: Omit<WaccInput, "skattesats">): number => {
  const gjeld = Math.max(D, 0);
  const V = E + gjeld;
  if (V <= 0) return rE;
  return (E / V) * rE + (gjeld / V) * rD;
};

export interface WaccOppsett {
  rf: number;
  markedspremie: number;
  beta: number;
  E: number;
  D: number;
  rD: number;
  skattesats: number;
}

export interface WaccResultat {
  rE: number;
  rDEtterSkatt: number;
  vektE: number;
  vektD: number;
  wacc: number;
}

/** Hele kjeden fra CAPM til WACC, slik den vises i verktøyet. */
export const byggWacc = (o: WaccOppsett): WaccResultat => {
  const rE = kravCAPM(o.rf, o.beta, o.markedspremie);
  const gjeld = Math.max(o.D, 0);
  const V = o.E + gjeld;
  const vektE = V > 0 ? o.E / V : 1;
  const vektD = 1 - vektE;
  return {
    rE,
    rDEtterSkatt: o.rD * (1 - o.skattesats),
    vektE,
    vektD,
    wacc: wacc({ E: o.E, D: o.D, rE, rD: o.rD, skattesats: o.skattesats }),
  };
};
