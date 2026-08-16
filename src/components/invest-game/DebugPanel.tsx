import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  NYHETER,
  SEKTOR_TIDSLINJER,
  VARIGHET_SEK,
  type Nyhet,
  type SektorId,
} from "@/config/invest-game/spillet";
import { multiplikator } from "@/lib/invest-game/motor";

interface DebugPanelProps {
  tSek: number;
  pauset: boolean;
  onHoppTil: (sek: number) => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onTriggNyhet: (nyhet: Nyhet) => void;
}

/**
 * Utviklingspanel for testing og balansering. Vises KUN med ?debug i
 * URL-en (håndteres av siden) — det renderes aldri for vanlige spillere,
 * og det finnes ingen knapp som leder hit.
 */
const DebugPanel = ({
  tSek,
  pauset,
  onHoppTil,
  onPauseToggle,
  onReset,
  onTriggNyhet,
}: DebugPanelProps) => {
  const [visTidslinjer, setVisTidslinjer] = useState(false);
  const [visNyheter, setVisNyheter] = useState(false);
  // Hoppunkter hvert 30. sekund, avledet av varigheten — ikke hardkodet,
  // så panelet følger med hvis spillet endrer lengde igjen.
  const stopp: number[] = [];
  for (let s = 30; s < VARIGHET_SEK; s += 30) stopp.push(s);
  const sektorer = Object.keys(SEKTOR_TIDSLINJER) as SektorId[];
  const mmss = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  // Kolonnene i tidslinjetabellen — seks jevne nedslag gjennom løpet.
  const tabelltider = Array.from({ length: 6 }, (_, i) => Math.round((VARIGHET_SEK * i) / 5));

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[340px] max-h-[70vh] overflow-y-auto rounded-md border border-border bg-card p-4 text-xs shadow-lg"
      data-testid="debug-panel"
    >
      <p className="font-medium text-foreground mb-2">
        Debug · t = {tSek.toFixed(1)} s {pauset && "· PAUSET"}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {stopp.map((s) => (
          <Button key={s} size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onHoppTil(s)}>
            {mmss(s)}
          </Button>
        ))}
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onHoppTil(VARIGHET_SEK - 10)}>
          Slutt−10s
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onPauseToggle}>
          {pauset ? "Fortsett" : "Pause"}
        </Button>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onReset}>
          Reset
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => setVisNyheter(!visNyheter)}
        >
          Nyheter
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => setVisTidslinjer(!visTidslinjer)}
        >
          Tidslinjer
        </Button>
      </div>

      {visNyheter && (
        <div className="space-y-1 mb-3">
          {NYHETER.map((n) => (
            <button
              key={n.tidSek}
              onClick={() => onTriggNyhet(n)}
              className="block w-full text-left text-muted-foreground hover:text-foreground"
            >
              {n.tidSek}s · {n.tittel}
            </button>
          ))}
        </div>
      )}

      {visTidslinjer && (
        <table className="w-full tabular-nums">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-normal">Sektor</th>
              {tabelltider.map((t) => (
                <th key={t} className="text-right font-normal">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sektorer.map((sektor) => (
              <tr key={sektor}>
                <td className="text-muted-foreground">{sektor}</td>
                {tabelltider.map((t) => (
                  <td key={t} className="text-right">
                    {multiplikator(SEKTOR_TIDSLINJER[sektor], t).toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DebugPanel;
