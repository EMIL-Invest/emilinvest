/**
 * Motortest for Børskrakket — kjøres med `npx tsx scripts/test-borskrakket.ts`.
 * Ingen nettleser: tester tidslinjene, nyhetstimingen, handelsmatematikken
 * og at balansen faktisk belønner den som følger med på nyhetene.
 */
import {
  NYHETER,
  SEKTOR_TIDSLINJER,
  SELSKAPER,
  STARTKAPITAL,
  VARIGHET_SEK,
  type SektorId,
} from "../src/config/invest-game/spillet";
import {
  avkastningPct,
  investeringsresultater,
  kjop,
  kurs,
  multiplikator,
  nyPortefolje,
  selg,
  totalverdi,
} from "../src/lib/invest-game/motor";

let feil = 0;
const sjekk = (navn: string, ok: boolean, detalj = "") => {
  if (!ok) feil++;
  console.log(`${ok ? "ok  " : "FEIL"} ${navn}${detalj ? ` — ${detalj}` : ""}`);
};

/* Tidslinjene er velformede */
for (const [sektor, linje] of Object.entries(SEKTOR_TIDSLINJER)) {
  sjekk(`${sektor}: starter på t=0, v=1`, linje[0].t === 0 && linje[0].v === 1);
  sjekk(`${sektor}: slutter på t=${VARIGHET_SEK}`, linje[linje.length - 1].t === VARIGHET_SEK);
  const stigende = linje.every((p, i) => i === 0 || p.t > linje[i - 1].t);
  sjekk(`${sektor}: tidspunkter strengt stigende`, stigende);
}

/* Kursene er alltid positive og endelige */
let alleGyldige = true;
for (const s of SELSKAPER)
  for (let t = 0; t <= VARIGHET_SEK; t += 1)
    if (!Number.isFinite(kurs(s, t)) || kurs(s, t) <= 0) alleGyldige = false;
sjekk("alle kurser positive og endelige gjennom hele løpet", alleGyldige);

/* Nyheten kommer FØR bevegelsen, og bevegelsen kommer faktisk */
const sektorForNyhet: Record<number, { sektor: SektorId; retning: 1 | -1 }[]> = {
  13: [{ sektor: "teknologi", retning: 1 }],
  26: [{ sektor: "energi", retning: -1 }],
  41: [{ sektor: "forsvar", retning: 1 }],
  54: [
    { sektor: "eiendom", retning: -1 },
    { sektor: "finans", retning: 1 },
  ],
  68: [{ sektor: "sjomat", retning: -1 }],
  85: [{ sektor: "helse", retning: 1 }],
  99: [{ sektor: "krypto", retning: 1 }],
  103: [{ sektor: "teknologi", retning: -1 }],
};
for (const nyhet of NYHETER) {
  const effekter = sektorForNyhet[nyhet.tidSek];
  sjekk(`nyhet ${nyhet.tidSek}s («${nyhet.tittel}») har definert fasit i testen`, !!effekter);
  if (!effekter) continue;
  for (const { sektor, retning } of effekter) {
    const linje = SEKTOR_TIDSLINJER[sektor];
    const ved = multiplikator(linje, nyhet.tidSek);
    const for5 = multiplikator(linje, nyhet.tidSek - 5);
    const etter40 = multiplikator(linje, Math.min(nyhet.tidSek + 40, VARIGHET_SEK));
    sjekk(
      `  ${sektor}: rolig FØR nyheten (±1,5 %)`,
      Math.abs(ved / for5 - 1) < 0.015,
      `${((ved / for5 - 1) * 100).toFixed(2)} %`
    );
    const bevegelse = (etter40 / ved - 1) * retning;
    sjekk(
      `  ${sektor}: beveger seg ${retning > 0 ? "opp" : "ned"} etter nyheten (>2 %)`,
      bevegelse > 0.02,
      `${((etter40 / ved - 1) * 100).toFixed(1)} %`
    );
  }
}

/* Handel: verdien bevares i handleøyeblikket, kontanter går aldri i minus */
const nova = SELSKAPER.find((s) => s.id === "nova")!;
let p = nyPortefolje();
const forVerdi = totalverdi(p, 50);
p = kjop(p, nova, 25_000_000, 50);
sjekk("kjøp bevarer totalverdien i øyeblikket", Math.abs(totalverdi(p, 50) - forVerdi) < 1e-6);
p = kjop(p, nova, 999_000_000_000, 50); // langt mer enn vi har
sjekk("kjøp klippes til kontantbeholdningen", p.kontanter === 0);
const forSalg = totalverdi(p, 120);
p = selg(p, nova, 0.5, 120);
sjekk("salg bevarer totalverdien i øyeblikket", Math.abs(totalverdi(p, 120) - forSalg) < 1e-6);
p = selg(p, nova, 1, 120);
sjekk("100 %-salg nuller posten helt", p.poster["nova"].antall === 0);
sjekk("kontanter aldri negative", p.kontanter >= 0);

/* Resultatregning: gevinst = alt ut minus alt inn */
const post = p.poster["nova"];
const res = investeringsresultater(p, VARIGHET_SEK)[0];
sjekk(
  "investeringsresultat = solgtFor − kjoptFor når alt er solgt",
  Math.abs(res.gevinst - (post.solgtFor - post.kjoptFor)) < 1e-6
);

/* Balanse: passiv likevekt vs. å følge nyhetene */
let passiv = nyPortefolje();
for (const s of SELSKAPER) passiv = kjop(passiv, s, STARTKAPITAL / 10, 2);
const passivAvkastning = avkastningPct(passiv, VARIGHET_SEK);

// Reaktiv: teknologi ved AI-nyheten → forsvar ved budsjettnyheten →
// helse ved medisinnyheten → krypto ved reguleringsnyheten.
let reaktiv = nyPortefolje();
const flytt = (tilId: string, t: number) => {
  for (const s of SELSKAPER) reaktiv = selg(reaktiv, s, 1, t);
  reaktiv = kjop(reaktiv, SELSKAPER.find((s) => s.id === tilId)!, reaktiv.kontanter, t);
};
flytt("nova", 16);
flytt("arctic", 44);
flytt("medica", 88);
flytt("cryptofund", 102);
const reaktivAvkastning = avkastningPct(reaktiv, VARIGHET_SEK);

console.log(`\npassiv 10 %-i-alt:      ${passivAvkastning.toFixed(1)} %`);
console.log(`reaktiv (følger nyheter): ${reaktivAvkastning.toFixed(1)} %`);
sjekk("passiv strategi gir moderat pluss (0–15 %)", passivAvkastning > 0 && passivAvkastning < 15);
sjekk(
  "reaktiv strategi slår passiv med minst 20 prosentpoeng",
  reaktivAvkastning > passivAvkastning + 20
);

/* Determinisme: samme t gir alltid samme kurs */
sjekk(
  "kursen er deterministisk",
  SELSKAPER.every((s) => kurs(s, 123.456) === kurs(s, 123.456))
);

console.log(feil === 0 ? "\nAlle motortester besto." : `\n${feil} tester FEILET.`);
process.exit(feil === 0 ? 0 : 1);
