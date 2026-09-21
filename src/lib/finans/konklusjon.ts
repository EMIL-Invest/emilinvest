/**
 * Fra tall til konklusjon. Her ligger reglene som oversetter modellene til
 * «underpriset / rimelig priset / overpriset» og til setninger komiteen kan
 * lese uten å ha hatt faget. Terskler er bevisst konservative: en DCF har
 * stor usikkerhet (kap. 9.5 og 19.5), så små avvik fra kursen er støy.
 */

export type Anbefaling = "kjop" | "hold" | "selg";

export interface Metodeverdi {
  metode: string;
  /** Sentralt estimat for verdi per aksje. */
  verdi: number;
  /** Nedre og øvre anslag (scenario/kvartiler), for «fotballbanen». */
  lav?: number;
  hoey?: number;
  /** Vekt i det samlede estimatet. Null-vekt vises men teller ikke. */
  vekt: number;
}

export interface Samletvurdering {
  /** Vektet snitt av metodene med vekt > 0. */
  sentralverdi: number;
  lav: number;
  hoey: number;
  oppside: number;
  anbefaling: Anbefaling;
  /** Sikkerhetsmargin: hvor mye kursen ligger under sentralverdien, (V - P)/V. */
  sikkerhetsmargin: number;
  /** Hvor mange av metodene som peker samme vei som konklusjonen. */
  enighet: { antall: number; av: number };
}

export interface Terskler {
  /** Oppside over dette = kjøp. */
  kjop: number;
  /** Oppside under dette (negativt) = selg. */
  selg: number;
}

export const STANDARD_TERSKLER: Terskler = { kjop: 0.15, selg: -0.1 };

export const vurder = (
  metoder: Metodeverdi[],
  aksjekurs: number,
  terskler: Terskler = STANDARD_TERSKLER,
): Samletvurdering | null => {
  const brukte = metoder.filter((m) => m.vekt > 0 && isFinite(m.verdi) && m.verdi > 0);
  if (brukte.length === 0 || !(aksjekurs > 0)) return null;
  const sumVekt = brukte.reduce((s, m) => s + m.vekt, 0);
  const sentral = brukte.reduce((s, m) => s + (m.vekt / sumVekt) * m.verdi, 0);
  const lav = Math.min(...brukte.map((m) => (isFinite(m.lav ?? NaN) ? (m.lav as number) : m.verdi)));
  const hoey = Math.max(...brukte.map((m) => (isFinite(m.hoey ?? NaN) ? (m.hoey as number) : m.verdi)));
  const oppside = sentral / aksjekurs - 1;
  const anbefaling: Anbefaling = oppside >= terskler.kjop ? "kjop" : oppside <= terskler.selg ? "selg" : "hold";
  const retning = (v: number): Anbefaling => {
    const o = v / aksjekurs - 1;
    return o >= terskler.kjop ? "kjop" : o <= terskler.selg ? "selg" : "hold";
  };
  const enige = brukte.filter((m) => retning(m.verdi) === anbefaling).length;
  return {
    sentralverdi: sentral,
    lav,
    hoey,
    oppside,
    anbefaling,
    sikkerhetsmargin: sentral > 0 ? 1 - aksjekurs / sentral : NaN,
    enighet: { antall: enige, av: brukte.length },
  };
};

export const ANBEFALING_TEKST: Record<Anbefaling, { tittel: string; kort: string }> = {
  kjop: { tittel: "Underpriset", kort: "Modellene sier aksjen er verdt mer enn den koster." },
  hold: { tittel: "Rimelig priset", kort: "Kursen ligger nær det modellene mener aksjen er verdt." },
  selg: { tittel: "Overpriset", kort: "Modellene sier aksjen koster mer enn den er verdt." },
};

export const prosent = (v: number | null | undefined, desimaler = 1): string =>
  v === null || v === undefined || !isFinite(v)
    ? "-"
    : `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toLocaleString("no-NO", {
        minimumFractionDigits: desimaler,
        maximumFractionDigits: desimaler,
      })} %`;

/** Prosent uten fortegn for satser (WACC 8,2 %). */
export const sats = (v: number | null | undefined, desimaler = 1): string =>
  v === null || v === undefined || !isFinite(v)
    ? "-"
    : `${(v * 100).toLocaleString("no-NO", { minimumFractionDigits: desimaler, maximumFractionDigits: desimaler })} %`;

export const tall = (v: number | null | undefined, desimaler = 0): string =>
  v === null || v === undefined || !isFinite(v)
    ? "-"
    : v.toLocaleString("no-NO", { minimumFractionDigits: desimaler, maximumFractionDigits: desimaler });

export const beloep = (v: number | null | undefined, valuta = "", desimaler = 0): string => {
  const t = tall(v, desimaler);
  return t === "-" ? t : valuta ? `${t} ${valuta}` : t;
};

/**
 * Klarspråk-forklaring av det samlede resultatet, til presentasjonsvisningen.
 * Returnerer korte setninger - én per poeng - så de kan vises som avsnitt.
 */
export const forklarVurdering = (v: Samletvurdering, aksjekurs: number, valuta: string): string[] => {
  const ut: string[] = [];
  const retning = v.oppside >= 0 ? "over" : "under";
  ut.push(
    `Vi anslår at aksjen er verdt rundt ${beloep(v.sentralverdi, valuta, 0)}. Den handles til ${beloep(aksjekurs, valuta, 0)} - anslaget vårt ligger ${prosent(Math.abs(v.oppside)).replace(/^[+−]/, "")} ${retning} dagens kurs.`,
  );
  if (v.enighet.av > 1) {
    ut.push(
      v.enighet.antall === v.enighet.av
        ? `Alle ${v.enighet.av} metodene peker samme vei - det styrker konklusjonen.`
        : `${v.enighet.antall} av ${v.enighet.av} metoder peker samme vei. Uenighet mellom metodene betyr at estimatet er mer usikkert.`,
    );
  }
  if (v.anbefaling === "kjop") {
    ut.push(
      `Sikkerhetsmarginen er ${sats(v.sikkerhetsmargin)}: selv om anslaget vårt skulle være så mye for høyt, betaler vi ikke mer enn aksjen er verdt.`,
    );
  } else if (v.anbefaling === "selg") {
    ut.push("Kursen ligger over det vi klarer å forsvare med tallene. Markedet venter seg mer vekst eller lavere risiko enn vi legger til grunn.");
  } else {
    ut.push("Avviket er mindre enn den usikkerheten en slik modell har. Da er det ikke grunnlag for å si at markedet tar feil.");
  }
  ut.push(`Spennet mellom det laveste og høyeste anslaget er ${beloep(v.lav, valuta, 0)} - ${beloep(v.hoey, valuta, 0)}. Så stor er usikkerheten i verdsettelsen.`);
  return ut;
};
