/**
 * Børskrakket — spillmotoren.
 *
 * Alt her er rene funksjoner uten React og uten klokke: kursen er en
 * funksjon av tidspunktet t (sekunder siden start), og porteføljen er en
 * verdi som transformeres av kjøp og salg. Det gjør to ting mulig:
 *
 *  1. UI-et kan spørre «hva er kursen NÅ» basert på ekte klokketid
 *     (Date.now() minus starttidspunkt) — hakker nettleseren eller mister
 *     fanen fokus, er markedet fortsatt nøyaktig der det skal være.
 *  2. Motoren kan testes i node uten nettleser.
 */

import {
  BANNER_SEK,
  NYHETER,
  SEKTOR_TIDSLINJER,
  SELSKAPER,
  STARTKAPITAL,
  VARIGHET_SEK,
  type Nyhet,
  type Punkt,
  type Selskap,
} from "@/config/invest-game/spillet";

/* ------------------------------------------------------------------ */
/* Kurs                                                                */
/* ------------------------------------------------------------------ */

/**
 * Multiplikatoren til en tidslinje ved tid t. Cosinus-glatting mellom
 * punktene gjør at bevegelsene starter og slutter mykt i stedet for i
 * knekk — det ser ut som et marked, ikke som en trapp.
 */
export const multiplikator = (tidslinje: Punkt[], t: number): number => {
  if (t <= tidslinje[0].t) return tidslinje[0].v;
  const siste = tidslinje[tidslinje.length - 1];
  if (t >= siste.t) return siste.v;
  for (let i = 1; i < tidslinje.length; i++) {
    if (t <= tidslinje[i].t) {
      const a = tidslinje[i - 1];
      const b = tidslinje[i];
      const u = (t - a.t) / (b.t - a.t);
      const glatt = (1 - Math.cos(Math.PI * u)) / 2;
      return a.v + (b.v - a.v) * glatt;
    }
  }
  return siste.v;
};

/**
 * Liten deterministisk «uro» per selskap, maks ±0,5 %. Stor nok til at
 * grafene lever, alt for liten til å endre hvilken strategi som vinner.
 * Deterministisk (ingen Math.random) slik at alle grupper møter nøyaktig
 * samme marked — ellers ville konkurransen ikke vært rettferdig.
 */
const uro = (selskapIndeks: number, t: number): number => {
  const fase = selskapIndeks * 2.399; // gyllent vinkelsprang — ulik fase per selskap
  return 0.005 * (0.7 * Math.sin(t / 6.3 + fase) + 0.3 * Math.sin(t / 17 + fase * 2));
};

/** Kursen til et selskap ved tid t (sekunder siden spillstart). */
export const kurs = (selskap: Selskap, t: number): number => {
  const klippetT = Math.min(Math.max(t, 0), VARIGHET_SEK);
  const indeks = SELSKAPER.findIndex((s) => s.id === selskap.id);
  const m = multiplikator(SEKTOR_TIDSLINJER[selskap.sektorId], klippetT);
  return selskap.startkurs * m * (1 + uro(indeks, klippetT));
};

/** Prosentvis utvikling siden start. */
export const utviklingPct = (selskap: Selskap, t: number): number =>
  (kurs(selskap, t) / kurs(selskap, 0) - 1) * 100;

/* ------------------------------------------------------------------ */
/* Portefølje                                                          */
/* ------------------------------------------------------------------ */

export interface Post {
  antall: number;
  /** Sum kroner brukt på kjøp i dette selskapet. */
  kjoptFor: number;
  /** Sum kroner mottatt ved salg i dette selskapet. */
  solgtFor: number;
}

export interface Portefolje {
  kontanter: number;
  poster: Record<string, Post>;
}

export const nyPortefolje = (): Portefolje => ({
  kontanter: STARTKAPITAL,
  poster: {},
});

const hentPost = (p: Portefolje, id: string): Post =>
  p.poster[id] ?? { antall: 0, kjoptFor: 0, solgtFor: 0 };

