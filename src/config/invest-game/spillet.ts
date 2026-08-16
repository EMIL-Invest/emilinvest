/**
 * Børskrakket — all konfigurasjon for treminutterskonkurransen.
 *
 * ALT som styrer spilløpet ligger i denne fila: selskapene, hvordan hver
 * sektor beveger seg gjennom de tre minuttene, og nyhetene. Komponentene
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
 *
 * MERK om varigheten: spillet ble kortet fra fem til tre minutter.
 * Tidslinjene og nyhetene er skrevet om for 180 sekunder — ikke bare
 * skalert — slik at avstanden mellom nyhet og kursbevegelse fortsatt er
 * 2–5 sekunder. Endrer du VARIGHET_SEK igjen, må tidslinjene og
 * nyhetstidspunktene skrives om sammen med den.
 */

export const VARIGHET_SEK = 180;
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
  // Rolig start, kraftig opp etter AI-nyheten (20 s), korreksjon på slutten.
  teknologi: [
    { t: 0, v: 1.0 },
    { t: 18, v: 1.01 },
    { t: 24, v: 1.03 },
    { t: 42, v: 1.16 },
    { t: 60, v: 1.32 },
    { t: 78, v: 1.44 },
    { t: 114, v: 1.4 },
    { t: 141, v: 1.43 },
    { t: 157, v: 1.41 },
    { t: 167, v: 1.28 },
    { t: 180, v: 1.22 },
  ],
  // Liten oppgang først, stort fall etter oljefunn-nyheten (42 s).
  energi: [
    { t: 0, v: 1.0 },
    { t: 24, v: 1.04 },
    { t: 44, v: 1.06 },
    { t: 54, v: 0.95 },
    { t: 69, v: 0.84 },
    { t: 87, v: 0.81 },
    { t: 132, v: 0.83 },
    { t: 180, v: 0.79 },
  ],
  // Stabilt, så kraftig og vedvarende opp etter budsjettnyheten (63 s).
  forsvar: [
    { t: 0, v: 1.0 },
    { t: 36, v: 1.01 },
    { t: 60, v: 1.02 },
    { t: 65, v: 1.03 },
    { t: 78, v: 1.18 },
    { t: 102, v: 1.32 },
    { t: 126, v: 1.38 },
    { t: 180, v: 1.44 },
  ],
  // Jevnt pent helt til sykdomsnyheten (105 s) — så rett ned.
  sjomat: [
    { t: 0, v: 1.0 },
    { t: 36, v: 1.03 },
    { t: 72, v: 1.07 },
    { t: 107, v: 1.1 },
    { t: 120, v: 0.88 },
    { t: 135, v: 0.74 },
    { t: 156, v: 0.71 },
    { t: 180, v: 0.7 },
  ],
  // Moderat opp, faller etter renteøkningen (84 s).
  eiendom: [
    { t: 0, v: 1.0 },
    { t: 36, v: 1.04 },
    { t: 72, v: 1.07 },
    { t: 86, v: 1.08 },
    { t: 99, v: 0.97 },
    { t: 117, v: 0.89 },
    { t: 144, v: 0.87 },
    { t: 180, v: 0.86 },
  ],
  // Ingen nyhet — vandrer rolig. Trygg, men aldri spektakulær.
  fornybar: [
    { t: 0, v: 1.0 },
    { t: 30, v: 0.96 },
    { t: 66, v: 1.0 },
    { t: 102, v: 1.07 },
    { t: 138, v: 1.05 },
    { t: 180, v: 1.03 },
  ],
  // Flatt lenge, opp etter medisinnyheten (128 s).
  helse: [
    { t: 0, v: 1.0 },
    { t: 48, v: 0.99 },
    { t: 90, v: 1.01 },
    { t: 130, v: 1.02 },
    { t: 144, v: 1.12 },
    { t: 162, v: 1.22 },
    { t: 180, v: 1.27 },
  ],
  // Sidelengs, moderat positivt etter renteøkningen (84 s).
  finans: [
    { t: 0, v: 1.0 },
    { t: 48, v: 1.01 },
    { t: 84, v: 1.02 },
    { t: 96, v: 1.06 },
    { t: 126, v: 1.1 },
    { t: 180, v: 1.12 },
  ],
  // Ingen nyhet — opp, ned, opp. Belønner ikke passivitet spesielt.
  romfart: [
    { t: 0, v: 1.0 },
    { t: 27, v: 1.08 },
    { t: 54, v: 1.13 },
    { t: 84, v: 1.02 },
    { t: 114, v: 0.97 },
    { t: 150, v: 1.03 },
    { t: 180, v: 1.06 },
  ],
  // Faller tidlig, kraftig opp etter reguleringsnyheten (148 s).
  krypto: [
    { t: 0, v: 1.0 },
    { t: 21, v: 0.92 },
    { t: 42, v: 0.87 },
    { t: 72, v: 0.83 },
    { t: 102, v: 0.88 },
    { t: 126, v: 0.91 },
    { t: 151, v: 0.92 },
    { t: 161, v: 1.1 },
    { t: 171, v: 1.26 },
    { t: 180, v: 1.31 },
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
    tidSek: 20,
    tittel: "AI-gjennombrudd",
    tekst: "Et stort teknologiselskap lanserer en ny AI-modell som overgår alle forventninger.",
    konsekvens: "Teknologisektoren ventes å stige kraftig.",
    retning: "opp",
  },
  {
    tidSek: 42,
    tittel: "Enorme oljefunn",
    tekst: "Store nye oljereserver er oppdaget, og markedet venter et kraftig fall i oljeprisen.",
    konsekvens: "Energisektoren ventes å falle.",
    retning: "ned",
  },
  {
    tidSek: 63,
    tittel: "Forsvarsbudsjettene økes",
    tekst: "Europeiske land varsler en kraftig og varig økning i forsvarsbudsjettene.",
    konsekvens: "Forsvarssektoren ventes å stige.",
    retning: "opp",
  },
  {
    tidSek: 84,
    tittel: "Renten settes opp",
    tekst: "Sentralbanken overrasker markedet med en renteøkning.",
    konsekvens: "Eiendom ventes å falle. Bankene kan få en moderat positiv effekt.",
    retning: "blandet",
  },
  {
    tidSek: 105,
    tittel: "Sykdom i oppdrettsanleggene",
    tekst: "En sykdom sprer seg raskt mellom lakseoppdrettsanlegg langs kysten.",
    konsekvens: "Sjømatsektoren ventes å falle kraftig.",
    retning: "ned",
  },
  {
    tidSek: 128,
    tittel: "Gjennombrudd for ny medisin",
    tekst: "Et legemiddelselskap legger fram svært gode resultater fra en klinisk studie.",
    konsekvens: "Helsesektoren ventes å stige.",
    retning: "opp",
  },
  {
    tidSek: 148,
    tittel: "Krypto får regulatorisk medvind",
    tekst: "Myndighetene åpner for enklere og tryggere bruk av kryptovaluta.",
    konsekvens: "Kryptosektoren ventes å stige kraftig.",
    retning: "opp",
  },
  {
    tidSek: 155,
    tittel: "Gevinstsikring i teknologi",
    tekst: "Etter en eventyrlig opptur begynner store investorer å ta gevinst i teknologiaksjer.",
    konsekvens: "Teknologisektoren ventes å falle noe tilbake.",
    retning: "ned",
  },
];
