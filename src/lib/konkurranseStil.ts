/**
 * Felles klasser for konkurransen: faner, brikker og kjøpsknapp. Fanene ligger
 * som Tailwind-klasser (og ikke CSS) fordi de må overstyre standardstilen til TabsTrigger, og cn() lar de siste
 * klassene vinne.
 */

/** Hovedfaner: tekst med gul strek under den aktive. */
export const FANE =
  "rounded-none bg-transparent px-0 pt-0 pb-3 -mb-px text-[15px] font-normal text-muted-foreground shadow-none border-b-2 border-transparent hover:text-foreground " +
  "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:font-medium data-[state=active]:border-competition";

/** Små valgbrikker på lys bakgrunn; den aktive er mørkegrønn. */
export const BRIKKE =
  "rounded-full border border-border bg-transparent px-3.5 py-1.5 text-[13.5px] font-normal text-muted-foreground shadow-none hover:border-primary/40 hover:text-foreground " +
  "data-[state=active]:bg-band data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-none";

/** Kjøp er hovedhandlingen og får gullfargen, Selg står ved siden av i omriss. */
export const KJOEP = "bg-competition text-competition-foreground hover:bg-competition/90 font-semibold";
