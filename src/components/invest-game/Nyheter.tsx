import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import type { Nyhet } from "@/config/invest-game/spillet";

const RetningsIkon = ({ retning }: { retning: Nyhet["retning"] }) => {
  if (retning === "opp") return <TrendingUp className="w-4 h-4 stock-positive flex-shrink-0" />;
  if (retning === "ned") return <TrendingDown className="w-4 h-4 stock-negative flex-shrink-0" />;
  return <ArrowUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
};

/**
 * Banneret: tydelig, men det dekker ingenting og krever ingen klikk.
 * Det ligger i dokumentflyten rett under topplinjen og forsvinner av
 * seg selv når visningstiden er ute.
 */
export const NyhetsBanner = ({ nyhet }: { nyhet: Nyhet | null }) => {
  if (!nyhet) return null;
  return (
    <div className="section-container pt-4" role="status" aria-live="polite">
      <div
        className="rounded-md border overflow-hidden animate-fade-in"
        style={{ borderColor: "hsl(var(--competition) / 0.5)", background: "hsl(var(--card))" }}
      >
        <div className="h-1 w-full" style={{ background: "hsl(var(--competition))" }} />
        <div className="px-5 py-4 flex items-start gap-4">
          <span
            className="text-[0.6rem] uppercase tracking-[0.2em] font-semibold mt-1"
            style={{ color: "hsl(32 85% 38%)" }}
          >
            Nytt
          </span>
          <div className="min-w-0">
            <p className="font-serif text-lg md:text-xl text-foreground leading-snug">
              {nyhet.tittel}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">{nyhet.tekst}</p>
            <p className="text-sm text-foreground mt-1.5 flex items-center gap-2">
              <RetningsIkon retning={nyhet.retning} />
              {nyhet.konsekvens}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Feeden i sidespalten: de siste nyhetene, nyeste øverst. */
export const NyhetsFeed = ({ nyheter }: { nyheter: Nyhet[] }) => (
  <div
    className="rounded-md border border-border bg-card p-5"
    style={{ boxShadow: "var(--shadow-soft)" }}
  >
    <p className="eyebrow mb-4">Nyheter</p>
    {nyheter.length === 0 ? (
      <p className="text-sm text-muted-foreground leading-relaxed">
        Ingen nyheter ennå. Følg med - de forteller hvor markedet er på vei.
      </p>
    ) : (
      <ol className="space-y-4">
        {nyheter.slice(0, 4).map((nyhet) => (
          <li key={nyhet.tidSek} className="flex gap-3">
            <span className="text-xs text-muted-foreground tabular-nums mt-0.5 w-10 flex-shrink-0">
              {/* Når i løpet nyheten kom, som medgått tid mm:ss */}
              {`${String(Math.floor(nyhet.tidSek / 60)).padStart(2, "0")}:${String(nyhet.tidSek % 60).padStart(2, "0")}`}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug flex items-center gap-2">
                <RetningsIkon retning={nyhet.retning} />
                {nyhet.tittel}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {nyhet.konsekvens}
              </p>
            </div>
          </li>
        ))}
      </ol>
    )}
  </div>
);
