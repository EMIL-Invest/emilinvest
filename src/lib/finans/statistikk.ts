/**
 * Statistikk for avkastningsserier - kapittel 10 og 12 i Berk & DeMarzo.
 *
 * Alle funksjoner er rene og tar tall inn / gir tall ut, så de kan testes
 * uten nettleser eller database. Avkastninger er desimaltall (0.05 = 5 %).
 */

/** Antall perioder per år for annualisering. */
export const PERIODER_PER_AAR = { daglig: 252, ukentlig: 52, maanedlig: 12 } as const;
export type Frekvens = keyof typeof PERIODER_PER_AAR;

/** Realisert avkastning per periode: R_t = P_t / P_{t-1} - 1 (lign. 10.4 uten utbytte). */
export const avkastninger = (priser: number[]): number[] => {
  const ut: number[] = [];
  for (let i = 1; i < priser.length; i++) {
    const forrige = priser[i - 1];
    const naa = priser[i];
    if (forrige > 0 && isFinite(forrige) && isFinite(naa)) ut.push(naa / forrige - 1);
    else ut.push(NaN);
  }
  return ut;
};

export const gjennomsnitt = (x: number[]): number => {
  const g = x.filter(isFinite);
  if (g.length === 0) return NaN;
  return g.reduce((s, v) => s + v, 0) / g.length;
};

/** Utvalgsvarians (deler på T - 1), lign. 10.7. */
export const varians = (x: number[]): number => {
  const g = x.filter(isFinite);
  if (g.length < 2) return NaN;
  const m = gjennomsnitt(g);
  return g.reduce((s, v) => s + (v - m) ** 2, 0) / (g.length - 1);
};

export const standardavvik = (x: number[]): number => Math.sqrt(varians(x));

/** Standardfeil for gjennomsnittet: SD / sqrt(T), lign. 10.8. */
export const standardfeil = (x: number[]): number => {
  const g = x.filter(isFinite);
  return g.length < 2 ? NaN : standardavvik(g) / Math.sqrt(g.length);
};

/** Parvis kovarians - bruker bare perioder der begge har tall. */
export const kovarians = (x: number[], y: number[]): number => {
  const n = Math.min(x.length, y.length);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    if (isFinite(x[i]) && isFinite(y[i])) {
      xs.push(x[i]);
      ys.push(y[i]);
    }
  }
  if (xs.length < 2) return NaN;
  const mx = gjennomsnitt(xs);
  const my = gjennomsnitt(ys);
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += (xs[i] - mx) * (ys[i] - my);
  return s / (xs.length - 1);
};

export const korrelasjon = (x: number[], y: number[]): number => {
  const c = kovarians(x, y);
  const sx = standardavvik(x);
  const sy = standardavvik(y);
  if (!isFinite(c) || sx === 0 || sy === 0) return NaN;
  return c / (sx * sy);
};

/** Forventet avkastning annualiseres lineært (aritmetisk snitt × perioder). */
export const annualiserAvkastning = (perPeriode: number, frekvens: Frekvens): number =>
  perPeriode * PERIODER_PER_AAR[frekvens];

/** Volatilitet annualiseres med kvadratroten av antall perioder. */
export const annualiserVolatilitet = (perPeriode: number, frekvens: Frekvens): number =>
  perPeriode * Math.sqrt(PERIODER_PER_AAR[frekvens]);

export const annualiserKovarians = (perPeriode: number, frekvens: Frekvens): number =>
  perPeriode * PERIODER_PER_AAR[frekvens];

export interface Regresjon {
  /** Beta: Cov(R_i, R_m) / Var(R_m), lign. 12.5. */
  beta: number;
  /** Skjæringspunkt per periode (Jensens alfa når begge er meravkastning). */
  alfa: number;
  /** Forklaringsgrad - andelen av variasjonen som er systematisk. */
  r2: number;
  /** Standardfeil på beta-estimatet. */
  betaStandardfeil: number;
  antall: number;
}

/**
 * Lineær regresjon av aksjens (mer)avkastning på markedets, kapittel 12.3.
 * Bruk gjerne meravkastning (R - r_f) på begge sider, slik boka gjør, men
 * beta blir praktisk talt den samme med rå avkastning når r_f er stabil.
 */
