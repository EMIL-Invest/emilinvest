import { supabase } from "@/integrations/supabase/client";
import type { Holding } from "@/hooks/usePortfolioData";

/**
 * Handelsloggen for den ekte porteføljen (tabell fra 32_handelslogg.sql).
 * Hver handel, utbytte og gebyr lagres her. Kontantene regnes ut som
 * innskutt kapital (capital_flows) + summen av belop_nok.
 * Tabellene finnes ikke i den autogenererte types.ts - derfor type-omgåelsen.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (tabell: string) => any };

export type HandelsType = "kjop" | "salg" | "utbytte" | "gebyr";

export const HANDELSTYPER: Record<HandelsType, string> = {
  kjop: "Kjøp",
  salg: "Salg",
  utbytte: "Utbytte",
  gebyr: "Gebyr / annet",
};

export interface Handel {
  id: string;
  trade_date: string;
  type: HandelsType;
  ticker: string | null;
  name: string | null;
  quantity: number | null;
  price_nok: number | null;
  fees_nok: number;
  belop_nok: number;
  note: string | null;
  created_at: string;
}

export type NyHandel = Omit<Handel, "id" | "created_at">;

/** Kontanteffekten av en handel: kjøp og gebyr trekker penger, salg og utbytte gir penger. */
export const kontantEffekt = (
  type: HandelsType,
  antall: number,
  kurs: number,
  kurtasje: number,
  beloep: number,
): number => {
  switch (type) {
    case "kjop":
      return -(antall * kurs + kurtasje);
    case "salg":
      return antall * kurs - kurtasje;
    case "utbytte":
      return beloep - kurtasje;
    case "gebyr":
      return -(beloep + kurtasje);
  }
};

const tall = (x: unknown): number => Number(x) || 0;

export const hentHandler = async (): Promise<Handel[]> => {
  const { data, error } = await db
    .from("portfolio_transactions")
    .select("*")
    .order("trade_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    // Tabellen finnes ikke før 32_handelslogg.sql er kjørt.
    console.warn("Handelslogg utilgjengelig:", error.message);
    return [];
  }
  return (data ?? []).map((h: Handel) => ({
    ...h,
    quantity: h.quantity === null ? null : tall(h.quantity),
    price_nok: h.price_nok === null ? null : tall(h.price_nok),
    fees_nok: tall(h.fees_nok),
    belop_nok: tall(h.belop_nok),
  }));
};

/**
 * Kontanter = innskutt kapital + summen av handelsloggen.
 * Gir null hvis handelsloggen ikke finnes ennå (da vet vi ikke kontantene).
 */
export const hentKontanter = async (): Promise<number | null> => {
  const [flyt, handler] = await Promise.all([
    db.from("capital_flows").select("amount"),
    db.from("portfolio_transactions").select("belop_nok"),
  ]);
  if (flyt.error || handler.error) return null;
  const inn = (flyt.data ?? []).reduce((s: number, r: { amount: unknown }) => s + tall(r.amount), 0);
  const netto = (handler.data ?? []).reduce((s: number, r: { belop_nok: unknown }) => s + tall(r.belop_nok), 0);
  return inn + netto;
};

export interface Posisjonsinfo {
  name: string;
  sector: string | null;
  exchange: string | null;
}

/**
 * Lagrer handelen i loggen og oppdaterer beholdningen tilsvarende:
 * - kjøp: øker antallet (eller legger til ny aksje), kostpris inkl. kurtasje
 * - salg: reduserer antallet, kostprisen går ned forholdsmessig (snittkost);
 *   selges alt, fjernes aksjen fra beholdningen
 * - utbytte/gebyr: bare kontanter, beholdningen endres ikke
 */
export const registrerHandel = async (
  handel: NyHandel,
  holdings: Holding[],
  nyPosisjon?: Posisjonsinfo,
): Promise<void> => {
  const ticker = handel.ticker?.trim().toUpperCase() || null;
  const eksisterende = ticker ? holdings.find((h) => h.ticker.toUpperCase() === ticker) : undefined;
  const antall = handel.quantity ?? 0;
  const kurs = handel.price_nok ?? 0;

  if (handel.type === "salg") {
    if (!eksisterende) throw new Error(`Porteføljen eier ikke ${ticker}.`);
    if (antall > Number(eksisterende.quantity) + 1e-9)
      throw new Error(`Kan ikke selge ${antall} - porteføljen eier bare ${eksisterende.quantity} ${ticker}.`);
  }
  if (handel.type === "kjop" && !eksisterende && !nyPosisjon?.name)
    throw new Error("Ny aksje: fyll inn selskapsnavn.");

  const { error } = await db.from("portfolio_transactions").insert([
    { ...handel, ticker, name: handel.name || eksisterende?.name || nyPosisjon?.name || null },
  ]);
  if (error) throw new Error(error.message);

  if (handel.type === "kjop") {
    const kost = antall * kurs + handel.fees_nok;
    if (eksisterende) {
      const nyttAntall = Number(eksisterende.quantity) + antall;
      const nyKost = Number(eksisterende.cost_basis ?? eksisterende.purchase_price * eksisterende.quantity) + kost;
      const { error: e } = await supabase
        .from("portfolio_holdings")
        .update({ quantity: nyttAntall, cost_basis: nyKost, purchase_price: nyKost / nyttAntall })
        .eq("id", eksisterende.id);
      if (e) throw new Error(`Handelen er logget, men beholdningen ble ikke oppdatert: ${e.message}`);
    } else {
      const { error: e } = await supabase.from("portfolio_holdings").insert([
        {
          ticker: ticker!,
          name: nyPosisjon!.name,
          quantity: antall,
          purchase_price: kost / antall,
          cost_basis: kost,
          holding_type: "stock",
          sector: nyPosisjon!.sector,
          exchange: nyPosisjon!.exchange,
          purchase_date: handel.trade_date,
        },
      ]);
      if (e) throw new Error(`Handelen er logget, men aksjen ble ikke lagt til: ${e.message}`);
    }
  }

  if (handel.type === "salg" && eksisterende) {
    const foer = Number(eksisterende.quantity);
    const igjen = foer - antall;
    if (igjen <= 1e-9) {
      const { error: e } = await supabase.from("portfolio_holdings").delete().eq("id", eksisterende.id);
      if (e) throw new Error(`Handelen er logget, men aksjen ble ikke fjernet: ${e.message}`);
    } else {
      const kostFoer = Number(eksisterende.cost_basis ?? eksisterende.purchase_price * foer);
      const { error: e } = await supabase
        .from("portfolio_holdings")
        .update({ quantity: igjen, cost_basis: (kostFoer * igjen) / foer })
        .eq("id", eksisterende.id);
      if (e) throw new Error(`Handelen er logget, men beholdningen ble ikke oppdatert: ${e.message}`);
    }
  }
};

/** Sletter bare linjen i loggen - beholdningen rettes for hånd under Portefølje. */
export const slettHandel = async (id: string): Promise<void> => {
  const { error } = await db.from("portfolio_transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
};
