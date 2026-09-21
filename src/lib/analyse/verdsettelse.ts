import { byggWacc, WaccResultat } from "@/lib/finans/kapitalkostnad";
import {
  DcfInput, DcfResultat, dcf, sensitivitet, rutenett, kjoerScenario, STANDARD_SCENARIOER, implisittWacc,
} from "@/lib/finans/dcf";
import { gordon, flerfaseDDM, totalPayout, UtbytteResultat, FlerfaseResultat } from "@/lib/finans/utbytte";
import { Peer, Multippel, MultippelResultat, multippelverdsettelse } from "@/lib/finans/multipler";
import { Metodeverdi, Samletvurdering, vurder, Terskler } from "@/lib/finans/konklusjon";
import type { Forutsetninger } from "./db";
import type { Aksjeprofil, Regnskapsperiode } from "@/lib/aksjeprofiler";

/**
 * Én samlet modell for verdsettelsen: alle forutsetninger analytikeren
 * legger inn (`VerdsettelseInputs`) og alt som regnes ut av dem
 * (`VerdsettelseResultater`). Begge lagres som jsonb i tabellen valuations,
 * så en lagret analyse kan vises igjen nøyaktig slik den var.
 */

export type BetaKilde = "historisk" | "justert" | "manuell";
export type Utbyttemodell = "gordon" | "flerfase" | "total";

export interface VerdsettelseInputs {
  ticker: string;
  selskapsnavn: string;
  valuta: string;
  aksjekurs: number;
  /** Millioner aksjer. */
  antallAksjer: number;
  /** Millioner, i selskapets valuta. Negativ = netto kontanter. */
  nettoGjeld: number;
  andreFratrekk: number;

  kapital: {
    betaKilde: BetaKilde;
    betaHistorisk: number | null;
    betaJustert: number | null;
    betaManuell: number;
    risikofriRente: number;
    markedspremie: number;
    gjeldskostnad: number;
    skattesats: number;
    /** Overstyrer hele WACC-kjeden hvis satt. */
    waccManuell: number | null;
  };

  dcf: {
    bruk: boolean;
    omsetning0: number;
    aar: number;
    vekst: number[];
    ebitMargin: number[];
    avskrivningPst: number;
    capexPst: number;
    arbeidskapitalPst: number;
    terminalvekst: number;
  };

  utbytte: {
    bruk: boolean;
    modell: Utbyttemodell;
    utbytteNesteAar: number;
    utbytteIDag: number;
    vekstFase1: number[];
    vekst: number;
    totalUtbetalingNesteAar: number;
  };

  multipler: {
    bruk: boolean;
    peers: Peer[];
    tall: { resultat: number | null; ebitda: number | null; ebit: number | null; egenkapital: number | null; omsetning: number | null };
    /** Hvilke multipler som teller i snittet. */
    valgte: Multippel[];
  };

  vekter: { dcf: number; multipler: number; utbytte: number };
  notat: string;
}

export interface VerdsettelseResultater {
  beta: number;
  wacc: WaccResultat;
  waccBrukt: number;
  markedsverdi: number;
  dcf: DcfResultat | null;
  scenarioer: { navn: string; verdiPerAksje: number; oppside: number }[] | null;
  sensitivitet: { wacc: number[]; vekst: number[]; verdier: number[][] } | null;
  implisittWacc: number | null;
  utbytte: (UtbytteResultat | FlerfaseResultat) | null;
  multipler: MultippelResultat[] | null;
  multipelSnitt: number | null;
  metoder: Metodeverdi[];
  samlet: Samletvurdering | null;
  beregnet: string;
}

export const tomInputs = (f: Forutsetninger): VerdsettelseInputs => ({
  ticker: "",
  selskapsnavn: "",
  valuta: "NOK",
  aksjekurs: 0,
  antallAksjer: 0,
  nettoGjeld: 0,
  andreFratrekk: 0,
  kapital: {
    betaKilde: "justert",
    betaHistorisk: null,
    betaJustert: null,
    betaManuell: 1,
    risikofriRente: f.risikofriRente,
    markedspremie: f.markedspremie,
    gjeldskostnad: f.risikofriRente + 0.02,
    skattesats: f.skattesats,
    waccManuell: null,
  },
  dcf: {
    bruk: true,
    omsetning0: 0,
    aar: 5,
    vekst: [0.05, 0.05, 0.04, 0.03, 0.03],
    ebitMargin: [0.1, 0.1, 0.1, 0.1, 0.1],
    avskrivningPst: 0.04,
    capexPst: 0.05,
    arbeidskapitalPst: 0.1,
    terminalvekst: 0.02,
  },
  utbytte: {
    bruk: false,
    modell: "gordon",
    utbytteNesteAar: 0,
    utbytteIDag: 0,
    vekstFase1: [0.05, 0.05, 0.05],
    vekst: 0.03,
    totalUtbetalingNesteAar: 0,
  },
  multipler: {
    bruk: false,
    peers: [],
    tall: { resultat: null, ebitda: null, ebit: null, egenkapital: null, omsetning: null },
    valgte: ["pe", "evEbitda"],
  },
  vekter: { ...f.metodevekter },
  notat: "",
});

