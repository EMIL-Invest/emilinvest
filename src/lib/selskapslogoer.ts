/**
 * Nettsidene til selskapene vi eier, slik at logoen kan hentes i
 * nettleseren (ikonet nettstedet selv publiserer). Nøkkelen er tickeren
 * uten børssuffiks. Mangler et selskap her, vises en bokstav i stedet,
 * så nye kjøp ser aldri ødelagte ut - legg bare til domenet.
 */
export const SELSKAPSDOMENE: Record<string, string> = {
  GOOGL: "google.com",
  GOOG: "google.com",
  DNB: "dnb.no",
  SALM: "salmar.no",
  BRG: "borregaard.com",
  PROT: "protector.no",
  TSM: "tsmc.com",
  PRY: "prysmian.com",
  KIT: "kitron.com",
  YAR: "yara.com",
  "NOVO-B": "novonordisk.com",
  AKERBP: "akerbp.com",
  AKRBP: "akerbp.com",
  NHY: "hydro.com",
  ABB: "abb.com",
  SPCX: "spacex.com",
  EQNR: "equinor.com",
  MOWI: "mowi.com",
  ORK: "orkla.com",
  TEL: "telenor.com",
  KOG: "kongsberg.com",
};

export const logoUrl = (tickerUtenSuffiks: string): string | null => {
  const domene = SELSKAPSDOMENE[tickerUtenSuffiks.toUpperCase()];
  return domene ? `https://www.google.com/s2/favicons?domain=${domene}&sz=128` : null;
};

/** Kortere visningsnavn: «Salmar ASA» → «Salmar». */
export const kortNavn = (navn: string) =>
  navn
    .replace(/\s+(ASA|AB|A\/S|AS|SpA|S\.p\.A\.|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|plc|N\.V\.|SE|Class [A-C]|ser\. ?[A-C])\b.*$/i, "")
    .trim();

