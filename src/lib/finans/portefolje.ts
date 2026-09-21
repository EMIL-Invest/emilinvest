/**
 * Porteføljeteori - kapittel 11 i Berk & DeMarzo.
 *
 *   E[R_P]   = sum x_i E[R_i]                                 (lign. 11.3)
 *   Var(R_P) = sum_i sum_j x_i x_j Cov(R_i, R_j)              (lign. 11.9)
 *   Sharpe   = (E[R_P] - r_f) / SD(R_P)                       (kap. 11.5)
 *   beta_P   = sum x_i beta_i
 *   Var(R_P) = beta_P^2 Var(R_Mkt) + Var(epsilon)   - systematisk + selskapsspesifikk
 *
 * Optimeringene (effisient front, tangentportefølje) løses numerisk med
 * projisert gradient på simplekset (bare lange posisjoner) - det er
 * situasjonen komiteen faktisk er i. Den analytiske løsningen med shorting
 * (kap. 11.5) ligger også her, mest for testing og sammenligning.
 */

/* ----------------------------- lineær algebra ---------------------------- */

export const matVek = (A: number[][], x: number[]): number[] =>
  A.map((rad) => rad.reduce((s, a, j) => s + a * x[j], 0));

export const prikk = (a: number[], b: number[]): number => a.reduce((s, v, i) => s + v * b[i], 0);

/** Gauss-Jordan med delvis pivotering. Kaster hvis matrisen er singulær. */
export const inverter = (A: number[][]): number[][] => {
  const n = A.length;
  const M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    if (Math.abs(M[p][k]) < 1e-12) throw new Error("Kovariansmatrisen er singulær");
    [M[k], M[p]] = [M[p], M[k]];
    const piv = M[k][k];
    for (let j = 0; j < 2 * n; j++) M[k][j] /= piv;
    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const f = M[i][k];
      if (f !== 0) for (let j = 0; j < 2 * n; j++) M[i][j] -= f * M[k][j];
    }
  }
  return M.map((r) => r.slice(n));
};

/* ------------------------------ nøkkeltall -------------------------------- */

export interface PortefoljeNokkeltall {
  forventetAvkastning: number;
  varians: number;
  volatilitet: number;
  sharpe: number;
}

export const portefoljeNokkeltall = (
  vekter: number[],
  forventet: number[],
  kov: number[][],
  rf: number,
): PortefoljeNokkeltall => {
  const mu = prikk(vekter, forventet);
  const varians = prikk(vekter, matVek(kov, vekter));
  const vol = Math.sqrt(Math.max(varians, 0));
  return { forventetAvkastning: mu, varians, volatilitet: vol, sharpe: vol > 0 ? (mu - rf) / vol : NaN };
};

export interface Risikodekomponering {
  betaPortefolje: number;
  variansTotal: number;
  variansSystematisk: number;
  variansSelskapsspesifikk: number;
  /** Andel av variansen som er systematisk (kan ikke diversifiseres bort). */
  andelSystematisk: number;
  /** Vektet snitt av enkeltaksjenes volatilitet - det man «ville hatt» uten diversifisering. */
  vektetSnittVolatilitet: number;
  volatilitet: number;
  /** 1 - vol_P / vektet snitt: hvor mye risiko diversifiseringen fjerner. */
  diversifiseringsgevinst: number;
  /** Hver aksjes andel av porteføljens varians: x_i × Cov(R_i, R_P) / Var(R_P). Summerer til 1. */
  risikobidrag: number[];
}

export const dekomponerRisiko = (
  vekter: number[],
  kov: number[][],
  betaer: number[],
  variansMarked: number,
): Risikodekomponering => {
  const sigmaW = matVek(kov, vekter);
  const variansTotal = prikk(vekter, sigmaW);
  const betaP = prikk(vekter, betaer);
  const systematisk = betaP * betaP * variansMarked;
  const vol = Math.sqrt(Math.max(variansTotal, 0));
  const vektetSnitt = vekter.reduce((s, w, i) => s + w * Math.sqrt(Math.max(kov[i][i], 0)), 0);
  return {
    betaPortefolje: betaP,
    variansTotal,
    variansSystematisk: Math.min(systematisk, variansTotal),
    variansSelskapsspesifikk: Math.max(variansTotal - systematisk, 0),
    andelSystematisk: variansTotal > 0 ? Math.min(systematisk / variansTotal, 1) : NaN,
    vektetSnittVolatilitet: vektetSnitt,
    volatilitet: vol,
    diversifiseringsgevinst: vektetSnitt > 0 ? 1 - vol / vektetSnitt : NaN,
    risikobidrag: vekter.map((w, i) => (variansTotal > 0 ? (w * sigmaW[i]) / variansTotal : NaN)),
  };
};