/**
 * Forhåndsutfylling fra aksjesidene (stock_profiles / stock_financials).
 * Siste årsregnskap gir omsetning, EBIT, EBITDA -> avskrivninger, netto
 * gjeld og egenkapital. Antall aksjer = børsverdi / kurs.
 */
export const fyllFraProfil = (
  inputs: VerdsettelseInputs,
  profil: Aksjeprofil | null,
  regnskap: Regnskapsperiode[],
  kurs: number | null,
): VerdsettelseInputs => {
  const ut: VerdsettelseInputs = JSON.parse(JSON.stringify(inputs));
  if (profil) {
    ut.selskapsnavn = profil.name || ut.selskapsnavn;
    ut.valuta = profil.valuta || ut.valuta;
  }
  if (kurs && kurs > 0) ut.aksjekurs = kurs;
  if (profil?.borsverdi_mrd && ut.aksjekurs > 0) ut.antallAksjer = +((profil.borsverdi_mrd * 1000) / ut.aksjekurs).toFixed(2);

  const aar = regnskap.filter((r) => r.periode_type === "ar").sort((a, b) => b.periode_slutt.localeCompare(a.periode_slutt));
  const siste = aar[0];
  if (siste) {
    if (siste.omsetning) ut.dcf.omsetning0 = siste.omsetning;
    if (siste.omsetning && siste.ebit) {
      const m = siste.ebit / siste.omsetning;
      ut.dcf.ebitMargin = Array(ut.dcf.aar).fill(+m.toFixed(4));
    }
    if (siste.omsetning && siste.ebitda && siste.ebit) {
      ut.dcf.avskrivningPst = +((siste.ebitda - siste.ebit) / siste.omsetning).toFixed(4);
    }
    if (siste.netto_gjeld !== null) ut.nettoGjeld = siste.netto_gjeld;
    ut.multipler.tall = {
      resultat: siste.resultat,
      ebitda: siste.ebitda,
      ebit: siste.ebit,
      egenkapital: siste.egenkapital,
      omsetning: siste.omsetning,
    };
    // Historisk vekst som utgangspunkt for prognosen
    if (aar.length >= 2 && aar[1].omsetning && siste.omsetning) {
      const g = siste.omsetning / aar[1].omsetning - 1;
      const dempet = Math.max(-0.1, Math.min(0.25, g));
      ut.dcf.vekst = Array.from({ length: ut.dcf.aar }, (_, i) =>
        +(dempet + (ut.dcf.terminalvekst - dempet) * (i / Math.max(ut.dcf.aar - 1, 1))).toFixed(4),
      );
    }
  }
  if (profil?.utbytte_prosent && ut.aksjekurs > 0) {
    ut.utbytte.utbytteIDag = +((profil.utbytte_prosent / 100) * ut.aksjekurs).toFixed(2);
    ut.utbytte.utbytteNesteAar = +(ut.utbytte.utbytteIDag * (1 + ut.utbytte.vekst)).toFixed(2);
    ut.utbytte.bruk = true;
  }
  return ut;
};

export const valgtBeta = (k: VerdsettelseInputs["kapital"]): number => {
  if (k.betaKilde === "historisk" && k.betaHistorisk !== null && isFinite(k.betaHistorisk)) return k.betaHistorisk;
  if (k.betaKilde === "justert" && k.betaJustert !== null && isFinite(k.betaJustert)) return k.betaJustert;
  return k.betaManuell;
};

