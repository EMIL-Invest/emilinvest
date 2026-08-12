import { supabase } from "@/integrations/supabase/client";

/**
 * Datalag for aksjesidene (nøkkeltall, regnskap, bransjeforklaring).
 *
 * Tabellene stock_profiles og stock_financials finnes ikke i den
 * autogenererte types.ts ennå — den regenereres med
 * `supabase gen types typescript`. Til da ligger den ene nødvendige
 * type-omgåelsen samlet HER, med egne typer under, slik at resten av
 * koden er fullt typet.
 */
const db = supabase as unknown as {
  from: (tabell: string) => any;
};

/**
 * Tabellene finnes ikke før 10_aksjeprofiler.sql er kjørt i Supabase.
 * Da svarer PostgREST med 42P01 («relation does not exist»). Det skal
 * ikke gi en feilmelding til brukeren — siden skal bare se tom ut, slik
 * at koden kan deployes før SQL-skriptet kjøres.
 */
const manglerTabell = (feil: { code?: string; message?: string } | null): boolean =>
  !!feil && (feil.code === "42P01" || /does not exist|schema cache/i.test(feil.message ?? ""));

export type Periodetype = "ar" | "kvartal";

export interface Aksjeprofil {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  exchange: string | null;
  valuta: string;
  kort_beskrivelse: string | null;
  bransjeforklaring: string | null;
  nettside: string | null;
  borsverdi_mrd: number | null;
  pe: number | null;
  pb: number | null;
  ps: number | null;
  ev_ebitda: number | null;
  ev_ebit: number | null;
  utbytte_prosent: number | null;
  roe_prosent: number | null;
  egenkapitalandel: number | null;
  netto_gjeld_ebitda: number | null;
  tall_per_dato: string | null;
  kilde: string | null;
  updated_at: string;
}

export interface Regnskapsperiode {
  id: string;
  ticker: string;
  periode_type: Periodetype;
  periode_navn: string;
  periode_slutt: string;
  omsetning: number | null;
  ebitda: number | null;
  ebit: number | null;
  resultat: number | null;
  egenkapital: number | null;
  netto_gjeld: number | null;
}

/** Feltene i regnskapstabellen, i visningsrekkefølge. */
export const REGNSKAPSLINJER: { felt: keyof Regnskapsperiode; navn: string }[] = [
  { felt: "omsetning", navn: "Omsetning" },
  { felt: "ebitda", navn: "EBITDA" },
  { felt: "ebit", navn: "EBIT" },
  { felt: "resultat", navn: "Resultat etter skatt" },
  { felt: "egenkapital", navn: "Egenkapital" },
  { felt: "netto_gjeld", navn: "Netto gjeld" },
];

export const hentProfil = async (ticker: string): Promise<Aksjeprofil | null> => {
  const { data, error } = await db
    .from("stock_profiles")
    .select("*")
    .eq("ticker", ticker)
    .maybeSingle();
  if (error) {
    if (manglerTabell(error)) return null;
    throw error;
  }
  return (data as Aksjeprofil) ?? null;
};

export const hentAlleProfiler = async (): Promise<Aksjeprofil[]> => {
  const { data, error } = await db.from("stock_profiles").select("*").order("name");
  if (error) {
    if (manglerTabell(error)) return [];
    throw error;
  }
  return (data as Aksjeprofil[]) ?? [];
};

export const hentRegnskap = async (ticker: string): Promise<Regnskapsperiode[]> => {
  const { data, error } = await db
    .from("stock_financials")
    .select("*")
    .eq("ticker", ticker)
    .order("periode_slutt", { ascending: true });
  if (error) {
    if (manglerTabell(error)) return [];
    throw error;
  }
  return (data as Regnskapsperiode[]) ?? [];
};

export const lagreProfil = async (profil: Partial<Aksjeprofil>) => {
  const { error } = await db
    .from("stock_profiles")
    .upsert(profil, { onConflict: "ticker" });
  if (error) throw error;
};

export const lagrePeriode = async (periode: Partial<Regnskapsperiode>) => {
  const { error } = await db
    .from("stock_financials")
    .upsert(periode, { onConflict: "ticker,periode_type,periode_navn" });
  if (error) throw error;
};

export const slettPeriode = async (id: string) => {
  const { error } = await db.from("stock_financials").delete().eq("id", id);
  if (error) throw error;
};

export const slettProfil = async (ticker: string) => {
  const { error } = await db.from("stock_profiles").delete().eq("ticker", ticker);
  if (error) throw error;
};

/** «12 345» / «–» for tall som mangler. Beløp er i millioner. */
export const formatTall = (v: number | null | undefined, desimaler = 0): string =>
  v === null || v === undefined || !isFinite(v)
    ? "–"
    : v.toLocaleString("no-NO", {
        minimumFractionDigits: desimaler,
        maximumFractionDigits: desimaler,
      });

/** Margin i prosent, eller null når grunnlaget mangler. */
export const margin = (tall: number | null, omsetning: number | null): number | null =>
  tall === null || omsetning === null || omsetning === 0 ? null : (tall / omsetning) * 100;
