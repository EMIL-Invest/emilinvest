/**
 * Børskrakket — ledertavlen.
 *
 * Én gruppe spiller om gangen på samme maskin, så localStorage holder
 * fint til arrangementet. Lagringen er likevel gjemt bak et lite
 * grensesnitt: vil vi senere dele tavle på tvers av maskiner, bytter vi
 * ut implementasjonen av `lager` med Supabase-kall (tabell med navn,
 * avkastning, sluttverdi, tidspunkt) uten å røre komponentene.
 */

export interface Ledertavleresultat {
  navn: string;
  avkastningPct: number;
  sluttverdi: number;
  /** ISO-tidspunkt for da runden ble fullført. */
  tidspunkt: string;
}

interface Ledertavlelager {
  hent(): Ledertavleresultat[];
  lagre(resultat: Ledertavleresultat): void;
  tom(): void;
}

const NOKKEL = "emil-borskrakket-ledertavle";

const localStorageLager: Ledertavlelager = {
  hent() {
    try {
      const raa = localStorage.getItem(NOKKEL);
      if (!raa) return [];
      const data = JSON.parse(raa);
      if (!Array.isArray(data)) return [];
      return data.filter(
        (r): r is Ledertavleresultat =>
          typeof r?.navn === "string" &&
          typeof r?.avkastningPct === "number" &&
          typeof r?.sluttverdi === "number"
      );
    } catch {
      return [];
    }
  },
  lagre(resultat) {
    try {
      localStorage.setItem(NOKKEL, JSON.stringify([...localStorageLager.hent(), resultat]));
    } catch {
      // full/blokkert localStorage skal ikke velte selve spillet
    }
  },
  tom() {
    try {
      localStorage.removeItem(NOKKEL);
    } catch {
      // samme her
    }
  },
};

const lager: Ledertavlelager = localStorageLager;

/** Alle lagrede resultater, beste først. */
export const hentLedertavle = (): Ledertavleresultat[] =>
  lager.hent().sort((a, b) => b.avkastningPct - a.avkastningPct);

export const lagreResultat = (resultat: Ledertavleresultat): void => lager.lagre(resultat);

export const tomLedertavle = (): void => lager.tom();
