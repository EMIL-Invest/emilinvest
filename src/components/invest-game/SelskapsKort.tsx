import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { Selskap } from "@/config/invest-game/spillet";
import {
  formatKurs,
  formatMill,
  formatPct,
  kurs,
  utviklingPct,
  type Post,
} from "@/lib/invest-game/motor";

/**
 * Én mini-graf per selskap: opp, ned, hvor kraftig — mer skal den ikke si.
 * Kursen er en ren funksjon av tiden, så grafen tegnes ved å sample
 * historien fra start til nå. Ingen historikk å vedlikeholde.
 */
const Sparkline = ({ selskap, tSek }: { selskap: Selskap; tSek: number }) => {
  const { punkter, positiv } = useMemo(() => {
    const antall = 60;
    const verdier: number[] = [];
    for (let i = 0; i <= antall; i++) verdier.push(kurs(selskap, (tSek * i) / antall));
    const min = Math.min(...verdier);
    const maks = Math.max(...verdier);
    // Litt luft, og et gulv på spennet slik at småuro ikke ser dramatisk ut.
    const spenn = Math.max(maks - min, selskap.startkurs * 0.06);
    const midt = (maks + min) / 2;
    const pts = verdier
      .map((v, i) => {
        const x = (i / antall) * 100;
        const y = 14 - ((v - midt) / spenn) * 24;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    return { punkter: pts, positiv: verdier[verdier.length - 1] >= verdier[0] };
  }, [selskap, tSek]);

  return (
    <svg viewBox="0 0 100 28" className="w-full h-8" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={punkter}
        fill="none"
        stroke={positiv ? "hsl(153 20% 32%)" : "hsl(14 55% 45%)"}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

interface SelskapsKortProps {
  selskap: Selskap;
  tSek: number;
  post: Post | undefined;
  handelLaast: boolean;
  onKjop: () => void;
  onSelg: () => void;
}

const SelskapsKort = ({ selskap, tSek, post, handelLaast, onKjop, onSelg }: SelskapsKortProps) => {
  const pris = kurs(selskap, tSek);
  const utvikling = utviklingPct(selskap, tSek);
  const eierVerdi = (post?.antall ?? 0) * pris;

  return (
    <div
      className="rounded-md border border-border bg-card p-4 flex flex-col gap-2.5"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground leading-tight truncate">{selskap.navn}</p>
          <p className="text-xs text-muted-foreground">{selskap.sektorNavn}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium tabular-nums text-foreground">{formatKurs(pris)}</p>
          <p
            className={`text-xs tabular-nums ${
              utvikling >= 0 ? "stock-positive" : "stock-negative"
            }`}
          >
            {formatPct(utvikling)}
          </p>
        </div>
      </div>

      <Sparkline selskap={selskap} tSek={tSek} />

      <p className="text-xs text-muted-foreground tabular-nums h-4">
        {eierVerdi > 0 ? `Dere eier ${formatMill(eierVerdi)}` : ""}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" onClick={onKjop} disabled={handelLaast}>
          Kjøp
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onSelg}
          disabled={handelLaast || eierVerdi <= 0}
        >
          Selg
        </Button>
      </div>
    </div>
  );
};

export default SelskapsKort;
