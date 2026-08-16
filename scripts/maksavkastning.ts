/**
 * Hva er maksimal mulig avkastning i Børskrakket, og hvordan?
 *
 * Kursene er deterministiske funksjoner av tiden, så dette er et rent
 * optimeringsproblem. Vi regner med sekundoppløsning på de faktiske
 * kursene fra motoren (inkludert småuroen) og finner:
 *
 *  1. Det absolutte taket: bytt til beste aksje hvert eneste sekund.
 *  2. Optimal plan med et begrenset antall kjøp (det en gruppe faktisk
 *     kan gjøre), via dynamisk programmering med backpointers, slik at
 *     vi kan skrive ut NÅR og HVA man skal kjøpe.
 */
import { SELSKAPER, VARIGHET_SEK } from "../src/config/invest-game/spillet";
import { kurs } from "../src/lib/invest-game/motor";

const N = SELSKAPER.length;
const T = VARIGHET_SEK; // heltallssekunder 0..T

// r[a][t] = kursratio fra t til t+1
const r: number[][] = SELSKAPER.map((s) => {
  const ut: number[] = [];
  for (let t = 0; t < T; t++) ut.push(kurs(s, t + 1) / kurs(s, t));
  return ut;
});

/* 1) Taket: hold alltid det som stiger mest akkurat nå (kontanter hvis alt faller) */
let tak = 1;
for (let t = 0; t < T; t++) tak *= Math.max(1, ...r.map((rad) => rad[t]));

/* 2) DP med maks K kjøp. Tilstand: (antall kjøp brukt, holder aksje a | kontanter). */
const MAKS_KJOP = 10;
interface Spor {
  tid: number;
  aksje: number;
}
// V[j][a]: beste multiplikator; a = N betyr kontanter. Backpointer-lister kopieres
// (小 datamengde: 181 × 11 × 11 tilstander).
const planFor = (K: number) => {
  let V: number[][] = Array.from({ length: K + 1 }, () => Array(N + 1).fill(-1));
  let spor: Spor[][][] = Array.from({ length: K + 1 }, () => Array.from({ length: N + 1 }, () => [] as Spor[]));
  V[0][N] = 1; // start i kontanter, null kjøp brukt

  for (let t = 0; t < T; t++) {
    // Bytter ved tid t: selg til kontanter (gratis), kjøp (koster ett kjøp).
    // Selg først: kontant-tilstanden kan ta beste aksjeverdi med samme j.
    for (let j = 0; j <= K; j++) {
      for (let a = 0; a < N; a++) {
        if (V[j][a] > V[j][N]) {
          V[j][N] = V[j][a];
          spor[j][N] = spor[j][a];
        }
      }
    }
    // Kjøp: fra kontanter (j) til aksje b (j+1)
    for (let j = K - 1; j >= 0; j--) {
      for (let b = 0; b < N; b++) {
        if (V[j][N] > V[j + 1][b]) {
          V[j + 1][b] = V[j][N];
          spor[j + 1][b] = [...spor[j][N], { tid: t, aksje: b }];
        }
      }
    }
    // La tiden gå ett sekund
    for (let j = 0; j <= K; j++)
      for (let a = 0; a < N; a++) if (V[j][a] > 0) V[j][a] *= r[a][t];
  }

  let best = V[0][N];
  let bestSpor: Spor[] = [];
  for (let j = 0; j <= K; j++)
    for (let a = 0; a <= N; a++)
      if (V[j][a] > best) {
        best = V[j][a];
        bestSpor = spor[j][a];
      }
  return { best, spor: bestSpor };
};

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

console.log(`Absolutt tak (bytte hvert sekund): ${((tak - 1) * 100).toFixed(1)} %\n`);

for (const K of [3, 4, 5, 6, 8, 10]) {
  const { best, spor } = planFor(K);
  const plan = spor
    .map((s, i) => {
      const neste = spor[i + 1];
      const til = neste ? mmss(neste.tid) : mmss(T);
      return `${mmss(s.tid)}–${til} ${SELSKAPER[s.aksje].navn}`;
    })
    .join("  →  ");
  console.log(`Maks ${String(K).padStart(2)} kjøp: ${((best - 1) * 100).toFixed(1).padStart(6)} %   ${plan}`);
}

/* Referanse: den «naturlige» nyhetsstrategien */
console.log("\nTil sammenligning:");
const naturlig = [
  { fra: 23, aksje: "nova" },
  { fra: 66, aksje: "arctic" },
  { fra: 131, aksje: "medica" },
  { fra: 151, aksje: "cryptofund" },
];
let v = 1;
let holder: number | null = null;
for (let t = 0; t < T; t++) {
  const bytte = naturlig.find((n) => n.fra === t);
  if (bytte) holder = SELSKAPER.findIndex((s) => s.id === bytte.aksje);
  if (holder !== null) v *= r[holder][t];
}
console.log(`Nyhetsstrategien (tech→forsvar→helse→krypto): ${((v - 1) * 100).toFixed(1)} %`);
