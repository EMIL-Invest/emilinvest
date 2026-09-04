import { supabase } from "@/integrations/supabase/client";

/**
 * Børskrakket - ledertavlen.
 *
 * Resultatene ligger i Supabase-tabellen game_leaderboard, så alle ser
 * samme tavle uansett enhet: gruppene kan spille fra egne telefoner og
 * havne i samme liste. Se supabase/manual/18_ledertavle_borskrakket.sql
 * for tabell og RLS (alle kan lese og legge inn, ingen kan endre andres
 * rader, admin kan rydde).
 *
 * OFFLINE-KØ: mister nettleseren nettet i det tiden går ut, ville
 * resultatet vært tapt for godt - og på et arrangement er det en gruppe
 * som har spilt for ingenting. Derfor legges et mislykket lagringsforsøk
 * i localStorage og sendes på nytt neste gang tavlen hentes.
 */

const SPILL = "borskrakket";
const KO_NOKKEL = "emil-borskrakket-ukjorte-resultater";

/**
 * game_leaderboard er ikke med i de genererte Supabase-typene ennå.
 * Type-omgåelsen ligger samlet her, slik at resten av fila er typet.
 */
const db = supabase as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (tabell: string) => any;
};

export interface Ledertavleresultat {
  navn: string;
  avkastningPct: number;
  sluttverdi: number;
  /** Tidspunktet raden fikk i databasen (created_at). */
  tidspunkt: string;
}

interface RaaRad {
  gruppenavn: string;
  avkastning_pct: number;
  sluttverdi: number;
  created_at: string;
}

/** Det som ligger i køen har ennå ikke fått noe created_at fra basen. */
type KoRad = Omit<Ledertavleresultat, "tidspunkt">;

const tilRad = (r: RaaRad): Ledertavleresultat => ({
  navn: r.gruppenavn,
  avkastningPct: Number(r.avkastning_pct),
  sluttverdi: Number(r.sluttverdi),
  tidspunkt: r.created_at,
});

/* ---------------- offline-kø ---------------- */

const lesKo = (): KoRad[] => {
  try {
    const raa = localStorage.getItem(KO_NOKKEL);
    const data = raa ? JSON.parse(raa) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const skrivKo = (ko: KoRad[]) => {
  try {
    if (ko.length === 0) localStorage.removeItem(KO_NOKKEL);
    else localStorage.setItem(KO_NOKKEL, JSON.stringify(ko));
  } catch {
    // full eller blokkert localStorage skal ikke velte spillet
  }
};

/** Sender én rad. Returnerer databasens created_at, eller null ved feil. */
const send = async (resultat: KoRad): Promise<string | null> => {
  const { data, error } = await db
    .from("game_leaderboard")
    .insert([
      {
        spill: SPILL,
        gruppenavn: resultat.navn,
        avkastning_pct: Number(resultat.avkastningPct.toFixed(4)),
        sluttverdi: Math.round(resultat.sluttverdi),
      },
    ])
    .select("created_at")
    .single();

  if (error || !data) {
    console.error("Kunne ikke lagre til ledertavlen:", error);
    return null;
  }
  return (data as { created_at: string }).created_at;
};

/** Prøver å sende det som ligger i køen. Det som fortsatt feiler, blir liggende. */
const tomKo = async (): Promise<void> => {
  const ko = lesKo();
  if (ko.length === 0) return;
  const gjenstar: KoRad[] = [];
  for (const resultat of ko) {
    if ((await send(resultat)) === null) gjenstar.push(resultat);
  }
  skrivKo(gjenstar);
};

/* ---------------- offentlig API ---------------- */

/**
 * Lagrer et resultat. Returnerer databasens tidspunkt for raden, eller
 * null hvis den ble lagt i køen for et nytt forsøk senere.
 */
export const lagreResultat = async (resultat: KoRad): Promise<string | null> => {
  const tidspunkt = await send(resultat);
  if (tidspunkt === null) skrivKo([...lesKo(), resultat]);
  return tidspunkt;
};

/** Alle resultater, beste først. Tømmer køen på veien. */
export const hentLedertavle = async (): Promise<Ledertavleresultat[]> => {
  await tomKo();
  const { data, error } = await db
    .from("game_leaderboard")
    .select("gruppenavn, avkastning_pct, sluttverdi, created_at")
    .eq("spill", SPILL)
    .order("avkastning_pct", { ascending: false })
    .limit(50);

  if (error || !data) {
    console.error("Kunne ikke hente ledertavlen:", error);
    return [];
  }
  return (data as RaaRad[]).map(tilRad);
};