export const regresjon = (aksje: number[], marked: number[]): Regresjon => {
  const n = Math.min(aksje.length, marked.length);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    if (isFinite(aksje[i]) && isFinite(marked[i])) {
      xs.push(marked[i]);
      ys.push(aksje[i]);
    }
  }
  if (xs.length < 3) return { beta: NaN, alfa: NaN, r2: NaN, betaStandardfeil: NaN, antall: xs.length };
  const varM = varians(xs);
  const beta = kovarians(ys, xs) / varM;
  const alfa = gjennomsnitt(ys) - beta * gjennomsnitt(xs);
  let ssRes = 0;
  let ssTot = 0;
  const my = gjennomsnitt(ys);
  for (let i = 0; i < xs.length; i++) {
    const pred = alfa + beta * xs[i];
    ssRes += (ys[i] - pred) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  const r2 = ssTot === 0 ? NaN : 1 - ssRes / ssTot;
  const sigma2 = ssRes / (xs.length - 2);
  const betaStandardfeil = Math.sqrt(sigma2 / (varM * (xs.length - 1)));
  return { beta, alfa, r2, betaStandardfeil, antall: xs.length };
};

/**
 * Justert beta slik Bloomberg gjør det (omtalt i kap. 12.3): trekker
 * estimatet en tredjedel mot 1, fordi historiske betaer har målefeil og
 * tenderer mot markedet over tid.
 */
export const justertBeta = (raaBeta: number): number => (2 / 3) * raaBeta + 1 / 3;

export interface Kurspunkt {
  /** ISO-dato, f.eks. 2026-09-14 */
  dato: string;
  kurs: number;
}

/**
 * Legger flere kursserier på samme tidsakse. Serier fra ulike børser kan
 * ha ulike datoer i samme uke (helligdager, tidssoner), så vi grupperer på
 * en nøkkel: ISO-uke for ukentlige data, måned for månedlige og eksakt dato
 * for daglige. Perioder der noen mangler, kastes - da er kovariansene
 * regnet på identiske tidsvinduer, slik boka forutsetter.
 */
export const juster = (
  serier: Record<string, Kurspunkt[]>,
  frekvens: Frekvens,
): { noekler: string[]; kurser: Record<string, number[]> } => {
  const noekkel = (dato: string): string => {
    const d = new Date(dato + "T00:00:00Z");
    if (frekvens === "maanedlig") return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (frekvens === "ukentlig") {
      const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      const dag = t.getUTCDay() || 7;
      t.setUTCDate(t.getUTCDate() + 4 - dag);
      const aarStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
      const uke = Math.ceil(((t.getTime() - aarStart.getTime()) / 86400000 + 1) / 7);
      return `${t.getUTCFullYear()}-U${String(uke).padStart(2, "0")}`;
    }
    return dato;
  };

  const tickere = Object.keys(serier);
  const perTicker: Record<string, Map<string, number>> = {};
  for (const t of tickere) {
    const m = new Map<string, number>();
    for (const p of serier[t]) if (isFinite(p.kurs) && p.kurs > 0) m.set(noekkel(p.dato), p.kurs); // siste kurs i perioden vinner
    perTicker[t] = m;
  }
  if (tickere.length === 0) return { noekler: [], kurser: {} };
  let felles = [...perTicker[tickere[0]].keys()];
  for (const t of tickere.slice(1)) felles = felles.filter((k) => perTicker[t].has(k));
  felles.sort();
  const kurser: Record<string, number[]> = {};
  for (const t of tickere) kurser[t] = felles.map((k) => perTicker[t].get(k) as number);
  return { noekler: felles, kurser };
};

/** Kovariansmatrise (per periode) for et sett avkastningsserier, i gitt rekkefølge. */
export const kovariansmatrise = (serier: number[][]): number[][] =>
  serier.map((a) => serier.map((b) => kovarians(a, b)));

export const korrelasjonsmatrise = (serier: number[][]): number[][] =>
  serier.map((a) => serier.map((b) => korrelasjon(a, b)));
