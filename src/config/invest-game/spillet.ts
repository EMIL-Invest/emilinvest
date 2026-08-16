/**
 * Børskrakket — all konfigurasjon for femminutterskonkurransen.
 *
 * ALT som styrer spilløpet ligger i denne fila: selskapene, hvordan hver
 * sektor beveger seg gjennom de fem minuttene, og nyhetene. Komponentene
 * leser bare herfra — vil du rebalansere spillet før et arrangement,
 * endrer du tall her og lar resten av koden være.
 *
 * Slik leses en tidslinje: en liste av punkter {t, v} der t er sekunder
 * siden start og v er kursmultiplikator (1.00 = startkurs). Mellom
 * punktene glattes kursen med en cosinus-kurve, så bevegelsene ser
 * organiske ut. Hver tidslinje MÅ starte på {t: 0, v: 1} og slutte på
 * t = VARIGHET_SEK.
 *
 * Balansen er bevisst: en gruppe som fordeler likt på alt og sover,
 * ender rundt +8 %. En gruppe som følger nyhetene og flytter pengene,
 * kan hente langt mer. Nyheten kommer alltid 2–5 sekunder FØR bevegelsen
 * starter, så det går an å reagere.
 */

export const VARIGHET_SEK = 300;
export const STARTKAPITAL = 100_000_000;
/** Hvor lenge en nyhet ligger som banner før den bare finnes i feeden. */
export const BANNER_SEK = 10;

export type SektorId =
  | "teknologi"
  | "energi"
  | "forsvar"
  | "sjomat"
  | "eiendom"
  | "fornybar"
  | "helse"
  | "finans"
  | "romfart"
  | "krypto";

export interface Punkt {
  /** Sekunder siden spillstart */
  t: number;
  /** Kursmultiplikator, 1.00 = startkurs */
  v: number;
}

export interface Selskap {
  id: string;
  navn: string;
  sektorId: SektorId;
  sektorNavn: string;
  startkurs: number;
}

export interface Nyhet {
  /** Sekunder siden spillstart. Skal ligge like FØR kursbevegelsen. */
  tidSek: number;
  tittel: string;
  tekst: string;
  /** Én setning om hva dette sannsynligvis betyr for markedet. */
  konsekvens: string;
  retning: "opp" | "ned" | "blandet";
}

/* ------------------------------------------------------------------ */
/* Sektorenes forhåndsprogrammerte utvikling                           */
/* ------------------------------------------------------------------ */

export const SEKTOR_TIDSLINJER: Record<SektorId, Punkt[]> = {
  // Rolig start, kraftig opp etter AI-nyheten (35 s), korreksjon på slutten.
  teknologi: [
    { t: 0, v: 1.0 },
    { t: 30, v: 1.01 },
    { t: 40, v: 1.03 },
    { t: 70, v: 1.16 },
    { t: 100, v: 1.32 },
    { t: 130, v: 1.44 },
    { t: 190, v: 1.4 },
    { t: 235, v: 1.43 },
    { t: 262, v: 1.41 },
    { t: 278, v: 1.28 },
    { t: 300, v: 1.22 },
  ],
  // Liten oppgang først, stort fall etter oljefunn-nyheten (70 s).
  energi: [
    { t: 0, v: 1.0 },
    { t: 40, v: 1.04 },
    { t: 72, v: 1.06 },
    { t: 90, v: 0.95 },
    { t: 115, v: 0.84 },
    { t: 145, v: 0.81 },
    { t: 220, v: 0.83 },
    { t: 300, v: 0.79 },
  ],
  // Stabilt, så kraftig og vedvarende opp etter budsjettnyheten (105 s).
  forsvar: [
    { t: 0, v: 1.0 },
    { t: 60, v: 1.01 },
    { t: 100, v: 1.02 },
    { t: 108, v: 1.03 },
    { t: 130, v: 1.18 },
    { t: 170, v: 1.32 },
    { t: 210, v: 1.38 },
    { t: 300, v: 1.44 },
  ],
  // Jevnt pent helt til sykdomsnyheten (180 s) — så rett ned.
  sjomat: [
    { t: 0, v: 1.0 },
    { t: 60, v: 1.03 },
    { t: 120, v: 1.07 },
    { t: 182, v: 1.1 },
    { t: 200, v: 0.88 },
    { t: 225, v: 0.74 },
    { t: 260, v: 0.71 },
    { t: 300, v: 0.7 },
  ],
  // Moderat opp, faller etter renteøkningen (140 s).
  eiendom: [
    { t: 0, v: 1.0 },
    { t: 60, v: 1.04 },
    { t: 120, v: 1.07 },
    { t: 142, v: 1.08 },
    { t: 165, v: 0.97 },
    { t: 195, v: 0.89 },
    { t: 240, v: 0.87 },
    { t: 300, v: 0.86 },
  ],
  // Ingen nyhet — vandrer rolig. Trygg, men aldri spektakulær.
  fornybar: [
    { t: 0, v: 1.0 },
    { t: 50, v: 0.96 },
    { t: 110, v: 1.0 },
    { t: 170, v: 1.07 },
    { t: 230, v: 1.05 },
    { t: 300, v: 1.03 },
  ],
  // Flatt lenge, opp etter medisinnyheten (215 s).
  helse: [
    { t: 0, v: 1.0 },
    { t: 80, v: 0.99 },
    { t: 150, v: 1.01 },
    { t: 217, v: 1.02 },
    { t: 240, v: 1.12 },
    { t: 270, v: 1.22 },
    { t: 300, v: 1.27 },
  ],
  // Sidelengs, moderat positivt etter renteøkningen (140 s).
  finans: [
    { t: 0, v: 1.0 },
    { t: 80, v: 1.01 },
    { t: 140, v: 1.02 },
    { t: 160, v: 1.06 },
    { t: 210, v: 1.1 },
    { t: 300, v: 1.12 },
  ],
  // Ingen nyhet — opp, ned, opp. Belønner ikke passivitet spesielt.
  romfart: [
    { t: 0, v: 1.0 },
    { t: 45, v: 1.08 },
    { t: 90, v: 1.13 },
    { t: 140, v: 1.02 },
    { t: 190, v: 0.97 },
    { t: 250, v: 1.03 },
    { t: 300, v: 1.06 },
  ],
  // Faller tidlig, kraftig opp etter reguleringsnyheten (250 s).
  krypto: [
    { t: 0, v: 1.0 },
    { t: 35, v: 0.92 },
    { t: 70, v: 0.87 },
    { t: 120, v: 0.83 },
    { t: 170, v: 0.88 },
    { t: 210, v: 0.91 },
    { t: 252, v: 0.92 },
    { t: 268, v: 1.1 },
    { t: 285, v: 1.26 },
    { t: 300, v: 1.31 },
  ],
};