/* ------------------------------- optimering ------------------------------- */

/** Projeksjon på simplekset {w >= 0, sum w = 1} (Duchi m.fl. 2008). */
export const projiserSimpleks = (v: number[]): number[] => {
  const n = v.length;
  const u = [...v].sort((a, b) => b - a);
  let sum = 0;
  let rho = 0;
  let theta = 0;
  for (let i = 0; i < n; i++) {
    sum += u[i];
    const t = (sum - 1) / (i + 1);
    if (u[i] - t > 0) {
      rho = i;
      theta = t;
    }
  }
  void rho;
  return v.map((x) => Math.max(x - theta, 0));
};

const normaliser = (w: number[]): number[] => {
  const s = w.reduce((a, b) => a + b, 0);
  return s === 0 ? w : w.map((x) => x / s);
};

/**
 * Minimer wᵀΣw gitt sum w = 1, w >= 0 og (valgfritt) μᵀw = mål.
 * Målet håndteres med en kvadratisk straff som skrus opp gradvis.
 */
export const minVariansLangKun = (
  kov: number[][],
  forventet?: number[],
  maal?: number,
  start?: number[],
): number[] => {
  const n = kov.length;
  let w = start ? projiserSimpleks(start) : Array(n).fill(1 / n);
  const skala = Math.max(...kov.map((r, i) => Math.abs(r[i])), 1e-8);
  for (const lambda of [10, 100, 1000, 10000, 100000]) {
    let steg = 0.5 / (skala * (1 + lambda * (forventet ? Math.max(...forventet.map(Math.abs)) ** 2 : 0)) + 1e-12);
    for (let it = 0; it < 4000; it++) {
      const grad = matVek(kov, w).map((g) => 2 * g);
      if (forventet && maal !== undefined) {
        const avvik = prikk(forventet, w) - maal;
        for (let i = 0; i < n; i++) grad[i] += 2 * lambda * avvik * forventet[i] * skala;
      }
      const ny = projiserSimpleks(w.map((x, i) => x - steg * grad[i]));
      const endring = Math.sqrt(ny.reduce((s, x, i) => s + (x - w[i]) ** 2, 0));
      w = ny;
      if (endring < 1e-10) break;
      if (it % 500 === 499) steg *= 0.7;
    }
  }
  return w;
};

/** Maksimer Sharpe på simplekset med projisert gradient og flere startpunkter. */
export const tangentLangKun = (forventet: number[], kov: number[][], rf: number): number[] => {
  const n = forventet.length;
  const sharpe = (w: number[]) => {
    const { sharpe: s } = portefoljeNokkeltall(w, forventet, kov, rf);
    return isFinite(s) ? s : -Infinity;
  };
  const starter: number[][] = [Array(n).fill(1 / n), minVariansLangKun(kov)];
  const beste = forventet.indexOf(Math.max(...forventet));
  starter.push(Array.from({ length: n }, (_, i) => (i === beste ? 1 : 0)));
  let bestW = starter[0];
  let bestS = sharpe(bestW);
  for (const s0 of starter) {
    let w = projiserSimpleks(s0);
    let steg = 0.05;
    for (let it = 0; it < 6000; it++) {
      const sw = matVek(kov, w);
      const mu = prikk(forventet, w) - rf;
      const sigma = Math.sqrt(Math.max(prikk(w, sw), 1e-16));
      const grad = forventet.map((m, i) => m / sigma - (mu * sw[i]) / sigma ** 3);
      const ny = projiserSimpleks(w.map((x, i) => x + steg * grad[i]));
      if (sharpe(ny) >= sharpe(w) - 1e-12) {
        const endring = Math.sqrt(ny.reduce((s, x, i) => s + (x - w[i]) ** 2, 0));
        w = ny;
        if (endring < 1e-11) break;
      } else {
        steg *= 0.5;
        if (steg < 1e-9) break;
      }
    }
    const s = sharpe(w);
    if (s > bestS) {
      bestS = s;
      bestW = w;
    }
  }
  return bestW;
};

