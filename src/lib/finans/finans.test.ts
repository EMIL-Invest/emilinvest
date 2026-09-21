import { describe, it, expect } from "vitest";
import {
  avkastninger, gjennomsnitt, varians, standardavvik, kovarians, korrelasjon, regresjon,
  justertBeta, juster, annualiserVolatilitet, standardfeil,
} from "./statistikk";
import { kravCAPM, unleverBeta, releverBeta, wacc, byggWacc, gjeldskostnadFraYTM } from "./kapitalkostnad";
import { dcf, sensitivitet, implisittWacc, kjoerScenario, STANDARD_SCENARIOER } from "./dcf";
import { gordon, flerfaseDDM, totalPayout, baerekraftigVekst } from "./utbytte";
import { multippelverdsettelse, egenMultippel } from "./multipler";
import {
  portefoljeNokkeltall, dekomponerRisiko, projiserSimpleks, minVariansLangKun, tangentLangKun,
  tangentMedShorting, minVariansMedShorting, effisientFrontLangKun, kravMotPortefolje, inverter,
} from "./portefolje";
import { vurder } from "./konklusjon";

const naer = (a: number, b: number, tol = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(tol);

describe("statistikk (kap. 10)", () => {
  it("regner realisert avkastning og snitt/varians som i lign. 10.4-10.7", () => {
    const r = avkastninger([100, 110, 99, 108.9]);
    naer(r[0], 0.1);
    naer(r[1], -0.1);
    naer(r[2], 0.1);
    naer(gjennomsnitt(r), 0.1 / 3);
    // utvalgsvarians deler på T-1
    const m = 0.1 / 3;
    naer(varians(r), ((0.1 - m) ** 2 + (-0.1 - m) ** 2 + (0.1 - m) ** 2) / 2);
    naer(standardfeil(r), standardavvik(r) / Math.sqrt(3));
  });

  it("annualiserer volatilitet med kvadratroten av perioder", () => {
    naer(annualiserVolatilitet(0.02, "ukentlig"), 0.02 * Math.sqrt(52));
  });

  it("beta = Cov/Var og korrelasjon = 1 for identiske serier", () => {
    const m = [0.01, -0.02, 0.03, 0.005, -0.01, 0.02];
    const a = m.map((x) => 1.5 * x + 0.001); // beta 1,5, alfa 0,1 % per periode
    naer(regresjon(a, m).beta, 1.5, 1e-9);
    naer(regresjon(a, m).alfa, 0.001, 1e-9);
    naer(regresjon(a, m).r2, 1, 1e-9);
    naer(korrelasjon(a, m), 1, 1e-9);
    naer(kovarians(a, m) / varians(m), 1.5, 1e-9);
  });

  it("justert beta trekker en tredjedel mot 1", () => {
    naer(justertBeta(1.6), 1.4);
  });

  it("legger serier fra ulike børser på felles ukenøkkel og kaster hull", () => {
    const { noekler, kurser } = juster(
      {
        A: [{ dato: "2026-01-05", kurs: 10 }, { dato: "2026-01-12", kurs: 11 }, { dato: "2026-01-19", kurs: 12 }],
        B: [{ dato: "2026-01-06", kurs: 5 }, { dato: "2026-01-20", kurs: 6 }], // mangler uke 3
      },
      "ukentlig",
    );
    expect(noekler).toEqual(["2026-U02", "2026-U04"]);
    expect(kurser.A).toEqual([10, 12]);
    expect(kurser.B).toEqual([5, 6]);
  });
});

describe("kapitalkostnad (kap. 12, 18)", () => {
  it("CAPM eksempel: rf 3 %, beta 1,2, MRP 5 % -> 9 %", () => {
    naer(kravCAPM(0.03, 1.2, 0.05), 0.09);
  });

  it("unlever/relever er inverse operasjoner", () => {
    const bU = unleverBeta(1.4, 800, 200, 0.1);
    naer(releverBeta(bU, 800, 200, 0.1), 1.4, 1e-12);
    naer(bU, 0.8 * 1.4 + 0.2 * 0.1);
  });

  it("WACC etter skatt, lign. 12.13: E 600, D 400, rE 10 %, rD 5 %, tau 25 %", () => {
    naer(wacc({ E: 600, D: 400, rE: 0.1, rD: 0.05, skattesats: 0.25 }), 0.6 * 0.1 + 0.4 * 0.05 * 0.75);
  });

  it("netto kontanter gir WACC = rE", () => {
    naer(wacc({ E: 600, D: -100, rE: 0.1, rD: 0.05, skattesats: 0.25 }), 0.1);
  });

  it("byggWacc kjeder CAPM og vekter", () => {
    const r = byggWacc({ rf: 0.04, markedspremie: 0.05, beta: 1, E: 750, D: 250, rD: 0.06, skattesats: 0.22 });
    naer(r.rE, 0.09);
    naer(r.vektE, 0.75);
    naer(r.wacc, 0.75 * 0.09 + 0.25 * 0.06 * 0.78);
  });

  it("gjeldskostnad fra YTM justert for tap, lign. 12.7", () => {
    naer(gjeldskostnadFraYTM(0.07, 0.05, 0.6), 0.04);
  });
});

describe("DCF (kap. 9.3, 19)", () => {
  const basis = {
    omsetning0: 1000,
    aar: 5,
    vekst: [0.05],
    ebitMargin: [0.12],
    skattesats: 0.22,
    avskrivningPst: 0.04,
    capexPst: 0.05,
    arbeidskapitalPst: 0.1,
    terminalvekst: 0.02,
    wacc: 0.08,
    nettoGjeld: 200,
    antallAksjer: 100,
    aksjekurs: 12,
  };

  it("FCF-raden følger lign. 9.20 og diskonteres per år", () => {
    const r = dcf(basis);
    const a1 = r.aar[0];
    naer(a1.omsetning, 1050);
    naer(a1.ebit, 126);
    naer(a1.nopat, 126 * 0.78);
    naer(a1.avskrivning, 42);
    naer(a1.capex, 52.5);
    naer(a1.deltaNwc, 5);
    naer(a1.fcf, 126 * 0.78 + 42 - 52.5 - 5);
    naer(a1.pv, a1.fcf / 1.08);
  });

  it("terminalverdi = FCF_N(1+g)/(wacc-g), EV = sum PV + PV(TV), P = (EV - nettogjeld)/aksjer", () => {
    const r = dcf(basis);
    const siste = r.aar[4];
    naer(r.terminalverdi, (siste.fcf * 1.02) / 0.06);
    naer(r.pvTerminalverdi, r.terminalverdi / 1.08 ** 5);
    naer(r.ev, r.sumPvFcf + r.pvTerminalverdi);
    naer(r.verdiPerAksje, (r.ev - 200) / 100);
    naer(r.oppside, r.verdiPerAksje / 12 - 1);
    expect(r.gyldig).toBe(true);
  });

  it("nekter WACC <= g", () => {
    const r = dcf({ ...basis, terminalvekst: 0.08 });
    expect(r.gyldig).toBe(false);
    expect(r.feil).toMatch(/WACC/);
  });

  it("sensitivitet er monotont: høyere WACC gir lavere verdi, høyere g gir høyere", () => {
    const s = sensitivitet(basis, [0.07, 0.08, 0.09], [0.01, 0.02, 0.03]);
    expect(s.verdier[0][1]).toBeGreaterThan(s.verdier[1][1]);
    expect(s.verdier[1][1]).toBeGreaterThan(s.verdier[2][1]);
    expect(s.verdier[1][2]).toBeGreaterThan(s.verdier[1][0]);
    naer(s.verdier[1][1], dcf(basis).verdiPerAksje);
  });

  it("implisitt WACC gir verdi = kurs", () => {
    const w = implisittWacc(basis);
    expect(isFinite(w)).toBe(true);
    naer(dcf({ ...basis, wacc: w }).verdiPerAksje, 12, 1e-6);
  });

  it("scenarioene rangerer pessimistisk < basis < optimistisk", () => {
    const [p, b, o] = STANDARD_SCENARIOER.map((s) => kjoerScenario(basis, s).verdiPerAksje);
    expect(p).toBeLessThan(b);
    expect(b).toBeLessThan(o);
  });
});

describe("utbyttemodeller (kap. 9.1-9.2)", () => {
  it("Gordon: Div1 1,50, rE 10 %, g 5 % -> 30", () => {
    const r = gordon({ utbytteNesteAar: 1.5, rE: 0.1, vekst: 0.05, aksjekurs: 25 });
    naer(r.verdiPerAksje, 30);
    naer(r.oppside, 0.2);
    naer(r.implisittKrav, 1.5 / 25 + 0.05);
  });

  it("flerfase-DDM med null år i fase 1 er lik Gordon", () => {
    const r = flerfaseDDM({ utbytteIDag: 1.5 / 1.05, vekstFase1: [], vekstEvig: 0.05, rE: 0.1, aksjekurs: 25 });
    naer(r.verdiPerAksje, 30, 1e-9);
  });

  it("flerfase-DDM, eksempel 9.4-stil: 2 år 20 % vekst, så 4 %", () => {
    const r = flerfaseDDM({ utbytteIDag: 1, vekstFase1: [0.2, 0.2], vekstEvig: 0.04, rE: 0.1, aksjekurs: 20 });
    const d1 = 1.2, d2 = 1.44;
    const pN = (d2 * 1.04) / 0.06;
    naer(r.verdiPerAksje, d1 / 1.1 + d2 / 1.1 ** 2 + pN / 1.1 ** 2, 1e-9);
  });

  it("total payout deler egenkapitalverdien på dagens aksjer", () => {
    const r = totalPayout({ totalUtbetalingNesteAar: 500, rE: 0.1, vekst: 0.05, antallAksjer: 100, aksjekurs: 90 });
    naer(r.egenkapitalverdi, 10000);
    naer(r.verdiPerAksje, 100);
  });

  it("bærekraftig vekst = tilbakeholdt andel x ROE", () => {
    naer(baerekraftigVekst(0.4, 0.15), 0.09);
  });
});

describe("multipler (kap. 9.4)", () => {
  const tall = { resultat: 100, ebitda: 250, ebit: 200, egenkapital: 800, omsetning: 2000, nettoGjeld: 300, antallAksjer: 50, aksjekurs: 30 };
  it("P/E-median x resultat / aksjer; EV-multipler trekker fra netto gjeld", () => {
    const r = multippelverdsettelse(
      [{ navn: "A", pe: 12, evEbitda: 8 }, { navn: "B", pe: 16, evEbitda: 10 }, { navn: "C", pe: 20, evEbitda: 6 }],
      tall,
    );
    const pe = r.find((x) => x.multippel === "pe")!;
    naer(pe.median, 16);
    naer(pe.verdiPerAksje!, (16 * 100) / 50);
    const ev = r.find((x) => x.multippel === "evEbitda")!;
    naer(ev.median, 8);
    naer(ev.verdiPerAksje!, (8 * 250 - 300) / 50);
    expect(r.find((x) => x.multippel === "pb")).toBeUndefined();
  });

  it("egen multippel: P/E = markedsverdi / resultat", () => {
    naer(egenMultippel("pe", tall)!, (30 * 50) / 100);
    naer(egenMultippel("evEbitda", tall)!, (30 * 50 + 300) / 250);
  });
});

describe("portefølje (kap. 11)", () => {
  // Eksempel 11.x-stil: to aksjer, vol 30 % og 40 %, korrelasjon 0,2
  const mu = [0.1, 0.15];
  const s1 = 0.3, s2 = 0.4, rho = 0.2;
  const kov = [[s1 * s1, rho * s1 * s2], [rho * s1 * s2, s2 * s2]];

  it("forventet avkastning og varians for to aksjer, lign. 11.8", () => {
    const n = portefoljeNokkeltall([0.5, 0.5], mu, kov, 0.03);
    naer(n.forventetAvkastning, 0.125);
    naer(n.varians, 0.25 * 0.09 + 0.25 * 0.16 + 2 * 0.25 * rho * s1 * s2);
    naer(n.sharpe, (0.125 - 0.03) / n.volatilitet);
  });

  it("dekomponering: systematisk + selskapsspesifikk = total, risikobidrag summerer til 1", () => {
    const d = dekomponerRisiko([0.6, 0.4], kov, [0.8, 1.3], 0.15 ** 2);
    naer(d.variansSystematisk + d.variansSelskapsspesifikk, d.variansTotal);
    naer(d.betaPortefolje, 0.6 * 0.8 + 0.4 * 1.3);
    naer(d.risikobidrag.reduce((a, b) => a + b, 0), 1, 1e-9);
    expect(d.diversifiseringsgevinst).toBeGreaterThan(0);
  });

  it("simpleks-projeksjon gir vekter >= 0 som summerer til 1", () => {
    const w = projiserSimpleks([0.7, 0.6, -0.3]);
    naer(w.reduce((a, b) => a + b, 0), 1, 1e-12);
    expect(Math.min(...w)).toBeGreaterThanOrEqual(0);
    expect(w[2]).toBe(0);
  });

  it("minimum-varians uten short treffer den analytiske løsningen når den er lang", () => {
    const wAn = minVariansMedShorting(kov);
    const wNum = minVariansLangKun(kov);
    // analytisk for to aksjer: w1 = (s2^2 - cov)/(s1^2 + s2^2 - 2cov)
    const c = rho * s1 * s2;
    naer(wAn[0], (s2 * s2 - c) / (s1 * s1 + s2 * s2 - 2 * c), 1e-9);
    naer(wNum[0], wAn[0], 1e-4);
  });

  it("tangentportefølje uten short treffer analytisk løsning når den er lang", () => {
    const rf = 0.03;
    const wAn = tangentMedShorting(mu, kov, rf);
    expect(Math.min(...wAn)).toBeGreaterThan(0);
    const wNum = tangentLangKun(mu, kov, rf);
    naer(wNum[0], wAn[0], 2e-3);
    const sAn = portefoljeNokkeltall(wAn, mu, kov, rf).sharpe;
    const sNum = portefoljeNokkeltall(wNum, mu, kov, rf).sharpe;
    expect(sNum).toBeGreaterThan(sAn - 1e-5);
  });

  it("tangentporteføljen med short har lik Sharpe for alle aksjer mot porteføljen (lign. 11.19 med likhet)", () => {
    const rf = 0.03;
    const w = tangentMedShorting(mu, kov, rf);
    const k = kravMotPortefolje(w, mu, kov, rf);
    naer(k.differanse[0], 0, 1e-9);
    naer(k.differanse[1], 0, 1e-9);
  });

  it("effisient front er stigende i både avkastning og volatilitet", () => {
    const f = effisientFrontLangKun(mu, kov, 10);
    for (let i = 1; i < f.length; i++) {
      expect(f[i].forventetAvkastning).toBeGreaterThanOrEqual(f[i - 1].forventetAvkastning - 1e-9);
      expect(f[i].volatilitet).toBeGreaterThanOrEqual(f[i - 1].volatilitet - 1e-9);
    }
    naer(f[f.length - 1].forventetAvkastning, 0.15, 1e-3);
  });

  it("tre aksjer med negativ analytisk vekt: long-only holder seg på simplekset", () => {
    const mu3 = [0.05, 0.12, 0.13];
    const kov3 = [[0.04, 0.01, 0.01], [0.01, 0.09, 0.08], [0.01, 0.08, 0.1]];
    const w = tangentLangKun(mu3, kov3, 0.03);
    naer(w.reduce((a, b) => a + b, 0), 1, 1e-9);
    expect(Math.min(...w)).toBeGreaterThanOrEqual(0);
    const s = portefoljeNokkeltall(w, mu3, kov3, 0.03).sharpe;
    // ingen enkeltaksje eller like-vektet skal slå optimum
    for (const kand of [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1 / 3, 1 / 3, 1 / 3]]) {
      expect(s).toBeGreaterThanOrEqual(portefoljeNokkeltall(kand, mu3, kov3, 0.03).sharpe - 1e-6);
    }
  });

  it("inverter gir identitet", () => {
    const A = [[2, 1], [1, 3]];
    const I = inverter(A);
    naer(A[0][0] * I[0][0] + A[0][1] * I[1][0], 1);
    naer(A[0][0] * I[0][1] + A[0][1] * I[1][1], 0);
  });
});

describe("konklusjon", () => {
  it("vekter metodene, setter anbefaling etter terskler og teller enighet", () => {
    const v = vurder(
      [
        { metode: "DCF", verdi: 130, lav: 100, hoey: 160, vekt: 0.5 },
        { metode: "Multipler", verdi: 120, vekt: 0.3 },
        { metode: "DDM", verdi: 110, vekt: 0.2 },
        { metode: "Ignorert", verdi: 999, vekt: 0 },
      ],
      100,
    )!;
    naer(v.sentralverdi, 0.5 * 130 + 0.3 * 120 + 0.2 * 110);
    expect(v.anbefaling).toBe("kjop");
    expect(v.lav).toBe(100);
    expect(v.hoey).toBe(160);
    expect(v.enighet).toEqual({ antall: 2, av: 3 }); // DDM +10 % er «hold»
  });

  it("returnerer null uten brukbare metoder", () => {
    expect(vurder([{ metode: "x", verdi: NaN, vekt: 1 }], 100)).toBeNull();
  });
});
