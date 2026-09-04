/**
 * Reglene i aksjekonkurransen - ett sted.
 *
 * Tallene sto tidligere som løs tekst i StockTrader, LeaderboardTable og
 * vilkårene, og kunne dermed sprike. Databasen håndhever dem i
 * competition_buy_stock (supabase/manual/13_konkurranseregler.sql); endrer
 * du et tall her, må det samme tallet endres der.
 */

export const STARTKAPITAL = 100000;
/** Ulike aksjer som kreves for å bli rangert på ledertavlen. */
export const KRAV_ANTALL_AKSJER = 5;
export const MAKS_AKSJER = 10;
export const MAKSVEKT_PROSENT = 30;
export const MINSTE_FORSTEKJOP = 4000;
export const MAKS_HANDLER_PER_DAG = 3;

const kr = (n: number) => `${n.toLocaleString("no-NO")} kr`;

export interface Regel {
  tittel: string;
  tekst: string;
}

/** Punktlisten som vises øverst i vilkårene. */
export const REGLER: Regel[] = [
  {
    tittel: `Alle starter med ${kr(STARTKAPITAL)}`,
    tekst:
      "Virtuelle penger, live kurser fra børsen. Du handler ikke ekte verdipapirer og kan verken tape eller få utbetalt noe.",
  },
  {
    tittel: `Minst ${KRAV_ANTALL_AKSJER} ulike aksjer for å bli rangert`,
    tekst:
      "Har du færre, står du i en egen liste under rangeringen med hvor mange du mangler. Avkastningen din måles først fra det øyeblikket porteføljen blir gyldig - å bygge den ferdig siste dagen gir deg altså ingen snarvei.",
  },
  {
    tittel: `Maks ${MAKS_AKSJER} ulike aksjer`,
    tekst:
      "Nok til å spre risikoen, få nok til at du må velge. Du skal kunne begrunne hver eneste posisjon.",
  },
  {
    tittel: `Én aksje kan maks utgjøre ${MAKSVEKT_PROSENT} %`,
    tekst:
      "Grensen gjelder på kjøpstidspunktet. Vokser en posisjon forbi grensen fordi kursen stiger, er det helt greit - du får bare ikke kjøpe mer av den.",
  },
  {
    tittel: "En gyldig portefølje forblir gyldig",
    tekst:
      `Når du først har ${KRAV_ANTALL_AKSJER} aksjer, får du ikke solgt deg under grensen - handelen blir avvist med en forklaring. Vil du helt ut av en aksje, kjøper du en ny først.`,
  },
  {
    tittel: `Førstegangskjøp må være minst ${kr(MINSTE_FORSTEKJOP)}`,
    tekst:
      "Hindrer at man kjøper småposter i mange selskaper bare for å komme over kravet om fem aksjer.",
  },
  {
    tittel: `Maks ${MAKS_HANDLER_PER_DAG} handler per aksje per dag`,
    tekst:
      "Og bare mens børsen aksjen er notert på er åpen. Konkurransen skal handle om valgene dine, ikke om reaksjonstid.",
  },
  {
    tittel: "Premie hver måned til høyest avkastning",
    tekst:
      "Rangeringen nullstilles månedlig, så du er aldri ute av konkurransen. Det finnes også lister for året og all-time.",
  },
  {
    tittel: "Åpen ledertavle",
    tekst:
      "Visningsnavnet ditt, porteføljeverdien, avkastningen og hvilke aksjer du eier er synlige for andre deltakere. E-postadressen din er det ikke.",
  },
  {
    tittel: "Juks gir utestengelse",
    tekst:
      "Flere kontoer, utnyttelse av tekniske feil eller forsøk på å manipulere kurser fører til at du mister plassen.",
  },
];

/** Hvorfor reglene finnes - brukes både i vilkårene og i handelsboksen. */
export const HVORFOR_REGLER =
  "Reglene finnes fordi konkurransen skal gi erfaring med å bygge en portefølje. Uten en øvre grense per aksje ville den beste vinnersjansen vært å legge alt i det mest volatile selskapet man fant og håpe på flaks - som er både dårlig læring og dårlig investering. Diversifisering er ikke en begrensning vi har funnet på; det er selve poenget.";