/** Analytisk tangentportefølje med shorting tillatt: w ∝ Σ⁻¹(μ - r_f). */
export const tangentMedShorting = (forventet: number[], kov: number[][], rf: number): number[] =>
  normaliser(matVek(inverter(kov), forventet.map((m) => m - rf)));

/** Analytisk minimum-variansportefølje med shorting: w ∝ Σ⁻¹ 1. */
export const minVariansMedShorting = (kov: number[][]): number[] =>
  normaliser(matVek(inverter(kov), Array(kov.length).fill(1)));

export interface Frontpunkt {
  forventetAvkastning: number;
  volatilitet: number;
  vekter: number[];
}

/**
 * Effisient front for bare lange posisjoner: fra minimum-varians-
 * porteføljen opp til aksjen med høyest forventet avkastning.
 */
export const effisientFrontLangKun = (
  forventet: number[],
  kov: number[][],
  antallPunkter = 25,
): Frontpunkt[] => {
  const wMin = minVariansLangKun(kov);
  const muMin = prikk(wMin, forventet);
  const muMaks = Math.max(...forventet);
  const punkter: Frontpunkt[] = [];
  let forrige = wMin;
  for (let k = 0; k < antallPunkter; k++) {
    const maal = muMin + ((muMaks - muMin) * k) / (antallPunkter - 1);
    const w =
      k === 0
        ? wMin
        : k === antallPunkter - 1
          ? forventet.map((m) => (m === muMaks ? 1 : 0)) // endepunktet er aksjen med høyest forventet avkastning
          : minVariansLangKun(kov, forventet, maal, forrige);
    forrige = w;
    const n = portefoljeNokkeltall(w, forventet, kov, 0);
    punkter.push({ forventetAvkastning: n.forventetAvkastning, volatilitet: n.volatilitet, vekter: w });
  }
  // Fjern eventuelle punkter som ikke er effisiente (lavere avkastning ved høyere vol).
  const ut: Frontpunkt[] = [];
  for (const p of punkter) {
    if (ut.length === 0 || p.volatilitet >= ut[ut.length - 1].volatilitet - 1e-9) ut.push(p);
  }
  return ut;
};

/** Effisient front med shorting - to-fonds-teoremet: kombinasjoner av minvar og tangent. */
export const effisientFrontMedShorting = (
  forventet: number[],
  kov: number[][],
  rf: number,
  antallPunkter = 40,
): Frontpunkt[] => {
  const a = minVariansMedShorting(kov);
  const b = tangentMedShorting(forventet, kov, rf);
  const punkter: Frontpunkt[] = [];
  for (let k = 0; k < antallPunkter; k++) {
    const t = -0.5 + (2.5 * k) / (antallPunkter - 1);
    const w = a.map((x, i) => (1 - t) * x + t * b[i]);
    const n = portefoljeNokkeltall(w, forventet, kov, rf);
    punkter.push({ forventetAvkastning: n.forventetAvkastning, volatilitet: n.volatilitet, vekter: w });
  }
  return punkter.sort((p, q) => p.volatilitet - q.volatilitet);
};

/**
 * Nødvendig avkastning for at en aksje skal forbedre porteføljen:
 * r_i = r_f + beta_i^P (E[R_P] - r_f), lign. 11.19. beta_i^P = Cov(R_i,R_P)/Var(R_P).
 * Positiv differanse (E[R_i] - r_i) = kjøp mer, negativ = selg (kap. 11.6).
 */
export const kravMotPortefolje = (
  vekter: number[],
  forventet: number[],
  kov: number[][],
  rf: number,
): { betaMotPortefolje: number[]; krav: number[]; differanse: number[] } => {
  const sw = matVek(kov, vekter);
  const varP = prikk(vekter, sw);
  const muP = prikk(vekter, forventet);
  const betaMotPortefolje = sw.map((c) => (varP > 0 ? c / varP : NaN));
  const krav = betaMotPortefolje.map((b) => rf + b * (muP - rf));
  return { betaMotPortefolje, krav, differanse: forventet.map((m, i) => m - krav[i]) };
};