/** Kjøp for et kronebeløp til gjeldende kurs. Beløpet klippes til kontantbeholdningen. */
export const kjop = (p: Portefolje, selskap: Selskap, belop: number, t: number): Portefolje => {
  const faktisk = Math.min(Math.max(belop, 0), p.kontanter);
  if (faktisk <= 0) return p;
  const pris = kurs(selskap, t);
  const post = hentPost(p, selskap.id);
  return {
    kontanter: p.kontanter - faktisk,
    poster: {
      ...p.poster,
      [selskap.id]: {
        antall: post.antall + faktisk / pris,
        kjoptFor: post.kjoptFor + faktisk,
        solgtFor: post.solgtFor,
      },
    },
  };
};

/** Selg en andel (0–1) av beholdningen til gjeldende kurs. */
export const selg = (p: Portefolje, selskap: Selskap, andel: number, t: number): Portefolje => {
  const post = hentPost(p, selskap.id);
  const klippet = Math.min(Math.max(andel, 0), 1);
  if (post.antall <= 0 || klippet <= 0) return p;
  const antallSolgt = post.antall * klippet;
  const belop = antallSolgt * kurs(selskap, t);
  return {
    kontanter: p.kontanter + belop,
    poster: {
      ...p.poster,
      [selskap.id]: {
        // 100 %-salg nulles helt, så flyttall-rester ikke blir stående.
        antall: klippet >= 1 ? 0 : post.antall - antallSolgt,
        kjoptFor: post.kjoptFor,
        solgtFor: post.solgtFor + belop,
      },
    },
  };
};

/** Markedsverdien av aksjene (uten kontanter) ved tid t. */
export const aksjeverdi = (p: Portefolje, t: number): number =>
  SELSKAPER.reduce((sum, s) => sum + (p.poster[s.id]?.antall ?? 0) * kurs(s, t), 0);

/** Total verdi: kontanter pluss aksjer. */
export const totalverdi = (p: Portefolje, t: number): number => p.kontanter + aksjeverdi(p, t);

/** Avkastning i prosent, slik den vises i topplinjen og på resultatskjermen. */
export const avkastningPct = (p: Portefolje, t: number): number =>
  (totalverdi(p, t) / STARTKAPITAL - 1) * 100;

/* ------------------------------------------------------------------ */
/* Resultat                                                            */
/* ------------------------------------------------------------------ */

export interface Investeringsresultat {
  selskap: Selskap;
  /** Gevinst/tap i kroner: mottatt ved salg + verdi ved slutt − brukt på kjøp. */
  gevinst: number;
  /** Gevinsten målt mot beløpet gruppen brukte i selskapet. */
  pct: number;
}

/**
 * Beste og dårligste investering GRUPPEN faktisk gjorde — ikke hvilken
 * aksje som steg mest på børsen. Måles per selskap som alt de fikk ut
 * (salg + sluttverdi) mot alt de puttet inn.
 */
export const investeringsresultater = (p: Portefolje, t: number): Investeringsresultat[] =>
  SELSKAPER.filter((s) => (p.poster[s.id]?.kjoptFor ?? 0) > 0)
    .map((s) => {
      const post = p.poster[s.id];
      const gevinst = post.solgtFor + post.antall * kurs(s, t) - post.kjoptFor;
      return { selskap: s, gevinst, pct: (gevinst / post.kjoptFor) * 100 };
    })
    .sort((a, b) => b.pct - a.pct);

/* ------------------------------------------------------------------ */
/* Nyheter                                                             */
/* ------------------------------------------------------------------ */

/** Nyhetene som er publisert ved tid t, nyeste først. */
export const publiserteNyheter = (t: number): Nyhet[] =>
  NYHETER.filter((n) => n.tidSek <= t).sort((a, b) => b.tidSek - a.tidSek);

/** Nyheten som akkurat nå skal ligge som banner, om noen. */
export const aktivBanner = (t: number): Nyhet | null =>
  NYHETER.find((n) => t >= n.tidSek && t < n.tidSek + BANNER_SEK) ?? null;

/* ------------------------------------------------------------------ */
/* Formatering                                                         */
/* ------------------------------------------------------------------ */

export const formatMill = (kroner: number): string =>
  `${(kroner / 1_000_000).toLocaleString("no-NO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} mill.`;

export const formatKurs = (verdi: number): string =>
  verdi.toLocaleString("no-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatPct = (pct: number): string =>
  `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toLocaleString("no-NO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`;

export const formatTid = (sekIgjen: number): string => {
  const s = Math.max(0, Math.ceil(sekIgjen));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
