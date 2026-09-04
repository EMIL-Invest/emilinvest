import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VARIGHET_SEK } from "@/config/invest-game/spillet";
import {
  avkastningPct,
  formatPct,
  investeringsresultater,
  totalverdi,
  type Portefolje,
} from "@/lib/invest-game/motor";
import Ledertavle from "@/components/invest-game/Ledertavle";

interface ResultatSkjermProps {
  portefolje: Portefolje;
  gruppenavn: string;
  /** Tidspunktet resultatet ble lagret med - brukes til å utheve raden i tavlen. */
  lagretTidspunkt: string;
  /** null mens lagringen pågår, false hvis den havnet i offline-køen. */
  lagringOk: boolean | null;
  onSpillIgjen: () => void;
}

const ResultatSkjerm = ({
  portefolje,
  gruppenavn,
  lagretTidspunkt,
  lagringOk,
  onSpillIgjen,
}: ResultatSkjermProps) => {
  const sluttverdi = totalverdi(portefolje, VARIGHET_SEK);
  const avkastning = avkastningPct(portefolje, VARIGHET_SEK);
  const resultater = investeringsresultater(portefolje, VARIGHET_SEK);
  const beste = resultater[0];
  const darligste = resultater.length > 1 ? resultater[resultater.length - 1] : undefined;

  return (
    <div className="section-container py-14 md:py-20 max-w-2xl">
      <p className="eyebrow mb-6">{gruppenavn}</p>
      <h1 className="font-serif text-4xl md:text-6xl text-foreground mb-6">Børsen er stengt</h1>
      <div className="w-10 h-px bg-foreground/30 mb-10" />

      <div
        className="rounded-md overflow-hidden mb-8"
        style={{ background: "hsl(var(--band))" }}
      >
        <div className="h-1 w-full" style={{ background: "hsl(var(--competition))" }} />
        <div className="p-8 md:p-10 grid sm:grid-cols-2 gap-8">
          <div>
            <p
              className="text-[0.65rem] uppercase tracking-[0.2em] mb-2"
              style={{ color: "hsl(var(--primary-foreground) / 0.55)" }}
            >
              Sluttverdi
            </p>
            <p
              className="font-serif text-3xl md:text-4xl tabular-nums"
              style={{ color: "hsl(var(--primary-foreground))" }}
            >
              {Math.round(sluttverdi).toLocaleString("no-NO")} kr
            </p>
          </div>
          <div>
            <p
              className="text-[0.65rem] uppercase tracking-[0.2em] mb-2"
              style={{ color: "hsl(var(--primary-foreground) / 0.55)" }}
            >
              Avkastning
            </p>
            <p
              className="font-serif text-3xl md:text-4xl tabular-nums"
              style={{
                color:
                  avkastning >= 0 ? "hsl(var(--competition))" : "hsl(14 65% 62%)",
              }}
            >
              {formatPct(avkastning)}
            </p>
          </div>
        </div>
      </div>

      {beste && (
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div
            className="rounded-md border border-border bg-card p-6"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <p className="eyebrow mb-2">Beste investering</p>
            <p className="font-serif text-2xl text-foreground">{beste.selskap.navn}</p>
            <p className="font-serif text-xl stock-positive tabular-nums mt-1">
              {formatPct(beste.pct)}
            </p>
          </div>
          {darligste && (
            <div
              className="rounded-md border border-border bg-card p-6"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <p className="eyebrow mb-2">Dårligste investering</p>
              <p className="font-serif text-2xl text-foreground">{darligste.selskap.navn}</p>
              <p
                className={`font-serif text-xl tabular-nums mt-1 ${
                  darligste.pct >= 0 ? "stock-positive" : "stock-negative"
                }`}
              >
                {formatPct(darligste.pct)}
              </p>
            </div>
          )}
        </div>
      )}

      <div
        className="rounded-md border border-border bg-card p-6 md:p-8 mb-10"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        <p className="eyebrow mb-5">Ledertavle</p>
        {/* nokkel = lagretTidspunkt sikrer at tavlen hentes på nytt når
            rundens eget resultat er skrevet, så gruppen ser seg selv. */}
        <Ledertavle antall={10} uthevTidspunkt={lagretTidspunkt} nokkel={lagretTidspunkt} />
        {lagringOk === false && (
          <p className="text-sm stock-negative mt-4 leading-relaxed">
            Resultatet kunne ikke lagres akkurat nå - nettforbindelsen sviktet.
            Det er lagret lokalt og sendes automatisk neste gang siden åpnes
            med nett.
          </p>
        )}
      </div>

      <Button size="lg" onClick={onSpillIgjen} className="px-7">
        <RotateCcw className="w-4 h-4 mr-2" />
        Spill på nytt
      </Button>
    </div>
  );
};

export default ResultatSkjerm;
