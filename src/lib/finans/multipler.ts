/**
 * Verdsettelse med multipler mot sammenlignbare selskaper - kapittel 9.4.
 *
 * Prinsippet: antar at like selskaper prises likt per krone inntjening,
 * og bruker peer-gruppens multippel på vårt selskaps tall. Boka bruker
 * P/E og EV/EBITDA som hovedeksempler (lign. 9.25-9.27) og understreker
 * at spredningen i peer-gruppen sier noe om hvor usikker metoden er.
 */

export interface Peer {
  navn: string;
  pe?: number | null;
  evEbitda?: number | null;
  evEbit?: number | null;
  pb?: number | null;
  ps?: number | null;
}

export interface Selskapstall {
  /** Alt i millioner av samme valuta som kursen. */
  resultat: number | null;
  ebitda: number | null;
  ebit: number | null;
  egenkapital: number | null;
  omsetning: number | null;
  nettoGjeld: number;
  antallAksjer: number;
  aksjekurs: number;
}

export type Multippel = "pe" | "evEbitda" | "evEbit" | "pb" | "ps";

export const MULTIPPEL_NAVN: Record<Multippel, string> = {
  pe: "P/E",
  evEbitda: "EV/EBITDA",
  evEbit: "EV/EBIT",
  pb: "P/B",
  ps: "P/S",
};

export interface MultippelResultat {
  multippel: Multippel;
  navn: string;
  /** Median i peer-gruppen - robust mot én ekstrem peer. */
  median: number;
  gjennomsnitt: number;
  lav: number;
  hoey: number;
  antallPeers: number;
  /** Selskapets egen multippel på dagens kurs. */
  egen: number | null;
  /** Verdi per aksje når peer-medianen brukes på selskapets tall. */
  verdiPerAksje: number | null;
  verdiLav: number | null;
  verdiHoey: number | null;
  oppside: number | null;
}

const median = (x: number[]): number => {
  const s = [...x].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const kvartil = (x: number[], q: number): number => {
  const s = [...x].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
};

/** Verdi per aksje gitt multippel × grunnlag; EV-multipler trekker fra netto gjeld. */
const verdiFra = (m: Multippel, multippel: number, t: Selskapstall): number | null => {
  const grunnlag: Record<Multippel, number | null> = {
    pe: t.resultat,
    evEbitda: t.ebitda,
    evEbit: t.ebit,
    pb: t.egenkapital,
    ps: t.omsetning,
  };
  const g = grunnlag[m];
  if (g === null || g === undefined || !isFinite(g) || g <= 0 || t.antallAksjer <= 0) return null;
  const erEv = m === "evEbitda" || m === "evEbit";
  const egenkapital = erEv ? multippel * g - t.nettoGjeld : multippel * g;
  return egenkapital / t.antallAksjer;
};

/** Selskapets egen multippel på dagens kurs. */
export const egenMultippel = (m: Multippel, t: Selskapstall): number | null => {
  const markedsverdi = t.aksjekurs * t.antallAksjer;
  const ev = markedsverdi + t.nettoGjeld;
  const par: Record<Multippel, [number, number | null]> = {
    pe: [markedsverdi, t.resultat],
    evEbitda: [ev, t.ebitda],
    evEbit: [ev, t.ebit],
    pb: [markedsverdi, t.egenkapital],
    ps: [markedsverdi, t.omsetning],
  };
  const [teller, nevner] = par[m];
  if (nevner === null || !isFinite(nevner) || nevner <= 0) return null;
  return teller / nevner;
};

export const multippelverdsettelse = (peers: Peer[], tall: Selskapstall): MultippelResultat[] => {
  const alle: Multippel[] = ["pe", "evEbitda", "evEbit", "pb", "ps"];
  return alle
    .map((m) => {
      const verdier = peers
        .map((p) => p[m])
        .filter((v): v is number => typeof v === "number" && isFinite(v) && v > 0);
      if (verdier.length === 0) return null;
      const med = median(verdier);
      const lav = kvartil(verdier, 0.25);
      const hoey = kvartil(verdier, 0.75);
      const verdiPerAksje = verdiFra(m, med, tall);
      return {
        multippel: m,
        navn: MULTIPPEL_NAVN[m],
        median: med,
        gjennomsnitt: verdier.reduce((s, v) => s + v, 0) / verdier.length,
        lav,
        hoey,
        antallPeers: verdier.length,
        egen: egenMultippel(m, tall),
        verdiPerAksje,
        verdiLav: verdiFra(m, lav, tall),
        verdiHoey: verdiFra(m, hoey, tall),
        oppside: verdiPerAksje !== null && tall.aksjekurs > 0 ? verdiPerAksje / tall.aksjekurs - 1 : null,
      } satisfies MultippelResultat;
    })
    .filter((r): r is MultippelResultat => r !== null);
};
