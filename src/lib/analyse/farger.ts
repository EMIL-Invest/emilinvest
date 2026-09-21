/**
 * Farger til grafene i analyseverktøyet. Den kategoriske paletten er
 * validert for fargeblindhet mot den kremhvite bakgrunnen (F5F3F0):
 * alle nabopar har ΔE >= 10 for protan/deutan og >= 21 for normalt syn.
 * Rekkefølgen er fast - en serie beholder fargen sin uansett filter.
 */
export const KATEGORI = ["#1F8A5C", "#E08A12", "#2F6FCF", "#D2523A", "#8455B8", "#1A9AA8"] as const;

/** Statusfarger: brukes BARE for godt/nøytralt/dårlig, aldri som seriefarge. */
export const STATUS = {
  god: "#1F8A5C",
  noytral: "#8A7F6A",
  advarsel: "#E08A12",
  daarlig: "#D2523A",
} as const;

/** Divergerende skala til korrelasjons- og sensitivitetsceller: blå (lav) - grå - rød (høy). */
export const divergerende = (t: number): string => {
  // t i [-1, 1]; interpolerer i RGB mellom blå, lys grå og rød
  const klem = Math.max(-1, Math.min(1, isFinite(t) ? t : 0));
  const blaa = [47, 111, 207];
  const graa = [232, 229, 223];
  const roed = [210, 82, 58];
  const [a, b] = klem < 0 ? [graa, blaa] : [graa, roed];
  const s = Math.abs(klem);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * s));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

/** Sekvensiell grønn skala for magnitude (0..1). */
export const sekvensiell = (t: number): string => {
  const klem = Math.max(0, Math.min(1, isFinite(t) ? t : 0));
  const lys = [226, 236, 229];
  const moerk = [31, 138, 92];
  const c = lys.map((v, i) => Math.round(v + (moerk[i] - v) * klem));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

/** Tekstfarge som leses på en gitt bakgrunn (enkel luminans-sjekk). */
export const tekstPaa = (rgb: string): string => {
  const m = rgb.match(/\d+/g);
  if (!m) return "#1B2722";
  const [r, g, b] = m.map(Number);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#1B2722" : "#FFFFFF";
};
