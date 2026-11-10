import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Daglige sluttkurser for porteføljens aksjer siste år (fra edge-funksjonen
 * price-history i åpen modus), regnet om til kroner. Brukes til å vise
 * utvikling for 1 uke, 1 måned osv. i beholdningstabellen.
 */

interface Punkt { d: string; c: number }
interface Svar {
  series?: Record<string, { currency: string; points: Punkt[] }>;
  fx?: Record<string, Punkt[]>;
}

export type Periode = "kjop" | "1u" | "2u" | "1m" | "3m" | "6m" | "1a";

export const PERIODER: { id: Periode; navn: string }[] = [
  { id: "kjop", navn: "Siden kjøp" },
  { id: "1u", navn: "1 uke" },
  { id: "2u", navn: "2 uker" },
  { id: "1m", navn: "1 måned" },
  { id: "3m", navn: "3 måneder" },
  { id: "6m", navn: "6 måneder" },
  { id: "1a", navn: "1 år" },
];

/** Startdatoen for en periode, som ÅÅÅÅ-MM-DD. */
export const periodeStart = (p: Exclude<Periode, "kjop">, naa = new Date()): string => {
  const d = new Date(naa);
  if (p === "1u") d.setDate(d.getDate() - 7);
  else if (p === "2u") d.setDate(d.getDate() - 14);
  else if (p === "1m") d.setMonth(d.getMonth() - 1);
  else if (p === "3m") d.setMonth(d.getMonth() - 3);
  else if (p === "6m") d.setMonth(d.getMonth() - 6);
  else d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
};

/** Siste kurs på eller før datoen (børsen kan ha vært stengt den dagen). */
const kursPaa = (punkter: Punkt[], dato: string): number | null => {
  let svar: number | null = null;
  for (const p of punkter) {
    if (p.d > dato) break;
    svar = p.c;
  }
  // Datoen er før første punkt: bruk det første vi har
  return svar ?? punkter[0]?.c ?? null;
};

export const usePeriodeKurser = (aktiv: boolean) => {
  const [data, setData] = useState<Svar | null>(null);
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState(false);

  useEffect(() => {
    if (!aktiv || data || laster) return;
    setLaster(true);
    supabase.functions
      .invoke("price-history", { body: { portefolje: true } })
      .then(({ data: svar, error }) => {
        if (error || !svar?.series) setFeil(true);
        else setData(svar as Svar);
      })
      .catch(() => setFeil(true))
      .finally(() => setLaster(false));
  }, [aktiv, data, laster]);

  /** Kursen i kroner for en ticker på en gitt dato, eller null. */
  const kursINok = (ticker: string, dato: string): number | null => {
    const s = data?.series?.[ticker];
    if (!s || s.points.length === 0) return null;
    const c = kursPaa(s.points, dato);
    if (c == null) return null;
    if (!s.currency || s.currency === "NOK") return c;
    const fx = data?.fx?.[s.currency];
    const kurs = fx ? kursPaa(fx, dato) : null;
    return kurs ? c * kurs : null;
  };

  return { laster, feil, klar: !!data, kursINok };
};
