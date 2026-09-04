import { useEffect, useState } from "react";
import { formatPct } from "@/lib/invest-game/motor";
import { hentLedertavle, type Ledertavleresultat } from "@/lib/invest-game/ledertavle";

interface LedertavleProps {
  /** Hvor mange plasseringer som vises. */
  antall?: number;
  /** Tidspunktet til rundens eget resultat - den raden uthever vi. */
  uthevTidspunkt?: string;
  /** Bumpes for å tvinge en ny henting (f.eks. etter at et resultat er lagret). */
  nokkel?: string | number;
}

/**
 * Ledertavlen, delt mellom introskjermen og resultatskjermen.
 * Henter fra Supabase, så den er lik på alle enheter.
 */
const Ledertavle = ({ antall = 10, uthevTidspunkt, nokkel }: LedertavleProps) => {
  const [rader, setRader] = useState<Ledertavleresultat[] | null>(null);

  useEffect(() => {
    let avbrutt = false;
    hentLedertavle().then((r) => {
      if (!avbrutt) setRader(r);
    });
    return () => {
      avbrutt = true;
    };
  }, [nokkel]);

  if (rader === null) {
    return (
      <div className="space-y-2.5" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 py-1.5">
            <div className="h-3 w-4 rounded bg-secondary animate-pulse" />
            <div className="h-3 flex-1 rounded bg-secondary animate-pulse" />
            <div className="h-3 w-14 rounded bg-secondary animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (rader.length === 0) {
    return (
      <p className="text-sm text-muted-foreground leading-relaxed">
        Ingen har spilt ennå. Første gruppe som fullfører, legger seg øverst.
      </p>
    );
  }

  return (
    <ol className="space-y-1">
      {rader.slice(0, antall).map((r, i) => {
        const erDenne = !!uthevTidspunkt && r.tidspunkt === uthevTidspunkt;
        return (
          <li
            key={`${r.navn}-${r.tidspunkt}`}
            className="flex items-baseline gap-4 rounded-[4px] px-3 py-1.5"
            style={erDenne ? { background: "hsl(var(--competition) / 0.12)" } : undefined}
          >
            <span className="font-serif text-lg text-muted-foreground w-5 tabular-nums">
              {i + 1}
            </span>
            <span className="flex-1 text-sm font-medium text-foreground truncate">{r.navn}</span>
            <span
              className={`font-serif text-lg tabular-nums ${
                r.avkastningPct >= 0 ? "stock-positive" : "stock-negative"
              }`}
            >
              {formatPct(r.avkastningPct)}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export default Ledertavle;
