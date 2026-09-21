/**
 * Utbyttemodeller og totalutbetalingsmodellen - kapittel 9.1-9.3.
 *
 *   Gordon:        P_0 = Div_1 / (r_E - g)                           (lign. 9.6)
 *   Flerfase:      P_0 = sum Div_t/(1+r_E)^t + P_N/(1+r_E)^N,  P_N = Div_{N+1}/(r_E - g)   (lign. 9.13)
 *   Total payout:  P_0 = PV(utbytte + tilbakekjøp) / Aksjer_0        (lign. 9.16)
 */

export interface GordonInput {
  /** Utbytte per aksje forventet om ett år (Div_1). */
  utbytteNesteAar: number;
  rE: number;
  vekst: number;
  aksjekurs: number;
}

export interface UtbytteResultat {
  verdiPerAksje: number;
  oppside: number;
  /** Avkastning markedet priser inn: Div_1/P_0 + g, lign. 9.7. */
  implisittKrav: number;
  gyldig: boolean;
  feil?: string;
}

export const gordon = (inn: GordonInput): UtbytteResultat => {
  const gyldig = inn.rE > inn.vekst && inn.utbytteNesteAar >= 0;
  const verdi = gyldig ? inn.utbytteNesteAar / (inn.rE - inn.vekst) : NaN;
  return {
    verdiPerAksje: verdi,
    oppside: inn.aksjekurs > 0 ? verdi / inn.aksjekurs - 1 : NaN,
    implisittKrav: inn.aksjekurs > 0 ? inn.utbytteNesteAar / inn.aksjekurs + inn.vekst : NaN,
    gyldig,
    feil: gyldig ? undefined : "Avkastningskravet må være høyere enn utbytteveksten.",
  };
};

export interface FlerfaseInput {
  /** Utbytte per aksje i dag (Div_0). */
  utbytteIDag: number;
  /** Vekst i hver av de eksplisitte årene. */
  vekstFase1: number[];
  /** Evig vekst etter fase 1. */
  vekstEvig: number;
  rE: number;
  aksjekurs: number;
}

export interface FlerfaseResultat extends UtbytteResultat {
  utbytter: { aar: number; utbytte: number; pv: number }[];
  terminalverdi: number;
  pvTerminalverdi: number;
}

export const flerfaseDDM = (inn: FlerfaseInput): FlerfaseResultat => {
  const gyldig = inn.rE > inn.vekstEvig;
  let div = inn.utbytteIDag;
  let sum = 0;
  const utbytter: FlerfaseResultat["utbytter"] = [];
  inn.vekstFase1.forEach((g, i) => {
    div = div * (1 + g);
    const pv = div / Math.pow(1 + inn.rE, i + 1);
    sum += pv;
    utbytter.push({ aar: i + 1, utbytte: div, pv });
  });
  const n = inn.vekstFase1.length;
  const terminalverdi = gyldig ? (div * (1 + inn.vekstEvig)) / (inn.rE - inn.vekstEvig) : NaN;
  const pvTerminalverdi = terminalverdi / Math.pow(1 + inn.rE, n);
  const verdi = sum + pvTerminalverdi;
  return {
    utbytter,
    terminalverdi,
    pvTerminalverdi,
    verdiPerAksje: verdi,
    oppside: inn.aksjekurs > 0 ? verdi / inn.aksjekurs - 1 : NaN,
    implisittKrav: NaN,
    gyldig,
    feil: gyldig ? undefined : "Avkastningskravet må være høyere enn den evige veksten.",
  };
};

export interface TotalPayoutInput {
  /** Samlet utbytte + tilbakekjøp forventet neste år (millioner). */
  totalUtbetalingNesteAar: number;
  rE: number;
  vekst: number;
  /** Aksjer i dag (millioner). */
  antallAksjer: number;
  aksjekurs: number;
}

/** Totalutbetalingsmodellen, lign. 9.16 - verdsetter hele egenkapitalen og deler på dagens aksjer. */
export const totalPayout = (inn: TotalPayoutInput): UtbytteResultat & { egenkapitalverdi: number } => {
  const gyldig = inn.rE > inn.vekst && inn.antallAksjer > 0;
  const egenkapitalverdi = gyldig ? inn.totalUtbetalingNesteAar / (inn.rE - inn.vekst) : NaN;
  const verdi = egenkapitalverdi / inn.antallAksjer;
  return {
    egenkapitalverdi,
    verdiPerAksje: verdi,
    oppside: inn.aksjekurs > 0 ? verdi / inn.aksjekurs - 1 : NaN,
    implisittKrav: NaN,
    gyldig,
    feil: gyldig ? undefined : "Avkastningskravet må være høyere enn veksten, og aksjer må være > 0.",
  };
};

/**
 * Bærekraftig vekst fra regnskapet: g = tilbakeholdt andel × ROE (lign. 9.12).
 * Godt utgangspunkt for utbyttevekst når selskapet ikke gir guiding.
 */
export const baerekraftigVekst = (utbytteandel: number, roe: number): number =>
  (1 - utbytteandel) * roe;