/* ------------------------------------------------------------------ */
/* Selskapene                                                          */
/* ------------------------------------------------------------------ */

export const SELSKAPER: Selskap[] = [
  { id: "nova", navn: "Nova AI", sektorId: "teknologi", sektorNavn: "Teknologi", startkurs: 240 },
  { id: "nordpetro", navn: "NordPetro", sektorId: "energi", sektorNavn: "Energi", startkurs: 118 },
  { id: "arctic", navn: "Arctic Defence", sektorId: "forsvar", sektorNavn: "Forsvar", startkurs: 310 },
  { id: "salmon", navn: "Nordic Salmon", sektorId: "sjomat", sektorNavn: "Sjømat", startkurs: 86 },
  { id: "urban", navn: "Urban Eiendom", sektorId: "eiendom", sektorNavn: "Eiendom", startkurs: 142 },
  { id: "greenwind", navn: "GreenWind", sektorId: "fornybar", sektorNavn: "Fornybar energi", startkurs: 64 },
  { id: "medica", navn: "Medica", sektorId: "helse", sektorNavn: "Helse", startkurs: 195 },
  { id: "nordbank", navn: "NordBank", sektorId: "finans", sektorNavn: "Finans", startkurs: 128 },
  { id: "orbitx", navn: "OrbitX", sektorId: "romfart", sektorNavn: "Romfart", startkurs: 52 },
  { id: "cryptofund", navn: "CryptoFund", sektorId: "krypto", sektorNavn: "Krypto", startkurs: 480 },
];

/* ------------------------------------------------------------------ */
/* Nyhetene                                                            */
/* ------------------------------------------------------------------ */

export const NYHETER: Nyhet[] = [
  {
    tidSek: 35,
    tittel: "AI-gjennombrudd",
    tekst: "Et stort teknologiselskap lanserer en ny AI-modell som overgår alle forventninger.",
    konsekvens: "Teknologisektoren ventes å stige kraftig.",
    retning: "opp",
  },
  {
    tidSek: 70,
    tittel: "Enorme oljefunn",
    tekst: "Store nye oljereserver er oppdaget, og markedet venter et kraftig fall i oljeprisen.",
    konsekvens: "Energisektoren ventes å falle.",
    retning: "ned",
  },
  {
    tidSek: 105,
    tittel: "Forsvarsbudsjettene økes",
    tekst: "Europeiske land varsler en kraftig og varig økning i forsvarsbudsjettene.",
    konsekvens: "Forsvarssektoren ventes å stige.",
    retning: "opp",
  },
  {
    tidSek: 140,
    tittel: "Renten settes opp",
    tekst: "Sentralbanken overrasker markedet med en renteøkning.",
    konsekvens: "Eiendom ventes å falle. Bankene kan få en moderat positiv effekt.",
    retning: "blandet",
  },
  {
    tidSek: 180,
    tittel: "Sykdom i oppdrettsanleggene",
    tekst: "En sykdom sprer seg raskt mellom lakseoppdrettsanlegg langs kysten.",
    konsekvens: "Sjømatsektoren ventes å falle kraftig.",
    retning: "ned",
  },
  {
    tidSek: 215,
    tittel: "Gjennombrudd for ny medisin",
    tekst: "Et legemiddelselskap legger fram svært gode resultater fra en klinisk studie.",
    konsekvens: "Helsesektoren ventes å stige.",
    retning: "opp",
  },
  {
    tidSek: 250,
    tittel: "Krypto får regulatorisk medvind",
    tekst: "Myndighetene åpner for enklere og tryggere bruk av kryptovaluta.",
    konsekvens: "Kryptosektoren ventes å stige kraftig.",
    retning: "opp",
  },
  {
    tidSek: 258,
    tittel: "Gevinstsikring i teknologi",
    tekst: "Etter en eventyrlig opptur begynner store investorer å ta gevinst i teknologiaksjer.",
    konsekvens: "Teknologisektoren ventes å falle noe tilbake.",
    retning: "ned",
  },
];
