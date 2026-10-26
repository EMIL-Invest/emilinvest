import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Indeksene forsiden kan sammenligne porteføljen med, i visningsrekkefølge. */
export const INDEKS_NOEKLER = ["verden", "oslo", "dow", "sp500"] as const;
export type IndeksNoekkel = (typeof INDEKS_NOEKLER)[number];

export interface IndeksPunkt {
  d: string;
  c: number;
}

export interface IndeksSerie {
  navn: string;
  /** Sluttkurser i NOK, eldste først. */
  punkter: IndeksPunkt[];
}

/**
 * Henter indeksenes kurshistorikk (i NOK) fra edge-funksjonen indeks-historikk.
 * Feiler kallet, får man et tomt objekt - forsiden viser da bare porteføljen.
 */
export const useIndekser = () => {
  const [serier, setSerier] = useState<Partial<Record<IndeksNoekkel, IndeksSerie>>>({});
  const [laster, setLaster] = useState(true);

  useEffect(() => {
    let aktiv = true;
    supabase.functions
      .invoke("indeks-historikk", { body: {} })
      .then(({ data, error }) => {
        if (!aktiv) return;
        if (error || !data?.serier) console.error("Kunne ikke hente indekser:", error);
        else setSerier(data.serier);
      })
      .finally(() => aktiv && setLaster(false));
    return () => {
      aktiv = false;
    };
  }, []);

  return { serier, laster };
};

/** Kurs på dato d, eller siste kjente før d (helger og helligdager). */
export const kursPaa = (punkter: IndeksPunkt[], d: string): number | null => {
  let svar: number | null = null;
  for (const p of punkter) {
    if (p.d > d) break;
    svar = p.c;
  }
  return svar;
};

/** Endring i prosent fra nest siste til siste punkt - «i dag» i kurslinjen. */
export const dagsendring = (punkter: IndeksPunkt[]): number | null => {
  if (punkter.length < 2) return null;
  const [forrige, siste] = punkter.slice(-2);
  return (siste.c / forrige.c - 1) * 100;
};
