/**
 * Filtrering i aksjevelgeren i konkurransen.
 *
 * Sektorene i oslo_stocks er skrevet inn for hånd over tid, så samme sektor
 * finnes under flere navn ("Shipping / LPG", "Technology", "IT / Teknologi").
 * Her slås de sammen til én ren liste. Dataene i databasen endres ikke.
 */
import { getExchangeFromTicker } from "@/lib/exchangeHours";

// Navn (eller første del før " / ") som skal over i en annen sektor.
const SEKTOR_ALIAS: Record<string, string> = {
  technology: "Teknologi",
  it: "Teknologi",
  materials: "Materialer",
  seafood: "Sjømat",
  energitjenester: "Energi",
  offshore: "Energi",
  hydrogen: "Fornybar energi",
  "grønn energi": "Fornybar energi",
  forsikring: "Finans",
  rådgivning: "Industri",
  detaljhandel: "Handel",
  forbruk: "Konsumvarer",
  luksus: "Konsumvarer",
};

/** Gir den sammenslåtte sektoren for en rå sektor fra databasen. */
export function sektorGruppe(sektor: string | null | undefined): string {
  const rå = (sektor ?? "").trim();
  if (!rå) return "Annet";
  // "Shipping / LPG" -> "Shipping", "Energi / Olje" -> "Energi"
  const hoved = rå.split("/")[0].trim();
  return SEKTOR_ALIAS[hoved.toLowerCase()] ?? SEKTOR_ALIAS[rå.toLowerCase()] ?? hoved;
}

// Rekkefølge og korte navn i markedsfilteret. Krypto er ikke en børs,
// derfor heter standardvalget "Alle markeder" og ikke "Alle børser".
const MARKEDER: { kode: string; navn: string }[] = [
  { kode: "OSL", navn: "Oslo Børs" },
  { kode: "NYSE", navn: "NYSE" },
  { kode: "NASDAQ", navn: "Nasdaq" },
  { kode: "STO", navn: "Stockholm" },
  { kode: "CPH", navn: "København" },
  { kode: "HEL", navn: "Helsingfors" },
  { kode: "LSE", navn: "London" },
  { kode: "XETRA", navn: "Frankfurt (Xetra)" },
  { kode: "EPA", navn: "Paris (Euronext)" },
  { kode: "AMS", navn: "Amsterdam (Euronext)" },
  { kode: "SWX", navn: "Sveits (SIX)" },
  { kode: "TSE", navn: "Tokyo" },
  { kode: "HKEX", navn: "Hongkong" },
  { kode: "KRX", navn: "Korea" },
  { kode: "CRYPTO", navn: "Krypto" },
];

/** Markedskoden for en aksje, med ticker som reserve når exchange mangler. */
export function aksjeMarked(stock: { ticker: string; exchange?: string | null }): string {
  return stock.exchange || getExchangeFromTicker(stock.ticker);
}

export function markedNavn(kode: string): string {
  return MARKEDER.find((m) => m.kode === kode)?.navn ?? kode;
}

/** Sorterer markedskodene i fast rekkefølge, ukjente til slutt. */
export function sorterMarkeder(koder: string[]): string[] {
  const indeks = (k: string) => {
    const i = MARKEDER.findIndex((m) => m.kode === k);
    return i === -1 ? MARKEDER.length : i;
  };
  return [...koder].sort((a, b) => indeks(a) - indeks(b) || a.localeCompare(b));
}
