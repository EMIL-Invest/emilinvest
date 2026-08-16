import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Selskap } from "@/config/invest-game/spillet";
import { formatKurs, formatMill } from "@/lib/invest-game/motor";

export interface Handel {
  selskap: Selskap;
  modus: "kjop" | "selg";
}

interface HandelsDialogProps {
  handel: Handel | null;
  kontanter: number;
  posisjonsverdi: number;
  kursNaa: number;
  onKjop: (belop: number) => void;
  onSelg: (andel: number) => void;
  onLukk: () => void;
}

const KJOPSVALG = [
  { belop: 1_000_000, tekst: "1 mill." },
  { belop: 5_000_000, tekst: "5 mill." },
  { belop: 10_000_000, tekst: "10 mill." },
  { belop: 25_000_000, tekst: "25 mill." },
];

const SALGSVALG = [
  { andel: 0.25, tekst: "25 %" },
  { andel: 0.5, tekst: "50 %" },
  { andel: 1, tekst: "100 %" },
];

/**
 * Ett trykk = én handel. Ingen bekreftelsessteg — i et femminutterspill
 * er farten en del av moroa, og en feilhandel kan alltid reverseres med
 * neste trykk.
 */
const HandelsDialog = ({
  handel,
  kontanter,
  posisjonsverdi,
  kursNaa,
  onKjop,
  onSelg,
  onLukk,
}: HandelsDialogProps) => {
  if (!handel) return null;
  const { selskap, modus } = handel;

  return (
    <Dialog open onOpenChange={(åpen) => !åpen && onLukk()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {modus === "kjop" ? "Kjøp" : "Selg"} {selskap.navn}
          </DialogTitle>
          <DialogDescription>
            Kurs {formatKurs(kursNaa)} ·{" "}
            {modus === "kjop"
              ? `${formatMill(kontanter)} tilgjengelig`
              : `dere eier ${formatMill(posisjonsverdi)}`}
          </DialogDescription>
        </DialogHeader>

        {modus === "kjop" ? (
          <div className="grid grid-cols-2 gap-2">
            {KJOPSVALG.map((valg) => (
              <Button
                key={valg.belop}
                variant="outline"
                disabled={valg.belop > kontanter}
                onClick={() => onKjop(valg.belop)}
              >
                {valg.tekst}
              </Button>
            ))}
            <Button
              className="col-span-2"
              disabled={kontanter <= 0}
              onClick={() => onKjop(kontanter)}
            >
              Maks — {formatMill(kontanter)}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {SALGSVALG.map((valg) => (
              <Button
                key={valg.andel}
                variant={valg.andel === 1 ? "default" : "outline"}
                onClick={() => onSelg(valg.andel)}
              >
                {valg.tekst}
              </Button>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Handelen skjer umiddelbart til gjeldende kurs. Ingen gebyrer.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default HandelsDialog;
