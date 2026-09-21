import { supabase } from "@/integrations/supabase/client";
import type { Anbefaling, Terskler } from "@/lib/finans/konklusjon";
import type { Frekvens } from "@/lib/finans/statistikk";

/**
 * Datalag for analyseverktøyet: lagrede verdsettelser, porteføljeanalyser
 * og felles forutsetninger. Tabellene kommer fra 28_analyseverktoy.sql og
 * finnes ikke i den autogenererte types.ts - derfor samme type-omgåelse
 * som i aksjeprofiler.ts, samlet her.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (tabell: string) => any };

const manglerTabell = (feil: { code?: string; message?: string } | null): boolean =>
  !!feil && (feil.code === "42P01" || /does not exist|schema cache/i.test(feil.message ?? ""));

/* ------------------------------ forutsetninger ---------------------------- */

export interface Forutsetninger {
  risikofriRente: number;
  markedspremie: number;
  skattesats: number;
  markedsindeks: string;
  frekvens: Frekvens;
  historikk: "1y" | "2y" | "3y" | "5y" | "10y";
  terskler: Terskler;
  metodevekter: { dcf: number; multipler: number; utbytte: number };
}

export const STANDARD_FORUTSETNINGER: Forutsetninger = {
  risikofriRente: 0.04,
  markedspremie: 0.05,
  skattesats: 0.22,
  markedsindeks: "OSEBX.OL",
  frekvens: "ukentlig",
  historikk: "3y",
  terskler: { kjop: 0.15, selg: -0.1 },
  metodevekter: { dcf: 0.5, multipler: 0.3, utbytte: 0.2 },
};

export const hentForutsetninger = async (): Promise<Forutsetninger> => {
  const { data, error } = await db.from("analysis_settings").select("key, value");
  if (error) {
    if (manglerTabell(error)) return STANDARD_FORUTSETNINGER;
    throw error;
  }
  const m = new Map<string, unknown>((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
  const num = (k: string, fallback: number) => {
    const v = Number(m.get(k));
    return isFinite(v) ? v : fallback;
  };
  const s = STANDARD_FORUTSETNINGER;
  const vekter = (m.get("metodevekter") as Forutsetninger["metodevekter"] | undefined) ?? s.metodevekter;
  return {
    risikofriRente: num("risikofri_rente", s.risikofriRente),
    markedspremie: num("markedspremie", s.markedspremie),
    skattesats: num("skattesats", s.skattesats),
    markedsindeks: (m.get("markedsindeks") as string) ?? s.markedsindeks,
    frekvens: ((m.get("frekvens") as Frekvens) ?? s.frekvens),
    historikk: ((m.get("historikk") as Forutsetninger["historikk"]) ?? s.historikk),
    terskler: { kjop: num("terskel_kjop", s.terskler.kjop), selg: num("terskel_selg", s.terskler.selg) },
    metodevekter: { ...s.metodevekter, ...vekter },
  };
};

export const lagreForutsetninger = async (f: Forutsetninger): Promise<void> => {
  const rader = [
    { key: "risikofri_rente", value: f.risikofriRente },
    { key: "markedspremie", value: f.markedspremie },
    { key: "skattesats", value: f.skattesats },
    { key: "markedsindeks", value: f.markedsindeks },
    { key: "frekvens", value: f.frekvens },
    { key: "historikk", value: f.historikk },
    { key: "terskel_kjop", value: f.terskler.kjop },
    { key: "terskel_selg", value: f.terskler.selg },
    { key: "metodevekter", value: f.metodevekter },
  ].map((r) => ({ ...r, updated_at: new Date().toISOString() }));
  const { error } = await db.from("analysis_settings").upsert(rader, { onConflict: "key" });
  if (error) throw error;
};

/* ------------------------------- verdsettelser ---------------------------- */

export type VerdsettelseStatus = "utkast" | "ferdig";

export interface LagretVerdsettelse<I = unknown, R = unknown> {
  id: string;
  ticker: string;
  selskapsnavn: string;
  valuta: string;
  status: VerdsettelseStatus;
  inputs: I;
  resultater: R;
  anbefaling: Anbefaling | null;
  konklusjon: string | null;
  notat: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const hentVerdsettelser = async <I, R>(): Promise<LagretVerdsettelse<I, R>[]> => {
  const { data, error } = await db.from("valuations").select("*").order("updated_at", { ascending: false });
  if (error) {
    if (manglerTabell(error)) return [];
    throw error;
  }
  return (data ?? []) as LagretVerdsettelse<I, R>[];
};

export const lagreVerdsettelse = async <I, R>(
  v: Partial<LagretVerdsettelse<I, R>> & { ticker: string; selskapsnavn: string },
): Promise<LagretVerdsettelse<I, R>> => {
  const { data: session } = await supabase.auth.getUser();
  const rad = { ...v, created_by: v.created_by ?? session.user?.id ?? null };
  const { data, error } = await db.from("valuations").upsert(rad).select().single();
  if (error) throw error;
  return data as LagretVerdsettelse<I, R>;
};

export const slettVerdsettelse = async (id: string): Promise<void> => {
  const { error } = await db.from("valuations").delete().eq("id", id);
  if (error) throw error;
};

/* ---------------------------- porteføljeanalyser --------------------------- */

export interface LagretPortefoljeanalyse<P = unknown, R = unknown> {
  id: string;
  tittel: string;
  parametre: P;
  resultater: R;
  notat: string | null;
  created_by: string | null;
  created_at: string;
}

export const hentPortefoljeanalyser = async <P, R>(): Promise<LagretPortefoljeanalyse<P, R>[]> => {
  const { data, error } = await db
    .from("portfolio_analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) {
    if (manglerTabell(error)) return [];
    throw error;
  }
  return (data ?? []) as LagretPortefoljeanalyse<P, R>[];
};

export const lagrePortefoljeanalyse = async <P, R>(
  a: Omit<LagretPortefoljeanalyse<P, R>, "id" | "created_at" | "created_by">,
): Promise<void> => {
  const { data: session } = await supabase.auth.getUser();
  const { error } = await db.from("portfolio_analyses").insert({ ...a, created_by: session.user?.id ?? null });
  if (error) throw error;
};

export const slettPortefoljeanalyse = async (id: string): Promise<void> => {
  const { error } = await db.from("portfolio_analyses").delete().eq("id", id);
  if (error) throw error;
};