export const beregnVerdsettelse = (inn: VerdsettelseInputs, terskler: Terskler): VerdsettelseResultater => {
  const beta = valgtBeta(inn.kapital);
  const markedsverdi = inn.aksjekurs * inn.antallAksjer;
  const wacc = byggWacc({
    rf: inn.kapital.risikofriRente,
    markedspremie: inn.kapital.markedspremie,
    beta,
    E: markedsverdi,
    D: inn.nettoGjeld,
    rD: inn.kapital.gjeldskostnad,
    skattesats: inn.kapital.skattesats,
  });
  const waccBrukt = inn.kapital.waccManuell ?? wacc.wacc;

  let dcfRes: DcfResultat | null = null;
  let scenarioer: VerdsettelseResultater["scenarioer"] = null;
  let sens: VerdsettelseResultater["sensitivitet"] = null;
  let implWacc: number | null = null;
  if (inn.dcf.bruk && inn.dcf.omsetning0 > 0 && inn.antallAksjer > 0) {
    const d: DcfInput = {
      omsetning0: inn.dcf.omsetning0,
      aar: inn.dcf.aar,
      vekst: inn.dcf.vekst,
      ebitMargin: inn.dcf.ebitMargin,
      skattesats: inn.kapital.skattesats,
      avskrivningPst: inn.dcf.avskrivningPst,
      capexPst: inn.dcf.capexPst,
      arbeidskapitalPst: inn.dcf.arbeidskapitalPst,
      terminalvekst: inn.dcf.terminalvekst,
      wacc: waccBrukt,
      nettoGjeld: inn.nettoGjeld,
      andreFratrekk: inn.andreFratrekk,
      antallAksjer: inn.antallAksjer,
      aksjekurs: inn.aksjekurs,
    };
    dcfRes = dcf(d);
    if (dcfRes.gyldig) {
      scenarioer = STANDARD_SCENARIOER.map((s) => {
        const r = kjoerScenario(d, s);
        return { navn: s.navn, verdiPerAksje: r.gyldig ? r.verdiPerAksje : NaN, oppside: r.gyldig ? r.oppside : NaN };
      });
      sens = sensitivitet(d, rutenett(waccBrukt, 0.005, 3), rutenett(inn.dcf.terminalvekst, 0.005, 2));
      implWacc = implisittWacc(d);
    }
  }

  let utb: VerdsettelseResultater["utbytte"] = null;
  if (inn.utbytte.bruk) {
    const rE = wacc.rE;
    if (inn.utbytte.modell === "gordon") utb = gordon({ utbytteNesteAar: inn.utbytte.utbytteNesteAar, rE, vekst: inn.utbytte.vekst, aksjekurs: inn.aksjekurs });
    else if (inn.utbytte.modell === "flerfase")
      utb = flerfaseDDM({ utbytteIDag: inn.utbytte.utbytteIDag, vekstFase1: inn.utbytte.vekstFase1, vekstEvig: inn.utbytte.vekst, rE, aksjekurs: inn.aksjekurs });
    else
      utb = totalPayout({ totalUtbetalingNesteAar: inn.utbytte.totalUtbetalingNesteAar, rE, vekst: inn.utbytte.vekst, antallAksjer: inn.antallAksjer, aksjekurs: inn.aksjekurs });
  }

  let mult: MultippelResultat[] | null = null;
  let multSnitt: number | null = null;
  if (inn.multipler.bruk && inn.multipler.peers.length > 0 && inn.antallAksjer > 0) {
    mult = multippelverdsettelse(inn.multipler.peers, { ...inn.multipler.tall, nettoGjeld: inn.nettoGjeld, antallAksjer: inn.antallAksjer, aksjekurs: inn.aksjekurs });
    const valgte = mult.filter((m) => inn.multipler.valgte.includes(m.multippel) && m.verdiPerAksje !== null && m.verdiPerAksje > 0);
    multSnitt = valgte.length ? valgte.reduce((s, m) => s + (m.verdiPerAksje as number), 0) / valgte.length : null;
  }

  const metoder: Metodeverdi[] = [];
  if (dcfRes?.gyldig) {
    const lav = scenarioer ? Math.min(...scenarioer.map((s) => s.verdiPerAksje).filter(isFinite)) : undefined;
    const hoey = scenarioer ? Math.max(...scenarioer.map((s) => s.verdiPerAksje).filter(isFinite)) : undefined;
    metoder.push({ metode: "DCF (fri kontantstrøm)", verdi: dcfRes.verdiPerAksje, lav, hoey, vekt: inn.vekter.dcf });
  }
  if (mult && multSnitt !== null) {
    const valgte = mult.filter((m) => inn.multipler.valgte.includes(m.multippel) && m.verdiPerAksje !== null);
    const lavs = valgte.map((m) => m.verdiLav).filter((v): v is number => v !== null && isFinite(v));
    const hoeys = valgte.map((m) => m.verdiHoey).filter((v): v is number => v !== null && isFinite(v));
    metoder.push({ metode: "Multipler (peers)", verdi: multSnitt, lav: lavs.length ? Math.min(...lavs) : undefined, hoey: hoeys.length ? Math.max(...hoeys) : undefined, vekt: inn.vekter.multipler });
  }
  if (utb?.gyldig && isFinite(utb.verdiPerAksje)) {
    metoder.push({ metode: "Utbyttemodell", verdi: utb.verdiPerAksje, vekt: inn.vekter.utbytte });
  }

  return {
    beta,
    wacc,
    waccBrukt,
    markedsverdi,
    dcf: dcfRes,
    scenarioer,
    sensitivitet: sens,
    implisittWacc: implWacc,
    utbytte: utb,
    multipler: mult,
    multipelSnitt: multSnitt,
    metoder,
    samlet: vurder(metoder, inn.aksjekurs, terskler),
    beregnet: new Date().toISOString(),
  };
};
